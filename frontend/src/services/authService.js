import api from "../api/axiosConfig";
import { revokeDemoSession } from "../api/demoAdapter";

export const clearAuthSession = () => {
  const token = localStorage.getItem("token");
  revokeDemoSession(token);
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
};

export const login = async (credentials) => {
  const response = await api.post("/users/login", credentials);
  const { token, role, email } = response.data;

  clearAuthSession();
  localStorage.setItem("token", token);
  localStorage.setItem("role", role || "USER");
  localStorage.setItem("email", email || credentials.email);

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

export const getAuthConfig = async () => {
  const response = await api.get("/users/auth-config");
  return response.data;
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
