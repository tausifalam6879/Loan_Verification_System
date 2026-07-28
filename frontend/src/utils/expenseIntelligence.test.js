import { analyzeExpenses, predictExpenseCategory } from "./expenseIntelligence";

const dateMonthsAgo = (offset, day = 10) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - offset);
  date.setDate(day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

describe("expense intelligence", () => {
  test("uses completed months and reports forecast confidence", () => {
    const insights = analyzeExpenses([
      { id: 1, amount: 12000, category: "Rent", date: dateMonthsAgo(1) },
      { id: 2, amount: 10000, category: "Rent", date: dateMonthsAgo(2) },
      { id: 3, amount: 1800, category: "Food", date: dateMonthsAgo(0) }
    ], 50000);

    expect(insights.monthlyTotals).toHaveLength(6);
    expect(insights.summary.latestAmount).toBe(1800);
    expect(insights.summary.previousAmount).toBe(12000);
    expect(insights.forecast.confidence).toBe("Medium");
    expect(insights.forecast.basis).toContain("completed months");
  });

  test("predicts familiar merchant descriptions without a server", () => {
    const prediction = predictExpenseCategory("Uber ride to office");

    expect(prediction.category).toBe("Travel");
    expect(prediction.confidence).toBeGreaterThan(0.5);
  });
});
