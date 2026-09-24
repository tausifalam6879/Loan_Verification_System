import React, { useMemo, useState } from "react";
import { Box, Card, CardContent, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryTotals, expenseColors, money } from "../utils/expensePresentation";

export default function ExpensePieChart({ expenses = [], loading }) {
  const [period, setPeriod] = useState("month");
  const data = useMemo(() => categoryTotals(expenses, period), [expenses, period]);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return <Card elevation={0} sx={{ height: "100%", border: "1px solid #e3e8fc", borderRadius: 2, boxShadow: "0 4px 18px rgba(68,75,135,.04)" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box><Typography variant="h6" sx={{ fontWeight: 900 }}>Category Analytics</Typography><Typography variant="body2" color="text.secondary">See where your money goes {period === "month" ? "this month" : "across all saved expenses"}.</Typography></Box>
        <TextField select size="small" value={period} onChange={event => setPeriod(event.target.value)} slotProps={{ select: { inputProps: { "aria-label": "Analytics period" } } }} sx={{ minWidth: 120 }}><MenuItem value="month">This Month</MenuItem><MenuItem value="all">All Time</MenuItem></TextField>
      </Box>
      {loading ? <Box sx={{ height: 275, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : !data.length ? <Box sx={{ height: 275, display: "grid", placeItems: "center", textAlign: "center", color: "text.secondary" }}><Box><DonutLargeIcon sx={{ fontSize: 48, color: "#ad9bdf" }} /><Typography>No expenses for this period</Typography></Box></Box> :
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, .95fr) minmax(0, 1.1fr)", alignItems: "center", gap: 2, mt: 2 }}>
          <Box sx={{ height: 270, position: "relative", minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 260, height: 270 }}><PieChart><Pie data={data} dataKey="value" innerRadius="68%" outerRadius="94%" startAngle={90} endAngle={-270} stroke="#fff" strokeWidth={2}>{data.map((item, index) => <Cell key={item.name} fill={expenseColors[index % expenseColors.length]} />)}</Pie><Tooltip formatter={value => [money(value), "Spent"]} /></PieChart></ResponsiveContainer>
            <Box sx={{ position: "absolute", inset: "35% 15%", display: "grid", alignContent: "center", textAlign: "center", pointerEvents: "none" }}><Typography sx={{ fontSize: 20, fontWeight: 900 }}>{money(total)}</Typography><Typography variant="caption" color="text.secondary">Total Spent</Typography></Box>
          </Box>
          <Box sx={{ border: "1px solid #edf0fb", borderRadius: 2, px: 1.5, maxHeight: 280, overflowY: "auto" }}>{data.map((item, index) => <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.7, borderBottom: index < data.length - 1 ? "1px solid #f0f2fa" : "none" }}><Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: expenseColors[index % expenseColors.length], flexShrink: 0 }} /><Typography variant="body2" sx={{ flex: 1, textTransform: "capitalize", overflowWrap: "anywhere" }}>{item.name}</Typography><Typography variant="caption">{Math.round(item.value / total * 100)}%</Typography><Typography variant="body2" sx={{ fontWeight: 800, color: expenseColors[index % expenseColors.length] }}>{money(item.value)}</Typography></Box>)}</Box>
        </Box>}
    </CardContent>
  </Card>;
}
