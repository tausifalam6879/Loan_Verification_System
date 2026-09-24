import { categoryTotals, currentMonthExpenses } from "./expensePresentation";

const now = new Date(2026, 8, 24);
const expenses = [
  { date: "2026-09-01", category: "Food", amount: 100 },
  { date: "2026-09-24", category: " food ", amount: 50.5 },
  { date: "2026-08-31", category: "Food", amount: 200 },
  { createdAt: "2026-09-20T12:00:00", category: "Bills", amount: 75 },
  { date: "invalid", category: "Other", amount: 10 }
];
test("monthly analytics include only the selected calendar month", () => {
  expect(currentMonthExpenses(expenses, now)).toHaveLength(3);
  expect(categoryTotals(expenses, "month", now)).toEqual([{ name: "food", value: 150.5 }, { name: "bills", value: 75 }]);
});
test("all-time analytics preserve previous-month expenses and normalize categories", () => {
  expect(categoryTotals(expenses, "all", now)[0]).toEqual({ name: "food", value: 350.5 });
});
test("invalid amounts and empty data cannot produce a misleading donut", () => {
  expect(categoryTotals([], "month", now)).toEqual([]);
  expect(categoryTotals([{ amount: "bad" }, { amount: -20 }, { amount: 0 }], "all", now)).toEqual([]);
});
