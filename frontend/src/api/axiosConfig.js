import axios from "axios";
import { demoAdapter, demoMode, revokeDemoSession } from "./demoAdapter";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8081/api",
  adapter: demoMode ? demoAdapter : undefined,
  headers: {
    "Content-Type": "application/json"
  }
});

// Public market data intentionally bypasses the browser-demo adapter. In local/full-stack
// mode it reaches Spring Boot; on GitHub Pages it falls back to the timestamped snapshot.
export const marketApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8081/api",
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
      if (typeof window !== "undefined" && !window.location.hash.includes("/login")) {
        window.location.hash = "#/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
