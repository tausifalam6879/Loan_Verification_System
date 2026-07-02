import React from "react";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DownloadIcon from "@mui/icons-material/Download";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";

const drawerWidth = 272;

const Sidebar = ({
  drawerOpen,
  setDrawerOpen,
  handleExportCSV,
  onOpenDashboard,
  onOpenExpense,
  onOpenLoans,
  onOpenPayments,
  onOpenApplications,
  onOpenInvestments,
  onOpenAdmin,
  onOpenProfile,
  onLogout,
  role
}) => {
  const menuItems = [
    {
      label: "Dashboard",
      icon: <DashboardIcon />,
      active: true,
      action: onOpenDashboard
    },
    {
      label: "Expense Page",
      icon: <ReceiptLongIcon />,
      action: onOpenExpense
    },
    {
      label: "Loan Marketplace",
      icon: <LocalAtmIcon />,
      action: onOpenLoans
    },
    {
      label: "Payment Gateway",
      icon: <PaymentsIcon />,
      action: onOpenPayments
    },
    {
      label: "Loan Applications",
      icon: <AssignmentTurnedInIcon />,
      action: onOpenApplications
    },
    {
      label: "Profile",
      icon: <PersonIcon />,
      action: onOpenProfile
    },
    {
      label: "Investments",
      icon: <SavingsIcon />,
      action: onOpenInvestments
    },
    ...(role === "ADMIN"
      ? [
          {
            label: "Admin Dashboard",
            icon: <AdminPanelSettingsIcon />,
            action: onOpenAdmin
          }
        ]
      : []),
    {
      label: "Export CSV",
      icon: <DownloadIcon />,
      action: handleExportCSV
    },
    {
      label: "Logout",
      icon: <LogoutIcon />,
      action: onLogout
    }
  ];

  return (
    <Drawer
      variant="temporary"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          background: "linear-gradient(180deg, #082f49 0%, #0f172a 72%)",
          color: "#ffffff",
          borderRight: "none"
        }
      }}
    >
      <Toolbar />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography sx={{ color: "#ffffff", fontWeight: 900 }}>
          FinTrack
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Verification workspace
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(226, 232, 240, 0.12)" }} />

      <List sx={{ px: 1.5, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.75 }}>
            <ListItemButton
              onClick={() => {
                if (item.action) {
                  item.action();
                }
                if (!item.action || item.label === "Export CSV") {
                  setDrawerOpen(false);
                }
              }}
              sx={{
                borderRadius: 2,
                background: item.active
                  ? "linear-gradient(90deg, #0d9488, #2563eb)"
                  : "transparent",
                color: item.active ? "#ffffff" : "#cbd5e1",
                "&:hover": {
                  background: item.active
                    ? "#1d4ed8"
                    : "rgba(255,255,255,0.08)"
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.active ? "#ffffff" : "#cbd5e1",
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  "& .MuiTypography-root": {
                    fontWeight: item.active ? 900 : 700
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
