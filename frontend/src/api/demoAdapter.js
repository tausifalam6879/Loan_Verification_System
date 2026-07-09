import { analyzeExpenses, predictExpenseCategory } from "../utils/expenseIntelligence";

const demoMode =
  process.env.REACT_APP_DEMO_MODE === "true" ||
  (typeof window !== "undefined" && window.location.hostname.endsWith("github.io"));

const storageKey = "fintrackDemoState";

const clone = (value) => JSON.parse(JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const normalizeExpenseTimestamps = (expenses = []) =>
  expenses.map((expense) => {
    const date = expense.date || today();

    return {
      ...expense,
      date,
      createdAt: expense.createdAt || `${date}T00:00:00`
    };
  });

const initialState = {
  expenses: [
    { id: 1, amount: 4500, category: "rent", description: "Hostel and room expenses", date: today(), createdAt: now() },
    { id: 2, amount: 1800, category: "food", description: "Monthly food and groceries", date: today(), createdAt: now() },
    { id: 3, amount: 900, category: "travel", description: "Campus travel and metro", date: today(), createdAt: now() }
  ],
  applications: [
    {
      id: 1,
      applicantName: "Demo Applicant",
      email: "demo@fintrack.in",
      requestedAmount: 600000,
      monthlyIncome: 65000,
      creditScore: 735,
      tenureMonths: 48,
      status: "PRE_APPROVED",
      fraudScore: 18,
      fraudLevel: "LOW",
      deviceRisk: "low",
      employmentType: "salaried",
      loanPurpose: "Education and personal finance",
      city: "Raipur",
      paymentStatus: "UNPAID",
      verificationSummary: "Demo verification completed successfully.",
      decisionReason: "Strong credit profile and low fraud signal."
    }
  ],
  auditLogs: [
    {
      id: 1,
      actorEmail: "admin@demo.com",
      details: "Demo admin reviewed application #1",
      createdAt: new Date().toISOString()
    }
  ]
};

const loanOffers = [
  {
    id: 1,
    bank: { id: 1, name: "State Bank of India", shortName: "SBI", themeColor: "#2563eb" },
    loanType: { id: 1, name: "Personal Loan", slug: "personal", iconName: "credit", color: "#2563eb" },
    interestRate: 10.25,
    minAmount: 50000,
    maxAmount: 1200000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    minCreditScore: 650,
    processingFeePercent: 1.1
  },
  {
    id: 2,
    bank: { id: 2, name: "HDFC Bank", shortName: "HDFC", themeColor: "#7c3aed" },
    loanType: { id: 2, name: "Home Loan", slug: "home", iconName: "home", color: "#7c3aed" },
    interestRate: 8.65,
    minAmount: 300000,
    maxAmount: 7500000,
    minTenureMonths: 60,
    maxTenureMonths: 240,
    minCreditScore: 680,
    processingFeePercent: 0.6
  },
  {
    id: 3,
    bank: { id: 3, name: "ICICI Bank", shortName: "ICICI", themeColor: "#ea580c" },
    loanType: { id: 3, name: "Education Loan", slug: "education", iconName: "school", color: "#ea580c" },
    interestRate: 9.35,
    minAmount: 100000,
    maxAmount: 3000000,
    minTenureMonths: 24,
    maxTenureMonths: 120,
    minCreditScore: 620,
    processingFeePercent: 0.8
  },
  {
    id: 4,
    bank: { id: 4, name: "Axis Bank", shortName: "Axis", themeColor: "#0f766e" },
    loanType: { id: 4, name: "Business Loan", slug: "business", iconName: "business", color: "#0f766e" },
    interestRate: 11.5,
    minAmount: 200000,
    maxAmount: 5000000,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    minCreditScore: 660,
    processingFeePercent: 1.25
  }
];

const readState = () => {
  if (typeof window === "undefined") {
    return clone(initialState);
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    window.localStorage.setItem(storageKey, JSON.stringify(initialState));
    return clone(initialState);
  }

  try {
    const state = { ...clone(initialState), ...JSON.parse(saved) };
    state.expenses = normalizeExpenseTimestamps(state.expenses);
    return state;
  } catch (error) {
    window.localStorage.setItem(storageKey, JSON.stringify(initialState));
    return clone(initialState);
  }
};

const writeState = (state) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }
};

