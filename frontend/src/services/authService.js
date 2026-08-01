import api from "../api/axiosConfig";
import { revokeDemoSession } from "../api/demoAdapter";

const AUTH_WARMUP_TIMEOUT_MS = 90000;
const SESSION_VALIDATION_TIMEOUT_MS = 8000;
const FRESH_SESSION_WINDOW_MS = 15 * 60 * 1000;
const TRUSTED_SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;
const SESSION_ISSUED_AT_KEY = "fintrack.session.issuedAt";
const SESSION_VALIDATED_AT_KEY = "fintrack.session.validatedAt";
let authWarmupPromise;
let sessionValidationPromise;

const readTimestamp = (key) => {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const isWithinWindow = (timestamp, windowMs) => {
  const age = Date.now() - timestamp;
  return timestamp > 0 && age >= 0 && age < windowMs;
};

const markSessionValidated = () => {
  localStorage.setItem(SESSION_VALIDATED_AT_KEY, String(Date.now()));
};

export const clearAuthSession = () => {
  const token = localStorage.getItem("token");
  revokeDemoSession(token);
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  localStorage.removeItem(SESSION_ISSUED_AT_KEY);
  localStorage.removeItem(SESSION_VALIDATED_AT_KEY);
  sessionValidationPromise = null;
};

export const login = async (credentials) => {
  const response = await api.post("/users/login", credentials);
  const { token, role, email } = response.data;

  clearAuthSession();
  localStorage.setItem("token", token);
  localStorage.setItem("role", role || "USER");
  localStorage.setItem("email", email || credentials.email);
  // A freshly issued server token is already authenticated. This timestamp lets
  // the protected route render immediately while it validates in the background.
  localStorage.setItem(SESSION_ISSUED_AT_KEY, String(Date.now()));
  markSessionValidated();

  return response.data;
};

export const register = async (payload) => {
  const response = await api.post("/users/register", payload);
  return response.data;
};

export const requestOtp = async (payload) => {
  const response = await api.post("/users/request-otp", payload);
  return response.data;
};

export const verifyOtp = async (payload) => {
  const response = await api.post("/users/verify-otp", payload);
  return response.data;
};

export const warmUpAuthService = () => {
  if (!authWarmupPromise) {
    authWarmupPromise = api
      .get("/users/auth-config", { timeout: AUTH_WARMUP_TIMEOUT_MS })
      .then((response) => response.data)
      .catch((error) => {
        // Allow a later manual retry after a temporary cloud/network failure.
        authWarmupPromise = null;
        throw error;
      });
  }

  return authWarmupPromise;
};

export const getAuthConfig = warmUpAuthService;

export const hasFreshSession = () => {
  const latestServerProof = Math.max(
    readTimestamp(SESSION_ISSUED_AT_KEY),
    readTimestamp(SESSION_VALIDATED_AT_KEY)
  );
  return Boolean(localStorage.getItem("token")) && isWithinWindow(latestServerProof, FRESH_SESSION_WINDOW_MS);
};

// A token saved by a successful login/validation can render the route shell while
// an older session is rechecked in the background. Protected APIs still verify the
// JWT on every request, and an explicit 401/403 clears this local marker.
export const hasTrustedSession = () => {
  const latestServerProof = Math.max(
    readTimestamp(SESSION_ISSUED_AT_KEY),
    readTimestamp(SESSION_VALIDATED_AT_KEY)
  );
  return Boolean(localStorage.getItem("token")) && isWithinWindow(latestServerProof, TRUSTED_SESSION_WINDOW_MS);
};

export const logout = () => {
  clearAuthSession();
};

export const getCurrentAuth = () => ({
  token: localStorage.getItem("token"),
  role: localStorage.getItem("role"),
  email: localStorage.getItem("email")
});

export const getProfile = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const validateSession = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication is required");
  }

  if (!sessionValidationPromise) {
    sessionValidationPromise = api
      .get("/users/session", { timeout: SESSION_VALIDATION_TIMEOUT_MS })
      .catch((error) => {
        // Keep the frontend compatible during a rolling deploy where GitHub Pages
        // may update a few moments before the new lightweight backend endpoint.
        if (error.response?.status === 404) {
          return api.get("/users/me", { timeout: SESSION_VALIDATION_TIMEOUT_MS });
        }
        throw error;
      })
      .then((response) => {
        const session = response.data;
        if (localStorage.getItem("token") === token) {
          localStorage.setItem("role", session.role || "USER");
          localStorage.setItem("email", session.email || "");
          markSessionValidated();
        }
        return session;
      })
      .finally(() => {
        sessionValidationPromise = null;
      });
  }

  return sessionValidationPromise;
};

export const updateProfile = async (profile) => {
  const response = await api.patch("/users/me", profile);
  return response.data;
};
