import { predictExpenseCategory } from "../utils/expenseIntelligence";
import { buildCopilotFallbackAnswer, getCopilotPrompts } from "../utils/copilot";

const configuredDemoMode = process.env.REACT_APP_DEMO_MODE;
const isLocalPreview = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const isHostedStaticDemo = typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
const demoMode =
  configuredDemoMode === "true" ||
  (!configuredDemoMode && (isHostedStaticDemo || isLocalPreview));

const ACCOUNT_STORAGE_KEY = "fintrackDemoAccountsV1";
const STATE_STORAGE_PREFIX = "fintrackDemoStateV3";
const SESSION_STORAGE_PREFIX = "fintrackDemoSessionV1";
const OTP_STORAGE_PREFIX = "fintrackDemoOtpV1";
const OTP_TOKEN_STORAGE_PREFIX = "fintrackDemoOtpTokenV1";
const SESSION_TTL_MS = 30 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const PASSWORD_ALGORITHM = "PBKDF2-SHA256";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeMobile = (mobile) => String(mobile || "").replace(/[\s-]/g, "");
const normalizeChannel = (channel) => {
  const normalized = String(channel || "EMAIL").trim().toUpperCase();
  return ["MOBILE", "WHATSAPP"].includes(normalized) ? normalized : "EMAIL";
};
const stateStorageKey = (email) => `${STATE_STORAGE_PREFIX}:${normalizeEmail(email)}`;
const sessionStorageKey = (token) => `${SESSION_STORAGE_PREFIX}:${token}`;
const otpStorageKey = (purpose, channel, identity) =>
  `${OTP_STORAGE_PREFIX}:${String(purpose || "LOGIN").toUpperCase()}:${normalizeChannel(channel)}:${identity}`;
const otpTokenStorageKey = (token) => `${OTP_TOKEN_STORAGE_PREFIX}:${token}`;

const randomSecret = () => {
  if (typeof window === "undefined" || !window.crypto?.getRandomValues) {
    throw new Error("Secure browser cryptography is unavailable");
  }

  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const hashPassword = async (password, salt) => {
  if (typeof window === "undefined" || !window.crypto?.subtle || typeof TextEncoder === "undefined") {
    throw new Error("Secure browser cryptography is unavailable");
  }

  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const digest = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 120000, hash: "SHA-256" },
    passwordKey,
    256
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const hashLegacyPassword = async (password, salt) => {
  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const readAccounts = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNT_STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
};

const writeAccounts = (accounts) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  }
};

const verifyAndUpgradePassword = async (accounts, account, password) => {
  if (!account.passwordSalt || !account.passwordHash) return false;
  if (account.passwordAlgorithm && account.passwordAlgorithm !== PASSWORD_ALGORITHM) return false;

  const currentHash = await hashPassword(password, account.passwordSalt);
  if (currentHash === account.passwordHash) {
    if (!account.passwordAlgorithm) {
      writeAccounts(
        accounts.map((candidate) =>
          candidate.id === account.id
            ? { ...candidate, passwordAlgorithm: PASSWORD_ALGORITHM }
            : candidate
        )
      );
    }
    return true;
  }

  if (account.passwordAlgorithm) return false;
  const legacyHash = await hashLegacyPassword(password, account.passwordSalt);
  if (legacyHash !== account.passwordHash) return false;

  const passwordSalt = randomSecret();
  const passwordHash = await hashPassword(password, passwordSalt);
  writeAccounts(
    accounts.map((candidate) =>
      candidate.id === account.id
        ? { ...candidate, passwordSalt, passwordHash, passwordAlgorithm: PASSWORD_ALGORITHM }
        : candidate
    )
  );
  return true;
};

const identityFor = (payload, channel) =>
  normalizeChannel(channel) === "EMAIL" ? normalizeEmail(payload.email) : normalizeMobile(payload.mobile);

