const parseExpenseDate = (expense) => {
  const raw = expense?.date || expense?.createdAt;
  if (!raw) return null;
  const parsed = new Date(String(raw).includes("T") ? raw : `${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date) =>
  date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

const normalizeCategory = (value) => String(value || "other").trim().toLowerCase();

const titleCase = (value) => String(value || "Other")
  .split(/\s+/)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
  .join(" ");

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export const formatDashboardCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export const buildMoneyFlow = (
  expenses = [],
  monthlyIncome = 0,
  referenceDate = new Date(),
  numberOfMonths = 6
) => {
  const totals = new Map();
  expenses.forEach((expense) => {
    const parsed = parseExpenseDate(expense);
    if (!parsed) return;
    const key = monthKey(parsed);
    totals.set(key, (totals.get(key) || 0) + Number(expense.amount || 0));
  });

  return Array.from({ length: numberOfMonths }, (_, index) => {
    const offset = numberOfMonths - index - 1;
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    const expense = Math.round(totals.get(monthKey(date)) || 0);
    const income = Math.round(Number(monthlyIncome || 0));
    return {
      key: monthKey(date),
      month: monthLabel(date),
      income,
      expense,
      savings: income - expense
    };
  });
};

export const buildDashboardIntelligence = ({
  expenses = [],
  totalIncome = 0,
  budgets = {},
  creditScore = null,
  applications = [],
  referenceDate = new Date()
} = {}) => {
  const flow = buildMoneyFlow(expenses, totalIncome, referenceDate);
  const current = flow[flow.length - 1] || { expense: 0, savings: Number(totalIncome || 0) };
  const previous = flow[flow.length - 2] || { expense: 0 };
  const income = Number(totalIncome || 0);
  const remaining = income - current.expense;
  const spendingRate = income > 0 ? Math.round((current.expense / income) * 100) : 0;
  const savingsRate = income > 0 ? Math.round((remaining / income) * 100) : 0;
  const monthChange = previous.expense > 0
    ? Math.round(((current.expense - previous.expense) / previous.expense) * 100)
    : 0;

  const categoryTotals = {};
  expenses.forEach((expense) => {
    const parsed = parseExpenseDate(expense);
    if (!parsed || monthKey(parsed) !== monthKey(referenceDate)) return;
    const category = normalizeCategory(expense.category);
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount || 0);
  });

  const budgetSignals = Object.entries(budgets)
    .filter(([, limit]) => Number(limit) > 0)
    .map(([category, limit]) => {
      const spent = categoryTotals[normalizeCategory(category)] || 0;
      return {
        category,
        spent,
        limit: Number(limit),
        percentage: Math.round((spent / Number(limit)) * 100)
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const overBudget = budgetSignals.filter((item) => item.percentage >= 100);
  const nearBudget = budgetSignals.filter(
    (item) => item.percentage >= 80 && item.percentage < 100
  );

  const savingsPoints = savingsRate >= 30
    ? 35
    : savingsRate >= 20
      ? 30
      : savingsRate >= 10
        ? 22
        : savingsRate >= 0
          ? 12
          : 0;
  const spendingPoints = spendingRate <= 60
    ? 25
    : spendingRate <= 75
      ? 20
      : spendingRate <= 90
        ? 10
        : 0;
  const budgetPoints = overBudget.length
    ? 4
    : nearBudget.length
      ? 12
      : budgetSignals.length
        ? 20
        : 10;
  const trackingPoints = expenses.length >= 8 ? 10 : expenses.length >= 3 ? 7 : expenses.length ? 4 : 0;
  const numericCreditScore = Number(creditScore);
  const creditPoints = Number.isFinite(numericCreditScore) && numericCreditScore > 0
    ? numericCreditScore >= 750
      ? 10
      : numericCreditScore >= 700
        ? 8
        : numericCreditScore >= 650
          ? 5
          : 2
    : 5;
  const healthScore = clamp(
    savingsPoints + spendingPoints + budgetPoints + trackingPoints + creditPoints,
    0,
    100
  );
  const health = healthScore >= 80
    ? { label: "Strong", color: "#16a34a", message: "Savings and spending are well balanced." }
    : healthScore >= 60
      ? { label: "Good", color: "#0d9488", message: "Your finances are stable with a few areas to improve." }
      : healthScore >= 40
        ? { label: "Needs attention", color: "#d97706", message: "Review budgets and protect your monthly savings buffer." }
        : { label: "At risk", color: "#dc2626", message: "Spending pressure is high; prioritize essential payments." };

  const alerts = [];
  if (remaining < 0) {
    alerts.push({
      severity: "error",
      title: "Monthly spending is above income",
      detail: `Reduce or review ${formatDashboardCurrency(Math.abs(remaining))} of spending.`,
      action: "expense"
    });
  } else if (spendingRate >= 85) {
    alerts.push({
      severity: "warning",
      title: `${spendingRate}% of monthly income is already used`,
      detail: `${formatDashboardCurrency(remaining)} remains for this month.`,
      action: "expense"
    });
  }

  [...overBudget, ...nearBudget].slice(0, 2).forEach((item) => {
    alerts.push({
      severity: item.percentage >= 100 ? "error" : "warning",
      title: `${titleCase(item.category)} budget is at ${item.percentage}%`,
      detail: `${formatDashboardCurrency(item.spent)} spent from a ${formatDashboardCurrency(item.limit)} limit.`,
      action: "expense"
    });
  });

  const pendingApplications = applications.filter((application) =>
    ["PENDING", "UNDER_REVIEW", "PRE_APPROVED"].includes(String(application.status || "").toUpperCase())
  ).length;
  if (pendingApplications > 0) {
    alerts.push({
      severity: "info",
      title: `${pendingApplications} loan application${pendingApplications === 1 ? "" : "s"} need tracking`,
      detail: "Review decision, verification and processing-fee status.",
      action: "applications"
    });
  }

  if (!alerts.length) {
    alerts.push({
      severity: "success",
      title: "No urgent financial alert",
      detail: savingsRate >= 20
        ? `You are retaining about ${savingsRate}% of monthly income.`
        : "Keep recording transactions to improve dashboard guidance.",
      action: "expense"
    });
  }

  return {
    flow,
    currentExpense: current.expense,
    previousExpense: previous.expense,
    remaining,
    spendingRate,
    savingsRate,
    monthChange,
    healthScore,
    health,
    alerts: alerts.slice(0, 4),
    budgetSignals,
    pendingApplications
  };
};
