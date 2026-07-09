import React, { useMemo } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import InsightsIcon from "@mui/icons-material/Insights";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { analyzeExpenses } from "../utils/expenseIntelligence";

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const ExpenseIntelligencePanel = ({ expenses, totalIncome }) => {
  const insights = useMemo(
    () => analyzeExpenses(expenses, totalIncome),
    [expenses, totalIncome]
  );

  const { forecast, anomalies, categoryTrends, recommendations, summary, categoryTotals } = insights;
  const topCategory = summary.topCategory;
  const budgetStatus =
    totalIncome > 0
      ? `${summary.spendingRatio}% of monthly income used`
      : "Monthly income is not set";

  return (
    <Card
      elevation={0}
      sx={{
        mt: 2.5,
        borderRadius: 2,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(12,74,110,0.88))"
            : "linear-gradient(145deg, #ffffff, #f0fdfa)",
        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)"
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 1.5,
            mb: 2
          }}
        >
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
            <InsightsIcon color="primary" sx={{ fontSize: 34 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Smart Expense Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real analytics from saved transactions: category totals, forecast, anomaly checks and saving tips
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip
              icon={<AutoGraphIcon />}
              label={`${summary.transactionCount} transactions analyzed`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={budgetStatus}
              color={summary.spendingRatio > 80 ? "warning" : "success"}
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Box>

        {summary.transactionCount === 0 && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Add expense transactions to generate useful category, forecast and anomaly insights.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              icon={<PaymentsIcon />}
              label="Top Category"
              value={topCategory.category}
              helper={topCategory.amount > 0 ? `${formatCurrency(topCategory.amount)} (${topCategory.percentage}%)` : "No category data"}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              icon={<TrendingUpIcon />}
              label={`Forecast for ${forecast.month}`}
              value={formatCurrency(forecast.amount)}
              helper={forecast.basis}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              icon={<ReportProblemIcon />}
              label="Unusual Spending"
              value={anomalies.length.toString()}
              helper={
                anomalies.length
                  ? `${anomalies[0].category}: ${formatCurrency(anomalies[0].amount)}`
                  : "No unusual transaction found"
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <MetricCard
              icon={<SavingsIcon />}
              label="Suggested Saving"
              value={formatCurrency(summary.suggestedCut)}
              helper={summary.suggestedCut > 0 ? "Reduce this month to stay near target" : "Spending is within target"}
            />
          </Grid>
        </Grid>

        {anomalies.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            Unusual spending detected in {anomalies[0].category}: {formatCurrency(anomalies[0].amount)}.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Box
              sx={{
                height: 280,
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.56)" : "rgba(255,255,255,0.72)"
              }}
            >
              {categoryTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryTrends} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.32)" />
                    <XAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Amount"]}
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(45, 212, 191, 0.28)",
                        borderRadius: 8,
                        color: "#f8fafc"
                      }}
                      labelStyle={{ color: "#ccfbf1", fontWeight: 800 }}
                    />
                    <Bar dataKey="amount" fill="#14b8a6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "grid", placeItems: "center", color: "text.secondary" }}>
                  Add categorized expenses to see spending distribution.
                </Box>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.56)" : "rgba(255,255,255,0.72)"
              }}
            >
              <Typography sx={{ fontWeight: 900, mb: 1 }}>
                Data-Based Recommendations
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense disablePadding>
                {recommendations.map((item) => (
                  <ListItem key={item} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <SavingsIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{
                        variant: "body2",
                        sx: { fontWeight: 700, color: "text.primary" }
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              {categoryTotals.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
                  {categoryTotals.slice(0, 4).map((item) => (
                    <Chip
                      key={item.category}
                      size="small"
                      label={`${item.category}: ${formatCurrency(item.amount)}`}
                      variant="outlined"
                      sx={{ fontWeight: 800 }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const MetricCard = ({ icon, label, value, helper }) => (
  <Box
    sx={{
      height: "100%",
      minHeight: 126,
      p: 2,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: (theme) =>
        theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.58)" : "rgba(255,255,255,0.76)"
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
      {icon}
      <Typography variant="body2" sx={{ fontWeight: 900 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 900, mt: 1, overflowWrap: "anywhere" }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
      {helper}
    </Typography>
  </Box>
);

export default ExpenseIntelligencePanel;
