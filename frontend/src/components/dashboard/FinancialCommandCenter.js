import WorkspaceHeading from "../WorkspaceHeading";
import { summarizeApplications } from "../../utils/applicationDashboard";
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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
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
  referenceDate,
  workspaceCards
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

  const applicationSummary = summarizeApplications(applications);
  const metrics = [
    { label: "Monthly Spending", value: formatDashboardCurrency(intelligence.currentExpense),
      helper: intelligence.monthChange === 0 ? "No comparable change yet" : `${Math.abs(intelligence.monthChange)}% ${intelligence.monthChange > 0 ? "higher" : "lower"} than last month`,
      icon: <PaymentsIcon />, color: "#f43357" },
    { label: "Remaining this month", value: formatDashboardCurrency(intelligence.remaining),
      helper: "Monthly income minus recorded spending", icon: <AccountBalanceWalletIcon />, color: intelligence.remaining < 0 ? "#dc2626" : "#059669" },
    { label: "Loan Applications", value: applicationSummary.total,
      helper: `${applicationSummary.review} in review`, icon: <AssignmentTurnedInIcon />, color: "#2563ff" }
  ];

  const quickActions = [
    { label: "Add expense", icon: <AddCircleIcon />, target: "expense" },
    { label: "Make payment", icon: <PaymentsIcon />, target: "payments" },
    { label: "Compare loans", icon: <AccountBalanceIcon />, target: "loans" }
  ];

  return (
    <Stack spacing={2.5}>
      <WorkspaceHeading title="FinTech Dashboard" subtitle="Simple overview of your finances, loans and next actions.">
        <Typography sx={{ color: "primary.main", maxWidth: 165, fontSize: 14, display: { xs: "none", lg: "block" } }}>Small steps<br />towards bigger goals</Typography>
      </WorkspaceHeading>

      <Grid container spacing={2}>
        {metrics.map((metric) => (
          <Grid size={{ xs: 12, md: 4 }} key={metric.label}>
            <MetricTile {...metric} />
          </Grid>
        ))}
      </Grid>

      {workspaceCards}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12 }} sx={{ order: 2 }}>
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

        <Grid size={{ xs: 12 }} sx={{ order: 1 }}>
          <Stack direction={{ xs: "column-reverse", lg: "row-reverse" }} spacing={2.5} sx={{ "& > .MuiCard-root": { flex: 1, minWidth: 0 } }}>
            <Card elevation={0} sx={panelStyle}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Quick actions</Typography>
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  {quickActions.map((item, index) => (
                    <Grid size={{ xs: 6, sm: 4 }} key={item.target}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={item.icon}
                        onClick={() => onOpen(item.target)}
                        sx={{ ...actionButtonStyle, justifyContent: "center", flexDirection: "column", gap: 1, minHeight: 116, background: ["#f1eaff", "#eaf1ff", "#e5f8f1"][index], borderColor: "transparent", color: ["#7439ef", "#2563ff", "#008762"][index], "& .MuiButton-startIcon": { m: 0 }, "& svg": { fontSize: 28 } }}
                      >
                        {item.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="body2" sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: "#f5f1ff", color: "#62579e" }}>Tip: Keep your expenses up to date to understand your monthly budget.</Typography>
              </CardContent>
            </Card>

            <Card elevation={0} sx={panelStyle}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Recent activity</Typography>
                <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                  {recentActivity.map((expense) => (
                    <Stack key={expense.id || `${expense.createdAt}-${expense.amount}`} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                      <Box sx={{ width: 38, height: 38, bgcolor: "#fff0f3", color: "#f43357", display: "grid", placeItems: "center", borderRadius: 1.5, flexShrink: 0 }}><PaymentsIcon fontSize="small" /></Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
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


      <Grid container spacing={2}>        <Grid size={{ xs: 12 }}>
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
</Grid>
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Chip size="small" label="Signed-in account data" variant="outlined" />
        <Typography variant="caption" color="text.secondary">{refreshedAt ? `Updated ${new Date(refreshedAt).toLocaleTimeString("en-IN")}` : "Ready to refresh"}</Typography>
        <Button startIcon={<RefreshIcon />} onClick={onRefresh} disabled={loading}>{loading ? "Refreshing" : "Refresh"}</Button>
        <Button startIcon={<DownloadIcon />} onClick={onExport}>Export expenses</Button>
      </Stack>
    </Stack>
  );
};

const MetricTile = ({ label, value, helper, icon, color }) => (
  <Card elevation={0} sx={{ ...panelStyle, height: "100%", background: `linear-gradient(110deg,${color}08,#fff)`, borderColor: `${color}22` }}>
    <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2, minHeight: 132 }}>
      <Box sx={{ width: 62, height: 62, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: `${color}12`, color, "& svg": { fontSize: 32 } }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{label}</Typography>
        <Typography variant="h5" sx={{ color, fontWeight: 800, mt: .4 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{helper}</Typography>
      </Box>
      <Box aria-hidden="true" sx={{ display: { xs: "none", xl: "flex" }, alignItems: "flex-end", gap: .5, opacity: .3 }}>
        {[18,28,40,54].map((height) => <Box key={height} sx={{ width: 7, height, borderRadius: 3, bgcolor: color }} />)}
      </Box>
    </CardContent>
  </Card>
);

const panelStyle = {
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: "divider",
  color: "text.primary",
  background: "linear-gradient(145deg,#ffffff,#fbfcff)",
  boxShadow: "0 12px 32px rgba(61,70,126,.07)"
};

const actionButtonStyle = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 900
};

export default FinancialCommandCenter;
