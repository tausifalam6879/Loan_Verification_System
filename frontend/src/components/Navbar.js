import React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Toolbar,
  Typography
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import LogoutIcon from "@mui/icons-material/Logout";

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
        background: (theme) => theme.fintrackMode === "soft"
          ? "linear-gradient(90deg, #21184f 0%, #5d477f 58%, #8a648d 100%)"
          : "linear-gradient(90deg, #082f49 0%, #0f766e 58%, #134e4a 100%)",
        borderBottom: "1px solid rgba(204, 251, 241, 0.22)",
        boxShadow: (theme) => theme.fintrackMode === "soft"
          ? "0 6px 18px rgba(44, 29, 74, 0.18)"
          : "0 12px 32px rgba(8, 47, 73, 0.22)"
      }}
    >
      <Toolbar sx={{ gap: { xs: 0.5, sm: 1, md: 2 }, px: { xs: 1, sm: 2 } }}>
        <IconButton
          edge="start"
          onClick={() => setDrawerOpen(true)}
          sx={{ color: "#ffffff" }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            noWrap
            sx={{ color: "#ffffff", fontWeight: 900, lineHeight: 1.1, fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" } }}
          >
            FinTech Dashboard
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", display: { xs: "none", md: "block" } }}>
            FinTech Loan Aggregator workspace
          </Typography>
        </Box>

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

        <Typography
          variant="body2"
          sx={{ color: "#cbd5e1", display: { xs: "none", md: "block" } }}
        >
          {today}
        </Typography>

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
