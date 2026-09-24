import React from "react";
import { Box, Button, Card, LinearProgress, Typography } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { categoryTotals, dateOfExpense, expenseColors, money } from "../utils/expensePresentation";

export default function ExpenseSummaryPanels({ expenses = [], budgets = {} }) {
  const recent = [...expenses].sort((a, b) => (dateOfExpense(b).getTime() || 0) - (dateOfExpense(a).getTime() || 0)).slice(0, 3);
  const totals = Object.fromEntries(categoryTotals(expenses).map(item => [item.name, item.value]));
  const rows = Object.entries(budgets).filter(([, limit]) => Number(limit) > 0).map(([category, limit]) => ({
    category, limit: Number(limit), spent: totals[category.trim().toLowerCase()] || 0
  }));
  const jump = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const panel = { p: 2.5, borderRadius: 2, border: "1px solid #e3e8fc", boxShadow: "0 4px 18px rgba(68,75,135,.04)" };
  return <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, mt: 2.5 }}>
    <Card elevation={0} sx={panel}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>Recent Transactions</Typography><Button onClick={() => jump("expense-transactions")} size="small">View all</Button></Box>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13, "& th": { textAlign: "left", bgcolor: "#f5f3ff", color: "#637099", py: 1 }, "& td": { py: 1.5, borderBottom: "1px solid #eef1fb" }, "& th, & td": { px: 1 } }}>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
        <tbody>{recent.map((expense, index) => <tr key={expense.id || index}><td>{Number.isNaN(dateOfExpense(expense).getTime()) ? "—" : dateOfExpense(expense).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td><td>{expense.description || expense.merchant || "Expense"}</td><td><Box sx={{ display: "flex", alignItems: "center", gap: .7 }}><ReceiptLongIcon sx={{ fontSize: 22, p: .4, borderRadius: 1, bgcolor: "#f0eaff", color: "#7848ff" }} />{expense.category || "Other"}</Box></td><td style={{ textAlign: "right", color: "#f33155", fontWeight: 800, whiteSpace: "nowrap" }}>− {money(expense.amount)}</td></tr>)}</tbody>
      </Box>
      {!recent.length && <Typography color="text.secondary" sx={{ py: 3 }}>Your saved expenses will appear here.</Typography>}
    </Card>
    <Card elevation={0} sx={panel}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Typography variant="h6" sx={{ fontWeight: 900 }}>Budget Progress</Typography><Typography variant="caption" color="text.secondary">This Month</Typography></Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Track spending against your category limits.</Typography>
      {!rows.length && <Typography color="text.secondary" sx={{ py: 2 }}>No category budgets set yet. Add a limit to track your progress.</Typography>}
      <Box sx={{ maxHeight: 170, overflowY: "auto" }}>{rows.map((row, index) => {
        const percent = Math.round(row.spent / row.limit * 100);
        const color = percent > 100 ? "#ef4444" : expenseColors[index % expenseColors.length];
        return <Box key={row.category} sx={{ display: "grid", gridTemplateColumns: "110px minmax(60px,1fr) 42px 125px", gap: 1.2, alignItems: "center", py: 1.1 }}><Typography variant="body2" sx={{ textTransform: "capitalize" }}>{row.category}</Typography><LinearProgress variant="determinate" value={Math.min(100, percent)} aria-label={row.category + " budget usage"} sx={{ height: 12, borderRadius: 8, bgcolor: "#edf1fa", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 8 } }} /><Typography variant="caption" sx={{ fontWeight: 800 }}>{percent}%</Typography><Typography variant="caption" color="text.secondary">{money(row.spent)} / {row.limit.toLocaleString("en-IN")}</Typography></Box>;
      })}</Box>
      <Button size="small" onClick={() => jump("expense-budget-settings")} sx={{ mt: 1 }}>Manage budgets →</Button>
    </Card>
  </Box>;
}
