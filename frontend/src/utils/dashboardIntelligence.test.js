import {
  buildDashboardIntelligence,
  buildMoneyFlow,
  formatDashboardCurrency
} from "./dashboardIntelligence";

const july = new Date(2026, 6, 28);

test("builds a six-month income, expense and savings series", () => {
  const flow = buildMoneyFlow([
    { amount: 12000, date: "2026-06-12" },
    { amount: 18000, date: "2026-07-03" },
    { amount: 2000, date: "2026-07-18" }
  ], 50000, july);

  expect(flow).toHaveLength(6);
  expect(flow.at(-2)).toMatchObject({ expense: 12000, income: 50000, savings: 38000 });
  expect(flow.at(-1)).toMatchObject({ expense: 20000, income: 50000, savings: 30000 });
});

test("creates financial health and actionable budget/application alerts", () => {
  const result = buildDashboardIntelligence({
    expenses: [
      { amount: 5500, category: "Food", date: "2026-07-04" },
      { amount: 32000, category: "Rent", date: "2026-07-05" },
      { amount: 8000, category: "Shopping", date: "2026-07-06" }
    ],
    totalIncome: 50000,
    budgets: { food: 5000 },
    creditScore: 735,
    applications: [{ id: 1, status: "UNDER_REVIEW" }],
    referenceDate: july
  });

  expect(result.currentExpense).toBe(45500);
  expect(result.savingsRate).toBe(9);
  expect(result.alerts.some((alert) => alert.title.includes("91% of monthly income"))).toBe(true);
  expect(result.alerts.some((alert) => alert.title.includes("Food budget is at 110%"))).toBe(true);
  expect(result.alerts.some((alert) => alert.title.includes("loan application"))).toBe(true);
  expect(result.healthScore).toBeLessThan(70);
});

test("formats dashboard money as Indian currency", () => {
  expect(formatDashboardCurrency(87531)).toContain("87,531");
});
