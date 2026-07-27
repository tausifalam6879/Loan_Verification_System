import React, { useMemo, useState } from "react";
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
import {
  analyzeExpenses,
  predictExpenseCategory
} from "../utils/expenseIntelligence";

const quickQuestions = [
  "Zomato dinner kis category me aayega?",
  "Next month expense forecast batao",
  "Unusual spending detect karo",
  "Smart saving recommendation do",
  "Spending pattern analysis batao",
  "Safe EMI limit kya honi chahiye?",
  "Mere liye kaunsa loan better hai?",
  "Best FD kaise choose karu?",
  "Mutual fund SIP kya hota hai?"
];

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const includesAny = (text, keywords) =>
  keywords.some((keyword) => text.includes(keyword));

const extractExpenseDescription = (question) => {
  const quoted = question.match(/["'`](.+?)["'`]/);
  if (quoted?.[1]) {
    return quoted[1];
  }

  return question
    .replace(/kis category.*$/i, "")
    .replace(/category.*$/i, "")
    .replace(/predict/i, "")
    .replace(/classify/i, "")
    .replace(/expense/i, "")
    .replace(/\?/g, "")
    .trim();
};

const AiAssistant = ({ balance, totalIncome, totalExpense, expenses = [] }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const intelligence = useMemo(
    () => analyzeExpenses(expenses, totalIncome),
    [expenses, totalIncome]
  );
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste, main FinTrack AI assistant hoon. Ab aap free-form questions pooch sakte ho: category prediction, forecast, anomaly, saving advice, loan, FD, SIP aur EMI."
    }
  ]);

  const answerQuestion = (question) => {
    const text = question.toLowerCase();
    const { forecast, anomalies, categoryTotals, recommendations, summary, categoryTrends } = intelligence;
    const trainedTopic = aiTrainingTopics.find((topic) =>
      topic.keywords.some((keyword) => text.includes(keyword))
    );

    if (
      includesAny(text, ["category", "classify", "predict", "kis category", "kaunsi category"]) &&
      !includesAny(text, ["category wise", "category-wise", "trend"])
    ) {
      const description = extractExpenseDescription(question) || question;
      const prediction = predictExpenseCategory(description);
      return `"${description}" ko model ${prediction.category} category me classify karega. Confidence approx ${Math.round(
        prediction.confidence * 100
      )}%. Agar transaction business-specific hai to category manually override kar sakte ho.`;
    }

    if (
      includesAny(text, [
        "forecast",
        "next month",
        "expected",
        "agle month",
        "agle mahine",
        "budget predict",
        "monthly budget"
      ])
    ) {
      return `Forecast: ${forecast.month} me expected expense approx ${formatCurrency(
        forecast.amount
      )} hai. Ye ${forecast.basis} se nikala gaya hai. Latest month spend ${formatCurrency(
        summary.latestAmount
      )} hai aur safe monthly guardrail ${formatCurrency(summary.targetMonthlySpend)} rakha gaya hai.`;
    }

    if (
      includesAny(text, [
        "anomaly",
        "unusual",
        "alert",
        "zyada spend",
        "high expense",
        "abnormal"
      ])
    ) {
      if (!anomalies.length) {
        return "Anomaly detection: abhi koi major unusual transaction nahi mila. Jaise hi kisi category me normal pattern se bahut bada spend aayega, dashboard warning dikhayega.";
      }

      const top = anomalies[0];
      return `Unusual spending detected: ${top.category} me ${formatCurrency(
        top.amount
      )} ka transaction normal ${formatCurrency(top.average)} pattern se kaafi upar hai. Reason: ${top.reason}`;
    }

    if (
      includesAny(text, [
        "saving",
        "savings",
        "save",
        "recommendation",
        "reduce",
        "bachat",
        "advisor"
      ])
    ) {
      return `Smart recommendation: ${recommendations.join(" ")} Current balance ${formatCurrency(
        balance
      )} hai.`;
    }

    if (
      includesAny(text, [
        "pattern",
        "trend",
        "analysis",
        "category wise",
        "category-wise",
        "month wise",
        "month-wise",
        "kharcha analysis",
        "spending analysis"
      ])
    ) {
      const topCategories = categoryTotals
        .slice(0, 3)
        .map((item) => `${item.category} ${item.percentage}%`)
        .join(", ");
      const trendText = categoryTrends
        .filter((item) => item.changePercent !== 0)
        .slice(0, 2)
        .map((item) => `${item.category} ${item.changePercent > 0 ? "+" : ""}${item.changePercent}%`)
        .join(", ");

      return `Spending pattern: top categories ${topCategories || "no data yet"}. Latest month ${formatCurrency(
        summary.latestAmount
      )} spend hua. ${
        trendText ? `Month-over-month movement: ${trendText}.` : "Trend stable hai ya comparison ke liye aur monthly data chahiye."
      }`;
    }

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

    if (text.includes("recommend") || text.includes("kaunsa loan") || text.includes("which loan") || text.includes("better loan")) {
      const monthlySurplus = Number(totalIncome || 0) - Number(totalExpense || 0);
      if (monthlySurplus <= 0) {
        return "Loan recommendation: pehle expenses control karke positive monthly surplus lao. Abhi surplus low hai, isliye new EMI risk badha sakti hai.";
      }
      const safeEmi = Math.round(monthlySurplus * 0.35);
      return `Loan recommendation: agar income stable hai to personal/vehicle loan jaisa shorter tenure option manageable ho sakta hai. Safe EMI approx ${formatCurrency(
        safeEmi
      )} tak rakho, aur credit score 700+ ho to HDFC/SBI offers compare karo.`;
    }

    if (text.includes("safe emi") || text.includes("emi limit") || text.includes("afford")) {
      const safeEmi = Math.max(0, Math.round((Number(totalIncome || 0) - Number(totalExpense || 0)) * 0.35));
      return `Safe EMI thumb rule: monthly free cashflow ka 30-35% se upar mat jao. Current dashboard ke hisaab se safe EMI approx ${formatCurrency(
        safeEmi
      )} hai.`;
    }

    if (text.includes("approve") || text.includes("approval")) {
      return `Approval chance income, credit score, existing EMI, fraud score aur documents par depend karta hai. Aapka current dashboard balance ${formatCurrency(
        balance
      )} hai; loan form submit karte hi backend automatic verification status dega.`;
    }

    if (text.includes("document") || text.includes("aadhaar") || text.includes("pan")) {
      return "Required documents: Aadhaar, PAN, bank account, IFSC, nominee details, address, pincode, income details aur optional passport photo. System Aadhaar/PAN/IFSC/pincode format automatically verify karta hai.";
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
      return "Submit to Server ke baad application Saved Loan Applications card me dikhegi. User endpoint: GET http://localhost:8081/api/loans/my-applications. Admin endpoint: GET http://localhost:8081/api/admin/applications.";
    }

    if (text.includes("income") || text.includes("expense") || text.includes("balance") || text.includes("kharcha")) {
      return `Current dashboard: income ${formatCurrency(totalIncome)}, expense ${formatCurrency(
        totalExpense
      )}, balance ${formatCurrency(balance)}. Forecast ${forecast.month}: ${formatCurrency(
        forecast.amount
      )}. Top category: ${summary.topCategory.category}.`;
    }

    return `Main fixed 2-3 questions wala bot nahi hoon. Aap raw expense description, forecast, anomaly, category trend, savings, EMI, loan, FD ya SIP par natural question pooch sakte ho. Current insight: ${recommendations[0]}`;
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
            width: { xs: "calc(100vw - 24px)", sm: 400 },
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

            <Stack spacing={1} sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
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
                placeholder="Free-form question type karo..."
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
