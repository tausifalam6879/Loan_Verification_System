import React from "react";
import { Box, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DownloadIcon from "@mui/icons-material/Download";
import LogoutIcon from "@mui/icons-material/Logout";
import PaymentsIcon from "@mui/icons-material/Payments";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

export const drawerWidth = 252;

const Sidebar = ({ drawerOpen, setDrawerOpen, handleExportCSV, onOpenDashboard, onOpenExpense, onOpenLoans, onOpenPayments, onOpenApplications, onOpenInvestments, onOpenMarkets, onOpenAdmin, onOpenProfile, onLogout, activeWorkspace = "overview", role }) => {
  const primaryItems = [
    { id: "overview", label: "Dashboard", icon: <DashboardIcon />, action: onOpenDashboard },
    { id: "expense", label: "Expense & Budgets", icon: <ReceiptLongIcon />, action: onOpenExpense },
    { id: "payments", label: "Payments", icon: <PaymentsIcon />, action: onOpenPayments },
    { id: "loans", label: "Loan Marketplace", icon: <AccountBalanceIcon />, action: onOpenLoans },
    { id: "applications", label: "Loan Applications", icon: <AssignmentTurnedInIcon />, action: onOpenApplications },
    { id: "investments", label: "Savings & Investments", icon: <SavingsIcon />, action: onOpenInvestments },
    { id: "markets", label: "Global Markets & AI", icon: <ShowChartIcon />, action: onOpenMarkets }
  ];
  const accountItems = [
    { id: "profile", label: "Profile & Security", icon: <PersonIcon />, action: onOpenProfile },
    ...(role === "ADMIN" ? [{ id: "admin", label: "Admin Dashboard", icon: <AdminPanelSettingsIcon />, action: onOpenAdmin }] : []),
    { id: "export", label: "Export expenses", icon: <DownloadIcon />, action: handleExportCSV },
    { id: "logout", label: "Logout", icon: <LogoutIcon />, action: onLogout }
  ];

  const navigation = (items) => (
    <List sx={{ px: 1.2, py: 0.75 }}>
      {items.map((item) => {
        const active = activeWorkspace === item.id;
        return (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.45 }}>
            <ListItemButton
              onClick={() => { item.action?.(); setDrawerOpen?.(false); }}
              sx={{ minHeight: 46, borderRadius: 2.2, px: 1.6, color: active ? "#fff" : "#d9e2ff", background: active ? "linear-gradient(100deg,rgba(101,82,241,.96),rgba(78,70,214,.88))" : "transparent", boxShadow: active ? "0 10px 24px rgba(55,48,163,.36)" : "none", "&:hover": { background: active ? "#5b4ce4" : "rgba(255,255,255,.08)" } }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontSize: 14, fontWeight: active ? 850 : 650 }}>{item.label}</Typography>} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  const content = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.25, pt: 2.2, pb: 1.8 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.2, display: "grid", placeItems: "center", background: "linear-gradient(145deg,#2f80ff,#7456f5)", boxShadow: "0 8px 22px rgba(47,128,255,.35)" }}><VerifiedUserIcon sx={{ color: "#fff" }} /></Box>
        <Box><Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 20, lineHeight: 1.05 }}>FinTrack</Typography><Typography variant="caption" sx={{ color: "#aebce0" }}>Loan Verification System</Typography></Box>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,.09)", mx: 2 }} />
      <Box sx={{ mt: 1 }}>{navigation(primaryItems)}</Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,.09)", mx: 2, my: 0.75 }} />
      {navigation(accountItems)}
      <Box sx={{ mt: "auto", m: 1.5, p: 2, borderRadius: 2.5, color: "#fff", background: "linear-gradient(145deg,rgba(79,70,229,.9),rgba(37,99,235,.62))", border: "1px solid rgba(255,255,255,.12)" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Smarter financial decisions</Typography><Typography variant="caption" sx={{ color: "#dbeafe" }}>Verify. Plan. Grow.</Typography>
      </Box>
    </Box>
  );
  const paperSx = { width: drawerWidth, boxSizing: "border-box", color: "#fff", borderRight: "none", background: "linear-gradient(180deg,#071a3a 0%,#0b2147 48%,#0b1d3a 100%)" };
  return <><Drawer variant="permanent" open sx={{ display: { xs: "none", md: "block" }, width: drawerWidth, flexShrink: 0, "& .MuiDrawer-paper": paperSx }}>{content}</Drawer><Drawer variant="temporary" open={drawerOpen} onClose={() => setDrawerOpen?.(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": paperSx }}>{content}</Drawer></>;
};

export default Sidebar;
