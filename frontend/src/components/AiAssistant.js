import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SecurityIcon from "@mui/icons-material/Security";
import SendIcon from "@mui/icons-material/Send";
import { sendAiChatMessage } from "../services/chatService";
import {
  buildCopilotBrief,
  buildCopilotFallbackAnswer,
  copilotPageLabels,
  formatCopilotCurrency,
  getCopilotActions,
  getCopilotPrompts,
  inferCopilotAction
} from "../utils/copilot";

const AiAssistant = ({
  balance = 0,
  totalIncome = 0,
  totalExpense = 0,
  expenses = [],
  applications = [],
  page = "overview",
  onOpen = () => {}
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getCopilotPrompts(page));
  const conversationId = useRef(`fintrack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const brief = useMemo(
    () => buildCopilotBrief({ expenses, totalIncome, totalExpense, balance, applications }),
    [applications, balance, expenses, totalExpense, totalIncome]
  );
  const pageActions = useMemo(() => getCopilotActions(page), [page]);
  const pageLabel = copilotPageLabels[page] || "Dashboard";

  useEffect(() => {
    setSuggestedQuestions(getCopilotPrompts(page));
  }, [page]);

  const localFallback = (question) => buildCopilotFallbackAnswer({
    question,
    page,
    expenses,
    totalIncome,
    totalExpense,
    balance,
    applications
  });

  const sendMessage = async (value = message) => {
    const trimmed = String(value || "").trim();
    if (!trimmed || sending) return;

    const userMessage = { role: "user", text: trimmed };
    const history = [...messages, userMessage]
      .filter((item) => ["user", "assistant"].includes(item.role))
      .slice(-8)
      .map(({ role, text }) => ({ role, text }));

    setOpen(true);
    setMessage("");
    setMessages((current) => [...current, userMessage]);
    setSending(true);

    try {
      const result = await sendAiChatMessage({
        message: trimmed,
        page,
        conversationId: conversationId.current,
        recentMessages: history
      });
      const configuredAnswer = result?.usedContext !== false && result?.answer?.trim();
      const answer = configuredAnswer || localFallback(trimmed);
      const meta = configuredAnswer
        ? {
            source: result.liveProvider ? `${result.provider} · ${result.model}` : "Secure backend analytics",
            context: result.usedContext ? "Signed-in account context" : "General guidance",
            liveProvider: Boolean(result.liveProvider)
          }
        : {
            source: "Local analytics fallback",
            context: "Current screen data",
            liveProvider: false
          };

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: answer,
          meta,
          action: inferCopilotAction(trimmed, page)
        }
      ]);
      if (Array.isArray(result?.suggestedQuestions) && result.suggestedQuestions.length) {
        setSuggestedQuestions(result.suggestedQuestions.slice(0, 3));
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: localFallback(trimmed),
          meta: {
            source: "Local analytics fallback",
            context: "Backend unavailable · current screen data",
            liveProvider: false
          },
          action: inferCopilotAction(trimmed, page)
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setSuggestedQuestions(getCopilotPrompts(page));
    conversationId.current = `fintrack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  return (
    <>
      {!open && (
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setOpen(true)}
          sx={launcherStyle}
        >
          FinTrack Copilot
        </Button>
      )}

      {open && (
        <Card sx={panelStyle} aria-label="FinTrack Copilot panel">
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <Box sx={headerStyle}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                <Box sx={copilotIconStyle}><PsychologyIcon /></Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>FinTrack Copilot</Typography>
                  <Typography variant="caption" color="text.secondary">{pageLabel} · account-aware guidance</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.25}>
                <Tooltip title="Clear conversation">
                  <span>
                    <IconButton onClick={clearConversation} size="small" disabled={!messages.length || sending} aria-label="Clear Copilot conversation">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <IconButton onClick={() => setOpen(false)} size="small" aria-label="Close FinTrack Copilot">
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ px: 2, pt: 1.75 }}>
              <Box sx={briefStyle}>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 900 }}>Account brief</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{brief.attention}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    icon={<SecurityIcon />}
                    label="Private"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 900, flexShrink: 0 }}
                  />
                </Stack>
                <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", mt: 1.25 }}>
                  <Chip size="small" label={`${brief.transactionCount} transactions`} sx={metricChipStyle} />
                  <Chip size="small" label={`${formatCopilotCurrency(brief.remaining)} remaining`} sx={metricChipStyle} />
                  <Chip size="small" label={`${brief.pendingApplications} pending applications`} sx={metricChipStyle} />
                </Stack>
              </Box>

              <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", mt: 1.25 }}>
                {pageActions.map((action) => (
                  <Button
                    key={action.target}
                    size="small"
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => onOpen(action.target)}
                    sx={safeActionStyle}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1.25} sx={{ maxHeight: 300, overflowY: "auto", px: 2 }}>
              {!messages.length && (
                <Box sx={{ py: 1.25, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>Ask for an explanation or next safe step.</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Copilot can inspect account-scoped analytics, but it cannot send money, apply for a loan or place an investment.
                  </Typography>
                </Box>
              )}

              {messages.map((item, index) => (
                <Box
                  key={`${item.role}-${index}`}
                  sx={{
                    alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: item.role === "user" ? "86%" : "94%"
                  }}
                >
                  <Box sx={item.role === "user" ? userMessageStyle : assistantMessageStyle}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.55 }}>{item.text}</Typography>
                  </Box>
                  {item.role === "assistant" && item.meta && (
                    <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                      <Chip size="small" label={item.meta.source} variant="outlined" sx={evidenceChipStyle} />
                      <Chip size="small" label={item.meta.context} variant="outlined" sx={evidenceChipStyle} />
                      {item.action && (
                        <Chip
                          size="small"
                          clickable
                          label={item.action.label}
                          onClick={() => onOpen(item.action.target)}
                          color="primary"
                          sx={evidenceChipStyle}
                        />
                      )}
                    </Stack>
                  )}
                </Box>
              ))}

              {sending && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", py: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption">Checking secure account context...</Typography>
                </Stack>
              )}
            </Stack>

            <Box sx={{ px: 2, pt: 1.5 }}>
              <Stack direction="row" sx={{ gap: 0.75, overflowX: "auto", pb: 0.75 }}>
                {suggestedQuestions.slice(0, 3).map((question) => (
                  <Chip
                    key={question}
                    label={question}
                    onClick={() => sendMessage(question)}
                    disabled={sending}
                    size="small"
                    sx={{ fontWeight: 800, flexShrink: 0 }}
                  />
                ))}
              </Stack>
            </Box>

            <Box sx={{ display: "flex", gap: 1, p: 2, pt: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={`Ask about ${pageLabel.toLowerCase()}...`}
                value={message}
                disabled={sending}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <IconButton color="primary" onClick={() => sendMessage()} disabled={sending || !message.trim()} aria-label="Send message to FinTrack Copilot">
                <SendIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
};

const launcherStyle = {
  position: "fixed",
  right: { xs: 16, sm: 24 },
  bottom: { xs: 16, sm: 24 },
  zIndex: 1200,
  borderRadius: 99,
  px: 2,
  py: 1.05,
  textTransform: "none",
  fontWeight: 900,
  background: "linear-gradient(90deg, #6f5795, #d66f82)",
  boxShadow: "0 10px 28px rgba(75, 52, 96, 0.22)"
};

const panelStyle = {
  position: "fixed",
  right: { xs: 10, sm: 24 },
  bottom: { xs: 10, sm: 24 },
  width: { xs: "calc(100vw - 20px)", sm: 440 },
  maxHeight: "calc(100vh - 28px)",
  zIndex: 1300,
  overflow: "hidden",
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "0 22px 64px rgba(45, 31, 71, 0.24)"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1,
  px: 2,
  py: 1.5,
  background: (theme) => theme.fintrackMode === "soft"
    ? "linear-gradient(90deg, #fae8eb, #f1e7f4, #eaf3ff)"
    : "linear-gradient(90deg, #ecfeff, #eff6ff)"
};

const copilotIconStyle = {
  width: 38,
  height: 38,
  borderRadius: 2,
  display: "grid",
  placeItems: "center",
  color: "#ffffff",
  background: "linear-gradient(135deg, #6f5795, #d66f82)"
};

const briefStyle = {
  p: 1.5,
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: (theme) => theme.fintrackMode === "soft" ? "#fff8fb" : "#f7fbfc"
};

const metricChipStyle = { fontWeight: 800, bgcolor: "background.paper" };
const safeActionStyle = { borderRadius: 99, textTransform: "none", fontWeight: 900 };
const userMessageStyle = { px: 1.5, py: 1, borderRadius: "16px 16px 4px 16px", bgcolor: "primary.main", color: "#ffffff" };
const assistantMessageStyle = { px: 1.5, py: 1.2, borderRadius: "16px 16px 16px 4px", bgcolor: "action.hover", color: "text.primary" };
const evidenceChipStyle = { height: 22, fontSize: "0.68rem", fontWeight: 800 };

export default AiAssistant;
