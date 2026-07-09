import React, { useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const MonthlyExpenseChart = ({ expenses }) => {
  const data = useMemo(() => {
    const totals = new Map();

    expenses.forEach((expense) => {
      const date = expense.date ? new Date(`${expense.date}T00:00:00`) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const current = totals.get(key) || { key, month: label, amount: 0 };
      current.amount += Number(expense.amount || 0);
      totals.set(key, current);
    });

    return [...totals.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6);
  }, [expenses]);

  return (
    <Card
      elevation={0}
      sx={{
        mt: 2.5,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)"
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ShowChartIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Monthly Expenses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Spending trend for the latest six months
            </Typography>
          </Box>
        </Box>
        <Box sx={{ height: 260 }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.28)" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`Rs. ${Number(value).toLocaleString("en-IN")}`, "Expenses"]}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(45, 212, 191, 0.28)",
                    borderRadius: 8,
                    color: "#f8fafc"
                  }}
                  labelStyle={{ color: "#ccfbf1", fontWeight: 800 }}
                />
                <Bar dataKey="amount" fill="#0d9488" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center", color: "text.secondary" }}>
              Add expenses to see the monthly trend.
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MonthlyExpenseChart;
