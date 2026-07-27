import api from "../api/axiosConfig";

export const getGlobalMarketOverview = async (refresh = false) => {
  const response = await api.get("/market/overview", { params: { refresh } });
  return response.data;
};

export const getMarketAnalysis = async (symbol, refresh = false) => {
  const response = await api.get("/market/analysis", { params: { symbol, refresh } });
  return response.data;
};

export const getMarketFactors = async (refresh = false) => {
  const response = await api.get("/market/factors", { params: { refresh } });
  return response.data;
};

export const getMarketBreadth = async (refresh = false) => {
  const response = await api.get("/market/breadth", { params: { refresh } });
  return response.data;
};

export const getCompanyResearch = async (symbol, refresh = false) => {
  const response = await api.get("/market/company", { params: { symbol, refresh } });
  return response.data;
};

export const getMarketNewsFeed = async (refresh = false) => {
  const response = await api.get("/market/news-feed", { params: { refresh } });
  return response.data;
};

export const askMarketAgent = async ({ message, symbol, recentMessages = [] }) => {
  const response = await api.post("/market/agent", {
    message,
    symbol,
    recentMessages: recentMessages.map(({ role, content }) => ({ role, content }))
  });
  return response.data;
};
