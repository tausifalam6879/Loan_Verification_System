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
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import EmailIcon from "@mui/icons-material/Email";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { getAuthConfig, login, register, requestOtp, verifyOtp } from "../services/authService";

const AuthPage = ({ mode = "login" }) => {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
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
  const [authConfig, setAuthConfig] = useState({
    otpEnabled: true,
    emailOtpEnabled: true,
    mobileOtpEnabled: true,
    whatsappOtpEnabled: true,
    passwordLoginEnabled: true
  });
  const [authMethod, setAuthMethod] = useState("password");

  const otpPurpose = isRegister ? "REGISTER" : "LOGIN";

  useEffect(() => {
    let isMounted = true;

    getAuthConfig()
      .then((config) => {
        if (isMounted) {
          setAuthConfig((current) => ({
            ...current,
            ...config
          }));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthConfig((current) => ({
            ...current,
            otpEnabled: true,
            emailOtpEnabled: true,
            mobileOtpEnabled: true,
            whatsappOtpEnabled: true
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const getErrorMessage = (error) => {
    if (!error.response) {
      return "Backend is not reachable on http://localhost:8081. Start Spring Boot backend first.";
    }

    return error.response?.data?.message || "Authentication failed. Check email, password and backend.";
  };

  const isOtpMethod = ["emailOtp", "mobileOtp", "whatsappOtp"].includes(authMethod);

  const otpChannel = () => {
    if (authMethod === "mobileOtp") {
      return "MOBILE";
    }
    if (authMethod === "whatsappOtp") {
      return "WHATSAPP";
    }
    return "EMAIL";
  };

  const otpLabel = () => {
    if (authMethod === "mobileOtp") {
      return "Mobile OTP";
    }
    if (authMethod === "whatsappOtp") {
      return "WhatsApp OTP";
    }
    return "Email OTP";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setWarning("");

    try {
      if (isOtpMethod && !form.otpToken) {
        setError(`Verify ${otpLabel()} first, then continue.`);
        return;
      }

      if (isRegister) {
        await register({ ...form, role: "USER", otpToken: form.otpToken, otpChannel: otpChannel() });
        setSuccess("Account created. Login with the same email and password.");
        setForm((current) => ({ ...current, password: "", otp: "", otpToken: "" }));
      } else {
        await login({
          email: form.email,
          mobile: form.mobile,
          channel: authMethod === "password" ? "PASSWORD" : otpChannel(),
          password: authMethod === "password" ? form.password : "",
          otpToken: isOtpMethod ? form.otpToken : ""
        });
        navigate(localStorage.getItem("role") === "ADMIN" ? "/admin" : "/", { replace: true });
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setOtpLoading(true);
    setError("");
    setSuccess("");
    setWarning("");

    try {
      const response = await requestOtp({
        email: form.email,
        mobile: form.mobile,
        channel: otpChannel(),
        purpose: otpPurpose
      });
      setOtpRequired(response.otpRequired);
      if (response.otpRequired) {
        setSuccess(response.message);
      } else {
        setWarning(response.message || "Email OTP is disabled in backend configuration.");
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setError("");
    setSuccess("");
    setWarning("");

    try {
      const response = await verifyOtp({
        email: form.email,
        mobile: form.mobile,
        channel: otpChannel(),
        purpose: otpPurpose,
        otp: form.otp
      });
      updateForm("otpToken", response.otpToken || "");
      setOtpRequired(response.otpRequired);
      if (response.otpRequired) {
        setSuccess(response.message);
      } else {
        setWarning(response.message || "Email OTP is disabled in backend configuration.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "OTP verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAuthMethodChange = (event, value) => {
    if (!value) {
      return;
    }

    setAuthMethod(value);
    setError("");
    setSuccess("");
    setWarning("");
    setOtpRequired(false);
    setForm((current) => ({ ...current, otp: "", otpToken: "" }));
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

              <ToggleButtonGroup
                exclusive
                fullWidth
                value={authMethod}
                onChange={handleAuthMethodChange}
                size="small"
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                  gap: 1,
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "1px solid rgba(148, 163, 184, 0.38)",
                    borderRadius: "8px !important",
                    m: 0,
                    textTransform: "none",
                    fontWeight: 800
                  }
                }}
              >
                <ToggleButton value="password" disabled={!authConfig.passwordLoginEnabled}>
                  <LoginIcon fontSize="small" sx={{ mr: 0.75 }} />
                  Password
                </ToggleButton>
                <ToggleButton value="emailOtp">
                  <EmailIcon fontSize="small" sx={{ mr: 0.75 }} />
                  Email OTP
                </ToggleButton>
                <ToggleButton value="mobileOtp">
                  <PhoneAndroidIcon fontSize="small" sx={{ mr: 0.75 }} />
                  Mobile
                </ToggleButton>
                <ToggleButton value="whatsappOtp">
                  <WhatsAppIcon fontSize="small" sx={{ mr: 0.75 }} />
                  WhatsApp
                </ToggleButton>
              </ToggleButtonGroup>

              {isOtpMethod && !authConfig.otpEnabled && (
                <Alert severity="info">
                  OTP is available after starting backend with APP_OTP_ENABLED=true. Password login still works.
                </Alert>
              )}

              {isRegister && (
                <TextField
                  label="Full name"
                  value={form.fullName}
                  onChange={(event) => updateForm("fullName", event.target.value)}
                  required
                  fullWidth
                />
              )}

              {(isRegister || !["mobileOtp", "whatsappOtp"].includes(authMethod)) && (
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  required
                  fullWidth
                />
              )}

              {(isRegister || ["mobileOtp", "whatsappOtp"].includes(authMethod)) && (
                <TextField
                  label={authMethod === "whatsappOtp" ? "WhatsApp number" : "Mobile number"}
                  value={form.mobile}
                  onChange={(event) => updateForm("mobile", event.target.value)}
                  fullWidth
                  required={["mobileOtp", "whatsappOtp"].includes(authMethod)}
                />
              )}

              {(authMethod === "password" || isRegister) && (
                <TextField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  required={authMethod === "password" || isRegister}
                  fullWidth
                />
              )}

              {isOtpMethod && (
                <>
                  <Divider />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    label={otpLabel()}
                    value={form.otp}
                    onChange={(event) => updateForm("otp", event.target.value)}
                    fullWidth
                    disabled={!otpRequired}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleRequestOtp}
                    disabled={
                      otpLoading ||
                      (authMethod === "emailOtp" ? !form.email : !form.mobile)
                    }
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
                </>
              )}

              {isOtpMethod && form.otpToken && (
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
