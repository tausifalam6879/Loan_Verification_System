import {
  buildCopilotBrief,
  buildCopilotFallbackAnswer,
  getCopilotActions,
  getCopilotPrompts,
  inferCopilotAction
} from "./copilot";

const sampleExpenses = [
  { id: 1, amount: 5000, category: "Food", description: "Groceries", date: "2026-07-04" },
  { id: 2, amount: 1200, category: "Travel", description: "Metro", date: "2026-07-08" }
];

test("provides focused prompts and safe navigation actions for each workspace", () => {
  expect(getCopilotPrompts("applications")).toHaveLength(3);
  expect(getCopilotPrompts("applications")[0]).toMatch(/Summarize my loan applications/i);
  expect(getCopilotActions("payments").map((action) => action.target)).toEqual([
    "payments",
    "expense",
    "applications"
  ]);
});

test("builds an account brief from current signed-in screen data", () => {
  const brief = buildCopilotBrief({
    expenses: sampleExpenses,
    totalIncome: 20000,
    totalExpense: 6200,
    balance: 13800,
    applications: [{ id: 1, status: "UNDER_REVIEW" }]
  });

  expect(brief.transactionCount).toBe(2);
  expect(brief.topCategory.category).toBe("Food");
  expect(brief.pendingApplications).toBe(1);
  expect(brief.attention).toMatch(/application/i);
});

test("creates an honest local application summary and never claims execution", () => {
  const answer = buildCopilotFallbackAnswer({
    question: "Summarize my loan applications",
    applications: [{ id: 1, status: "PRE_APPROVED" }]
  });

  expect(answer).toMatch(/1 saved application/i);
  expect(answer).toMatch(/pre approved/i);
  expect(inferCopilotAction("Show my application status").target).toBe("applications");
});

