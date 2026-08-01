import axios from "axios";
import { demoAdapter, demoMode, revokeDemoSession } from "./demoAdapter";

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8081/api";
const marketApiBaseUrl = process.env.REACT_APP_MARKET_API_BASE_URL || apiBaseUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
  adapter: demoMode ? demoAdapter : undefined,
  headers: {
    "Content-Type": "application/json"
  }
});

// Public market data intentionally bypasses the browser-demo adapter. Production can call
// the Python market service directly, avoiding a second Render cold start through Spring.
export const marketApi = axios.create({
  baseURL: marketApiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      revokeDemoSession(localStorage.getItem("token"));
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      localStorage.removeItem("fintrack.session.issuedAt");
      localStorage.removeItem("fintrack.session.validatedAt");
      if (typeof window !== "undefined" && !window.location.hash.includes("/login")) {
        window.location.hash = "#/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
