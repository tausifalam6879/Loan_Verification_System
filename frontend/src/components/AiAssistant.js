import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SendIcon from "@mui/icons-material/Send";
import { sendAiChatMessage } from "../services/chatService";

const defaultQuestions = [
  "Mera sabse zyada kharcha kis category me hua?",
  "Last 5 transactions batao",
  "Mujhe saving improve karne ke liye 3 tips do",
  "Is month total expense kitna hai?",
  "Kya koi unusual spending hai?"
];

const pageFromPath = (pathname = "") => {
  if (pathname.includes("expense") || pathname.includes("transactions")) return "expenses";
  if (pathname.includes("loan")) return "loans";
  if (pathname.includes("payment")) return "payments";
  if (pathname.includes("application")) return "applications";
  if (pathname.includes("investment")) return "investments";
  return "dashboard";
};

const AiAssistant = () => {
  const location = useLocation();
  const page = useMemo(() => pageFromPath(location.pathname), [location.pathname]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState(defaultQuestions);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, main FinTrack AI hoon. Main backend ke actual expense/loan data ko read karke answer karta hoon. Free-form question type karo."
    }
  ]);

  const sendMessage = async (text = message) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const recentMessages = messages
      .slice(-8)
      .map((item) => ({ role: item.role, text: item.text }));

    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setMessage("");
    setOpen(true);
    setLoading(true);

    try {
      const response = await sendAiChatMessage({
        message: trimmed,
        page,
        conversationId: "dashboard-session",
        recentMessages
      });

      if (response?.suggestedQuestions?.length) {
        setSuggestedQuestions(response.suggestedQuestions);
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: response?.answer || "Mujhe backend se answer nahi mila. Please dobara try karo.",
          provider: response?.liveProvider
            ? `${response.provider || "LLM"} + your data`
            : response?.provider === "local-analytics"
              ? "Backend analytics + your data"
              : response?.provider || "Backend AI"
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "AI backend response nahi de paaya. Backend running hai ya login session valid hai, ye check karo.",
          provider: "error"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <Button
          variant="contained"
          startIcon={<PsychologyIcon />}
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 1200,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
            boxShadow: "0 14px 32px rgba(15, 23, 42, 0.24)"
          }}
        >
          AI Assistant
        </Button>
      )}

      {open && (
        <Card
          sx={{
            position: "fixed",
            right: { xs: 12, sm: 24 },
            bottom: { xs: 12, sm: 24 },
            width: { xs: "calc(100vw - 24px)", sm: 420 },
            zIndex: 1300,
            borderRadius: 2,
            border: "1px solid rgba(45, 212, 191, 0.26)",
            bgcolor: "#111827",
            color: "#f8fafc",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.36)"
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <PsychologyIcon sx={{ color: "#2dd4bf" }} />
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>FinTrack AI</Typography>
                  <Typography variant="caption" sx={{ color: "#99f6e4" }}>
                    Powered by LLM + your expense data
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: "#f8fafc" }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack
              spacing={1}
              sx={{
                maxHeight: 330,
                overflowY: "auto",
                pr: 0.5,
                "&::-webkit-scrollbar": { width: 8 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(148, 163, 184, 0.55)", borderRadius: 2 }
              }}
            >
              {messages.map((item, index) => (
                <Box
                  key={`${item.role}-${index}`}
                  sx={{
                    alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "90%",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: item.role === "user" ? "#0d9488" : "#263244",
                    color: "#f8fafc",
                    whiteSpace: "pre-line",
                    overflowWrap: "anywhere"
                  }}
                >
                  <Typography variant="body2">{item.text}</Typography>
                  {item.provider && (
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#99f6e4" }}>
                      {item.provider}
                    </Typography>
                  )}
                </Box>
              ))}
              {loading && (
                <Box
                  sx={{
                    alignSelf: "flex-start",
                    maxWidth: "90%",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: "#263244"
                  }}
                >
                  <Typography variant="body2">Thinking with your dashboard data...</Typography>
                </Box>
              )}
            </Stack>

            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ my: 1.25 }}>
              {suggestedQuestions.map((question) => (
                <Chip
                  key={question}
                  label={question}
                  onClick={() => sendMessage(question)}
                  size="small"
                  sx={{
                    maxWidth: "100%",
                    fontWeight: 800,
                    bgcolor: "rgba(45, 212, 191, 0.12)",
                    color: "#ccfbf1",
                    border: "1px solid rgba(45, 212, 191, 0.28)",
                    "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" }
                  }}
                />
              ))}
            </Stack>

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask about your spending..."
                value={message}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#f8fafc",
                    bgcolor: "rgba(15, 23, 42, 0.72)",
                    "& fieldset": { borderColor: "rgba(148, 163, 184, 0.38)" }
                  },
                  "& input::placeholder": { color: "#cbd5e1", opacity: 1 }
                }}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
              />
              <IconButton color="primary" onClick={() => sendMessage()} disabled={loading}>
                <SendIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AiAssistant;
