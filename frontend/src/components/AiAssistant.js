import React, { useState } from "react";
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
import { aiTrainingTopics, fixedDepositProducts, mutualFundProducts } from "../data/financialKnowledge";

const quickQuestions = [
  "Mera loan approve hoga kya?",
  "Kaunse documents chahiye?",
  "EMI kitni banegi?",
  "Fraud score high kyu aaya?",
  "Payment kaise karu?",
  "Server me saved application kaha milegi?",
  "Best FD kaise choose karu?",
  "Mutual fund SIP kya hota hai?"
];

const AiAssistant = ({ balance, totalIncome, totalExpense }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste, main FinTrack AI assistant hoon. Loan, documents, EMI, fraud risk aur payment ke questions pooch sakte ho."
    }
  ]);

  const answerQuestion = (question) => {
    const text = question.toLowerCase();
    const trainedTopic = aiTrainingTopics.find((topic) =>
      topic.keywords.some((keyword) => text.includes(keyword))
    );

    if (text.includes("fd") || text.includes("fixed deposit") || text.includes("deposit")) {
      const bankList = fixedDepositProducts
        .map((item) => `${item.bank}: ${item.rate}, senior ${item.seniorRate}`)
        .join("; ");
      return `FD compare karte waqt tenure, rate, senior citizen benefit, premature penalty, TDS aur nominee check karo. Demo data: ${bankList}. Live rate booking se pehle bank site par verify karna zaroori hai.`;
    }

    if (text.includes("mutual fund") || text.includes("sip") || text.includes("equity") || text.includes("debt")) {
      const categories = mutualFundProducts
        .map((item) => `${item.category} (${item.risk}, ${item.horizon})`)
        .join("; ");
      return `Mutual funds guaranteed return nahi dete, market linked hote hain. SIP regular investing ka method hai. Categories: ${categories}. Goal, horizon, risk tolerance, expense ratio aur exit load check karo.`;
    }

    if (trainedTopic) {
      return trainedTopic.answer;
    }

    if (text.includes("approve") || text.includes("approval")) {
      return `Approval chance income, credit score, existing EMI, fraud score aur documents par depend karta hai. Aapka current dashboard balance Rs. ${Number(balance).toLocaleString("en-IN")} hai; loan form submit karte hi backend automatic verification status dega.`;
    }

    if (text.includes("document") || text.includes("aadhaar") || text.includes("pan")) {
      return "Required documents: Aadhaar, PAN, bank account, IFSC, nominee details, address, pincode, income details aur optional passport photo. System ab Aadhaar/PAN/IFSC/pincode format automatically verify karta hai.";
    }

    if (text.includes("emi")) {
      return "EMI loan amount, interest rate aur tenure se calculate hoti hai. Loan card select karke amount/tenure change karo, EMI preview turant update ho jayega.";
    }

    if (text.includes("fraud") || text.includes("risk")) {
      return "Fraud score high ho sakta hai agar KYC mismatch, duplicate Aadhaar/PAN/email/phone, low credit score, high loan-to-income ratio, repeated failed attempts ya high device/IP risk mile.";
    }

    if (text.includes("payment") || text.includes("pay") || text.includes("fee")) {
      return "Application save hone ke baad Pay Processing Fee button dikhega. Demo gateway Google Pay, PhonePe, Any UPI App, Card aur Net Banking se payment status PAID mark karta hai.";
    }

    if (text.includes("saved") || text.includes("server") || text.includes("application kaha") || text.includes("applications")) {
      return "Submit to Server ke baad application Loan Marketplace ke neeche Saved Loan Applications card me dikhegi. Backend endpoint: GET http://localhost:8081/api/loans/applications. UI me View Saved Applications button se direct jump kar sakte ho.";
    }

    if (text.includes("income") || text.includes("expense") || text.includes("balance")) {
      return `Current income Rs. ${Number(totalIncome).toLocaleString("en-IN")}, expense Rs. ${Number(totalExpense).toLocaleString("en-IN")}, balance Rs. ${Number(balance).toLocaleString("en-IN")}.`;
    }

    return "Main trained demo knowledge se loan eligibility, documents, EMI, fraud risk, payment gateway, FD, mutual funds, SIP aur application status ke jawab de sakta hoon. Live financial rates ke liye final booking se pehle bank/AMC source verify karo.";
  };

  const sendMessage = (text = message) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: answerQuestion(trimmed) }
    ]);
    setMessage("");
    setOpen(true);
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
            width: { xs: "calc(100vw - 24px)", sm: 380 },
            zIndex: 1300,
            borderRadius: 2,
            border: "1px solid rgba(13, 148, 136, 0.24)",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.28)"
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <PsychologyIcon color="primary" />
                <Typography sx={{ fontWeight: 900 }}>FinTrack AI</Typography>
              </Box>
              <IconButton onClick={() => setOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={1} sx={{ maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
              {messages.map((item, index) => (
                <Box
                  key={`${item.role}-${index}`}
                  sx={{
                    alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: item.role === "user" ? "primary.main" : "action.hover",
                    color: item.role === "user" ? "#ffffff" : "text.primary"
                  }}
                >
                  <Typography variant="body2">{item.text}</Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ my: 1.5 }}>
              {quickQuestions.map((question) => (
                <Chip
                  key={question}
                  label={question}
                  onClick={() => sendMessage(question)}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Question type karo..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
              />
              <IconButton color="primary" onClick={() => sendMessage()}>
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
