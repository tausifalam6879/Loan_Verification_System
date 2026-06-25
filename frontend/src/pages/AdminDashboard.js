import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  approveApplication,
  getAuditLogs,
  getAdminApplications,
  getDashboardStats,
  rejectApplication
} from "../services/adminService";
import { logout } from "../services/authService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardData, applicationsData, auditData] = await Promise.all([
        getDashboardStats(),
        getAdminApplications(),
        getAuditLogs()
      ]);
      setStats(dashboardData);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);
    } catch (error) {
      setError(error.response?.status === 403
        ? "Admin access required for this dashboard."
        : "Could not load admin dashboard from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDecision = async (id, decision) => {
    setActionId(id);
    setError("");

    try {
      if (decision === "approve") {
        await approveApplication(id);
      } else {
        await rejectApplication(id);
      }
      await loadAdminData();
    } catch (error) {
      setError("Decision update failed. Check backend and admin token.");
    } finally {
      setActionId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, color: "#0f766e" },
    { label: "Applications", value: stats?.totalApplications ?? 0, color: "#2563eb" },
    { label: "Approved", value: stats?.approvedLoans ?? 0, color: "#16a34a" },
    { label: "Pre Approved", value: stats?.preApprovedLoans ?? 0, color: "#7c3aed" },
    { label: "Rejected", value: stats?.rejectedLoans ?? 0, color: "#dc2626" }
  ];
  const statusData = cards.slice(2).map((card) => ({
    name: card.label,
    value: Number(card.value || 0),
    color: card.color
  }));
  const hasStatusData = statusData.some((item) => item.value > 0);
  const riskData = applications.slice(0, 8).map((application) => ({
    name: `#${application.id}`,
    creditScore: Number(application.creditScore || 0),
    fraudScore: Number(application.fraudScore || 0)
  }));
  const riskCards = [
    { label: "Low Risk", value: stats?.lowRisk ?? 0, color: "#16a34a" },
    { label: "Medium Risk", value: stats?.mediumRisk ?? 0, color: "#d97706" },
    { label: "High Risk", value: stats?.highRisk ?? 0, color: "#dc2626" }
  ];

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          p: { xs: 2, md: 4 },
          background: "linear-gradient(180deg, #ecfeff 0%, #f8fafc 45%, #ffffff 100%)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 2.5
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
              Admin Control
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Dashboard and Applications
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} variant="outlined" sx={buttonStyle}>
              User Dashboard
            </Button>
            <Button startIcon={<RefreshIcon />} onClick={loadAdminData} variant="contained" disabled={loading} sx={buttonStyle}>
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outlined" color="error" sx={buttonStyle}>
              Logout
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {cards.map((card) => (
            <Grid size={{ xs: 12, sm: 6, lg: 2.4 }} key={card.label}>
              <Card elevation={0} sx={cardStyle(card.color)}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 800 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: card.color }}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card elevation={0} sx={panelStyle}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <DashboardIcon sx={{ color: "#0f766e" }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Application Status
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Current approval distribution
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 270 }}>
                  {hasStatusData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={94}
                          paddingAngle={4}
                        >
                          {statusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="No processed applications yet." />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Card elevation={0} sx={panelStyle}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <PeopleAltIcon sx={{ color: "#2563eb" }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Applicant Risk Overview
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Credit and fraud scores for recent applications
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 270 }}>
                  {riskData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="creditScore" name="Credit Score" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fraudScore" name="Fraud Score" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="No applicant risk data available." />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card elevation={0} sx={{ ...panelStyle, mb: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Fraud Monitoring
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Risk levels produced by the application fraud checks
            </Typography>
            <Grid container spacing={1.5}>
              {riskCards.map((risk) => (
                <Grid size={{ xs: 12, sm: 4 }} key={risk.label}>
                  <Box
                    sx={{
                      p: 2,
                      borderLeft: `4px solid ${risk.color}`,
                      bgcolor: `${risk.color}0d`,
                      borderRadius: 1
                    }}
                  >
                    <Typography color="text.secondary" sx={{ fontWeight: 800 }}>
                      {risk.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: risk.color, fontWeight: 900 }}>
                      {risk.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card elevation={0} sx={panelStyle}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <DashboardIcon sx={{ color: "#2563eb" }} />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Admin Applications Table
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Applicant</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Credit Score</TableCell>
                      <TableCell>Fraud Score</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 900 }}>
                            #{application.id} {application.applicantName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            {application.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          Rs. {Number(application.requestedAmount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>{application.creditScore ?? "-"}</TableCell>
                        <TableCell>{application.fraudScore ?? "-"}</TableCell>
                        <TableCell>
                          <Chip size="small" label={application.status || "SAVED"} sx={{ fontWeight: 900 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => setSelectedApplication(application)}
                              sx={buttonStyle}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleDecision(application.id, "approve")}
                              disabled={actionId === application.id}
                              sx={buttonStyle}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<HighlightOffIcon />}
                              onClick={() => handleDecision(application.id, "reject")}
                              disabled={actionId === application.id}
                              sx={buttonStyle}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {applications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#64748b" }}>
                          No applications found in backend.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ ...panelStyle, mt: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Admin Audit Logs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Latest approval and rejection actions
            </Typography>
            <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
              {auditLogs.map((log) => (
                <Box
                  key={log.id}
                  sx={{
                    py: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" }
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{log.details}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.actorEmail}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : ""}
                  </Typography>
                </Box>
              ))}
              {auditLogs.length === 0 && (
                <Typography color="text.secondary">No admin actions recorded yet.</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <ApplicationDetailsDialog
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />
    </>
  );
};

const ApplicationDetailsDialog = ({ application, onClose }) => {
  if (!application) {
    return null;
  }

  const details = [
    ["Applicant", application.applicantName],
    ["Email", application.email],
    ["Requested amount", `Rs. ${Number(application.requestedAmount || 0).toLocaleString("en-IN")}`],
    ["Monthly income", `Rs. ${Number(application.monthlyIncome || 0).toLocaleString("en-IN")}`],
    ["Credit score", application.creditScore],
    ["Fraud score", application.fraudScore ?? "-"],
    ["Fraud level", application.fraudLevel || "-"],
    ["Employment", application.employmentType || "-"],
    ["Loan purpose", application.loanPurpose || "-"],
    ["City", application.city || "-"],
    ["Payment status", application.paymentStatus || "UNPAID"],
    ["Decision reason", application.decisionReason || "-"]
  ];
  const timeline = [
    { label: "Application Submitted", done: true },
    { label: "Fraud Check Complete", done: application.fraudScore != null },
    { label: "Pre Approved", done: ["PRE_APPROVED", "APPROVED"].includes(application.status) },
    { label: "Approved", done: application.status === "APPROVED" }
  ];

  return (
    <Dialog open maxWidth="md" fullWidth onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Application #{application.id} Details
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1.5}>
          {details.map(([label, value]) => (
            <Grid size={{ xs: 12, sm: 6 }} key={label}>
              <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>{value}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography variant="h6" sx={{ fontWeight: 900, mt: 3, mb: 1.5 }}>
          Activity Timeline
        </Typography>
        <Stack>
          {timeline.map((item, index) => (
            <Box key={item.label} sx={{ display: "flex", gap: 1.5, minHeight: 48 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: item.done ? "#16a34a" : "#cbd5e1",
                    mt: 0.5
                  }}
                />
                {index < timeline.length - 1 && (
                  <Box sx={{ width: 2, flex: 1, bgcolor: item.done ? "#86efac" : "#e2e8f0" }} />
                )}
              </Box>
              <Typography sx={{ fontWeight: item.done ? 800 : 600, color: item.done ? "text.primary" : "text.secondary" }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={buttonStyle}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const buttonStyle = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 900
};

const cardStyle = (color) => ({
  height: "100%",
  borderRadius: 2,
  border: `1px solid ${color}24`,
  background: `linear-gradient(145deg, ${color}14, #ffffff 70%)`
});

const panelStyle = {
  height: "100%",
  borderRadius: 2,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)"
};

const EmptyChart = ({ message }) => (
  <Box
    sx={{
      height: "100%",
      display: "grid",
      placeItems: "center",
      border: "1px dashed",
      borderColor: "divider",
      borderRadius: 2,
      color: "text.secondary"
    }}
  >
    <Typography variant="body2">{message}</Typography>
  </Box>
);

export default AdminDashboard;
