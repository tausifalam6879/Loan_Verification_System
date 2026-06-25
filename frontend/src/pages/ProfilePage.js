import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Divider,
  Stack,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import LogoutIcon from "@mui/icons-material/Logout";
import SecurityIcon from "@mui/icons-material/Security";
import { getCurrentAuth, getProfile, logout } from "../services/authService";

const ProfilePage = () => {
  const navigate = useNavigate();
  const currentAuth = getCurrentAuth();
  const [profile, setProfile] = useState({
    fullName: "",
    email: currentAuth.email || "",
    role: currentAuth.role || "USER",
    totalApplications: 0,
    creditScore: null
  });
  const [loading, setLoading] = useState(true);
  const displayEmail = profile.email || "User";
  const displayName = displayEmail.includes("@")
    ? profile.fullName || displayEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : displayEmail;

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 5 }
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 920, mx: "auto" }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ mb: 2, textTransform: "none", fontWeight: 800 }}
          >
            Back to dashboard
          </Button>

          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 18px 42px rgba(15, 23, 42, 0.1)"
            }}
          >
            <Box
              sx={{
                px: { xs: 2.5, md: 4 },
                py: 3,
                color: "#ffffff",
                background: "linear-gradient(110deg, #082f49, #0f766e 58%, #2563eb)"
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 68,
                    height: 68,
                    bgcolor: "#f59e0b",
                    color: "#0f172a",
                    fontSize: 28,
                    fontWeight: 900
                  }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {displayName}
                  </Typography>
                  <Typography sx={{ color: "#ccfbf1", overflowWrap: "anywhere" }}>
                    {displayEmail}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                Account details
              </Typography>

              <Stack divider={<Divider flexItem />} spacing={0}>
                <DetailRow icon={<BadgeIcon />} label="Display name" value={displayName} />
                <DetailRow icon={<EmailIcon />} label="Email address" value={displayEmail} />
                <DetailRow
                  icon={<SecurityIcon />}
                  label="Account role"
                  value={<Chip size="small" label={profile.role || "USER"} color="primary" sx={{ fontWeight: 900 }} />}
                />
                <DetailRow icon={<BadgeIcon />} label="Total applications" value={profile.totalApplications ?? 0} />
                <DetailRow
                  icon={<SecurityIcon />}
                  label="Credit score"
                  value={profile.creditScore ?? "Not available"}
                />
              </Stack>

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: "action.hover",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>Session security</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Your dashboard is protected by the JWT session created during login.
                </Typography>
              </Box>

              <Button
                color="error"
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ mt: 3, textTransform: "none", fontWeight: 900 }}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "36px 1fr", sm: "36px 180px 1fr" },
      alignItems: "center",
      gap: 1.5,
      py: 2
    }}
  >
    <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
    <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
      {label}
    </Typography>
    <Box sx={{ gridColumn: { xs: "2", sm: "auto" }, fontWeight: 800, overflowWrap: "anywhere" }}>
      {value}
    </Box>
  </Box>
);

export default ProfilePage;
