import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Typography
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EditIcon from "@mui/icons-material/Edit";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { motion } from "framer-motion";

const TopCards = ({
  balance,
  totalIncome,
  totalExpense,
  isEditingIncome,
  setIsEditingIncome,
  incomeInput,
  setIncomeInput,
  handleSaveIncome,
  budgetPercentage
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2.5}>
        <SummaryCard
          title="Current Balance"
          value={`Rs. ${balance}`}
          icon={<AccountBalanceWalletIcon />}
          color="#2563eb"
          surface="linear-gradient(145deg, #dbeafe, #f0f9ff)"
        />

        <Grid size={{ xs: 12, md: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card sx={cardStyle("linear-gradient(145deg, #dcfce7, #f0fdfa)")}>
              <CardContent sx={contentStyle}>
                <Box sx={cardHeaderStyle}>
                  <Box>
                    <Typography sx={labelStyle}>Monthly Income</Typography>
                    {isEditingIncome ? (
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={incomeInput}
                          onChange={(event) => {
                            const value = event.target.value;
                            const numValue = Number(value);
                            // Prevent negative values
                            if (value === "" || numValue >= 0) {
                              setIncomeInput(value);
                            }
                          }}
                          sx={{
                            maxWidth: 130,
                            "& .MuiInputBase-input": { color: "#0f172a" },
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "rgba(255,255,255,0.72)"
                            }
                          }}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                        <Button
                          variant="contained"
                          onClick={() => {
                            const income = Number(incomeInput);
                            if (!incomeInput || income <= 0) {
                              alert("Please enter a valid income amount greater than 0");
                              return;
                            }
                            handleSaveIncome();
                          }}
                          sx={{
                            textTransform: "none",
                            fontWeight: 800,
                            bgcolor: "#10b981"
                          }}
                        >
                          Save
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}
                      >
                        <Typography sx={{ ...valueStyle, color: "#10b981" }}>
                          Rs. {totalIncome}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setIsEditingIncome(true)}
                          sx={{
                            bgcolor: "#ffffff",
                            color: "#0f766e",
                            border: "1px solid rgba(13, 148, 136, 0.28)",
                            boxShadow: "0 6px 14px rgba(15, 23, 42, 0.12)",
                            "&:hover": {
                              bgcolor: "#ccfbf1",
                              color: "#0f172a"
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ ...iconStyle, bgcolor: "#dcfce7", color: "#10b981" }}>
                    <TrendingUpIcon />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <SummaryCard
          title="Total Expenses"
          value={`Rs. ${totalExpense}`}
          icon={<TrendingDownIcon />}
          color="#ef4444"
          surface="linear-gradient(145deg, #fee2e2, #fff7ed)"
        />
      </Grid>

      <Card sx={{ ...cardStyle("linear-gradient(145deg, #fef3c7, #ecfeff)"), mt: 2.5 }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ color: "#334155", fontWeight: 900 }}>
              Budget Utilization
            </Typography>
            <Typography
              sx={{
                color: budgetPercentage > 80 ? "#ef4444" : "#2563eb",
                fontWeight: 900
              }}
            >
              {budgetPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={budgetPercentage}
            sx={{
              height: 8,
              borderRadius: 8,
              bgcolor: "#e2e8f0",
              "& .MuiLinearProgress-bar": {
                bgcolor: budgetPercentage > 80 ? "#ef4444" : "#2563eb"
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

const SummaryCard = ({ title, value, icon, color, surface }) => (
  <Grid size={{ xs: 12, md: 4 }}>
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card sx={cardStyle(surface)}>
        <CardContent sx={contentStyle}>
          <Box sx={cardHeaderStyle}>
            <Box>
              <Typography sx={labelStyle}>{title}</Typography>
              <Typography sx={{ ...valueStyle, color }}>{value}</Typography>
            </Box>
            <Box sx={{ ...iconStyle, bgcolor: `${color}18`, color }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  </Grid>
);

const cardStyle = (surface = "linear-gradient(145deg, #ffffff, #f0fdfa)") => ({
  borderRadius: 2,
  background: surface,
  border: "1px solid rgba(14, 116, 144, 0.16)",
  boxShadow: "0 14px 34px rgba(8, 47, 73, 0.14)",
  color: "#0f172a"
});

const contentStyle = {
  p: 2.5,
  "&:last-child": { pb: 2.5 }
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 2
};

const labelStyle = {
  color: "#64748b",
  fontWeight: 800,
  mb: 0.5
};

const valueStyle = {
  color: "#0f172a",
  fontSize: "1.65rem",
  fontWeight: 900
};

const iconStyle = {
  alignItems: "center",
  borderRadius: 2,
  display: "flex",
  height: 48,
  justifyContent: "center",
  width: 48
};

export default TopCards;
