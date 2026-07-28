import React, { useMemo, useState } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeMode, setThemeMode] = useState(() => {
    const savedMode = localStorage.getItem("themeMode") || "system";
    return savedMode === "dark" ? "soft" : savedMode;
  });
  const activeMode = themeMode === "system" ? (prefersDarkMode ? "soft" : "light") : themeMode;
  const isSoftMode = activeMode === "soft";

  const theme = useMemo(
    () =>
      createTheme({
        fintrackMode: activeMode,
        palette: {
          mode: "light",
          primary: {
            main: isSoftMode ? "#6f5795" : "#0d9488"
          },
          secondary: {
            main: isSoftMode ? "#d66f82" : "#2563eb"
          },
          background: {
            default: isSoftMode ? "#f8eff3" : "#eaf4f2",
            paper: isSoftMode ? "#fffdfd" : "#ffffff"
          },
          text: isSoftMode
            ? {
                primary: "#271f3d",
                secondary: "#6e637d"
              }
            : {
                primary: "#0f172a",
                secondary: "#64748b"
              },
          divider: isSoftMode
            ? "rgba(86, 64, 112, 0.15)"
            : "rgba(15, 23, 42, 0.12)"
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                background: isSoftMode
                  ? "linear-gradient(135deg, #fae8eb 0%, #fff4e6 48%, #eaf4ff 100%)"
                  : "linear-gradient(135deg, #eaf4f2 0%, #edf4ff 48%, #f6f1e8 100%)"
              }
            }
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                ...(isSoftMode && {
                  backgroundColor: "#fffdfd"
                })
              }
            }
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                ...(isSoftMode && {
                  boxShadow: "0 6px 20px rgba(75, 52, 96, 0.08)"
                })
              }
            }
          }
        },
        shape: {
          borderRadius: 8
        }
      }),
    [activeMode, isSoftMode]
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
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
            "/investments",
            "/markets"
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