const parseBody = (data) => {
  if (!data) {
    return {};
  }
  return typeof data === "string" ? JSON.parse(data) : data;
};

const response = (config, data, status = 200) =>
  Promise.resolve({
    data,
    status,
    statusText: "OK",
    headers: {},
    config,
    request: {}
  });

const dashboardStats = (state) => {
  const apps = state.applications;
  const count = (predicate) => apps.filter(predicate).length;

  return {
    totalUsers: 12,
    totalApplications: apps.length,
    approvedLoans: count((app) => app.status === "APPROVED"),
    rejectedLoans: count((app) => app.status === "REJECTED"),
    preApprovedLoans: count((app) => app.status === "PRE_APPROVED"),
    lowRisk: count((app) => app.fraudLevel === "LOW"),
    mediumRisk: count((app) => app.fraudLevel === "MEDIUM"),
    highRisk: count((app) => app.fraudLevel === "HIGH")
  };
};

const formatRs = (amount = 0) => `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;

const getDemoIncome = () => {
  if (typeof window === "undefined") {
    return 50000;
  }

  return Number(window.localStorage.getItem("userIncome") || 50000);
};

const getDemoAiAnswer = (message = "", state) => {
  const query = message.toLowerCase();
  const income = getDemoIncome();
  const analysis = analyzeExpenses(state.expenses, income);
  const expenses = [...state.expenses]
    .map((expense) => ({
      ...expense,
      amount: Number(expense.amount || 0),
      date: expense.date || today()
    }))
    .sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date)));

  const topCategory = analysis.summary.topCategory;
  const latestAmount = analysis.summary.latestAmount || analysis.totalExpense;
  const currentBalance = Math.max(0, income - latestAmount);

  if (!expenses.length) {
    return "Abhi demo data me koi expense transaction available nahi hai. Pehle expense add karo, phir main category, forecast aur saving insights bata paunga.";
  }

  if (query.includes("sabse") || query.includes("zyada") || query.includes("top category") || query.includes("highest")) {
    return `Sabse zyada kharcha ${topCategory.category} me hua hai: ${formatRs(topCategory.amount)} (${topCategory.percentage}% of total expenses).`;
  }

  if (query.includes("last 5") || query.includes("recent") || query.includes("transactions") || query.includes("transaction")) {
    return `Last 5 transactions:\n${expenses
      .slice(0, 5)
      .map((expense) => `- ${expense.date}: ${expense.description || "Expense"} (${expense.category || "Other"}) - ${formatRs(expense.amount)}`)
      .join("\n")}`;
  }

  if (query.includes("total expense") || query.includes("kitna") || query.includes("this month") || query.includes("is month")) {
    return `${analysis.summary.latestMonth} ka total expense ${formatRs(latestAmount)} hai. Overall tracked demo expense ${formatRs(analysis.totalExpense)} hai.`;
  }

  if (query.includes("saving") || query.includes("tips") || query.includes("improve") || query.includes("bachat")) {
    return `3 smart saving tips:\n${analysis.recommendations
      .slice(0, 3)
      .map((tip, index) => `${index + 1}. ${tip}`)
      .join("\n")}`;
  }

  if (query.includes("unusual") || query.includes("anomaly") || query.includes("normal")) {
    if (!analysis.anomalies.length) {
      return "Abhi demo expense history me koi major unusual spending detect nahi hui. More transactions add karoge to anomaly detection stronger hoga.";
    }

    return `Unusual spending detected:\n${analysis.anomalies
      .map((expense) => `- ${expense.category}: ${formatRs(expense.amount)} on ${expense.date}. ${expense.reason}`)
      .join("\n")}`;
  }

  if (query.includes("forecast") || query.includes("next month") || query.includes("agle")) {
    return `Next month forecast ${formatRs(analysis.forecast.amount)} hai, based on ${analysis.forecast.basis}.`;
  }

  if (query.includes("balance") || query.includes("decreasing") || query.includes("kam")) {
    return `Balance expenses ki wajah se reduce ho raha hai. Demo monthly income ${formatRs(income)} hai, latest monthly expense ${formatRs(latestAmount)} hai, estimated available balance ${formatRs(currentBalance)} hai. Biggest impact ${topCategory.category} category ka hai.`;
  }

  if (query.includes("loan") || query.includes("emi") || query.includes("risk")) {
    const app = state.applications[0];
    return `Latest demo loan profile: ${app?.bankName || "loan application"} amount ${formatRs(app?.requestedAmount || 0)}, income ${formatRs(app?.monthlyIncome || 0)}, credit score ${app?.creditScore || "not available"}, risk ${app?.fraudLevel || "not available"}. EMI decision se pehle income-to-expense ratio review karo.`;
  }

  return `Demo AI answer: ${analysis.summary.transactionCount} transactions analyze hue. Top category ${topCategory.category} (${formatRs(topCategory.amount)}), monthly expense ${formatRs(latestAmount)}, forecast ${formatRs(analysis.forecast.amount)}. ${analysis.recommendations[0]}`;
};

const demoAdapter = async (config) => {
  const state = readState();
  const method = (config.method || "get").toLowerCase();
  const path = new URL(config.url, "http://demo.local").pathname.replace(/^\/api/, "");
  const body = parseBody(config.data);

  if (path === "/users/auth-config" && method === "get") {
    return response(config, {
      otpEnabled: true,
      emailOtpEnabled: true,
      mobileOtpEnabled: true,
      whatsappOtpEnabled: true,
      passwordLoginEnabled: true
    });
  }

  if (path === "/users/request-otp" && method === "post") {
    return response(config, {
      message: `Demo OTP generated. Use OTP 123456 for ${body.channel || "EMAIL"}.`,
      otpRequired: true,
      otpToken: null,
      deliveryChannel: "demo",
      developmentOtp: "123456"
    });
  }

  if (path === "/users/verify-otp" && method === "post") {
    if (String(body.otp) !== "123456") {
      return response(config, { success: false, message: "Invalid or expired OTP" }, 400);
    }

    return response(config, {
      message: "OTP verified.",
      otpRequired: true,
      otpToken: `demo-otp-token-${Date.now()}`,
      deliveryChannel: body.channel || "EMAIL",
      developmentOtp: null
    });
  }

  if (path === "/users/login" && method === "post") {
    return response(config, {
      token: "demo-jwt-token",
      email: body.email || "demo@fintrack.in",
      role: (body.email || "").toLowerCase().includes("admin") ? "ADMIN" : "USER"
    });
  }

  if (path === "/users/register" && method === "post") {
    return response(config, {
      id: 101,
      fullName: body.fullName || "Demo User",
      email: body.email || "demo@fintrack.in",
      mobile: body.mobile || "",
      role: "USER",
      totalApplications: 0,
      creditScore: null
    });
  }

  if (path === "/users/me" && method === "get") {
    const email =
      typeof window !== "undefined"
        ? window.localStorage.getItem("email") || "demo@fintrack.in"
        : "demo@fintrack.in";
    const role =
      typeof window !== "undefined"
        ? window.localStorage.getItem("role") || "USER"
        : "USER";

    return response(config, {
      id: 101,
      fullName: email.includes("@") ? email.split("@")[0].replace(/[._-]+/g, " ") : "Demo User",
      email,
      role,
      totalApplications: state.applications.length,
      creditScore: 735
    });
  }

  if (path === "/expenses/all" && method === "get") {
    return response(config, { success: true, message: "Demo expenses fetched", data: state.expenses });
  }

  if (path === "/expenses/add" && method === "post") {
    const expense = {
      id: Date.now(),
      ...body,
      date: body.date || today(),
      createdAt: body.createdAt || now()
    };
    state.expenses = [expense, ...state.expenses];
    writeState(state);
    return response(config, { success: true, message: "Demo expense added", data: expense });
  }

  if (path.startsWith("/expenses/delete/") && method === "delete") {
    const id = Number(path.split("/").pop());
    state.expenses = state.expenses.filter((expense) => Number(expense.id) !== id);
    writeState(state);
    return response(config, { success: true, message: "Demo expense deleted", data: null });
  }

  if (path === "/ai/expenses/category" && method === "post") {
    const prediction = predictExpenseCategory(body.description || "");
    return response(config, {
      success: true,
      message: "Demo AI category predicted",
      data: {
        category: prediction.category,
        confidence: prediction.confidence,
        modelVersion: "demo-local-tfidf",
        source: "demo-fallback",
        topPredictions: prediction.scores.slice(0, 3).map((item) => ({
          category: item.category,
          confidence: item.score
        }))
      }
    });
  }

  if (path === "/ai/chat" && method === "post") {
    return response(config, {
      success: true,
      message: "Demo AI chat response generated",
      data: {
        answer: getDemoAiAnswer(body.message || "", state),
        usedContext: true,
        suggestedQuestions: [
          "Mera sabse zyada kharcha kis category me hua?",
          "Last 5 transactions batao",
          "Mujhe saving improve karne ke liye 3 tips do",
          "Is month total expense kitna hai?",
          "Kya koi unusual spending hai?"
        ],
        provider: "github-pages-demo-analytics",
        model: "demo-expense-context",
        liveProvider: false
      }
    });
  }

  if (path === "/loans/offers" && method === "get") {
    return response(config, loanOffers);
  }

  if (path.startsWith("/loans/offers/") && method === "get") {
    const id = Number(path.split("/").pop());
    return response(config, loanOffers.find((offer) => offer.id === id) || loanOffers[0]);
  }

  if (path === "/loans/apply" && method === "post") {
    const fraudScore = Number(body.creditScore || 0) < 620 ? 54 : 18;
    const app = {
      id: Date.now(),
      ...body,
      status: fraudScore > 40 ? "PENDING_REVIEW" : "PRE_APPROVED",
      fraudScore,
      fraudLevel: fraudScore > 40 ? "MEDIUM" : "LOW",
      paymentStatus: "UNPAID",
      verificationSummary: "Demo verification completed successfully.",
      decisionReason: "Demo decision generated from frontend sample data."
    };
    state.applications = [app, ...state.applications];
    writeState(state);
    return response(config, app);
  }

  if (["/loans/my-applications", "/loans/applications", "/admin/applications"].includes(path) && method === "get") {
    return response(config, state.applications);
  }

  if (path.includes("/payment") && method === "post") {
    const id = Number(path.split("/")[3]);
    state.applications = state.applications.map((app) =>
      Number(app.id) === id
        ? { ...app, paymentStatus: "PAID", paymentReference: body.reference || `DEMO-${Date.now()}` }
        : app
    );
    writeState(state);
    return response(config, state.applications.find((app) => Number(app.id) === id));
  }

  if (path === "/admin/dashboard" && method === "get") {
    return response(config, dashboardStats(state));
  }

  if (path === "/admin/audit-logs" && method === "get") {
    return response(config, state.auditLogs);
  }

  if (path.includes("/approve") && method === "put") {
    const id = Number(path.split("/")[3]);
    state.applications = state.applications.map((app) =>
      Number(app.id) === id ? { ...app, status: "APPROVED", decisionReason: "Approved in demo admin workflow." } : app
    );
    state.auditLogs = [
      { id: Date.now(), actorEmail: "admin@demo.com", details: `Demo admin approved application #${id}`, createdAt: new Date().toISOString() },
      ...state.auditLogs
    ];
    writeState(state);
    return response(config, state.applications.find((app) => Number(app.id) === id));
  }

  if (path.includes("/reject") && method === "put") {
    const id = Number(path.split("/")[3]);
    state.applications = state.applications.map((app) =>
      Number(app.id) === id ? { ...app, status: "REJECTED", decisionReason: "Rejected in demo admin workflow." } : app
    );
    state.auditLogs = [
      { id: Date.now(), actorEmail: "admin@demo.com", details: `Demo admin rejected application #${id}`, createdAt: new Date().toISOString() },
      ...state.auditLogs
    ];
    writeState(state);
    return response(config, state.applications.find((app) => Number(app.id) === id));
  }

  return response(config, {}, 404);
};

export { demoAdapter, demoMode };
