import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { clearAuthSession, validateSession } from "../services/authService";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem("token");
  const [session, setSession] = useState({ status: token ? "checking" : "missing", role: null });

  useEffect(() => {
    let active = true;

    if (!token) {
      return () => {
        active = false;
      };
    }

    setSession({ status: "checking", role: null });
    validateSession()
      .then((profile) => {
        if (active) {
          setSession({ status: "valid", role: profile.role || "USER" });
        }
      })
      .catch(() => {
        clearAuthSession();
        if (active) {
          setSession({ status: "invalid", role: null });
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
