import api from "../api/axiosConfig";
import { revokeDemoSession } from "../api/demoAdapter";

const AUTH_WARMUP_TIMEOUT_MS = 90000;
const FRESH_SESSION_WINDOW_MS = 2 * 60 * 1000;
const SESSION_ISSUED_AT_KEY = "fintrack.session.issuedAt";
let authWarmupPromise;

export const clearAuthSession = () => {
  const token = localStorage.getItem("token");
  revokeDemoSession(token);
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  localStorage.removeItem(SESSION_ISSUED_AT_KEY);
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
  const issuedAt = Number(localStorage.getItem(SESSION_ISSUED_AT_KEY));
  const age = Date.now() - issuedAt;
  return Boolean(localStorage.getItem("token")) && Number.isFinite(issuedAt) && age >= 0 && age < FRESH_SESSION_WINDOW_MS;
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
  if (!localStorage.getItem("token")) {
    throw new Error("Authentication is required");
  }

  const profile = await getProfile();
  localStorage.setItem("role", profile.role || "USER");
  localStorage.setItem("email", profile.email || "");
  return profile;
};

export const updateProfile = async (profile) => {
  const response = await api.patch("/users/me", profile);
  return response.data;
};
