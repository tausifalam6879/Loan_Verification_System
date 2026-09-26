import React from "react";
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorOutlineIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import { applicationStatusGroup, filterAndSortApplications } from "../../utils/applicationDashboard";

const colors = { approved: "#008763", review: "#7045ed", blocked: "#ef365a", submitted: "#2463eb" };
const panel = { bgcolor: "#fff", border: "1px solid #e3e8fc", borderRadius: 2.5, p: 2.5, boxShadow: "0 4px 20px #4758a004" };
const button = { textTransform: "none", fontWeight: 800, borderRadius: 1.5 };
const statusLabel = (status) => String(status || "SUBMITTED").toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dateLabel = (value) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date not recorded";

export default function ApplicationsWorkspace({ applications, visibleApplications, summary, loading, search, onSearch, status, onStatus, sort, onSort, onRefresh, refreshedAt, onDetails, onPayment, onDownload }) {
  const recent = filterAndSortApplications(applications).slice(0, 5);
  const metrics = [
    ["Total Applications", summary.total, "All time", "#2463eb", AssignmentIcon],
    ["Pre-approved / Approved", summary.approved, "Recorded decisions", colors.approved, CheckCircleIcon],
    ["In Review", summary.review, "Under evaluation", colors.review, ScheduleIcon],
    ["Blocked / Rejected", summary.blocked, "Review decision details", colors.blocked, ErrorOutlineIcon]
  ];
  return <Box id="loan-applications" sx={{ mt: 2 }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
      {metrics.map(([label, value, note, color, Icon]) => <Box key={label} sx={{ ...panel, display: "flex", alignItems: "center", gap: 2, minHeight: 130, background: `linear-gradient(115deg, ${color}09, #fff)`, borderColor: `${color}20` }}>
        <Box sx={{ p: 1.8, borderRadius: 2, bgcolor: `${color}12`, color }}><Icon sx={{ fontSize: 32 }} /></Box>
        <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800, fontSize: 14 }}>{label}</Typography><Typography sx={{ color, fontSize: 30, fontWeight: 900, lineHeight: 1.4 }}>{value}</Typography><Typography variant="caption" color="text.secondary">{note}</Typography></Box>
        <Box aria-hidden="true" sx={{ display: "flex", alignItems: "end", gap: .5, height: 45 }}>{[16, 25, 34, 43].map((h) => <Box key={h} sx={{ height: h, width: 6, borderRadius: 4, bgcolor: `${color}55` }} />)}</Box>
      </Box>)}
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", xl: "minmax(0, 2.6fr) minmax(260px, 1fr)" }, gap: 2.5, alignItems: "start" }}>
      <Stack spacing={2}>
        <Box sx={{ ...panel, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.8fr) 1fr 1fr" }, gap: 1.5 }}>
          <TextField size="small" label="Search application, lender or loan" value={search} onChange={(e) => onSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#707ba9" }} /></InputAdornment> }} />
          <TextField select size="small" label="Status" value={status} onChange={(e) => onStatus(e.target.value)}>{[["all", "All statuses"], ["approved", "Pre-approved / approved"], ["review", "In review"], ["blocked", "Blocked / rejected"], ["paid", "Fee paid"], ["unpaid", "Fee pending"]].map(([v, label]) => <MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
          <TextField select size="small" label="Sort" value={sort} onChange={(e) => onSort(e.target.value)}>{[["newest", "Newest first"], ["oldest", "Oldest first"], ["amount_high", "Highest amount"], ["amount_low", "Lowest amount"]].map(([v, label]) => <MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><Typography variant="h6" sx={{ fontWeight: 900 }}>Your applications</Typography><Chip size="small" label={`${summary.feePending} fee pending`} sx={{ color: colors.review, bgcolor: "#f0ebff" }} /></Box>
        {loading ? <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box> : applications.length === 0 ? <Box sx={{ ...panel, py: 5, textAlign: "center" }}><AssignmentIcon sx={{ color: "#8673e8", fontSize: 42 }} /><Typography sx={{ fontWeight: 800, mt: 1 }}>No applications yet</Typography><Typography color="text.secondary">Choose a loan offer and submit an application to start tracking its journey.</Typography></Box> : !visibleApplications.length ? <Alert severity="info">No application matches the current search or status filter.</Alert> : visibleApplications.map((app) => {
          const color = colors[applicationStatusGroup(app.status)];
          return <Box key={app.id} sx={{ ...panel, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(180px, 1fr) minmax(210px, 1.25fr) 170px" }, gap: 2, alignItems: "center" }}>
            <Box sx={{ display: "flex", gap: 1.5 }}><Box sx={{ bgcolor: `${color}12`, color, borderRadius: 2, p: 1.3, height: "fit-content" }}><AssignmentIcon /></Box><Box><Typography sx={{ fontWeight: 900 }}>{app.loanOffer?.bank?.name || "Lender not recorded"}</Typography><Typography variant="body2" color="text.secondary">{app.loanOffer?.loanType?.name || "Loan type not recorded"}</Typography><Typography sx={{ fontWeight: 900, mt: 1 }}>Rs. {Number(app.requestedAmount || 0).toLocaleString("en-IN")}</Typography><Typography variant="caption" color="text.secondary">#{app.id} · {dateLabel(app.createdAt)}</Typography></Box></Box>
            <Box><Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>{[true, Boolean(app.status), app.paymentStatus === "PAID"].map((done, index) => <React.Fragment key={index}>{index > 0 && <Box sx={{ flex: 1, height: 2, bgcolor: done ? `${color}70` : "#e5e8f6" }} />}<Box sx={{ width: 23, height: 23, borderRadius: "50%", border: `2px solid ${done ? color : "#dce1f3"}`, bgcolor: done ? color : "#fff", color: "#fff", display: "grid", placeItems: "center", fontSize: 13 }}>{done ? "✓" : ""}</Box></React.Fragment>)}</Box><Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, color: "#6878a6", fontSize: 11 }}><span>Submitted</span><span>{statusLabel(app.status)}</span><span>{app.paymentStatus === "PAID" ? "Fee paid" : "Fee pending"}</span></Box></Box>
            <Stack spacing={1} alignItems="stretch"><Chip size="small" label={statusLabel(app.status)} sx={{ bgcolor: `${color}12`, color, fontWeight: 800 }} /><Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => onDetails(app)} sx={{ ...button, bgcolor: color }}>View details</Button>{app.paymentStatus !== "PAID" && <Button size="small" onClick={() => onPayment(app)} disabled={!app.loanOffer} sx={button}>Pay processing fee</Button>}<Button size="small" onClick={() => onDownload(app)} sx={{ ...button, color: "#6b7397" }}>Download summary</Button></Stack>
          </Box>;
        })}
      </Stack>
      <Box sx={panel}>
        <Typography variant="h6" sx={{ display: "flex", gap: 1, alignItems: "center", fontWeight: 900, mb: 2.5 }}><ScheduleIcon sx={{ color: colors.review }} />Recent Activity</Typography>
        <Typography variant="caption" color="text.secondary">Latest submissions and their current status</Typography>
        {recent.length === 0 && <Typography color="text.secondary" sx={{ py: 3 }}>Your application activity will appear here.</Typography>}
        {recent.map((app, index) => { const color = colors[applicationStatusGroup(app.status)]; return <Box key={app.id} sx={{ display: "flex", gap: 2, mt: index === 0 ? 2.5 : 0 }}><Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}><Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: color, boxShadow: `0 0 0 6px ${color}15`, mt: .7 }} /><Box sx={{ width: 2, flex: 1, bgcolor: index < recent.length - 1 ? "#e4e6f6" : "transparent", mt: 1 }} /></Box><Box sx={{ pb: 3, flex: 1 }}><Typography sx={{ fontWeight: 800 }}>Application submitted</Typography><Typography variant="caption" color="text.secondary">{dateLabel(app.createdAt)}</Typography><Typography variant="body2" sx={{ mt: .7, color: "#56658e" }}>{app.loanOffer?.bank?.name || `Application #${app.id}`}</Typography><Button size="small" onClick={() => onDetails(app)} sx={{ ...button, color, p: 0, mt: .5 }}>{statusLabel(app.status)} →</Button></Box></Box>; })}
        <Button startIcon={<RefreshIcon />} onClick={onRefresh} disabled={loading} sx={button}>Refresh applications</Button><Typography variant="caption" display="block" color="text.secondary">{refreshedAt ? `Updated ${new Date(refreshedAt).toLocaleTimeString("en-IN")}` : "Waiting for first refresh"}</Typography>
      </Box>
    </Box>
  </Box>;
}
