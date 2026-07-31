import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { clearAuthSession, hasFreshSession, validateSession } from "../services/authService";

const localRole = () => localStorage.getItem("role") || "USER";
const isAuthenticationError = (error) => [401, 403].includes(error?.response?.status);

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem("token");
  const [session, setSession] = useState(() => ({
    status: token ? (hasFreshSession() ? "valid" : "checking") : "missing",
    role: token ? localRole() : null
  }));

  useEffect(() => {
    let active = true;

    if (!token) {
      return () => {
        active = false;
      };
    }

    const freshlyAuthenticated = hasFreshSession();
    setSession({ status: freshlyAuthenticated ? "valid" : "checking", role: localRole() });
    validateSession()
      .then((profile) => {
        if (active) {
          setSession({ status: "valid", role: profile.role || "USER" });
        }
      })
      .catch((error) => {
        // A sleeping free-tier server or a brief network failure must not log a
        // legitimate user out. Only the server's explicit 401/403 invalidates a JWT.
        if (isAuthenticationError(error)) {
          clearAuthSession();
          if (active) {
            setSession({ status: "invalid", role: null });
          }
        } else if (active) {
          setSession({ status: "valid", role: localRole() });
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!token || ["missing", "invalid"].includes(session.status)) {
    return <Navigate to="/login" replace />;
  }

  if (session.status === "checking") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default" }}>
        <Box sx={{ textAlign: "center", color: "white" }}>
          <CircularProgress size={30} sx={{ color: "#14b8a6" }} />
          <Typography sx={{ mt: 1.5, fontWeight: 800 }}>Verifying secure session...</Typography>
        </Box>
      </Box>
    );
  }

  if (requireAdmin && session.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
