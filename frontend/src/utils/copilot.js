import { analyzeExpenses } from "./expenseIntelligence";

export const copilotPageLabels = {
  overview: "Dashboard",
  expense: "Expenses",
  loans: "Loan Marketplace",
  payments: "Payments",
  applications: "Applications",
  investments: "Savings Planner",
  markets: "Markets"
};

const promptSets = {
  overview: [
    "What needs my attention?",
    "Where can I save money?",
    "Can I safely afford a new EMI?"
  ],
  expense: [
    "Which category is costing me the most?",
    "Show unusual spending",
    "What is next month's expense forecast?"
  ],
  loans: [
    "Can I safely afford a new EMI?",
    "What should I compare before choosing a loan?",
    "How do I track my submitted application?"
  ],
  payments: [
    "What should I verify before recording a payment?",
    "Show my recent transactions",
    "How will this payment affect my monthly spending?"
  ],
  applications: [
    "Summarize my loan applications",
    "What application needs attention?",
    "Explain processing-fee status"
  ],
  investments: [
    "Should I compare an FD or SIP for my goal?",
    "Explain the risk in my saved plan",
    "What assumptions should I verify before investing?"
  ]
};

const actionSets = {
  overview: [
    { label: "Review spending", target: "expense" },
    { label: "Track applications", target: "applications" },
    { label: "Plan savings", target: "investments" }
  ],
  expense: [
    { label: "Open expense tools", target: "expense" },
    { label: "Record payment", target: "payments" },
    { label: "Back to dashboard", target: "overview" }
  ],
  loans: [
    { label: "Compare loan offers", target: "loans" },
    { label: "Track applications", target: "applications" },
    { label: "Review spending", target: "expense" }
  ],
  payments: [
    { label: "Open payments", target: "payments" },
    { label: "Review ledger", target: "expense" },
    { label: "Track applications", target: "applications" }
  ],
  applications: [
    { label: "Track applications", target: "applications" },
    { label: "Compare loans", target: "loans" },
    { label: "Open payments", target: "payments" }
  ],
  investments: [
    { label: "Open savings planner", target: "investments" },
    { label: "Review spending", target: "expense" },
    { label: "Back to dashboard", target: "overview" }
  ]
};

export const formatCopilotCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export const getCopilotPrompts = (page = "overview") =>
  promptSets[page] || promptSets.overview;

export const getCopilotActions = (page = "overview") =>
  actionSets[page] || actionSets.overview;

export const buildCopilotBrief = ({
  expenses = [],
  totalIncome = 0,
  totalExpense = 0,
  balance = 0,
  applications = []
} = {}) => {
  const intelligence = analyzeExpenses(expenses, totalIncome);
  const topCategory = intelligence.summary.topCategory;
  const spendingRate = totalIncome > 0
    ? Math.round((Number(totalExpense || 0) / Number(totalIncome)) * 100)
    : 0;
  const pendingApplications = applications.filter((application) =>
    !["APPROVED", "REJECTED"].includes(String(application.status || "").toUpperCase())
  ).length;

  const attention = [];
  if (Number(balance) < 0) {
    attention.push("Monthly spending is above the entered income.");
  } else if (spendingRate >= 80) {
    attention.push(`${spendingRate}% of monthly income is already used.`);
  }
  if (intelligence.anomalies.length) {
    attention.push(`${intelligence.anomalies.length} unusual transaction signal${intelligence.anomalies.length === 1 ? "" : "s"} found.`);
  }
  if (pendingApplications) {
    attention.push(`${pendingApplications} loan application${pendingApplications === 1 ? "" : "s"} still need tracking.`);
  }

  return {
    intelligence,
    transactionCount: expenses.length,
    topCategory,
    spendingRate,
    pendingApplications,
    attention: attention[0] || "No urgent account signal right now.",
    remaining: Number(balance || 0)
  };
};

export const inferCopilotAction = (question = "", page = "overview") => {
  const text = question.toLowerCase();
  if (/application|status|processing fee/.test(text)) return { label: "Open applications", target: "applications" };
  if (/loan|emi|interest/.test(text)) return { label: "Compare loans", target: "loans" };
  if (/payment|upi|card|ledger/.test(text)) return { label: "Open payments", target: "payments" };
  if (/fd|sip|invest|saving plan/.test(text)) return { label: "Open savings planner", target: "investments" };
  if (/expense|spend|transaction|category|forecast|save money|attention/.test(text)) {
    return { label: "Review expenses", target: "expense" };
  }
  return getCopilotActions(page)[0];
};

