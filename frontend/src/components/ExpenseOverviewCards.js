import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditIcon from "@mui/icons-material/Edit";
import SavingsIcon from "@mui/icons-material/Savings";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const currency = (value) => `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

const expenseDate = (expense) => {
  const raw = expense?.date || expense?.createdAt;
  if (!raw) return null;
  const parsed = new Date(String(raw).includes("T") ? raw : `${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ExpenseOverviewCards = ({ expenses = [], totalIncome = 0, onIncomeChange, isDemoMode = false, onResetDemo }) => {
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState(totalIncome);

  useEffect(() => setIncomeDraft(totalIncome), [totalIncome]);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const previous = new Date(currentYear, currentMonth - 1, 1);
    const isMonth = (date, year, month) => date && date.getFullYear() === year && date.getMonth() === month;
    const currentTotal = expenses.reduce((sum, expense) => {
      const date = expenseDate(expense);
      return sum + (isMonth(date, currentYear, currentMonth) ? Number(expense.amount || 0) : 0);
    }, 0);
    const previousTotal = expenses.reduce((sum, expense) => {
      const date = expenseDate(expense);
      return sum + (isMonth(date, previous.getFullYear(), previous.getMonth()) ? Number(expense.amount || 0) : 0);
    }, 0);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const projected = currentTotal > 0 ? (currentTotal / Math.max(1, now.getDate())) * daysInMonth : 0;
    const remaining = Number(totalIncome || 0) - currentTotal;
    const savingsRate = totalIncome > 0 ? Math.round((remaining / totalIncome) * 100) : 0;
    const monthChange = previousTotal > 0
      ? Math.round(((projected - previousTotal) / previousTotal) * 100)
      : null;

    return { currentTotal, previousTotal, projected, remaining, savingsRate, monthChange };
  }, [expenses, totalIncome]);

  const saveIncome = () => {
    const value = Math.max(0, Number(incomeDraft) || 0);
    onIncomeChange(value);
    setEditingIncome(false);
  };

  const cards = [
    {
      label: "Spent this month",
      value: currency(metrics.currentTotal),
      helper: metrics.monthChange === null
        ? "Add previous-month data for comparison"
        : `Current pace is ${Math.abs(metrics.monthChange)}% ${metrics.monthChange > 0 ? "higher" : "lower"} than last month`,
      icon: <CalendarMonthIcon />,
      color: "#ef4444"
    },
    {
      label: "Remaining this month",
      value: currency(metrics.remaining),
      helper: `${metrics.savingsRate}% current savings rate`,
      icon: <AccountBalanceWalletIcon />,
      color: metrics.remaining < 0 ? "#dc2626" : "#0d9488"
    },
    {
      label: "Projected month-end",
      value: currency(metrics.projected),
      helper: "Based on daily spending pace",
      icon: <TrendingUpIcon />,
      color: metrics.projected > totalIncome && totalIncome > 0 ? "#ea580c" : "#2563eb"
    }
  ];

  return (
    <Card elevation={0} sx={{ mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>Monthly command center</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Know where this month is heading</Typography>
          </Box>
          {editingIncome ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="number"
                label="Monthly income"
                value={incomeDraft}
                onChange={(event) => setIncomeDraft(event.target.value)}
                inputProps={{ min: 0 }}
              />
              <Button variant="contained" onClick={saveIncome} sx={{ textTransform: "none", fontWeight: 800 }}>Save</Button>
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              {isDemoMode && (
                <Button startIcon={<RestartAltIcon />} onClick={onResetDemo} sx={{ textTransform: "none", fontWeight: 800 }}>
                  Reset demo
                </Button>
              )}
              <Button startIcon={<EditIcon />} onClick={() => setEditingIncome(true)} sx={{ textTransform: "none", fontWeight: 800 }}>
                Monthly income: {currency(totalIncome)}
              </Button>
            </Stack>
          )}
        </Stack>

        <Grid container spacing={1.5}>
          {cards.map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <MetricCard {...item} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              label="Last month"
              value={currency(metrics.previousTotal)}
              helper="Completed-month baseline"
              icon={<SavingsIcon />}
              color="#7c3aed"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const MetricCard = ({ label, value, helper, icon, color }) => (
  <Box sx={{ height: "100%", p: 2, borderRadius: 2, bgcolor: `${color}0d`, border: `1px solid ${color}24` }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 800 }}>{label}</Typography>
      <Box sx={{ color, display: "grid", placeItems: "center" }}>{icon}</Box>
    </Stack>
    <Typography variant="h5" sx={{ mt: 1.5, fontWeight: 900, color }}>{value}</Typography>
    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>{helper}</Typography>
  </Box>
);

export default ExpenseOverviewCards;
