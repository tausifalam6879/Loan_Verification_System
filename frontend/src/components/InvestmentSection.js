import React, { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import CalculateIcon from "@mui/icons-material/Calculate";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import SavingsIcon from "@mui/icons-material/Savings";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { fixedDepositProducts, mutualFundProducts } from "../data/financialKnowledge";
import {
  calculateFdProjection,
  calculateSipProjection,
  formatIndianCurrency,
  getInvestmentFit,
  recommendFundCategory
} from "../utils/investmentPlanner";

const defaultInputs = {
  goal: "Emergency fund",
  risk: "Moderate",
  fdProductId: fixedDepositProducts[0].id,
  fdAmount: 100000,
  fdYears: 3,
  taxRate: 10,
  seniorCitizen: false,
  fundProductId: mutualFundProducts[2].id,
  monthlySip: 5000,
  sipYears: 5
};

const readSavedPlans = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    return [];
  }
};

const csvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const InvestmentSection = () => {
  const accountEmail = localStorage.getItem("email") || "authenticated-user";
  const savedPlansKey = `savedInvestmentPlansV2:${accountEmail.toLowerCase()}`;
  const [inputs, setInputs] = useState(defaultInputs);
  const [savedPlans, setSavedPlans] = useState(() => readSavedPlans(savedPlansKey));
  const [notice, setNotice] = useState("");

  const selectedFd =
    fixedDepositProducts.find((product) => product.id === inputs.fdProductId) || fixedDepositProducts[0];
  const selectedFund =
    mutualFundProducts.find((product) => product.id === inputs.fundProductId) || mutualFundProducts[0];
  const fdRate = inputs.seniorCitizen ? selectedFd.seniorAnnualRate : selectedFd.annualRate;

  const fdProjection = useMemo(
    () =>
      calculateFdProjection({
        principal: inputs.fdAmount,
        annualRate: fdRate,
        years: inputs.fdYears,
        taxRate: inputs.taxRate
      }),
    [fdRate, inputs.fdAmount, inputs.fdYears, inputs.taxRate]
  );

  const sipProjection = useMemo(
    () =>
      calculateSipProjection({
        monthlyAmount: inputs.monthlySip,
        annualRate: selectedFund.assumedAnnualReturn,
        years: inputs.sipYears
      }),
    [inputs.monthlySip, inputs.sipYears, selectedFund.assumedAnnualReturn]
  );

  const fit = getInvestmentFit({ goal: inputs.goal, risk: inputs.risk, years: inputs.sipYears });
  const growthData = useMemo(() => {
    const fdYears = Math.max(0, Number(inputs.fdYears) || 0);
    const sipYears = Math.max(0, Number(inputs.sipYears) || 0);
    const horizon = Math.max(fdYears, sipYears);
    const periods = [...new Set([0, fdYears, sipYears, ...Array.from({ length: 12 }, (_, index) => horizon * (index + 1) / 12)])].sort((a, b) => a - b);
    return periods.map((year) => ({
      year: Math.round(year * 100) / 100,
      fd: year <= fdYears ? calculateFdProjection({ principal: inputs.fdAmount, annualRate: fdRate, years: year, taxRate: inputs.taxRate }).postTaxMaturity : null,
      sip: year <= sipYears ? calculateSipProjection({ monthlyAmount: inputs.monthlySip, annualRate: selectedFund.assumedAnnualReturn, years: year }).projected : null
    }));
  }, [fdRate, inputs.fdAmount, inputs.fdYears, inputs.taxRate, inputs.monthlySip, inputs.sipYears, selectedFund.assumedAnnualReturn]);
  const suggestedCategory = recommendFundCategory({ risk: inputs.risk, years: inputs.sipYears });

  const updateInput = (field, value) => {
    setInputs((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const savePlans = (next) => {
    setSavedPlans(next);
    localStorage.setItem(savedPlansKey, JSON.stringify(next));
  };

  const handleSavePlan = () => {
    const plan = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      goal: inputs.goal,
      risk: inputs.risk,
      fdBank: selectedFd.bank,
      fdAmount: fdProjection.principal,
      fdRate,
      fdYears: Number(inputs.fdYears),
      fdMaturity: fdProjection.maturity,
      fdPostTaxMaturity: fdProjection.postTaxMaturity,
      fundCategory: selectedFund.category,
      monthlySip: Number(inputs.monthlySip),
      sipYears: Number(inputs.sipYears),
      sipAssumedReturn: selectedFund.assumedAnnualReturn,
      sipInvested: sipProjection.invested,
      sipProjected: sipProjection.projected,
      sipLow: sipProjection.low,
      sipHigh: sipProjection.high
    };
    savePlans([plan, ...savedPlans]);
    setNotice("Comparison saved to this signed-in account on this browser.");
  };

  const handleDeletePlan = (id) => {
    savePlans(savedPlans.filter((plan) => plan.id !== id));
  };

  const handleExportPlans = () => {
    const headers = [
      "Saved at",
      "Goal",
      "Risk",
      "FD bank",
      "FD amount",
      "FD rate",
      "FD maturity",
      "Fund category",
      "Monthly SIP",
      "SIP invested",
      "SIP projected low",
      "SIP projected base",
      "SIP projected high"
    ];
    const rows = savedPlans.map((plan) => [
      plan.savedAt,
      plan.goal,
      plan.risk,
      plan.fdBank,
      plan.fdAmount,
      plan.fdRate,
      plan.fdMaturity,
      plan.fundCategory,
      plan.monthlySip,
      plan.sipInvested,
      plan.sipLow,
      plan.sipProjected,
      plan.sipHigh
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "fintrack-saved-investment-plans.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box id="investments-section">
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 3,
          border: "none",
          background: "transparent"
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, mb: 2.5 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontSize: 16, color: "#65729e", fontWeight: 800 }}>
              Build and compare a savings plan
            </Typography>
          </Box>
          <Chip icon={<CalculateIcon />} label="Interactive projections" color="primary" sx={{ fontWeight: 900 }} />
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2.5 }}>
          {[
            ["Financial goal", "What are you saving for?", "goal", ["Emergency fund", "Short-term purchase", "Education", "Home", "Retirement", "Wealth creation"], "#7848ff", <TrackChangesIcon />],
            ["Risk preference", "Choose your comfort level.", "risk", ["Low", "Moderate", "High"], "#00a67d", <TrendingUpIcon />]
          ].map(([label, note, field, options, color, icon]) => <Box key={field} sx={{ display: "flex", alignItems: "center", gap: 2, p: 2.5, bgcolor: "#fff", border: "1px solid #e3e8fc", borderRadius: 2.5 }}>
            <Box sx={{ width: 54, height: 54, flexShrink: 0, borderRadius: 2, bgcolor: color + "15", color, display: "grid", placeItems: "center" }}>{icon}</Box>
            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 900 }}>{label}</Typography><Typography variant="body2" color="text.secondary">{note}</Typography></Box>
            <TextField select label={label} value={inputs[field]} onChange={(e) => updateInput(field, e.target.value)} size="small" sx={{ width: "46%" }}>
              {options.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </TextField>
          </Box>)}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <PlannerCard
              icon={<SavingsIcon />}
              title="Fixed Deposit estimate"
              subtitle="Predictable rate with an estimated post-tax maturity."
              accent="#2463eb"
            >
              <Stack spacing={1.5}>
                <TextField
                  select
                  fullWidth
                  label="Bank product"
                  value={inputs.fdProductId}
                  onChange={(event) => updateInput("fdProductId", event.target.value)}
                >
                  {fixedDepositProducts.map((product) => (
                    <MenuItem key={product.id} value={product.id}>{product.bank} · {product.type}</MenuItem>
                  ))}
                </TextField>
                <Grid container spacing={1.25}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="One-time deposit"
                      value={inputs.fdAmount}
                      onChange={(event) => updateInput("fdAmount", Math.max(0, Number(event.target.value)))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Years"
                      value={inputs.fdYears}
                      onChange={(event) => updateInput("fdYears", Math.max(0.25, Number(event.target.value)))}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Tax %"
                      value={inputs.taxRate}
                      onChange={(event) => updateInput("taxRate", Math.min(100, Math.max(0, Number(event.target.value))))}
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={inputs.seniorCitizen}
                      onChange={(event) => updateInput("seniorCitizen", event.target.checked)}
                    />
                  }
                  label="Use indicative senior-citizen rate"
                />
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                  <Chip label={`${fdRate}% p.a. assumption`} color="success" size="small" />
                  <Chip label={selectedFd.tenure} size="small" />
                  <Chip label={`Minimum ${selectedFd.minAmount}`} size="small" />
                </Stack>
                <ResultGrid
                  items={[
                    ["Principal", formatIndianCurrency(fdProjection.principal)],
                    ["Estimated interest", formatIndianCurrency(fdProjection.interest)],
                    ["Maturity", formatIndianCurrency(fdProjection.maturity)],
                    ["Post-tax estimate", formatIndianCurrency(fdProjection.postTaxMaturity)]
                  ]}
                  accent="#0d9488"
                />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {selectedFd.notes}
                </Typography>
              </Stack>
            </PlannerCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <PlannerCard
              icon={<TrendingUpIcon />}
              title="SIP projection range"
              subtitle="Illustrative low, base and high outcomes—not a guaranteed return."
              accent="#ff991c"
            >
              <Stack spacing={1.5}>
                <TextField
                  select
                  fullWidth
                  label="Mutual-fund category"
                  value={inputs.fundProductId}
                  onChange={(event) => updateInput("fundProductId", event.target.value)}
                >
                  {mutualFundProducts.map((product) => (
                    <MenuItem key={product.id} value={product.id}>{product.category}</MenuItem>
                  ))}
                </TextField>
                <Grid container spacing={1.25}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Monthly SIP"
                      value={inputs.monthlySip}
                      onChange={(event) => updateInput("monthlySip", Math.max(0, Number(event.target.value)))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Years"
                      value={inputs.sipYears}
                      onChange={(event) => updateInput("sipYears", Math.max(1, Number(event.target.value)))}
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                  <Chip label={selectedFund.risk} color="warning" size="small" />
                  <Chip label={selectedFund.horizon} size="small" />
                  <Chip label={`${selectedFund.assumedAnnualReturn}% base assumption`} color="primary" size="small" />
                </Stack>
                <ResultGrid
                  items={[
                    ["Total invested", formatIndianCurrency(sipProjection.invested)],
                    ["Low projection", formatIndianCurrency(sipProjection.low)],
                    ["Base projection", formatIndianCurrency(sipProjection.projected)],
                    ["High projection", formatIndianCurrency(sipProjection.high)]
                  ]}
                  accent="#2563eb"
                />
                <Typography variant="caption" color="text.secondary">Scenario assumptions: {sipProjection.lowRate}% low · {selectedFund.assumedAnnualReturn}% base · {sipProjection.highRate}% high per year</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {selectedFund.suitableFor}
                </Typography>
              </Stack>
            </PlannerCard>
          </Grid>
        </Grid>

        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 2.1fr) minmax(280px, 1fr)", gap: 2.5, mt: 2.5 }}>
        <Card sx={{ borderRadius: 2.5, border: "1px solid #e3e8fc" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}><TrendingUpIcon color="primary" /><Typography variant="h6">Growth comparison</Typography></Stack>
            <Typography variant="body2" color="text.secondary">Your selected amounts and assumptions. Each line ends at its selected tenure; FD is after estimated tax, SIP is a market-linked estimate.</Typography>
            <Box sx={{ height: 280, mt: 2, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 700, height: 280 }}>
                <AreaChart data={growthData} margin={{ left: 5, right: 15, top: 10, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e6eaf7" />
                  <XAxis dataKey="year" type="number" domain={[0, "dataMax"]} tickFormatter={(value) => `${value}y`} />
                  <YAxis width={75} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatIndianCurrency(value)} labelFormatter={(value) => `Year ${value}`} />
                  <Legend />
                  <Area fill="#0ba87a" fillOpacity={0.1} dataKey="fd" name="Fixed deposit" stroke="#0ba87a" strokeWidth={3} dot={false} />
                  <Area fill="#7848ff" fillOpacity={0.1} dataKey="sip" name="SIP estimate" stroke="#7848ff" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <PlannerCard icon={<TrackChangesIcon />} title="Planning Insights" subtitle="Based on your goal and assumptions." accent="#7848ff">
          <Stack spacing={2} sx={{ bgcolor: "#f6f2ff", p: 2, borderRadius: 2 }}>
            {[[fit.label, fit.detail], ["Suggested fund category", suggestedCategory], ["Estimated SIP gains", formatIndianCurrency(sipProjection.estimatedGain) + " above your contributions at the base assumption."]].map(([title, detail], index) => <Box key={title} sx={{ display: "flex", gap: 1.5 }}><Box sx={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", bgcolor: "#e7ddff", color: "#7045ed", display: "grid", placeItems: "center", fontWeight: 900 }}>{index + 1}</Box><Box><Typography variant="body2" sx={{ fontWeight: 800 }}>{title}</Typography><Typography variant="body2" color="text.secondary">{detail}</Typography></Box></Box>)}
          </Stack>
        </PlannerCard>
        </Box>
        <Alert icon={<ShieldOutlinedIcon />} severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
          <strong>{fit.label}:</strong> {fit.detail} Rates and projections are indicative. Verify current rates, taxation,
          expense ratio, exit load and product documents with the provider before investing.
        </Alert>

        {notice && <Alert severity="success" sx={{ mt: 2 }}>{notice}</Alert>}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<BookmarkAddIcon />}
            onClick={handleSavePlan}
            sx={{ textTransform: "none", fontWeight: 900 }}
          >
            Save comparison plan
          </Button>
          {savedPlans.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportPlans}
              sx={{ textTransform: "none", fontWeight: 900 }}
            >
              Export saved plans
            </Button>
          )}
        </Stack>
      </Paper>

      <Card elevation={0} sx={{ mt: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 1, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Saved comparison plans</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Planning records only—no bank deposit or mutual-fund order is placed.
              </Typography>
            </Box>
            <Chip label={`${savedPlans.length} saved`} variant="outlined" />
          </Stack>

          {savedPlans.length === 0 ? (
            <Alert severity="info">Adjust the assumptions above and save a comparison to review it later.</Alert>
          ) : (
            <Grid container spacing={1.5}>
              {savedPlans.map((plan) => (
                <Grid size={{ xs: 12, md: 6, xl: 4 }} key={plan.id}>
                  <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                    <CardContent>
                      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>{plan.goal}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {new Date(plan.savedAt).toLocaleString("en-IN")} · {plan.risk} risk
                          </Typography>
                        </Box>
                        <Button
                          aria-label={`Delete ${plan.goal} plan`}
                          color="error"
                          onClick={() => handleDeletePlan(plan.id)}
                          sx={{ minWidth: 36, alignSelf: "flex-start" }}
                        >
                          <DeleteIcon />
                        </Button>
                      </Stack>
                      <Divider sx={{ my: 1.5 }} />
                      <PlanLine label={`${plan.fdBank} FD`} value={formatIndianCurrency(plan.fdMaturity)} />
                      <PlanLine label={`${plan.fundCategory} SIP`} value={formatIndianCurrency(plan.sipProjected)} />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        SIP range {formatIndianCurrency(plan.sipLow)} – {formatIndianCurrency(plan.sipHigh)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};


const PlannerCard = ({ icon, title, subtitle, accent, children }) => (
  <Card elevation={0} sx={{ height: "100%", borderRadius: 2.5, border: `1px solid ${accent}25`, background: `linear-gradient(135deg, ${accent}05, #fff 45%)` }}>
    <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
        <Box sx={{ width: 58, height: 58, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", color: accent, bgcolor: `${accent}16` }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{subtitle}</Typography>
        </Box>
      </Stack>
      {children}
    </CardContent>
  </Card>
);

const ResultGrid = ({ items, accent }) => (
  <Grid container spacing={0} sx={{ bgcolor: "#f5f7ff", borderRadius: 2, py: 1.5 }}>
    {items.map(([label, value]) => (
      <Grid size={{ xs: 6, lg: 3 }} key={label}>
        <Box sx={{ px: 1.25, minHeight: 64, borderRight: `1px solid ${accent}16` }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800 }}>{label}</Typography>
          <Typography sx={{ color: accent, fontWeight: 900 }}>{value}</Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
);

const PlanLine = ({ label, value }) => (
  <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, mb: 0.75 }}>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 900 }}>{value}</Typography>
  </Stack>
);

export default InvestmentSection;