const findAccount = (accounts, payload, channel) => {
  const normalizedChannel = normalizeChannel(channel);
  const identity = identityFor(payload, normalizedChannel);
  return accounts.find((account) =>
    normalizedChannel === "EMAIL"
      ? normalizeEmail(account.email) === identity
      : normalizeMobile(account.mobile) === identity
  );
};

const readSession = (token) => {
  if (typeof window === "undefined" || !token) return null;
  try {
    const session = JSON.parse(window.sessionStorage.getItem(sessionStorageKey(token)) || "null");
    if (!session || session.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(sessionStorageKey(token));
      return null;
    }
    return session;
  } catch (error) {
    return null;
  }
};

const createSession = (account) => {
  const token = `demo-session-${randomSecret()}`;
  const session = {
    token,
    email: normalizeEmail(account.email),
    role: "USER",
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  window.sessionStorage.setItem(sessionStorageKey(token), JSON.stringify(session));
  return session;
};

const revokeDemoSession = (token) => {
  if (typeof window !== "undefined" && token) {
    window.sessionStorage.removeItem(sessionStorageKey(token));
  }
};

const tokenFromConfig = (config) => {
  const authorization = config.headers?.get?.("Authorization") || config.headers?.Authorization || config.headers?.authorization || "";
  return String(authorization).replace(/^Bearer\s+/i, "").trim();
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const monthsAgo = (offset, day = 12) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(1);
  date.setMonth(date.getMonth() - offset);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const timestampFor = (date, hour = 10) => `${date}T${String(hour).padStart(2, "0")}:15:00`;
const maskValue = (value, visible = 4) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return `${"X".repeat(Math.max(0, normalized.length - visible))}${normalized.slice(-visible)}`;
};
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
  profile: {
    fullName: "",
    mobile: ""
  },
  expenses: [
    { id: 1, amount: 8500, category: "Rent", description: "Monthly apartment rent", merchant: "Landlord", paymentMethod: "UPI", recurring: true, date: monthsAgo(0, 2), createdAt: timestampFor(monthsAgo(0, 2), 9) },
    { id: 2, amount: 2350, category: "Food", description: "Groceries and vegetables", merchant: "Reliance Fresh", paymentMethod: "Card", recurring: false, date: monthsAgo(0, 8), createdAt: timestampFor(monthsAgo(0, 8), 18) },
    { id: 3, amount: 799, category: "Bills", description: "Broadband monthly bill", merchant: "JioFiber", paymentMethod: "UPI", recurring: true, date: monthsAgo(0, 10), createdAt: timestampFor(monthsAgo(0, 10), 11) },
    { id: 4, amount: 620, category: "Travel", description: "Metro recharge and cab", merchant: "Delhi Metro", paymentMethod: "UPI", recurring: false, date: monthsAgo(0, 15), createdAt: timestampFor(monthsAgo(0, 15), 8) },
    { id: 5, amount: 8500, category: "Rent", description: "Monthly apartment rent", merchant: "Landlord", paymentMethod: "Bank Transfer", recurring: true, date: monthsAgo(1, 2), createdAt: timestampFor(monthsAgo(1, 2), 9) },
    { id: 6, amount: 4100, category: "Food", description: "Food and groceries", merchant: "Multiple", paymentMethod: "Card", recurring: false, date: monthsAgo(1, 14), createdAt: timestampFor(monthsAgo(1, 14), 19) },
    { id: 7, amount: 1499, category: "Shopping", description: "Running shoes", merchant: "Myntra", paymentMethod: "Card", recurring: false, date: monthsAgo(1, 21), createdAt: timestampFor(monthsAgo(1, 21), 20) },
    { id: 8, amount: 8500, category: "Rent", description: "Monthly apartment rent", merchant: "Landlord", paymentMethod: "Bank Transfer", recurring: true, date: monthsAgo(2, 2), createdAt: timestampFor(monthsAgo(2, 2), 9) },
    { id: 9, amount: 3700, category: "Food", description: "Monthly meals and groceries", merchant: "Multiple", paymentMethod: "UPI", recurring: false, date: monthsAgo(2, 16), createdAt: timestampFor(monthsAgo(2, 16), 18) },
    { id: 10, amount: 2499, category: "Education", description: "React advanced course", merchant: "Udemy", paymentMethod: "Card", recurring: false, date: monthsAgo(2, 19), createdAt: timestampFor(monthsAgo(2, 19), 14) },
    { id: 11, amount: 8500, category: "Rent", description: "Monthly apartment rent", merchant: "Landlord", paymentMethod: "Bank Transfer", recurring: true, date: monthsAgo(3, 2), createdAt: timestampFor(monthsAgo(3, 2), 9) },
    { id: 12, amount: 5200, category: "Food", description: "Food delivery and groceries", merchant: "Multiple", paymentMethod: "UPI", recurring: false, date: monthsAgo(3, 17), createdAt: timestampFor(monthsAgo(3, 17), 21) },
    { id: 13, amount: 8500, category: "Rent", description: "Monthly apartment rent", merchant: "Landlord", paymentMethod: "Bank Transfer", recurring: true, date: monthsAgo(4, 2), createdAt: timestampFor(monthsAgo(4, 2), 9) },
    { id: 14, amount: 1850, category: "Health", description: "Doctor consultation and medicines", merchant: "Apollo Pharmacy", paymentMethod: "Card", recurring: false, date: monthsAgo(4, 23), createdAt: timestampFor(monthsAgo(4, 23), 12) },
    { id: 15, amount: 8500, category: "Rent", description: "Monthly apartment rent", merchant: "Landlord", paymentMethod: "Bank Transfer", recurring: true, date: monthsAgo(5, 2), createdAt: timestampFor(monthsAgo(5, 2), 9) },
    { id: 16, amount: 4600, category: "Travel", description: "Train and local transport", merchant: "IRCTC", paymentMethod: "UPI", recurring: false, date: monthsAgo(5, 12), createdAt: timestampFor(monthsAgo(5, 12), 7) }
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
      loanOfferId: 3,
      status: "PRE_APPROVED",
      fraudScore: 18,
      fraudLevel: "LOW",
      deviceRisk: "low",
      employmentType: "salaried",
      loanPurpose: "Education and personal finance",
      city: "Raipur",
      createdAt: now(),
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

const readState = (email) => {
  if (typeof window === "undefined") {
    return clone(initialState);
  }

  const key = stateStorageKey(email);
  const saved = window.localStorage.getItem(key);
  if (!saved) {
    window.localStorage.setItem(key, JSON.stringify(initialState));
    return clone(initialState);
  }

  try {
    const state = { ...clone(initialState), ...JSON.parse(saved) };
    state.expenses = normalizeExpenseTimestamps(state.expenses);
    state.applications = (state.applications || []).map((application) => {
      const offerId = application.loanOfferId || (Number(application.id) === 1 ? 3 : null);
      const loanOffer = application.loanOffer || loanOffers.find((offer) => Number(offer.id) === Number(offerId));
      return loanOffer ? { ...application, loanOfferId: loanOffer.id, loanOffer } : application;
    });
    return state;
  } catch (error) {
    window.localStorage.setItem(key, JSON.stringify(initialState));
    return clone(initialState);
  }
};

const writeState = (state, email) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(stateStorageKey(email), JSON.stringify(state));
  }
};