export const buildCopilotFallbackAnswer = ({
  question = "",
  page = "overview",
  expenses = [],
  totalIncome = 0,
  totalExpense = 0,
  balance = 0,
  applications = []
} = {}) => {
  const text = question.toLowerCase();
  const brief = buildCopilotBrief({ expenses, totalIncome, totalExpense, balance, applications });
  const { intelligence } = brief;

  if (/application|status|processing fee/.test(text)) {
    if (!applications.length) {
      return "No saved loan application is available for this signed-in account. Submit an application first, then use Application Center to track its decision and fee status.";
    }
    const statusCounts = applications.reduce((counts, item) => {
      const status = String(item.status || "PENDING").replaceAll("_", " ");
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
    const summary = Object.entries(statusCounts).map(([status, count]) => `${count} ${status.toLowerCase()}`).join(", ");
    return `This signed-in account has ${applications.length} saved application${applications.length === 1 ? "" : "s"}: ${summary}. Open Application Center for verification, decision and processing-fee details.`;
  }

  if (/emi|afford/.test(text)) {
    const freeCashflow = Math.max(0, Number(totalIncome || 0) - Number(totalExpense || 0));
    if (!totalIncome) {
      return "Set monthly income and record current expenses before estimating an affordable EMI. FinTrack will not recommend borrowing without verified cash-flow inputs.";
    }
    const safeEmi = Math.round(freeCashflow * 0.3);
    return `Based on the locally entered income and current-month expenses, a cautious EMI ceiling is about ${formatCopilotCurrency(safeEmi)} (30% of free cash flow). This is an affordability estimate—not an approval decision.`;
  }

  if (/unusual|anomal|abnormal/.test(text)) {
    if (!intelligence.anomalies.length) {
      return "No unusual transaction signal is currently strong enough to flag. Detection becomes more reliable after at least three transactions exist in the same category.";
    }
    const item = intelligence.anomalies[0];
    return `${item.category} has an unusual ${formatCopilotCurrency(item.amount)} transaction compared with its normal pattern. Review that entry before changing a budget or savings decision.`;
  }

  if (/forecast|next month/.test(text)) {
    return `The local analytics estimate for ${intelligence.forecast.month} is ${formatCopilotCurrency(intelligence.forecast.amount)} with ${intelligence.forecast.confidence.toLowerCase()} confidence. It uses ${intelligence.forecast.basis}.`;
  }

  if (/recent|last.*transaction|transaction/.test(text)) {
    const recent = [...expenses]
      .sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))
      .slice(0, 5);
    if (!recent.length) return "No saved transaction is available for this signed-in account.";
    return `Recent account activity:\n${recent.map((item) => `• ${String(item.date || item.createdAt || "").slice(0, 10)} — ${item.description || item.merchant || item.category || "Expense"}: ${formatCopilotCurrency(item.amount)}`).join("\n")}`;
  }

  if (/save|saving|attention|top|category|most/.test(text)) {
    if (!expenses.length) {
      return "Add a few categorized expenses first. FinTrack needs account activity before it can identify a top category or a realistic saving opportunity.";
    }
    const top = brief.topCategory;
    const recommendation = intelligence.recommendations[0];
    return `${brief.attention} Your largest recorded category is ${top.category} at ${formatCopilotCurrency(top.amount)} (${top.percentage}%). ${recommendation}`;
  }

  if (/fd|sip|invest/.test(text) || page === "investments") {
    return "Use the Savings Planner to compare an FD maturity estimate with SIP projection ranges. Verify current rate, tax, expense ratio and exit load with the regulated provider before investing; FinTrack does not place an order.";
  }

  if (/payment|upi|card/.test(text) || page === "payments") {
    return "Before recording a payment, verify the recipient, amount and rail. A successful entry is added to the signed-in expense ledger; FinTrack Copilot never authorizes or sends money.";
  }

  if (!expenses.length) {
    return "There is not enough signed-in account activity for a data-based answer yet. Add expenses or submit a loan application, then ask for spending risks, forecasts or status guidance.";
  }

  return `${brief.attention} This answer uses ${brief.transactionCount} locally available transaction${brief.transactionCount === 1 ? "" : "s"}. Ask about saving opportunities, unusual spending, recent transactions, EMI affordability or application status.`;
};
