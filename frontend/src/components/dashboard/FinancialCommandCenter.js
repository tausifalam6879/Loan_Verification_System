import React, { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PaymentsIcon from "@mui/icons-material/Payments";
import RefreshIcon from "@mui/icons-material/Refresh";
import SavingsIcon from "@mui/icons-material/Savings";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LiveExchangeRatesCard from "./LiveExchangeRatesCard";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  buildDashboardIntelligence,
  formatDashboardCurrency
} from "../../utils/dashboardIntelligence";

const FinancialCommandCenter = ({
  expenses = [],
  totalIncome = 0,
  budgets = {},
  profile = {},
  applications = [],
  onOpen,
  onRefresh,
  onExport,
  incomeInput,
  setIncomeInput,
  isEditingIncome,
  setIsEditingIncome,
  onSaveIncome,
  loading = false,
  refreshedAt = "",
  referenceDate
}) => {
  const intelligence = useMemo(
    () => buildDashboardIntelligence({
      expenses,
      totalIncome,
      budgets,
      creditScore: profile?.creditScore,
      applications,
      referenceDate: referenceDate || new Date()
    }),
    [applications, budgets, expenses, profile?.creditScore, referenceDate, totalIncome]
  );

  const recentActivity = useMemo(
    () => [...expenses]
      .sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))
      .slice(0, 4),
    [expenses]
  );

  const creditScore = Number(profile?.creditScore);
  const hasCreditScore = Number.isFinite(creditScore) && creditScore > 0;

  const metrics = [
    {
      label: "Remaining this month",
      value: formatDashboardCurrency(intelligence.remaining),
      helper: `${intelligence.spendingRate}% income used`,
      icon: <AccountBalanceWalletIcon />,
      color: intelligence.remaining < 0 ? "#dc2626" : "#2563eb"
    },
    {
      label: "This month spending",
      value: formatDashboardCurrency(intelligence.currentExpense),
      helper: intelligence.monthChange === 0
        ? "No comparable change yet"
        : `${Math.abs(intelligence.monthChange)}% ${intelligence.monthChange > 0 ? "higher" : "lower"} than last month`,
      icon: intelligence.monthChange > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />,
      color: intelligence.monthChange > 0 ? "#d97706" : "#0d9488"
    },
    {
      label: "Savings rate",
      value: `${intelligence.savingsRate}%`,
      helper: intelligence.savingsRate >= 20 ? "Healthy monthly buffer" : "20% or more is a useful target",
      icon: <SavingsIcon />,
      color: intelligence.savingsRate >= 20 ? "#16a34a" : "#d97706"
    }
  ];

  const quickActions = [
    { label: "Add expense", icon: <AddCircleIcon />, target: "expense" },
    { label: "Make payment", icon: <PaymentsIcon />, target: "payments" },
    { label: "Compare loans", icon: <AccountBalanceIcon />, target: "loans" },
    { label: "Plan FD / SIP", icon: <SavingsIcon />, target: "investments" },
    { label: "Market alerts", icon: <ShowChartIcon />, target: "markets" },
    { label: "Track applications", icon: <AssignmentTurnedInIcon />, target: "applications" }
  ];

  return (
    <Stack spacing={2.5}>
      <Card elevation={0} sx={heroStyle}>
        <CardContent sx={{ p: { xs: 2.25, md: 3 }, "&:last-child": { pb: { xs: 2.25, md: 3 } } }}>
          <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography variant="overline" sx={{ color: "primary.light", fontWeight: 900, letterSpacing: 1.2 }}>
                FinTrack financial workspace
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.25 }}>
                Financial Command Center
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                Monitor spending, savings, loan activity and next actions in one secure workspace.
              </Typography>
              <Stack direction="row" sx={{ mt: 1.75, gap: 1, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  label={`${intelligence.health.label} financial health`}
                  sx={{ bgcolor: `${intelligence.health.color}22`, color: "text.primary", fontWeight: 900 }}
                />
                <Chip
                  size="small"
                  label="Signed-in account data"
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />
                <Chip
                  size="small"
                  label={refreshedAt ? `Updated ${new Date(refreshedAt).toLocaleTimeString("en-IN")}` : "Ready to refresh"}
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
            </Box>

            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignSelf: { xs: "stretch", md: "flex-start" } }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
                sx={actionButtonStyle}
              >
                {loading ? "Refreshing" : "Refresh"}
              </Button>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={onExport} sx={primaryActionStyle}>
                Export expenses
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card elevation={0} sx={{ ...panelStyle, height: "100%" }}>
            <CardContent sx={{ p: 2.25 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>Monthly income</Typography>
                  {isEditingIncome ? (
                    <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={incomeInput}
                        onChange={(event) => setIncomeInput(event.target.value)}
                        slotProps={{ htmlInput: { min: 1 } }}
                        sx={{ maxWidth: 150 }}
                      />
                      <Button variant="contained" onClick={onSaveIncome} sx={actionButtonStyle}>Save</Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: "#16a34a", mt: 0.75 }}>
                        {formatDashboardCurrency(totalIncome)}
                      </Typography>
                      <IconButton size="small" aria-label="Edit monthly income" onClick={() => setIsEditingIncome(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>Used for cash-flow estimates</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "rgba(22,163,74,0.10)", color: "#16a34a" }}>
                  <TrendingUpIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {metrics.map((metric) => (
          <Grid size={{ xs: 12, sm: 6, xl: 3 }} key={metric.label}>
            <MetricTile {...metric} />
          </Grid>
        ))}
      </Grid>

      <LiveExchangeRatesCard onOpenMarkets={() => onOpen("markets")} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={panelStyle}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>
                Financial health
              </Typography>
              <Stack direction="row" spacing={2.5} sx={{ mt: 1.25, alignItems: "center" }}>
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={intelligence.healthScore}
                    size={104}
                    thickness={5}
                    sx={{ color: intelligence.health.color }}
                  />
                  <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{intelligence.healthScore}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: intelligence.health.color }}>
                    {intelligence.health.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {intelligence.health.message}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                Calculated from monthly cash flow, category budgets, transaction history and the submitted credit score.
              </Typography>
              <Stack direction="row" sx={{ mt: 1.5, gap: 1, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  icon={<CreditScoreIcon />}
                  label={hasCreditScore ? `Submitted score ${creditScore}` : "Credit score not set"}
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />
                <Chip
                  size="small"
                  icon={<AssignmentTurnedInIcon />}
                  label={`${applications.length} application${applications.length === 1 ? "" : "s"}`}
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={panelStyle}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: "center" }}>
                <NotificationsActiveIcon color="primary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Priority alerts</Typography>
                  <Typography variant="body2" color="text.secondary">Important conditions that may need your attention.</Typography>
                </Box>
              </Stack>
              <Stack spacing={1}>
                {intelligence.alerts.map((alert) => (
                  <Alert
                    key={`${alert.title}-${alert.detail}`}
                    severity={alert.severity}
                    action={
                      <Button color="inherit" size="small" onClick={() => onOpen(alert.action)} sx={{ fontWeight: 900 }}>
                        Review
                      </Button>
                    }
                    sx={{ borderRadius: 2, alignItems: "center" }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{alert.title}</Typography>
                    <Typography variant="caption">{alert.detail}</Typography>
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={panelStyle}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Six-month money flow</Typography>
              <Typography variant="body2" color="text.secondary">
                Income uses your current monthly setting; expenses come from saved transactions.
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 300 }}>
                  <ComposedChart data={intelligence.flow} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [formatDashboardCurrency(value), name]}
                      contentStyle={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, color: "#0f172a" }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="income" name="Income" fill="rgba(37,99,235,0.16)" stroke="#2563eb" strokeWidth={2} />
                    <Bar dataKey="expense" name="Expenses" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                    <Area type="monotone" dataKey="savings" name="Savings" fill="rgba(13,148,136,0.14)" stroke="#0d9488" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            <Card elevation={0} sx={panelStyle}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Quick actions</Typography>
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  {quickActions.map((item) => (
                    <Grid size={{ xs: 6 }} key={item.target}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={item.icon}
                        onClick={() => onOpen(item.target)}
                        sx={{ ...actionButtonStyle, justifyContent: "flex-start", minHeight: 44 }}
                      >
                        {item.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card elevation={0} sx={panelStyle}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Recent activity</Typography>
                <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                  {recentActivity.map((expense) => (
                    <Stack key={expense.id || `${expense.createdAt}-${expense.amount}`} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 800 }}>
                          {expense.merchant || expense.description || expense.category || "Expense"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {expense.category || "Other"} · {String(expense.date || expense.createdAt || "").slice(0, 10)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: "#dc2626", fontWeight: 900, whiteSpace: "nowrap" }}>
                        -{formatDashboardCurrency(expense.amount)}
                      </Typography>
                    </Stack>
                  ))}
                  {!recentActivity.length && (
                    <Typography variant="body2" color="text.secondary">
                      Add an expense to begin your private activity timeline.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

const MetricTile = ({ label, value, helper, icon, color }) => (
  <Card elevation={0} sx={{ ...panelStyle, height: "100%" }}>
    <CardContent sx={{ p: 2.25 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1.5 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color, mt: 0.75 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{helper}</Typography>
        </Box>
        <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: `${color}18`, color }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const heroStyle = {
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  color: "text.primary",
  background: (theme) => theme.fintrackMode === "soft"
    ? "linear-gradient(120deg, #fffafb, #f5e9f3 55%, #eaf3ff)"
    : "linear-gradient(120deg, #effcf9, #eef6ff, #fffaf0)",
  boxShadow: (theme) => theme.fintrackMode === "soft"
    ? "0 10px 28px rgba(75, 52, 96, 0.09)"
    : "0 18px 48px rgba(15, 23, 42, 0.08)"
};

const panelStyle = {
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: "divider",
  color: "text.primary",
  background: (theme) => theme.fintrackMode === "soft"
    ? "rgba(255, 253, 253, 0.96)"
    : "linear-gradient(145deg, #ffffff, #f7fbfc)",
  boxShadow: (theme) => theme.fintrackMode === "soft"
    ? "0 5px 16px rgba(75, 52, 96, 0.07)"
    : "0 14px 34px rgba(15, 23, 42, 0.07)"
};

const actionButtonStyle = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 900
};

const primaryActionStyle = {
  ...actionButtonStyle,
  background: "linear-gradient(90deg, #0d9488, #2563eb)"
};

export default FinancialCommandCenter;
