import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { getAuthConfig, login, register, requestOtp, verifyOtp } from "../services/authService";

const AuthPage = ({ mode = "login" }) => {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "USER",
    otp: "",
    otpToken: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(false);

  const otpPurpose = isRegister ? "REGISTER" : "LOGIN";

  useEffect(() => {
    let isMounted = true;

    getAuthConfig()
      .then((config) => {
        if (isMounted) {
          const enabled = Boolean(config?.otpEnabled);
          setOtpEnabled(enabled);
          setOtpRequired(enabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOtpEnabled(false);
          setOtpRequired(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setWarning("");

    try {
      if (isRegister) {
        await register({ ...form, role: "USER", otpToken: form.otpToken });
        setSuccess("Account created. Login with the same email and password.");
        setForm((current) => ({ ...current, password: "", otp: "", otpToken: "" }));
      } else {
        await login({ email: form.email, password: form.password, otpToken: form.otpToken });
        navigate(localStorage.getItem("role") === "ADMIN" ? "/admin" : "/", { replace: true });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Authentication failed. Check email, password and backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setOtpLoading(true);
    setError("");
    setSuccess("");
    setWarning("");

    if (!otpEnabled) {
      return;
    }

    try {
      const response = await requestOtp({ email: form.email, purpose: otpPurpose });
      setOtpRequired(response.otpRequired);
      setOtpEnabled(response.otpRequired);
      if (response.otpRequired) {
        setSuccess(response.message);
      } else {
        setWarning("");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Could not request OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setError("");
    setSuccess("");
    setWarning("");

    if (!otpEnabled) {
      return;
    }

    try {
      const response = await verifyOtp({ email: form.email, purpose: otpPurpose, otp: form.otp });
      updateForm("otpToken", response.otpToken || "");
      setOtpRequired(response.otpRequired);
      setOtpEnabled(response.otpRequired);
      if (response.otpRequired) {
        setSuccess(response.message);
      } else {
        setWarning("");
      }
    } catch (error) {
      setError(error.response?.data?.message || "OTP verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2,
          background:
            "linear-gradient(135deg, #ecfeff 0%, #f8fafc 42%, #e0f2fe 100%)"
        }}
      >
        <Card
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 2,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 18px 44px rgba(15, 23, 42, 0.14)"
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#ccfbf1",
                  color: "#0f766e"
                }}
              >
                <AccountBalanceIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {isRegister ? "Create Account" : "Login"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Connect React dashboard with Spring Boot JWT APIs.
                </Typography>
              </Box>
            </Box>

            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              {error && <Alert severity="error">{error}</Alert>}
              {warning && <Alert severity="warning">{warning}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              {isRegister && (
                <TextField
                  label="Full name"
                  value={form.fullName}
                  onChange={(event) => updateForm("fullName", event.target.value)}
                  required
                  fullWidth
                />
              )}

              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                required
                fullWidth
              />

              {otpEnabled && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    label="Email OTP"
                    value={form.otp}
                    onChange={(event) => updateForm("otp", event.target.value)}
                    fullWidth
                    disabled={!otpRequired}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleRequestOtp}
                    disabled={otpLoading || !form.email}
                    sx={{ minWidth: 120, textTransform: "none", fontWeight: 900 }}
                  >
                    Send OTP
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || !otpRequired || !form.otp}
                    startIcon={<VerifiedUserIcon />}
                    sx={{ minWidth: 120, textTransform: "none", fontWeight: 900 }}
                  >
                    Verify
                  </Button>
                </Stack>
              )}

              {otpEnabled && form.otpToken && (
                <Chip
                  icon={<VerifiedUserIcon />}
                  label="OTP verified"
                  color="success"
                  sx={{ alignSelf: "flex-start", fontWeight: 900 }}
                />
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={isRegister ? <PersonAddIcon /> : <LoginIcon />}
                sx={{ borderRadius: 2, py: 1.2, textTransform: "none", fontWeight: 900 }}
              >
                {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
              </Button>

              <Typography variant="body2" sx={{ textAlign: "center", color: "#64748b" }}>
                {isRegister ? "Already registered?" : "Need an account?"}{" "}
                <Link to={isRegister ? "/login" : "/register"}>
                  {isRegister ? "Login" : "Register"}
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default AuthPage;
