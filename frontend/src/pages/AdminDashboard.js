import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  approveApplication,
  getAdminApplications,
  getDashboardStats,
  rejectApplication
} from "../services/adminService";
import { logout } from "../services/authService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardData, applicationsData] = await Promise.all([
        getDashboardStats(),
        getAdminApplications()
      ]);
      setStats(dashboardData);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
    } catch (error) {
      setError(error.response?.status === 403
        ? "Admin access required for this dashboard."
        : "Could not load admin dashboard from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDecision = async (id, decision) => {
    setActionId(id);
    setError("");

    try {
      if (decision === "approve") {
        await approveApplication(id);
      } else {
        await rejectApplication(id);
      }
      await loadAdminData();
    } catch (error) {
      setError("Decision update failed. Check backend and admin token.");
    } finally {
      setActionId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, color: "#0f766e" },
    { label: "Applications", value: stats?.totalApplications ?? 0, color: "#2563eb" },
    { label: "Approved", value: stats?.approvedLoans ?? 0, color: "#16a34a" },
    { label: "Pre Approved", value: stats?.preApprovedLoans ?? 0, color: "#7c3aed" },
    { label: "Rejected", value: stats?.rejectedLoans ?? 0, color: "#dc2626" }
  ];

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          p: { xs: 2, md: 4 },
          background: "linear-gradient(180deg, #ecfeff 0%, #f8fafc 45%, #ffffff 100%)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 2.5
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
              Admin Control
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Dashboard and Applications
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} variant="outlined" sx={buttonStyle}>
              User Dashboard
            </Button>
            <Button startIcon={<RefreshIcon />} onClick={loadAdminData} variant="contained" disabled={loading} sx={buttonStyle}>
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outlined" color="error" sx={buttonStyle}>
              Logout
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {cards.map((card) => (
            <Grid size={{ xs: 12, sm: 6, lg: 2.4 }} key={card.label}>
              <Card elevation={0} sx={cardStyle(card.color)}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 800 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: card.color }}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(15, 23, 42, 0.08)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <DashboardIcon sx={{ color: "#2563eb" }} />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Admin Applications Table
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Applicant</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Credit Score</TableCell>
                      <TableCell>Fraud Score</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 900 }}>
                            #{application.id} {application.applicantName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            {application.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          Rs. {Number(application.requestedAmount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>{application.creditScore ?? "-"}</TableCell>
                        <TableCell>{application.fraudScore ?? "-"}</TableCell>
                        <TableCell>
                          <Chip size="small" label={application.status || "SAVED"} sx={{ fontWeight: 900 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleDecision(application.id, "approve")}
                              disabled={actionId === application.id}
                              sx={buttonStyle}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<HighlightOffIcon />}
                              onClick={() => handleDecision(application.id, "reject")}
                              disabled={actionId === application.id}
                              sx={buttonStyle}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {applications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#64748b" }}>
                          No applications found in backend.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

const buttonStyle = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 900
};

const cardStyle = (color) => ({
  height: "100%",
  borderRadius: 2,
  border: `1px solid ${color}24`,
  background: `linear-gradient(145deg, ${color}14, #ffffff 70%)`
});

export default AdminDashboard;
