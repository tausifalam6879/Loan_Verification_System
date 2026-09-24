export const expenseColors = ["#7848ff", "#3274ff", "#ff9f22", "#0fa779", "#8993ae", "#e75187"];
export const money = value => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const dateOfExpense = expense => {
  const raw = expense.date || expense.createdAt;
  return raw ? new Date(String(raw).includes("T") ? raw : `${raw}T00:00:00`) : new Date(NaN);
};
export const currentMonthExpenses = (expenses, now = new Date()) => expenses.filter(expense => {
  const date = dateOfExpense(expense);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
});
export const categoryTotals = (expenses, period = "month", now = new Date()) => {
  const totals = new Map();
  (period === "month" ? currentMonthExpenses(expenses, now) : expenses).forEach(expense => {
    const value = Number(expense.amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const name = String(expense.category || "Other").trim().toLowerCase() || "other";
    totals.set(name, (totals.get(name) || 0) + value);
  });
  return [...totals].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};
