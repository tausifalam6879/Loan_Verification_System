import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Divider,
  Grid,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BadgeIcon from "@mui/icons-material/Badge";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import LogoutIcon from "@mui/icons-material/Logout";
import PaymentsIcon from "@mui/icons-material/Payments";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PhoneIcon from "@mui/icons-material/Phone";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { getCurrentAuth, getProfile, logout, updateProfile } from "../services/authService";
import { getLoanApplications } from "../services/loanService";
import {
  getCreditScoreBand,
  getProfileCompleteness,
  getSessionDetails,
  summarizeProfileApplications
} from "../utils/profileInsights";

const emptyProfile = (auth) => ({
  fullName: "",
  email: auth.email || "",
  mobile: "",
  role: auth.role || "USER",
  totalApplications: 0,
  creditScore: null
});

const ProfilePage = () => {
  const navigate = useNavigate();
  const currentAuth = getCurrentAuth() || {};
  const [profile, setProfile] = useState(() => emptyProfile(currentAuth));
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [applicationWarning, setApplicationWarning] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState("");
  const [form, setForm] = useState({ fullName: "", mobile: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError("");
    setApplicationWarning("");

    const [profileResult, applicationsResult] = await Promise.allSettled([
      getProfile(),
      getLoanApplications()
    ]);

    if (profileResult.status === "fulfilled") {
      setProfile(profileResult.value);
      setForm({
        fullName: profileResult.value.fullName || "",
        mobile: profileResult.value.mobile || ""
      });
    } else {
      setError(profileResult.reason?.response?.data?.message || "Could not load your account profile. Please retry.");
    }

    if (applicationsResult.status === "fulfilled") {
      setApplications(Array.isArray(applicationsResult.value) ? applicationsResult.value : []);
    } else {
      setApplicationWarning("Application insights are temporarily unavailable. Your account details are still safe.");
    }

    setLastRefreshedAt(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const displayEmail = profile.email || currentAuth.email || "User";
  const displayName = displayEmail.includes("@")
    ? profile.fullName || displayEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : profile.fullName || displayEmail;
  const applicationSummary = useMemo(
    () => summarizeProfileApplications(applications),
    [applications]
  );
  const totalApplications = applicationWarning
    ? Number(profile.totalApplications || 0)
    : applicationSummary.total;
  const scoreBand = useMemo(
    () => getCreditScoreBand(profile.creditScore),
    [profile.creditScore]
  );
  const completeness = useMemo(
    () => getProfileCompleteness(profile),
    [profile]
  );
  const session = useMemo(
    () => getSessionDetails(currentAuth.token),
    [currentAuth.token]
  );

  const handleEdit = () => {
    setForm({ fullName: profile.fullName || displayName, mobile: profile.mobile || "" });
    setEditing(true);
  };

  const handleSave = async () => {
    const fullName = form.fullName.trim();
    const mobile = form.mobile.trim();
    if (fullName.length < 2) {
      setSnackbar({ open: true, message: "Enter a valid full name.", severity: "error" });
      return;
    }
    if (mobile && !/^[0-9+\-\s]{10,20}$/.test(mobile)) {
      setSnackbar({ open: true, message: "Enter a valid mobile number.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile({ fullName, mobile });
      setProfile(updated);
      setForm({ fullName: updated.fullName || "", mobile: updated.mobile || "" });
      setEditing(false);
      setSnackbar({ open: true, message: "Profile updated successfully.", severity: "success" });
    } catch (saveError) {
      setSnackbar({
        open: true,
        message: saveError.response?.data?.message || "Profile could not be updated.",
        severity: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const openApplications = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    navigate("/applications");
  };

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
          background: (theme) => theme.fintrackMode === "soft"
            ? "radial-gradient(circle at top, rgba(205,159,204,0.20), transparent 28rem), linear-gradient(180deg, #fae8eb, #fff5e8 42rem, #edf5ff)"
            : "linear-gradient(180deg, #ecfeff 0, #f8fafc 24rem, #ffffff 100%)",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 }
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto" }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ mb: 2, textTransform: "none", fontWeight: 800 }}
          >
            Back to dashboard
          </Button>

          <Card elevation={0} sx={{ ...panelStyle, mb: 2 }}>
            <Box
              sx={{
                px: { xs: 2.5, md: 4 },
                py: { xs: 3, md: 3.5 },
                color: "#ffffff",
                background: "linear-gradient(110deg, #082f49, #0f766e 52%, #2563eb)"
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2.5}
                sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 76,
                      height: 76,
                      bgcolor: "#f59e0b",
                      color: "#0f172a",
                      fontSize: 30,
                      fontWeight: 900,
                      border: "4px solid rgba(255,255,255,0.28)"
                    }}
                  >
                    {displayName.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: "#99f6e4", fontWeight: 900 }}>
                      Account command center
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                      {displayName}
                    </Typography>
                    <Typography sx={{ color: "#ccfbf1", overflowWrap: "anywhere", mt: 0.4 }}>
                      {displayEmail}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap" }}>
                      <Chip size="small" label={profile.role || "USER"} sx={{ bgcolor: "#ccfbf1", color: "#115e59", fontWeight: 900 }} />
                      <Chip size="small" icon={<VerifiedUserIcon />} label={session.label} sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#ffffff", fontWeight: 800, "& .MuiChip-icon": { color: "#86efac" } }} />
                    </Stack>
                  </Box>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadProfileData}
                    disabled={loading}
                    sx={heroButtonStyle}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    sx={{ ...heroButtonStyle, bgcolor: "#ffffff", color: "#0f172a", "&:hover": { bgcolor: "#e2e8f0" } }}
                  >
                    Edit profile
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Card>

          {loading && (
            <Card sx={{ ...panelStyle, mb: 2 }}>
              <CardContent sx={{ py: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <CircularProgress size={24} />
                <Typography sx={{ fontWeight: 800 }}>Loading your profile and application activity...</Typography>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert
              severity="error"
              action={<Button color="inherit" size="small" onClick={loadProfileData}>Retry</Button>}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}
          {applicationWarning && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{applicationWarning}</Alert>}

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <ProfileMetric icon={<CreditScoreIcon />} label="Submitted score" value={profile.creditScore ?? "—"} meta={scoreBand.label} color={scoreBand.color} />
            <ProfileMetric icon={<AssignmentTurnedInIcon />} label="Applications" value={totalApplications} meta="Your records" color="#2563eb" />
            <ProfileMetric icon={<CheckCircleIcon />} label="Pre-approved" value={applicationSummary.approved} meta="Positive decisions" color="#16a34a" />
            <ProfileMetric icon={<PaymentsIcon />} label="Fee pending" value={applicationSummary.feePending} meta="Action required" color="#7c3aed" />
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack spacing={2}>
                <Card sx={panelStyle}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <SectionHeading
                      icon={<BadgeIcon />}
                      title="Personal information"
                      subtitle="Your authenticated account details and contact information."
                    />

                    {editing ? (
                      <Stack spacing={2} sx={{ mt: 2.5 }}>
                        <TextField
                          fullWidth
                          required
                          label="Full name"
                          value={form.fullName}
                          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                          slotProps={{ htmlInput: { maxLength: 100 } }}
                        />
                        <TextField fullWidth label="Email address" value={displayEmail} disabled helperText="Email remains linked to the authenticated account." />
                        <TextField
                          fullWidth
                          label="Mobile number"
                          value={form.mobile}
                          onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
                          helperText="10–20 digits; country code is supported."
                        />
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving} sx={actionButtonStyle}>
                            {saving ? "Saving..." : "Save changes"}
                          </Button>
                          <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditing(false)} disabled={saving} sx={actionButtonStyle}>
                            Cancel
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack divider={<Divider flexItem />} spacing={0} sx={{ mt: 1.5 }}>
                        <DetailRow icon={<BadgeIcon />} label="Display name" value={displayName} />
                        <DetailRow icon={<EmailIcon />} label="Email address" value={displayEmail} tag="Verified login" />
                        <DetailRow icon={<PhoneIcon />} label="Mobile number" value={profile.mobile || "Not added"} tag={profile.mobile ? "Contact ready" : "Add number"} />
                        <DetailRow icon={<SecurityIcon />} label="Account role" value={profile.role || "USER"} />
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Card sx={panelStyle}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
                      <SectionHeading
                        icon={<PendingActionsIcon />}
                        title="Recent loan activity"
                        subtitle="Latest applications submitted from your account."
                      />
                      <Button variant="outlined" onClick={openApplications} sx={actionButtonStyle}>View all applications</Button>
                    </Box>

                    {applications.length === 0 ? (
                      <Box sx={{ mt: 2, p: 2.5, borderRadius: 2, bgcolor: "action.hover", textAlign: "center" }}>
                        <Typography sx={{ fontWeight: 900 }}>No applications found</Typography>
                        <Typography variant="body2" color="text.secondary">Explore the Loan Marketplace to create your first application.</Typography>
                        <Button onClick={() => navigate("/loans")} sx={{ mt: 1, textTransform: "none", fontWeight: 900 }}>Browse loan offers</Button>
                      </Box>
                    ) : (
                      <Stack spacing={1.25} sx={{ mt: 2 }}>
                        {applicationSummary.recent.map((application) => (
                          <ApplicationActivity key={application.id} application={application} />
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={2}>
                <Card sx={panelStyle}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <SectionHeading
                      icon={<CreditScoreIcon />}
                      title="Financial snapshot"
                      subtitle="Eligibility context from your submitted applications."
                    />
                    <Box sx={{ mt: 2.5, p: 2.25, borderRadius: 2.5, bgcolor: scoreBand.background, color: "#0f172a" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 1 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: "#475569", fontWeight: 800 }}>CREDIT PROFILE</Typography>
                          <Typography variant="h3" sx={{ color: scoreBand.color, fontWeight: 900 }}>{profile.creditScore ?? "—"}</Typography>
                        </Box>
                        <Chip label={scoreBand.label} sx={{ bgcolor: "#ffffff", color: scoreBand.color, fontWeight: 900 }} />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={scoreBand.progress}
                        sx={{ mt: 1.5, height: 9, borderRadius: 99, bgcolor: "rgba(100,116,139,0.18)", "& .MuiLinearProgress-bar": { bgcolor: scoreBand.color, borderRadius: 99 } }}
                      />
                      <Typography variant="body2" sx={{ color: "#334155", mt: 1.25, fontWeight: 700 }}>{scoreBand.message}</Typography>
                    </Box>
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                      This is the highest self-reported score from your submitted loan applications—not a live CIBIL or Experian bureau pull.
                    </Alert>
                  </CardContent>
                </Card>

                <Card sx={panelStyle}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <SectionHeading
                      icon={<CheckCircleIcon />}
                      title="Profile completeness"
                      subtitle={`${completeness.completed} of ${completeness.total} key details available.`}
                    />
                    <Typography variant="h4" sx={{ mt: 2, fontWeight: 900 }}>{completeness.percent}%</Typography>
                    <LinearProgress variant="determinate" value={completeness.percent} sx={{ mt: 1, height: 9, borderRadius: 99 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                      {completeness.missing.length
                        ? `Add ${completeness.missing.join(" and ")} to complete your profile.`
                        : "Your core profile information is complete."}
                    </Typography>
                    {completeness.missing.includes("mobile number") && !editing && (
                      <Button startIcon={<EditIcon />} onClick={handleEdit} sx={{ mt: 1, textTransform: "none", fontWeight: 900 }}>Complete profile</Button>
                    )}
                  </CardContent>
                </Card>

                <Card sx={panelStyle}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <SectionHeading
                      icon={<SecurityIcon />}
                      title="Account security"
                      subtitle="Authentication and current session information."
                    />
                    <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
                      <SecurityFact label="Session" value={session.label} positive={session.status === "active"} />
                      <SecurityFact label="Signed-in email" value={displayEmail} positive />
                      <SecurityFact label="Session expiry" value={session.expiresAt ? session.expiresAt.toLocaleString("en-IN") : "Managed by current login"} positive={session.status === "active"} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                      Your JWT token is used only for authenticated API requests and is never displayed here.
                    </Typography>
                    <Button color="error" variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ ...actionButtonStyle, mt: 2 }}>
                      Logout securely
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "right", mt: 1.5 }}>
            {lastRefreshedAt ? `Last refreshed ${new Date(lastRefreshedAt).toLocaleString("en-IN")}` : "Waiting for profile refresh"}
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const panelStyle = {
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.1)"
};

const heroButtonStyle = {
  borderColor: "rgba(255,255,255,0.72)",
  color: "#ffffff",
  borderRadius: 2,
  px: 2,
  textTransform: "none",
  fontWeight: 900,
  "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.12)" }
};

const actionButtonStyle = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 900
};

const ProfileMetric = ({ icon, label, value, meta, color }) => (
  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
    <Card sx={{ ...panelStyle, height: "100%" }}>
      <CardContent sx={{ p: 2.25, display: "flex", gap: 1.5, alignItems: "center", "&:last-child": { pb: 2.25 } }}>
        <Box sx={{ width: 46, height: 46, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: `${color}18`, color }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15 }}>{value}</Typography>
          <Typography variant="caption" sx={{ color, fontWeight: 800 }}>{meta}</Typography>
        </Box>
      </CardContent>
    </Card>
  </Grid>
);

const SectionHeading = ({ icon, title, subtitle }) => (
  <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
    <Box sx={{ width: 42, height: 42, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "rgba(13,148,136,0.12)", color: "#0d9488" }}>{icon}</Box>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
    </Box>
  </Box>
);

const DetailRow = ({ icon, label, value, tag }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "36px 1fr", sm: "36px 170px minmax(0, 1fr) auto" }, alignItems: "center", gap: 1.25, py: 1.75 }}>
    <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
    <Typography color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
    <Typography sx={{ gridColumn: { xs: "2", sm: "auto" }, fontWeight: 900, overflowWrap: "anywhere" }}>{value}</Typography>
    {tag && <Chip size="small" label={tag} variant="outlined" sx={{ gridColumn: { xs: "2", sm: "auto" }, justifySelf: "start", fontWeight: 800 }} />}
  </Box>
);

const ApplicationActivity = ({ application }) => {
  const status = String(application.status || "SUBMITTED").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  const approved = ["APPROVED", "PRE_APPROVED"].includes(String(application.status || "").toUpperCase());
  const blocked = ["REJECTED", "BLOCKED", "HIGH_RISK"].includes(String(application.status || "").toUpperCase());
  const statusColor = approved ? { bg: "#dcfce7", text: "#166534" } : blocked ? { bg: "#fee2e2", text: "#991b1b" } : { bg: "#fef3c7", text: "#92400e" };
  const lender = application.loanOffer?.bank?.shortName || application.loanOffer?.bank?.name || "Lender pending";
  const product = application.loanOffer?.loanType?.name || "Loan application";

  return (
    <Box sx={{ p: 1.75, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "action.hover", display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.25 }}>
      <Box>
        <Typography sx={{ fontWeight: 900 }}>#{application.id} · {lender} {product}</Typography>
        <Typography variant="body2" color="text.secondary">
          Rs. {Number(application.requestedAmount || 0).toLocaleString("en-IN")} · {application.createdAt ? new Date(application.createdAt).toLocaleDateString("en-IN") : "Date unavailable"}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.75}>
        <Chip size="small" label={status} sx={{ bgcolor: statusColor.bg, color: statusColor.text, fontWeight: 900 }} />
        <Chip size="small" label={application.paymentStatus === "PAID" ? "Fee paid" : "Fee pending"} variant="outlined" sx={{ fontWeight: 800 }} />
      </Stack>
    </Box>
  );
};

const SecurityFact = ({ label, value, positive }) => (
  <Box sx={{ py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
    <Stack direction="row" spacing={0.75} sx={{ minWidth: 0, alignItems: "center" }}>
      <Box sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: "50%", bgcolor: positive ? "#22c55e" : "#ef4444" }} />
      <Typography variant="body2" sx={{ fontWeight: 900, textAlign: "right", overflowWrap: "anywhere" }}>{value}</Typography>
    </Stack>
  </Box>
);

export default ProfilePage;
