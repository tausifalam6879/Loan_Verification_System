import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AddAlertIcon from "@mui/icons-material/AddAlert";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteIcon from "@mui/icons-material/Delete";
import SavingsIcon from "@mui/icons-material/Savings";

const DEFAULT_CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Health", "Entertainment", "Education", "Rent", "Other"];
const normalize = (value) => String(value || "Other").trim().toLowerCase();
const title = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const currency = (value) => `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

const isCurrentMonth = (expense) => {
  const raw = expense?.date || expense?.createdAt;
  if (!raw) return false;
  const date = new Date(String(raw).includes("T") ? raw : `${raw}T00:00:00`);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

const ExpenseBudgetPlanner = ({ expenses = [], budgets = {}, onBudgetsChange }) => {
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [browserAlerts, setBrowserAlerts] = useState(false);
  const notifiedRef = useRef(new Set());

  const currentTotals = useMemo(() => {
    const totals = {};
    expenses.filter(isCurrentMonth).forEach((expense) => {
      const key = normalize(expense.category);
      totals[key] = (totals[key] || 0) + Number(expense.amount || 0);
    });
    return totals;
  }, [expenses]);

  const categories = useMemo(() => {
    const values = new Set(DEFAULT_CATEGORIES);
    expenses.forEach((expense) => expense.category && values.add(title(normalize(expense.category))));
    return [...values].sort();
  }, [expenses]);

  const budgetRows = useMemo(() => Object.entries(budgets)
    .filter(([, limit]) => Number(limit) > 0)
    .map(([key, limit]) => {
      const spent = currentTotals[key] || 0;
      const percentage = Math.round((spent / Number(limit)) * 100);
      return { key, limit: Number(limit), spent, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage), [budgets, currentTotals]);

  const alertRows = budgetRows.filter((item) => item.percentage >= 80);
  const recurring = useMemo(() => {
    const commitments = new Map();
    expenses
      .filter((expense) => expense.recurring)
      .forEach((expense) => {
        const key = normalize(expense.merchant || expense.description || expense.category);
        const existing = commitments.get(key);
        const existingDate = String(existing?.date || existing?.createdAt || "");
        const expenseDate = String(expense.date || expense.createdAt || "");
        if (!existing || expenseDate > existingDate) commitments.set(key, expense);
      });
    return [...commitments.values()];
  }, [expenses]);
  const recurringTotal = recurring.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  useEffect(() => {
    if (!browserAlerts || !("Notification" in window) || window.Notification.permission !== "granted") return;
    alertRows.forEach((item) => {
      const notificationKey = `${item.key}-${item.percentage >= 100 ? "over" : "warning"}`;
      if (!notifiedRef.current.has(notificationKey)) {
        new window.Notification("FinTrack budget alert", {
          body: `${title(item.key)} is at ${item.percentage}% of its monthly budget.`
        });
        notifiedRef.current.add(notificationKey);
      }
    });
  }, [alertRows, browserAlerts]);

  const saveBudget = () => {
    const limit = Number(amount);
    if (limit <= 0) return;
    onBudgetsChange({ ...budgets, [normalize(category)]: limit });
    setAmount("");
  };

  const removeBudget = (key) => {
    const next = { ...budgets };
    delete next[key];
    onBudgetsChange(next);
  };

  const enableBrowserAlerts = async () => {
    if (!("Notification" in window)) return;
    const permission = await window.Notification.requestPermission();
    setBrowserAlerts(permission === "granted");
  };

  return (
    <Card elevation={0} sx={{ mt: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", gap: 1.5, mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Budgets, alerts and subscriptions</Typography>
            <Typography variant="body2" color="text.secondary">Set category limits and get notified before spending crosses them.</Typography>
          </Box>
          <Button
            variant={browserAlerts ? "contained" : "outlined"}
            startIcon={<AddAlertIcon />}
            onClick={enableBrowserAlerts}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {browserAlerts ? "Browser alerts enabled" : "Enable browser alerts"}
          </Button>
        </Stack>

        {alertRows.length > 0 && (
          <Alert severity={alertRows.some((item) => item.percentage >= 100) ? "error" : "warning"} sx={{ mb: 2, borderRadius: 2 }}>
            {alertRows.map((item) => `${title(item.key)} ${item.percentage}%`).join(" · ")} — review these categories now.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
              <TextField select size="small" label="Category" value={category} onChange={(event) => setCategory(event.target.value)} sx={{ minWidth: 170 }}>
                {categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
              <TextField size="small" type="number" label="Monthly limit (Rs.)" value={amount} onChange={(event) => setAmount(event.target.value)} slotProps={{ htmlInput: { min: 1 } }} />
              <Button variant="contained" onClick={saveBudget} startIcon={<SavingsIcon />} sx={{ textTransform: "none", fontWeight: 800 }}>Save budget</Button>
            </Stack>

            {budgetRows.length === 0 ? (
              <Alert severity="info">No category budget set yet. Add one above to activate overspending alerts.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {budgetRows.map((item) => (
                  <Box key={item.key} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>{title(item.key)}</Typography>
                        <Typography variant="caption" color="text.secondary">{currency(item.spent)} of {currency(item.limit)}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Chip size="small" label={`${item.percentage}%`} color={item.percentage >= 100 ? "error" : item.percentage >= 80 ? "warning" : "success"} />
        <Button color="error" size="small" onClick={() => removeBudget(item.key)} aria-label={`Remove ${item.key} budget`}><DeleteIcon fontSize="small" /></Button>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, item.percentage)}
                      color={item.percentage >= 100 ? "error" : item.percentage >= 80 ? "warning" : "success"}
                      sx={{ mt: 1, height: 8, borderRadius: 99 }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ height: "100%", p: 2, borderRadius: 2, bgcolor: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.16)" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <AutorenewIcon color="primary" />
                <Typography sx={{ fontWeight: 900 }}>Recurring commitments</Typography>
              </Stack>
              <Typography variant="h5" sx={{ mt: 1.5, fontWeight: 900 }}>{currency(recurringTotal)}</Typography>
              <Typography variant="body2" color="text.secondary">estimated monthly total across {recurring.length} commitments</Typography>
              <Stack spacing={0.75} sx={{ mt: 2 }}>
                {recurring.slice(0, 5).map((expense) => (
                  <Stack key={expense.id} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{expense.merchant || expense.description || expense.category}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{currency(expense.amount)}</Typography>
                  </Stack>
                ))}
                {recurring.length === 0 && <Typography variant="body2" color="text.secondary">Mark rent, EMI or subscriptions as recurring while adding an expense.</Typography>}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ExpenseBudgetPlanner;
