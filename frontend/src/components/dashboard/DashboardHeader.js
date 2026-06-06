import React from "react";
import { Box, Button, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";

const DashboardHeader = ({ onRefresh, onExport }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "stretch", md: "center" },
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        mb: 3
      }}
    >
      <Box
        sx={{
          p: { xs: 2, md: 0 },
          borderRadius: 3,
          background: {
            xs: "rgba(240, 253, 250, 0.86)",
            md: "transparent"
          },
          border: {
            xs: "1px solid rgba(14, 116, 144, 0.12)",
            md: "none"
          }
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "#0f766e", fontWeight: 900 }}
        >
          Phase 1 Expense Tracker
        </Typography>
        <Typography
          variant="h4"
          sx={{ color: "text.primary", fontWeight: 900, letterSpacing: 0 }}
        >
          Expense Dashboard
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          Track spending, budget utilization and category-wise expenses.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 800
          }}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onExport}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 800,
            background: "linear-gradient(90deg, #0d9488, #2563eb)",
            "&:hover": { background: "linear-gradient(90deg, #0f766e, #1d4ed8)" }
          }}
        >
          Export CSV
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardHeader;
