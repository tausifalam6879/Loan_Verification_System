import api from "../api/axiosConfig";

export const sendAiChatMessage = async ({ message, page, conversationId, recentMessages }) => {
  const response = await api.post("/ai/chat", {
    message,
    page,
    conversationId,
    recentMessages
  });

  return response.data?.data;
};
