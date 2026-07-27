import React, { useEffect, useState } from "react";
import { Box, Paper, Tab, Tabs } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GlobalMarketSection from "./GlobalMarketSection";
import InvestmentSection from "./InvestmentSection";

const InvestmentMarketHub = ({ initialTab = "markets" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          px: { xs: 1, sm: 2 },
          mb: 1.5,
          bgcolor: "background.paper"
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Investment workspace views"
        >
          <Tab value="markets" icon={<ShowChartIcon />} iconPosition="start" label="Global Share Markets" />
          <Tab value="investments" icon={<AccountBalanceIcon />} iconPosition="start" label="FD and SIP (Existing)" />
        </Tabs>
      </Paper>

      {activeTab === "markets" && <GlobalMarketSection />}
      {activeTab === "investments" && <InvestmentSection />}
    </Box>
  );
};

export default InvestmentMarketHub;
