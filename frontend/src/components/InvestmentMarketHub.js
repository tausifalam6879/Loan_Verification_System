import React from "react";
import GlobalMarketSection from "./GlobalMarketSection";
import InvestmentSection from "./InvestmentSection";

const InvestmentMarketHub = ({ initialTab = "markets" }) => {
  if (initialTab === "investments") {
    return <InvestmentSection />;
  }

  return <GlobalMarketSection />;
};

export default InvestmentMarketHub;
