import React, { useState } from "react";
import { Alert, Avatar, Box, Button, Card, Chip, Stack, Step, StepLabel, Stepper, TextField, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { paymentGatewayOptions } from "../../data/financialKnowledge";

const panel = { p: 2.5, border: "1px solid #e2e7fb", borderRadius: 2, boxShadow: "0 4px 18px rgba(68,75,135,.04)" };
const money = value => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const methodColors = { gpay: "#4285f4", phonepe: "#673ab7", upi: "#159b77", card: "#246bff", netbanking: "#246bff" };

export default function PaymentWorkspace({ paymentMethod, setPaymentMethod, onStartPayment, paymentHistory = [], onDownloadReceipt }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [showAll, setShowAll] = useState(false);
  const recipients = [...new Set(paymentHistory.filter(item => item.status === "SUCCESS" && item.recipient).map(item => item.recipient))].slice(0, 3);
  const ready = recipient.trim() && Number(amount) > 0;
  const start = event => {
    event.preventDefault();
    if (ready) onStartPayment(paymentMethod, "general", { recipient: recipient.trim(), amount });
  };
  return <Stack spacing={2.5}>
    <Stepper alternativeLabel activeStep={ready ? 1 : 0} sx={{ py: 1, "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": { color: "#7040ff" }, "& .MuiStepLabel-label": { fontWeight: 700 } }}>
      {["Choose Method", "Enter Details", "Verify in Checkout", "Receipt"].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
    </Stepper>
    <Box>
      <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Select Payment Method</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" }, gap: 1.5 }}>
        {paymentGatewayOptions.map(method => {
          const selected = method.id === paymentMethod;
          const Icon = method.id === "card" ? CreditCardIcon : method.id === "netbanking" ? AccountBalanceIcon : SmartphoneIcon;
          const color = methodColors[method.id];
          return <Button key={method.id} aria-pressed={selected} onClick={() => setPaymentMethod(method.id)} sx={{ p: 2, minHeight: 100, gap: 1.5, justifyContent: "flex-start", textAlign: "left", textTransform: "none", borderRadius: 2, border: selected ? "1px solid #875bff" : "1px solid #e2e7fb", background: selected ? "linear-gradient(120deg,#f3eeff,#fff)" : "#fff" }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: color + "13", color, display: "grid", placeItems: "center", flexShrink: 0 }}>
              {method.id === "gpay" ? <Typography aria-hidden="true" sx={{ fontWeight: 900, fontSize: 32, color }}>G</Typography> : method.id === "phonepe" ? <Typography aria-hidden="true" sx={{ fontWeight: 900, fontSize: 29 }}>पे</Typography> : <Icon sx={{ fontSize: 30 }} />}
            </Box>
            <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 15, fontWeight: 800, color: "#101638" }}>{method.id === "card" ? "Card" : method.label}</Typography><Typography variant="caption" color="text.secondary">{method.id === "card" ? "Debit / Credit" : method.rail + " demo"}</Typography></Box>
            <Box aria-hidden="true" sx={{ width: 17, height: 17, borderRadius: "50%", border: "2px solid", borderColor: selected ? "#7848ff" : "#cbd0e5", p: "3px", flexShrink: 0 }}><Box sx={{ width: "100%", height: "100%", bgcolor: selected ? "#7848ff" : "transparent", borderRadius: "50%" }} /></Box>
          </Button>;
        })}
      </Box>
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.8fr) minmax(0, 1fr)" }, gap: 2.5 }}>
      <Card elevation={0} sx={panel}>
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 900, mb: 2.5 }}><CreditCardIcon sx={{ color: "#7040ff" }} />Payment Details</Typography>
        <Box component="form" onSubmit={start}>
          <TextField fullWidth required label="Send to (recipient)" placeholder="Enter recipient or merchant name" value={recipient} onChange={event => setRecipient(event.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} sx={{ mb: 2 }} />
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: "#f7f8ff", border: "1px solid #e8ecfa" }}><Typography variant="caption" color="text.secondary">Purpose</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>General demo payment</Typography></Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField required label="Amount (Rs.)" type="number" value={amount} onChange={event => setAmount(event.target.value)} slotProps={{ htmlInput: { min: .01, step: .01 } }} sx={{ flex: 1 }} />
            <Button type="submit" disabled={!ready} variant="contained" endIcon={<ArrowForwardIcon />} sx={{ flex: 1.5, textTransform: "none", fontWeight: 800, borderRadius: 2, background: "linear-gradient(90deg,#6044ef,#8252ff)" }}>Continue to checkout</Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>Review details and authorize in the demo checkout. No real money moves.</Typography>
        </Box>
      </Card>
      <Card elevation={0} sx={panel}>
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 900 }}><PeopleAltOutlinedIcon sx={{ color: "#7040ff" }} />Recent Recipients</Typography>
        <Typography variant="caption" color="text.secondary">From successful receipts on this device</Typography>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {recipients.length ? recipients.map((name, index) => <Button key={name} onClick={() => setRecipient(name)} sx={{ p: 1.5, justifyContent: "flex-start", gap: 1.5, textTransform: "none", textAlign: "left", bgcolor: "#f6f8ff", borderRadius: 2 }}>
            <Avatar sx={{ bgcolor: ["#ffe1e7", "#d8fae9", "#e1ecff"][index], color: ["#ed4264", "#059b6b", "#2874f4"][index] }}>{name.slice(0, 2).toUpperCase()}</Avatar>
            <Box sx={{ flex: 1, overflow: "hidden" }}><Typography sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>{name}</Typography><Typography variant="caption" color="text.secondary">Use recipient name</Typography></Box><ArrowForwardIcon fontSize="small" />
          </Button>) : <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}><PeopleAltOutlinedIcon sx={{ fontSize: 42, color: "#b7a8e8", mb: 1 }} /><Typography variant="body2">No recent recipients yet.</Typography><Typography variant="caption">Completed demo payments will appear here.</Typography></Box>}
        </Stack>
      </Card>
    </Box>
    <Card elevation={0} sx={panel}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}><Typography variant="h6" sx={{ fontWeight: 900, display: "flex", gap: 1.5, alignItems: "center" }}><HistoryIcon sx={{ color: "#7040ff" }} />Recent Payments</Typography>{paymentHistory.length > 4 && <Button size="small" onClick={() => setShowAll(value => !value)}>{showAll ? "Show recent" : "View all"}</Button>}</Box>
      <Typography variant="caption" color="text.secondary">Device-local demo receipts · raw card and CVV details are never stored.</Typography>
      {!paymentHistory.length ? <Alert severity="info" sx={{ mt: 2 }}>No payments yet. Complete a demo checkout to create a receipt.</Alert> :
        <Box role="region" aria-label="Payment history" tabIndex={0} sx={{ overflowX: "auto" }}><Box component="table" sx={{ minWidth: 650, width: "100%", borderCollapse: "collapse", mt: 1.5, fontSize: 14, "& th": { bgcolor: "#f4f2ff", color: "#64719d", textAlign: "left" }, "& th, & td": { p: 1.3, borderBottom: "1px solid #edf0fa" } }}>
          <thead><tr><th>Date</th><th>Recipient</th><th>Purpose / Method</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
          <tbody>{(showAll ? paymentHistory : paymentHistory.slice(0, 4)).map(receipt => <tr key={receipt.reference}>
            <td>{new Date(receipt.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
            <td>{receipt.recipient}{receipt.failureReason && <Typography variant="caption" color="error" sx={{ display: "block" }}>{receipt.failureReason}</Typography>}</td>
            <td>{receipt.applicationId ? "Loan fee" : "General payment"}<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{receipt.methodLabel}</Typography></td>
            <td style={{ fontWeight: 800 }}>Rs. {money(receipt.amount)}</td><td><Chip size="small" label={receipt.status} color={receipt.status === "SUCCESS" ? "success" : receipt.status === "FAILED" ? "error" : "warning"} variant="outlined" /></td>
            <td>{receipt.status === "SUCCESS" ? <Button size="small" onClick={() => onDownloadReceipt(receipt)}>Download</Button> : "—"}</td>
          </tr>)}</tbody>
        </Box></Box>}
    </Card>
  </Stack>;
}
