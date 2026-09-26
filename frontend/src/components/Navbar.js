import React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import { drawerWidth } from "./Sidebar";

const Navbar = ({ setDrawerOpen, balance, themeMode, onThemeModeChange, role, email, onLogout }) => {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        ml: { md: `${drawerWidth}px` },
        width: { md: `calc(100% - ${drawerWidth}px)` },
        background: "linear-gradient(100deg,#4c3fa2 0%,#44369b 52%,#342978 100%)",
        borderBottom: "1px solid rgba(204, 251, 241, 0.22)",
        boxShadow: (theme) => theme.fintrackMode === "soft"
          ? "0 6px 18px rgba(44, 29, 74, 0.18)"
          : "0 12px 32px rgba(8, 47, 73, 0.22)"
      }}
    >
      <Toolbar sx={{ gap: { xs: 0.5, sm: 1, md: 2 }, px: { xs: 1, sm: 2.5 }, minHeight: { xs: 64, md: 72 } }}>
        <IconButton
          edge="start"
          aria-label="Open navigation menu"
          onClick={() => setDrawerOpen(true)}
          sx={{ color: "#ffffff", display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: { xs: 1, md: 0 }, minWidth: 0, display: { xs: "block", md: "none" } }}>
          <Typography
            variant="h6"
            noWrap
            sx={{ color: "#ffffff", fontWeight: 900, lineHeight: 1.1, fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" } }}
          >
            FinTech
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", display: { xs: "none", md: "block" } }}>
            FinTech Loan Aggregator workspace
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search loans, expenses, transactions..."
          slotProps={{ htmlInput: { "aria-label": "Search workspace" }, input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#fff" }} /></InputAdornment> } }}
          sx={{ display: { xs: "none", md: "block" }, width: "min(42vw, 520px)", mr: "auto", "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(255,255,255,.11)", borderRadius: 2.5, "& fieldset": { borderColor: "rgba(255,255,255,.08)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,.25)" } }, "& input::placeholder": { color: "#e0e7ff", opacity: 1 } }}
        />

        <Chip
          icon={<AccountBalanceWalletIcon />}
          label={`Balance Rs. ${balance}`}
          sx={{
            display: { xs: "none", md: "inline-flex" },
            bgcolor: "rgba(240, 253, 250, 0.16)",
            color: "#ecfeff",
            fontWeight: 800,
            border: "1px solid rgba(204, 251, 241, 0.24)",
            "& .MuiChip-icon": { color: "#bef264" }
          }}
        />

        <Box sx={{ color: "#fff", display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 1 }}><CalendarMonthIcon /><Typography variant="body2" sx={{ fontWeight: 800 }}>{today}</Typography></Box>

        <FormControl size="small" sx={{ display: { xs: "none", md: "block" }, minWidth: 116 }}>
          <Select
            value={themeMode}
            onChange={(event) => onThemeModeChange(event.target.value)}
            startAdornment={<ColorLensIcon sx={{ color: "#fbcfe8", mr: 0.75, fontSize: 18 }} />}
            sx={{
              color: "#ecfeff",
              fontWeight: 800,
              ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(204, 251, 241, 0.28)" },
              ".MuiSvgIcon-root": { color: "#ecfeff" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(204, 251, 241, 0.5)" }
            }}
          >
            <MenuItem value="system">System</MenuItem>
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="soft">Soft</MenuItem>
          </Select>
        </FormControl>

        <Avatar
          title={email || role || "User"}
          sx={{
            width: 34,
            height: 34,
            bgcolor: "#f59e0b",
            color: "#0f172a",
            fontWeight: 900
          }}
        >
          {(email || role || "U").slice(0, 1).toUpperCase()}
        </Avatar>

        <IconButton onClick={onLogout} sx={{ color: "#ffffff" }} title="Logout">
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