const resetDemoState = () => {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem("token");
  const session = readSession(token);
  if (!session) return false;
  writeState(clone(initialState), session.email);
  return true;
};

const parseBody = (data) => {
  if (!data) {
    return {};
  }
  return typeof data === "string" ? JSON.parse(data) : data;
};

const response = (config, data, status = 200) => {
  const result = {
    data,
    status,
    statusText: status >= 400 ? "Request failed" : "OK",
    headers: {},
    config,
    request: {}
  };

  if (status >= 400) {
    const error = new Error(data?.message || "Request failed");
    error.response = result;
    error.config = config;
    error.isAxiosError = true;
    return Promise.reject(error);
  }

  return Promise.resolve(result);
};

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

const demoAdapter = async (config) => {
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
    const purpose = String(body.purpose || "LOGIN").toUpperCase();
    const channel = normalizeChannel(body.channel);
    const identity = identityFor(body, channel);
    const accounts = readAccounts();
    const account = findAccount(accounts, body, channel);

    if (!identity || (purpose === "LOGIN" && !account)) {
      return response(config, { message: "Unable to process OTP for the provided details" }, 400);
    }
    if (purpose === "REGISTER" && account) {
      return response(
        config,
        { message: `${channel === "EMAIL" ? "Email" : "Mobile number"} already registered. Please use Login instead.` },
        400
      );
    }

    window.sessionStorage.setItem(
      otpStorageKey(purpose, channel, identity),
      JSON.stringify({ otp: "123456", purpose, channel, identity, expiresAt: Date.now() + OTP_TTL_MS })
    );

    return response(config, {
      message: `Demo OTP generated for the verified ${channel.toLowerCase()} identity. Use OTP 123456.`,
      otpRequired: true,
      otpToken: null,
      deliveryChannel: "demo",
      developmentOtp: "123456"
    });
  }

  if (path === "/users/verify-otp" && method === "post") {
    const purpose = String(body.purpose || "LOGIN").toUpperCase();
    const channel = normalizeChannel(body.channel);
    const identity = identityFor(body, channel);
    const key = otpStorageKey(purpose, channel, identity);
    const request = JSON.parse(window.sessionStorage.getItem(key) || "null");

    if (
      !request ||
      request.expiresAt <= Date.now() ||
      request.identity !== identity ||
      request.purpose !== purpose ||
      String(body.otp) !== request.otp
    ) {
      return response(config, { success: false, message: "Invalid or expired OTP" }, 400);
    }

    if (purpose === "LOGIN" && !findAccount(readAccounts(), body, channel)) {
      window.sessionStorage.removeItem(key);
      return response(config, { success: false, message: "Unable to verify OTP for the provided login details" }, 400);
    }

    window.sessionStorage.removeItem(key);
    const otpToken = `demo-otp-${randomSecret()}`;
    window.sessionStorage.setItem(
      otpTokenStorageKey(otpToken),
      JSON.stringify({ purpose, channel, identity, expiresAt: Date.now() + OTP_TTL_MS })
    );

    return response(config, {
      message: "OTP verified.",
      otpRequired: true,
      otpToken,
      deliveryChannel: channel,
      developmentOtp: null
    });
  }

  if (path === "/users/login" && method === "post") {
    const channel = normalizeChannel(body.channel);
    const accounts = readAccounts();
    const account = findAccount(accounts, body, channel);

    if (!account) {
      return response(config, { message: "Invalid login details" }, 401);
    }

    if (body.otpToken) {
      const otpToken = JSON.parse(window.sessionStorage.getItem(otpTokenStorageKey(body.otpToken)) || "null");
      const identity = identityFor(body, channel);
      if (
        !otpToken ||
        otpToken.expiresAt <= Date.now() ||
        otpToken.purpose !== "LOGIN" ||
        otpToken.channel !== channel ||
        otpToken.identity !== identity
      ) {
        return response(config, { message: "Verified OTP is invalid or expired" }, 401);
      }
      window.sessionStorage.removeItem(otpTokenStorageKey(body.otpToken));
    } else {
      if (!body.password) {
        return response(config, { message: "Password or verified OTP is required" }, 401);
      }
      if (!(await verifyAndUpgradePassword(accounts, account, body.password))) {
        return response(config, { message: "Invalid login details" }, 401);
      }
    }

    const session = createSession(account);
    return response(config, {
      token: session.token,
      email: account.email,
      role: session.role
    });
  }

  if (path === "/users/register" && method === "post") {
    const email = normalizeEmail(body.email);
    const mobile = normalizeMobile(body.mobile);
    const fullName = String(body.fullName || "").trim();
    const password = String(body.password || "");
    const accounts = readAccounts();

    if (!fullName || !email || password.length < 8) {
      return response(config, { message: "Full name, valid email and an 8-character password are required" }, 400);
    }
    if (accounts.some((account) => normalizeEmail(account.email) === email)) {
      return response(config, { message: "Email already registered" }, 400);
    }
    if (mobile && accounts.some((account) => normalizeMobile(account.mobile) === mobile)) {
      return response(config, { message: "Mobile number already registered" }, 400);
    }

    if (body.otpToken) {
      const channel = normalizeChannel(body.otpChannel);
      const identity = identityFor({ email, mobile }, channel);
      const otpToken = JSON.parse(window.sessionStorage.getItem(otpTokenStorageKey(body.otpToken)) || "null");
      if (
        !otpToken ||
        otpToken.expiresAt <= Date.now() ||
        otpToken.purpose !== "REGISTER" ||
        otpToken.channel !== channel ||
        otpToken.identity !== identity
      ) {
        return response(config, { message: "Verified OTP is invalid or expired" }, 400);
      }
      window.sessionStorage.removeItem(otpTokenStorageKey(body.otpToken));
    }

    const passwordSalt = randomSecret();
    const account = {
      id: Date.now(),
      fullName,
      email,
      mobile,
      role: "USER",
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt),
      passwordAlgorithm: PASSWORD_ALGORITHM
    };
    writeAccounts([...accounts, account]);
    readState(email);

    return response(config, {
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      mobile: account.mobile,
      role: account.role,
      totalApplications: 0,
      creditScore: null
    });
  }

  const session = readSession(tokenFromConfig(config));
  const account = session
    ? readAccounts().find((candidate) => normalizeEmail(candidate.email) === session.email)
    : null;
  if (!session || !account) {
    return response(config, { message: "Your secure session is invalid or expired. Please log in again." }, 401);
  }
  if (path.startsWith("/admin/") && session.role !== "ADMIN") {
    return response(config, { message: "Administrator access is required" }, 403);
  }

  const state = readState(session.email);
  const persistState = () => writeState(state, session.email);

  if (path === "/ai/chat" && method === "post") {
    const currentDate = new Date();
    const currentMonthExpense = state.expenses.reduce((sum, expense) => {
      const rawDate = expense.date || expense.createdAt;
      if (!rawDate) return sum;
      const parsedDate = new Date(String(rawDate).includes("T") ? rawDate : `${rawDate}T00:00:00`);
      const isCurrentMonth =
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.getFullYear() === currentDate.getFullYear() &&
        parsedDate.getMonth() === currentDate.getMonth();
      return sum + (isCurrentMonth ? Number(expense.amount || 0) : 0);
    }, 0);
    const page = body.page || "overview";
    const answer = buildCopilotFallbackAnswer({
      question: body.message,
      page,
      expenses: state.expenses,
      applications: state.applications,
      totalExpense: currentMonthExpense
    });

    return response(config, {
      success: true,
      message: "Account-scoped demo analytics generated",
      data: {
        answer,
        usedContext: true,
        suggestedQuestions: getCopilotPrompts(page).slice(0, 3),
        provider: "demo-analytics",
        model: "account-scoped-local",
        liveProvider: false
      }
    });
  }

  if (path === "/users/me" && method === "get") {
    const submittedScores = state.applications
      .map((application) => Number(application.creditScore))
      .filter((score) => Number.isFinite(score));

    return response(config, {
      id: account.id,
      fullName: state.profile?.fullName || account.fullName,
      email: account.email,
      mobile: state.profile?.mobile || "",
      role: session.role,
      totalApplications: state.applications.length,
      creditScore: submittedScores.length ? Math.max(...submittedScores) : null
    });
  }

  if (path === "/users/me" && method === "patch") {
    const updatedMobile = normalizeMobile(body.mobile);
    const accounts = readAccounts();
    if (
      updatedMobile &&
      accounts.some(
        (candidate) => candidate.id !== account.id && normalizeMobile(candidate.mobile) === updatedMobile
      )
    ) {
      return response(config, { message: "Mobile number already registered" }, 400);
    }

    state.profile = {
      fullName: String(body.fullName || "").trim(),
      mobile: updatedMobile
    };
    writeAccounts(
      accounts.map((candidate) =>
        candidate.id === account.id
          ? { ...candidate, fullName: state.profile.fullName, mobile: updatedMobile }
          : candidate
      )
    );
    persistState();
    const submittedScores = state.applications
      .map((application) => Number(application.creditScore))
      .filter((score) => Number.isFinite(score));

    return response(config, {
      id: account.id,
      ...state.profile,
      email: account.email,
      role: session.role,
      totalApplications: state.applications.length,
      creditScore: submittedScores.length ? Math.max(...submittedScores) : null
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
    persistState();
    return response(config, { success: true, message: "Demo expense added", data: expense });
  }

  if (path.startsWith("/expenses/update/") && method === "put") {
    const id = Number(path.split("/").pop());
    state.expenses = state.expenses.map((expense) =>
      Number(expense.id) === id
        ? { ...expense, ...body, id, createdAt: expense.createdAt || now() }
        : expense
    );
    persistState();
    return response(config, {
      success: true,
      message: "Demo expense updated",
      data: state.expenses.find((expense) => Number(expense.id) === id)
    });
  }

  if (path.startsWith("/expenses/delete/") && method === "delete") {
    const id = Number(path.split("/").pop());
    state.expenses = state.expenses.filter((expense) => Number(expense.id) !== id);
    persistState();
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

  if (path === "/loans/offers" && method === "get") {
    return response(config, loanOffers);
  }

  if (path.startsWith("/loans/offers/") && method === "get") {
    const id = Number(path.split("/").pop());
    return response(config, loanOffers.find((offer) => offer.id === id) || loanOffers[0]);
  }

  if (path === "/loans/apply" && method === "post") {
    const fraudScore = Number(body.creditScore || 0) < 620 ? 54 : 18;
    const selectedOffer = loanOffers.find((offer) => Number(offer.id) === Number(body.loanOfferId)) || loanOffers[0];
    const safeBody = {
      ...body,
      maskedAadhaarNumber: maskValue(body.aadhaarNumber),
      maskedPanNumber: maskValue(body.panNumber, 3),
      maskedBankAccountNumber: maskValue(body.bankAccountNumber),
      maskedNomineePhone: maskValue(body.nomineePhone),
      aadhaarDocumentUploaded: Boolean(body.aadhaarDocumentUrl || body.aadhaarDocumentDataUrl),
      panDocumentUploaded: Boolean(body.panDocumentUrl || body.panDocumentDataUrl)
    };
    ["aadhaarNumber", "panNumber", "bankAccountNumber", "nomineePhone", "passportPhotoUrl", "passportPhotoDataUrl", "aadhaarDocumentUrl", "aadhaarDocumentDataUrl", "panDocumentUrl", "panDocumentDataUrl"].forEach((field) => delete safeBody[field]);
    const app = {
      id: Date.now(),
      ...safeBody,
      loanOffer: selectedOffer,
      status: fraudScore > 40 ? "PENDING_REVIEW" : "PRE_APPROVED",
      fraudScore,
      fraudLevel: fraudScore > 40 ? "MEDIUM" : "LOW",
      paymentStatus: "UNPAID",
      verificationSummary: "Demo verification completed successfully.",
      decisionReason: "Demo decision generated from frontend sample data."
    };
    state.applications = [app, ...state.applications];
    persistState();
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
    persistState();
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
    persistState();
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
    persistState();
    return response(config, state.applications.find((app) => Number(app.id) === id));
  }

  return response(config, {}, 404);
};

export { demoAdapter, demoMode, resetDemoState, revokeDemoSession };
