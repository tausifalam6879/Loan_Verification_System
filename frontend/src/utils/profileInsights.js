import { applicationStatusGroup } from "./applicationDashboard";

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getCreditScoreBand = (value) => {
  const score = number(value, 0);
  if (!score) {
    return {
      label: "Not available",
      color: "#64748b",
      background: "#e2e8f0",
      progress: 0,
      message: "Submit a loan application to add a self-reported score."
    };
  }
  if (score >= 750) {
    return {
      label: "Excellent",
      color: "#15803d",
      background: "#dcfce7",
      progress: Math.min(100, ((score - 300) / 600) * 100),
      message: "Strong eligibility across most lender criteria."
    };
  }
  if (score >= 700) {
    return {
      label: "Good",
      color: "#047857",
      background: "#d1fae5",
      progress: Math.min(100, ((score - 300) / 600) * 100),
      message: "Good approval fit; compare total repayment before applying."
    };
  }
  if (score >= 650) {
    return {
      label: "Fair",
      color: "#b45309",
      background: "#fef3c7",
      progress: Math.min(100, ((score - 300) / 600) * 100),
      message: "Some offers may need income or document review."
    };
  }
  return {
    label: "Needs attention",
    color: "#b91c1c",
    background: "#fee2e2",
    progress: Math.min(100, ((score - 300) / 600) * 100),
    message: "Focus on repayment history and lower credit utilisation."
  };
};

export const summarizeProfileApplications = (applications = []) => {
  const summary = {
    total: applications.length,
    approved: 0,
    review: 0,
    blocked: 0,
    feePending: 0,
    recent: []
  };

  applications.forEach((application) => {
    const group = applicationStatusGroup(application.status);
    if (group === "approved") summary.approved += 1;
    if (group === "review") summary.review += 1;
    if (group === "blocked") summary.blocked += 1;
    if (String(application.paymentStatus || "UNPAID").toUpperCase() !== "PAID") {
      summary.feePending += 1;
    }
  });

  summary.recent = [...applications]
    .sort((left, right) => {
      const rightTime = new Date(right.createdAt || 0).getTime() || number(right.id);
      const leftTime = new Date(left.createdAt || 0).getTime() || number(left.id);
      return rightTime - leftTime;
    })
    .slice(0, 3);

  return summary;
};

export const getProfileCompleteness = (profile = {}) => {
  const checks = [
    { label: "full name", complete: Boolean(String(profile.fullName || "").trim()) },
    { label: "email", complete: Boolean(String(profile.email || "").trim()) },
    { label: "mobile number", complete: Boolean(String(profile.mobile || "").trim()) },
    {
      label: "credit profile",
      complete: profile.creditScore !== null
        && profile.creditScore !== undefined
        && profile.creditScore !== ""
        && Number.isFinite(Number(profile.creditScore))
    }
  ];
  const completed = checks.filter((check) => check.complete).length;

  return {
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
    missing: checks.filter((check) => !check.complete).map((check) => check.label)
  };
};

export const getSessionDetails = (token) => {
  if (!token) {
    return { status: "missing", label: "No active session", expiresAt: null };
  }

  const parts = String(token).split(".");
  if (parts.length !== 3 || typeof atob !== "function") {
    return { status: "active", label: "Active protected session", expiresAt: null };
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    if (!payload.exp) {
      return { status: "active", label: "Active protected session", expiresAt: null };
    }
    const expiresAt = new Date(payload.exp * 1000);
    const expired = expiresAt.getTime() <= Date.now();
    return {
      status: expired ? "expired" : "active",
      label: expired ? "Session expired" : "Active protected session",
      expiresAt
    };
  } catch (error) {
    return { status: "active", label: "Active protected session", expiresAt: null };
  }
};
