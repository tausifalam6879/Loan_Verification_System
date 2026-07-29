import api from "../api/axiosConfig";

// Account Copilot must remain responsive even when the free cloud backend is
// waking up. The component already has a safe, account-scoped local fallback.
const COPILOT_TIMEOUT_MS = 12000;

export const sendAiChatMessage = async ({ message, page, conversationId, recentMessages }) => {
  const response = await api.post("/ai/chat", {
    message,
    page,
    conversationId,
    recentMessages
  }, { timeout: COPILOT_TIMEOUT_MS });

  return response.data?.data;
};
