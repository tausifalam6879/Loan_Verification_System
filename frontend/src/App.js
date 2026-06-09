import React, { useMemo, useState } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("themeMode") || "system");
  const activeMode = themeMode === "system" ? (prefersDarkMode ? "dark" : "light") : themeMode;

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: activeMode,
          primary: {
            main: "#0d9488"
          },
          secondary: {
            main: "#2563eb"
          },
          background: {
            default: activeMode === "dark" ? "#06141b" : "#eaf4f2",
            paper: activeMode === "dark" ? "#0f172a" : "#ffffff"
          }
        },
        shape: {
          borderRadius: 8
        }
      }),
    [activeMode]
  );

  const handleThemeModeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem("themeMode", mode);
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {[
            "/",
            "/expense",
            "/transactions",
            "/loans",
            "/payments",
            "/applications",
            "/investments"
          ].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Dashboard
                    themeMode={themeMode}
                    activeMode={activeMode}
                    onThemeModeChange={handleThemeModeChange}
                  />
                </ProtectedRoute>
              }
            />
          ))}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
