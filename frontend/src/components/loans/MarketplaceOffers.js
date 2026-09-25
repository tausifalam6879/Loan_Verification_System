import React from "react";
import { Alert, Avatar, Box, Button, Card, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import SecurityIcon from "@mui/icons-material/Security";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const money = value => "Rs. " + Number(value || 0).toLocaleString("en-IN");
const colors = ["#2563eb", "#ef6545", "#009b83"];
const panel = { p: 2.5, borderRadius: 2, border: "1px solid #e2e7fb", boxShadow: "0 4px 18px rgba(68,75,135,.04)" };

export default function MarketplaceOffers({ rows = [], loading, selectedId, tenureMonths, onSelect }) {
  const comparison = rows.slice(0, 3);
  const preview = rows.find(row => row.offer.id === selectedId) || rows[0];
  const features = [
    ["Interest rate (p.a.)", row => row.offer.interestRate + "%"],
    ["Monthly EMI", row => money(row.metrics.emi)],
    ["Maximum amount", row => money(row.offer.maxAmount)],
    ["Processing fee estimate", row => money(row.metrics.processingFee)],
    ["Total repayment", row => money(row.metrics.totalPayable)],
    ["Tenure available", row => row.offer.minTenureMonths + "–" + row.offer.maxTenureMonths + " months"]
  ];
  if (loading) return <Box sx={{ py: 5, textAlign: "center" }}><CircularProgress /><Typography>Loading loan offers from backend...</Typography></Box>;
  return <Stack spacing={2.5}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Typography variant="h5" sx={{ fontWeight: 900 }}>Top Loan Offers</Typography><Typography variant="body2" color="text.secondary">{rows.length} offers in current filters · demo offers</Typography></Box>
    {!rows.length ? <Alert severity="info">No offers match this loan type. Try another filter.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 2 }}>
      {rows.map(({ offer, metrics, eligibility }, index) => {
        const color = colors[index % colors.length];
        return <Card key={offer.id} elevation={0} sx={{ ...panel, background: "linear-gradient(130deg," + color + "08,#fff)", borderColor: offer.id === selectedId ? color : color + "28" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Avatar variant="rounded" sx={{ bgcolor: color + "15", color, width: 56, height: 56 }}><AccountBalanceIcon sx={{ fontSize: 32 }} /></Avatar>
            <Box sx={{ flex: 1 }}><Typography variant="h6" sx={{ fontWeight: 900, fontSize: 19 }}>{offer.bank?.name || "Lender"}</Typography><Typography variant="body2" color="text.secondary">{offer.loanType?.name}</Typography></Box>
            <Chip size="small" label={eligibility.eligible ? "Criteria met" : "Review"} color={eligibility.eligible ? "success" : "warning"} variant="outlined" />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", mb: 2.5, "& > div + div": { borderLeft: "1px solid #dfe4f5", pl: 1.2 } }}>
            {[[offer.interestRate + "%", "Interest rate (p.a.)"], [money(metrics.emi), "Monthly EMI"], [money(offer.maxAmount), "Max loan amount"]].map(([value, label]) => <Box key={label} sx={{ pr: 1 }}><Typography sx={{ fontWeight: 900, fontSize: 18, overflowWrap: "anywhere" }}>{value}</Typography><Typography variant="caption" color="text.secondary">{label}</Typography></Box>)}
          </Box>
          <Button fullWidth onClick={() => onSelect(offer)} endIcon={<ArrowForwardIcon />} sx={{ bgcolor: color + "13", color, borderRadius: 1.5, fontWeight: 800, textTransform: "none" }}>View Offer</Button>
        </Card>;
      })}
    </Box>}
    {preview && <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1.65fr) minmax(0,1fr)", gap: 2 }}>
      <Card elevation={0} sx={panel}>
        <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", gap: 1, alignItems: "center" }}><CompareArrowsIcon sx={{ color: "#7545ef" }} />Loan Comparison</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>First {comparison.length} offers in your current sort · EMI for {tenureMonths} months</Typography>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13, "& th, & td": { p: 1.25, border: "1px solid #e8ecf8", textAlign: "left" }, "& th": { bgcolor: "#f5f6ff", fontWeight: 800 }, "& td:not(:first-of-type)": { fontWeight: 700 } }}>
          <thead><tr><th>Feature</th>{comparison.map(row => <th key={row.offer.id}>{row.offer.bank?.name}<Typography variant="caption" sx={{ display: "block", fontWeight: 400 }}>{row.offer.loanType?.name}</Typography></th>)}</tr></thead>
          <tbody>{features.map(([label, getValue]) => <tr key={label}><td>{label}</td>{comparison.map(row => <td key={row.offer.id}>{getValue(row)}</td>)}</tr>)}</tbody>
        </Box>
      </Card>
      <Stack spacing={2}>
        <Card elevation={0} sx={panel}>
          <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", gap: 1, alignItems: "center" }}><SecurityIcon sx={{ color: "#0d9e79" }} />Eligibility Preview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 1.5 }}>{preview.offer.bank?.name} · {preview.offer.loanType?.name}</Typography>
          <Alert severity={preview.eligibility.eligible ? "success" : "warning"} sx={{ borderRadius: 2 }}>{preview.eligibility.eligible ? "Amount, tenure and submitted credit score meet this offer’s basic criteria." : preview.eligibility.reasons.join(" · ")}</Alert>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>This is a rules-based preview, not lender approval or a verified credit-bureau check.</Typography>
        </Card>
        <Card elevation={0} sx={{ ...panel, bgcolor: "#f8f6ff" }}><Typography sx={{ color: "#6440bd", fontWeight: 800, mb: .7 }}>Review before applying</Typography><Typography variant="body2" color="text.secondary">Compare fees and total repayment. Final verification and application decisions follow the existing backend flow.</Typography></Card>
      </Stack>
    </Box>}
  </Stack>;
}
