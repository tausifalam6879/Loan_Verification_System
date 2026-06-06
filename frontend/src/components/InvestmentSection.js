import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadIcon from "@mui/icons-material/Download";
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { fixedDepositProducts, mutualFundProducts } from "../data/financialKnowledge";

const InvestmentSection = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [selectedCsvFields, setSelectedCsvFields] = useState({
    name: true,
    group: true,
    type: true,
    rate: true,
    tenure: true,
    savedAt: true
  });
  const [savedInvestments, setSavedInvestments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedInvestments") || "[]");
    } catch (error) {
      return [];
    }
  });

  const handleSaveInvestment = () => {
    if (!selectedItem) {
      return;
    }
    const saved = {
      id: `${Date.now()}`,
      savedAt: new Date().toLocaleString("en-IN"),
      group: selectedItem.group,
      name: selectedItem.bank || selectedItem.category,
      type: selectedItem.type || selectedItem.category,
      rate: selectedItem.rate || selectedItem.expectedReturn,
      tenure: selectedItem.tenure || selectedItem.horizon
    };
    setSavedInvestments((current) => {
      const next = [saved, ...current];
      localStorage.setItem("savedInvestments", JSON.stringify(next));
      return next;
    });
    setSelectedItem(null);
  };

  const handleExportCsv = () => {
    const headers = Object.keys(selectedCsvFields)
      .filter(field => selectedCsvFields[field])
      .map(field => field.charAt(0).toUpperCase() + field.slice(1))
      .join(",") + "\n";

    const rows = savedInvestments
      .map(investment =>
        Object.keys(selectedCsvFields)
          .filter(field => selectedCsvFields[field])
          .map(field => {
            const value = investment[field];
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value || "";
          })
          .join(",")
      )
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fintech_investments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCsvDialogOpen(false);
  };

  return (
    <Box id="investments-section" sx={{ mt: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
          Deposits and Mutual Funds
        </Typography>
        <Typography variant="h4" sx={{ color: "text.primary", fontWeight: 900 }}>
          FD and Investment Comparison
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Indicative demo data for comparing banks, process, risk and investment fit.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 3,
          border: "1px solid rgba(20, 184, 166, 0.22)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(145deg, #0f172a, #164e63)"
              : "linear-gradient(145deg, #f0fdfa, #eff6ff)",
          color: "text.primary"
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            component="a"
            href="/data/financial_knowledge.csv"
            download
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ alignSelf: "flex-start", borderRadius: 2, textTransform: "none", fontWeight: 900 }}
          >
            Download AI CSV
          </Button>
          {savedInvestments.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setCsvDialogOpen(true)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
            >
              Export Investments CSV
            </Button>
          )}
          <Chip
            icon={<AccountBalanceIcon />}
            label="FD rates are indicative and must be checked before booking"
            sx={{ fontWeight: 800, alignSelf: "flex-start" }}
          />
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
                <SavingsIcon sx={{ color: "#0d9488" }} /> Fixed Deposits by Bank
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {fixedDepositProducts.map((item) => (
                <Grid size={{ xs: 12, sm: 6 }} key={`${item.bank}-${item.type}`}>
                  <InfoCard
                    icon={<SavingsIcon />}
                    color="#0d9488"
                    onClick={() => setSelectedItem({ ...item, group: "Fixed Deposit", cta: "Book FD" })}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: "1rem" }}>{item.bank}</Typography>
                    <Typography variant="body2" sx={{ color: "#475569", mb: 1 }}>
                      {item.type} | {item.tenure}
                    </Typography>
                    <Fact label="Rate" value={item.rate} />
                    <Fact label="Senior" value={item.seniorRate} />
                    <Fact label="Min Amount" value={item.minAmount} />
                    <Typography variant="body2" sx={{ color: "#334155", mt: 0.75, fontSize: "0.85rem" }}>
                      {item.process}
                    </Typography>
                  </InfoCard>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUpIcon sx={{ color: "#2563eb" }} /> Mutual Fund Categories
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {mutualFundProducts.map((item) => (
                <Grid size={{ xs: 12, sm: 6 }} key={item.category}>
                  <InfoCard
                    icon={<TrendingUpIcon />}
                    color="#2563eb"
                    onClick={() => setSelectedItem({ ...item, group: "Mutual Fund", cta: "Start SIP" })}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: "1rem" }}>{item.category}</Typography>
                    <Typography variant="body2" sx={{ color: "#475569", mb: 1 }}>
                      {item.risk} | {item.horizon}
                    </Typography>
                    <Fact label="Return" value={item.expectedReturn} />
                    <Typography variant="body2" sx={{ color: "#334155", mt: 0.75, fontSize: "0.85rem" }}>
                      {item.process}
                    </Typography>
                    <Typography sx={{ color: "#0d9488", mt: 0.75, fontWeight: 900, fontSize: "0.85rem" }}>
                      {item.suitableFor} <ArrowForwardIcon sx={{ fontSize: 16, verticalAlign: "text-bottom" }} />
                    </Typography>
                  </InfoCard>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Card
        elevation={0}
        sx={{
          mt: 2,
          borderRadius: 2,
          background: "linear-gradient(145deg, #ecfeff, #eff6ff)",
          border: "1px solid rgba(14, 116, 144, 0.16)",
          color: "#0f172a"
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            Saved FD / SIP Bookings
          </Typography>
          {savedInvestments.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Book FD ya Start SIP click karne ke baad selected record yahan save hoga.
            </Alert>
          ) : (
            <Grid container spacing={1.25}>
              {savedInvestments.map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                      border: "1px solid rgba(14, 116, 144, 0.16)"
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>{item.name}</Typography>
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      {item.group} | {item.type}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f766e", fontWeight: 900 }}>
                      {item.rate}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Saved {item.savedAt}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #ffffff, #ecfeff)",
            color: "#0f172a"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {selectedItem?.group}: {selectedItem?.bank || selectedItem?.category}
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Stack spacing={1.5}>
              <Fact label="Type" value={selectedItem.type || selectedItem.category} />
              <Fact label="Tenure / Horizon" value={selectedItem.tenure || selectedItem.horizon} />
              <Fact label="Rate / Return" value={selectedItem.rate || selectedItem.expectedReturn} />
              <Fact label="Risk / Profile" value={selectedItem.risk || "Low risk bank deposit"} />
              <Typography sx={{ color: "#334155" }}>{selectedItem.process}</Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                {selectedItem.notes || selectedItem.suitableFor}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedItem(null)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveInvestment}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
          >
            {selectedItem?.cta || "Continue"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={csvDialogOpen}
        onClose={() => setCsvDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #ffffff, #ecfeff)",
            color: "#0f172a"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Export Investment Records
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: "#475569" }}>
              Select which fields to include in the CSV export:
            </Typography>
            <Stack spacing={1}>
              {[
                { id: "name", label: "Investment Name" },
                { id: "group", label: "Group (FD/MF)" },
                { id: "type", label: "Type" },
                { id: "rate", label: "Rate/Return" },
                { id: "tenure", label: "Tenure/Horizon" },
                { id: "savedAt", label: "Saved Date & Time" }
              ].map((field) => (
                <FormControlLabel
                  key={field.id}
                  control={
                    <Checkbox
                      checked={selectedCsvFields[field.id]}
                      onChange={(e) =>
                        setSelectedCsvFields((prev) => ({
                          ...prev,
                          [field.id]: e.target.checked
                        }))
                      }
                    />
                  }
                  label={field.label}
                />
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCsvDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExportCsv}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
          >
            Export CSV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const InfoCard = ({ children, icon, color, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      height: "100%",
      cursor: "pointer",
      borderRadius: 2,
      background: "linear-gradient(145deg, #ffffff, #ecfeff)",
      border: "1px solid rgba(14, 116, 144, 0.16)",
      color: "#0f172a",
      minHeight: 0,
      transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      "&:hover": {
        transform: "translateY(-2px)",
        borderColor: "#0d9488",
        boxShadow: "0 14px 28px rgba(8, 47, 73, 0.16)"
      }
    }}
  >
    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: `${color}18`,
          color,
          mb: 1
        }}
      >
        {icon}
      </Box>
      {children}
    </CardContent>
  </Card>
);

const Fact = ({ label, value }) => (
  <Box sx={{ mb: 0.5 }}>
    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 900 }}>
      {value || "-"}
    </Typography>
  </Box>
);

export default InvestmentSection;
