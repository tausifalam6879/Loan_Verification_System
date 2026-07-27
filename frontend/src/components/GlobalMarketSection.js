import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Link,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InsightsIcon from "@mui/icons-material/Insights";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import PublicIcon from "@mui/icons-material/Public";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  askMarketAgent,
  getCompanyResearch,
  getGlobalMarketOverview,
  getMarketAnalysis,
  getMarketBreadth,
  getMarketFactors,
  getMarketNewsFeed
} from "../services/marketService";

const popularSymbols = [
  ["^NSEI", "Nifty 50"], ["^BSESN", "Sensex"], ["RELIANCE.NS", "Reliance"],
  ["HDFCBANK.NS", "HDFC Bank"], ["INFY.NS", "Infosys"], ["AAPL", "Apple"], ["MSFT", "Microsoft"]
];

const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: digits });
};

const formatLargeNumber = (value) => {
  if (!value) return "N/A";
  const numeric = Number(value);
  if (numeric >= 1e12) return `${formatNumber(numeric / 1e12)}T`;
  if (numeric >= 1e9) return `${formatNumber(numeric / 1e9)}B`;
  if (numeric >= 1e7) return `${formatNumber(numeric / 1e7)}Cr`;
  return formatNumber(numeric, 0);
};

const formatTime = (value) => {
  if (!value) return "Timestamp unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const directionColor = (value) => Number(value) >= 0 ? "#15803d" : "#dc2626";
const outlookColor = (outlook) => outlook === "BULLISH" ? "#15803d" : outlook === "BEARISH" ? "#dc2626" : "#b45309";

const GlobalMarketSection = () => {
  const [view, setView] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [factors, setFactors] = useState(null);
  const [breadth, setBreadth] = useState(null);
  const [newsFeed, setNewsFeed] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [company, setCompany] = useState(null);
  const [symbol, setSymbol] = useState("^NSEI");
  const [companySymbol, setCompanySymbol] = useState("RELIANCE.NS");
  const [loadingPulse, setLoadingPulse] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("Kal Nifty ko kaun se real-world factors affect kar sakte hain?");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentMessages, setAgentMessages] = useState([]);

  const loadPulse = async (refresh = false) => {
    setLoadingPulse(true);
    const results = await Promise.allSettled([
      getGlobalMarketOverview(refresh), getMarketFactors(false), getMarketBreadth(false), getMarketNewsFeed(false)
    ]);
    if (results[0].status === "fulfilled") setOverview(results[0].value);
    if (results[1].status === "fulfilled") setFactors(results[1].value);
    if (results[2].status === "fulfilled") setBreadth(results[2].value);
    if (results[3].status === "fulfilled") setNewsFeed(results[3].value);
    const failed = results.find((result) => result.status === "rejected");
    setError(failed ? "Some market feeds could not be refreshed. Available sections still show their source and timestamp." : "");
    setLoadingPulse(false);
  };

  const analyzeSymbol = async (nextSymbol = symbol, refresh = false) => {
    const cleaned = nextSymbol.trim().toUpperCase();
    if (!cleaned) return;
    setSymbol(cleaned);
    setLoadingAnalysis(true);
    try {
      setAnalysis(await getMarketAnalysis(cleaned, refresh));
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.response?.data?.message || "Model analysis is unavailable for this symbol.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const researchCompany = async (nextSymbol = companySymbol, refresh = false) => {
    const cleaned = nextSymbol.trim().toUpperCase();
    if (!cleaned) return;
    setCompanySymbol(cleaned);
    setLoadingCompany(true);
    try {
      setCompany(await getCompanyResearch(cleaned, refresh));
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.response?.data?.message || "Company research is unavailable for this symbol.");
    } finally {
      setLoadingCompany(false);
    }
  };

  useEffect(() => {
    loadPulse();
    analyzeSymbol("^NSEI");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "research" && !company && !loadingCompany) researchCompany("RELIANCE.NS");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    const refreshVisibleView = () => {
      if (document.visibilityState !== "visible") return;
      if (view === "overview") loadPulse(true);
      if (view === "research") researchCompany(companySymbol, true);
      if (view === "outlook") analyzeSymbol(symbol, true);
    };
    const intervalId = window.setInterval(refreshVisibleView, 120000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshVisibleView();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, companySymbol, symbol]);

  const refreshCurrentView = () => {
    if (view === "overview") loadPulse(true);
    if (view === "research") researchCompany(companySymbol, true);
    if (view === "outlook") analyzeSymbol(symbol, true);
  };

  const submitAgentQuestion = async (event, quickQuestion) => {
    event?.preventDefault();
    const message = (quickQuestion || question).trim();
    if (!message || agentLoading) return;
    const userMessage = { role: "user", content: message };
    setAgentMessages((current) => [...current, userMessage]);
    setQuestion("");
    setAgentLoading(true);
    try {
      const response = await askMarketAgent({
        message,
        symbol,
        recentMessages: [...agentMessages, userMessage].slice(-4).map(({ role, content }) => ({ role, content }))
      });
      setAgentMessages((current) => [...current, {
        role: "assistant",
        content: response.answer,
        llmStatus: response.llmStatus,
        llmProvider: response.llmProvider,
        toolsUsed: response.toolsUsed || []
      }]);
    } catch (requestError) {
      setAgentMessages((current) => [...current, {
        role: "assistant",
        content: requestError.response?.data?.message || requestError.response?.data?.detail || "Market agent is unavailable. Check Spring Boot and the Python market service."
      }]);
    } finally {
      setAgentLoading(false);
    }
  };

  const generatedAt = overview?.generatedAt || factors?.generatedAt || breadth?.generatedAt;
  const openResearch = (nextSymbol) => {
    setView("research");
    researchCompany(nextSymbol);
  };

  return (
    <Box id="global-market-section" sx={{ mt: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>Market research workspace</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Global Markets, Companies and AI Outlook</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Current research feed, transparent factor analysis and backend-only AI explanations.
          </Typography>
        </Box>
        <Tooltip title="Refresh current view from upstream source">
          <IconButton onClick={refreshCurrentView} disabled={loadingPulse || loadingAnalysis || loadingCompany}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 1, mb: 1.5, overflow: "hidden" }}>
        <Tabs value={view} onChange={(_, value) => setView(value)} variant="scrollable" scrollButtons="auto">
          <Tab value="overview" icon={<PublicIcon />} iconPosition="start" label="Market Pulse" />
          <Tab value="research" icon={<SearchIcon />} iconPosition="start" label="Stock Research" />
          <Tab value="outlook" icon={<AutoAwesomeIcon />} iconPosition="start" label="ML + AI Agent" />
        </Tabs>
      </Paper>

      <Paper variant="outlined" sx={{ mb: 1.5, px: 1.5, py: 1, borderRadius: 1, bgcolor: "info.50", borderColor: "info.100" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={1}>
          <Typography variant="body2" color="text.secondary">
            Yahoo Finance via yfinance. Quotes may be delayed; licensed exchange streaming is not included. Last fetch: {formatTime(generatedAt)}.
          </Typography>
          <Chip size="small" color="success" variant="outlined" icon={<RefreshIcon />} label="Auto-refresh every 2 min" sx={{ flexShrink: 0 }} />
        </Stack>
      </Paper>
      {error && <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1 }}>{error}</Alert>}

      {view === "overview" && <MarketPulse overview={overview} factors={factors} breadth={breadth} newsFeed={newsFeed} loading={loadingPulse} onOpenSymbol={openResearch} />}
      {view === "research" && (
        <StockResearch
          company={company}
          symbol={companySymbol}
          setSymbol={setCompanySymbol}
          loading={loadingCompany}
          onSearch={(event) => { event?.preventDefault(); researchCompany(); }}
          onQuickSearch={(value) => researchCompany(value)}
        />
      )}
      {view === "outlook" && (
        <ModelWorkspace
          analysis={analysis}
          symbol={symbol}
          setSymbol={setSymbol}
          loading={loadingAnalysis}
          onAnalyze={(event) => { event?.preventDefault(); analyzeSymbol(); }}
          onQuickAnalyze={(value) => analyzeSymbol(value)}
          question={question}
          setQuestion={setQuestion}
          messages={agentMessages}
          agentLoading={agentLoading}
          onSubmit={submitAgentQuestion}
        />
      )}
    </Box>
  );
};

const MarketPulse = ({ overview, factors, breadth, newsFeed, loading, onOpenSymbol }) => {
  if (loading && !overview) return <LinearProgress />;
  return (
    <Stack spacing={1.5}>
      <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
        <SectionTitle icon={<PublicIcon />} title="Major Global Indices" detail={`${overview?.availableMarkets || 0}/${overview?.totalMarkets || 0} available`} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, borderTop: "1px solid", borderLeft: "1px solid", borderColor: "divider" }}>
          {(overview?.markets || []).map((market) => <IndexTile key={market.symbol} market={market} onClick={() => onOpenSymbol(market.symbol)} />)}
        </Box>
      </Paper>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: "100%" }}>
            <SectionTitle icon={<InsightsIcon />} title="India Market Breadth" detail={`${breadth?.coverageCount || 0} stocks`} compact />
            <Stack direction="row" spacing={1} sx={{ my: 1.5 }}>
              <BreadthCount label="Advances" value={breadth?.advances} color="#15803d" />
              <BreadthCount label="Declines" value={breadth?.declines} color="#dc2626" />
              <BreadthCount label="Flat" value={breadth?.unchanged} color="#64748b" />
            </Stack>
            <Typography variant="caption" color="text.secondary">{breadth?.disclaimer || "Breadth data unavailable."}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <SectionTitle title="Global Drivers and Sector Impact" detail="Live moves + explainable impact" compact />
            <Grid container spacing={1}>
              {(factors?.factors || []).map((factor) => <FactorTile key={factor.symbol} factor={factor} onClick={() => onOpenSymbol(factor.symbol)} />)}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: "100%" }}>
            <SectionTitle title="Watchlist Movers" detail={breadth?.coverage || "Representative watchlist"} compact />
            <Grid container spacing={2}>
              <MoverList title="Top gainers" items={breadth?.topGainers || []} onOpenSymbol={onOpenSymbol} />
              <MoverList title="Top losers" items={breadth?.topLosers || []} onOpenSymbol={onOpenSymbol} />
            </Grid>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: "100%" }}>
            <SectionTitle icon={<NewspaperIcon />} title="Market News" detail="Multi-asset feed" compact />
            <Stack divider={<Divider flexItem />}>
              {(newsFeed?.articles || []).slice(0, 6).map((item, index) => (
                <Box key={`${item.title}-${index}`} sx={{ py: 1 }}>
                  <Link href={item.url || undefined} target="_blank" rel="noreferrer" underline="hover" color="inherit" sx={{ fontWeight: 700, fontSize: 14 }}>
                    {item.title}
                  </Link>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {item.publisher} | {item.relatedSymbol} | {formatTime(item.publishedAt)}
                  </Typography>
                </Box>
              ))}
              {!newsFeed?.articles?.length && <Typography variant="body2" color="text.secondary">No current headlines were returned by the provider.</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

const StockResearch = ({ company, symbol, setSymbol, loading, onSearch, onQuickSearch }) => (
  <Stack spacing={1.5}>
    <SearchBar symbol={symbol} setSymbol={setSymbol} onSubmit={onSearch} onQuick={onQuickSearch} buttonLabel="Research" />
    {loading ? <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box> : company && (
      <>
        <Paper component="section" variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="overline" color="text.secondary">{company.symbol} | {company.sector}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>{company.name}</Typography>
              <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mt: 0.75 }}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{formatNumber(company.quote?.price)}</Typography>
                <Typography sx={{ color: directionColor(company.quote?.changePercent), fontWeight: 900 }}>
                  {Number(company.quote?.changePercent) >= 0 ? "+" : ""}{formatNumber(company.quote?.changePercent)}%
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">As of {formatTime(company.dataAsOf)} | {company.source}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Grid container spacing={1}>
                <QuoteFact label="Open" value={company.quote?.open} />
                <QuoteFact label="High" value={company.quote?.high} />
                <QuoteFact label="Low" value={company.quote?.low} />
                <QuoteFact label="Prev. close" value={company.quote?.previousClose} />
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <SectionTitle title="One-Year Price History" detail="Daily close" compact />
              <PriceChart data={company.history || []} color="#0d9488" />
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                {Object.entries(company.performance || {}).map(([key, value]) => (
                  <Chip key={key} size="small" variant="outlined" label={`${performanceLabel(key)}: ${value === null ? "N/A" : `${value}%`}`} sx={{ color: directionColor(value) }} />
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: "100%" }}>
              <SectionTitle title="Fundamentals" detail={company.industry} compact />
              <FactRow label="Market cap" value={formatLargeNumber(company.fundamentals?.marketCap)} />
              <FactRow label="P/E (TTM)" value={formatNumber(company.fundamentals?.trailingPE)} />
              <FactRow label="P/B" value={formatNumber(company.fundamentals?.priceToBook)} />
              <FactRow label="ROE" value={percentOrNA(company.fundamentals?.returnOnEquity)} />
              <FactRow label="Revenue growth" value={percentOrNA(company.fundamentals?.revenueGrowth)} />
              <FactRow label="Earnings growth" value={percentOrNA(company.fundamentals?.earningsGrowth)} />
              <FactRow label="Debt/equity" value={formatNumber(company.fundamentals?.debtToEquity)} />
              <FactRow label="52-week range" value={`${formatNumber(company.range?.fiftyTwoWeekLow)} - ${formatNumber(company.range?.fiftyTwoWeekHigh)}`} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box component="section" sx={{ py: 1 }}>
              <SectionTitle title="Business Context" detail={`${company.country} | ${company.industry}`} compact />
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {company.summary || "Business summary is not available from the current provider."}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <SectionTitle title="Related Headlines" compact />
              <Stack divider={<Divider flexItem />}>
                {(company.news || []).slice(0, 5).map((item, index) => (
                  <Link key={`${item.title}-${index}`} href={item.url || undefined} target="_blank" rel="noreferrer" underline="hover" color="inherit" sx={{ py: 1, fontSize: 14, fontWeight: 700 }}>
                    {item.title}
                  </Link>
                ))}
                {!company.news?.length && <Typography variant="body2" color="text.secondary">No recent company headlines available.</Typography>}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </>
    )}
  </Stack>
);

const ModelWorkspace = ({ analysis, symbol, setSymbol, loading, onAnalyze, onQuickAnalyze, question, setQuestion, messages, agentLoading, onSubmit }) => {
  const confidenceGap = Math.abs(Number(analysis?.probabilityUp || 50) - 50);
  return (
    <Stack spacing={1.5}>
      <SearchBar symbol={symbol} setSymbol={setSymbol} onSubmit={onAnalyze} onQuick={onQuickAnalyze} buttonLabel="Run model" />
      <Alert severity="warning" sx={{ borderRadius: 1 }}>
        This is a next-session probability experiment, not a target price or buy/sell call. A backtest near 50% has weak predictive value.
      </Alert>
      {loading ? <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box> : analysis && (
        <>
          <Grid container spacing={1.25}>
            <ModelMetric label="Outlook" value={analysis.outlook} color={outlookColor(analysis.outlook)} />
            <ModelMetric label="Probability up" value={`${analysis.probabilityUp}%`} detail={`${confidenceGap.toFixed(1)} points from neutral`} color="#2563eb" />
            <ModelMetric label="Historical test" value={`${analysis.model?.backtestAccuracy}%`} detail={`${analysis.model?.quality || "unknown"} signal quality`} color={analysis.model?.quality === "useful" ? "#15803d" : "#b45309"} />
            <ModelMetric label="Macro overlay" value={analysis.macroFactor?.signal || "mixed"} detail={`${signed(analysis.macroFactor?.probabilityAdjustmentPoints)} probability points`} color="#7c3aed" />
          </Grid>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <SectionTitle title={`${analysis.name} Evidence`} detail={`Expected range ${formatNumber(analysis.expectedRange?.low)} - ${formatNumber(analysis.expectedRange?.high)}`} compact />
                <PriceChart data={analysis.history || []} color="#2563eb" />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: "100%" }}>
                <SectionTitle title="Technical and News Inputs" compact />
                <FactRow label="RSI (14)" value={analysis.technicalIndicators?.rsi14} />
                <FactRow label="SMA 20" value={formatNumber(analysis.technicalIndicators?.sma20)} />
                <FactRow label="SMA 50" value={formatNumber(analysis.technicalIndicators?.sma50)} />
                <FactRow label="20-day volatility" value={percentOrNA(analysis.technicalIndicators?.dailyVolatility20d)} />
                <FactRow label="News tone" value={analysis.newsFactor?.sentimentLabel} />
                <FactRow label="News adjustment" value={`${signed(analysis.newsFactor?.probabilityAdjustmentPoints)} pts`} />
                <FactRow label="Training/test rows" value={`${analysis.model?.trainingRows}/${analysis.model?.testRows}`} />
              </Paper>
            </Grid>
          </Grid>

          <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <SectionTitle title="Why the Macro Overlay Moved" detail={analysis.macroFactor?.method} compact />
            <Grid container spacing={1}>
              {(analysis.macroFactor?.factors || []).map((factor) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={factor.factor}>
                  <Box sx={{ p: 1, borderLeft: "3px solid", borderColor: Number(factor.scoreContribution) >= 0 ? "success.main" : "error.main" }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{factor.factor}: {signed(factor.changePercent)}%</Typography>
                    <Typography variant="caption" color="text.secondary">{factor.reason}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </>
      )}

      <Paper component="section" variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
        <SectionTitle icon={<SmartToyIcon />} title="Grounded Market Research Agent" detail="Backend tools first, configured LLM explanation second" compact />
        <Stack direction="row" spacing={0.75} sx={{ mb: 1, overflowX: "auto" }}>
          {["Gold aur crude ka Nifty par kya impact hai?", "Top gainers aur losers batao", `Why is ${symbol} outlook ${analysis?.outlook || "neutral"}?`].map((item) => (
            <Chip key={item} size="small" label={item} onClick={(event) => onSubmit(event, item)} clickable />
          ))}
        </Stack>
        <Box sx={{ maxHeight: 320, overflowY: "auto", mb: 1.25 }}>
          {messages.length === 0 && <Alert severity="info">Ask about stocks, gold, oil, currency, news, model weakness or market breadth.</Alert>}
          {messages.map((item, index) => (
            <Box key={`${item.role}-${index}`} sx={{ ml: item.role === "user" ? "auto" : 0, mb: 1, p: 1.1, maxWidth: { xs: "96%", md: "82%" }, bgcolor: item.role === "user" ? "primary.main" : "action.hover", color: item.role === "user" ? "primary.contrastText" : "text.primary", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.content}</Typography>
              {item.role === "assistant" && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: "wrap", gap: 0.5 }}>
                  <Chip
                    size="small"
                    icon={<AutoAwesomeIcon />}
                    label={item.llmStatus === "connected" ? `${item.llmProvider || "LLM"} grounded` : item.llmStatus === "grounding_fallback" ? "LLM checked - tool answer used" : "LLM offline - verified tool answer"}
                  />
                  {(item.toolsUsed || []).map((tool) => <Chip key={tool} size="small" label={tool.replaceAll("_", " ")} variant="outlined" />)}
                </Stack>
              )}
            </Box>
          ))}
          {agentLoading && <CircularProgress size={24} />}
        </Box>
        <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", gap: 1 }}>
          <TextField fullWidth size="small" label="Ask using live market evidence" value={question} onChange={(event) => setQuestion(event.target.value)} />
          <Button type="submit" variant="contained" disabled={agentLoading || !question.trim()} aria-label="Send market question"><SendIcon /></Button>
        </Box>
      </Paper>
    </Stack>
  );
};

const SearchBar = ({ symbol, setSymbol, onSubmit, onQuick, buttonLabel }) => (
  <Paper component="form" onSubmit={onSubmit} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField fullWidth size="small" label="Yahoo Finance ticker" value={symbol} onChange={(event) => setSymbol(event.target.value)} helperText="Examples: RELIANCE.NS, HDFCBANK.NS, AAPL, ^NSEI" />
      <Button type="submit" variant="contained" startIcon={<SearchIcon />} sx={{ minWidth: 140, alignSelf: { sm: "flex-start" } }}>{buttonLabel}</Button>
    </Stack>
    <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: "auto", pb: 0.25 }}>
      {popularSymbols.map(([value, label]) => <Chip key={value} size="small" label={label} onClick={() => onQuick(value)} variant={symbol === value ? "filled" : "outlined"} color={symbol === value ? "primary" : "default"} />)}
    </Stack>
  </Paper>
);

const IndexTile = ({ market, onClick }) => {
  const available = market.status === "available";
  const positive = Number(market.changePercent) >= 0;
  return (
    <ButtonBase
      onClick={available ? onClick : undefined}
      disabled={!available}
      aria-label={`Open ${market.name} research`}
      sx={{ p: 1.25, minWidth: 0, width: "100%", display: "block", textAlign: "left", borderRight: "1px solid", borderBottom: "1px solid", borderColor: "divider", transition: "background-color 150ms ease", "&:hover": { bgcolor: "action.hover" } }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" sx={{ fontWeight: 900 }}>{market.name}</Typography>
        <Stack direction="row" spacing={0.25} alignItems="center">
          {available && (positive ? <TrendingUpIcon fontSize="small" color="success" /> : <TrendingDownIcon fontSize="small" color="error" />)}
          {available && <ChevronRightIcon fontSize="small" color="action" />}
        </Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary">{market.region} | {market.symbol}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "baseline", columnGap: 1, mt: 0.75 }}>
        <Typography sx={{ fontWeight: 900 }}>{available ? formatNumber(market.price) : "Unavailable"}</Typography>
        {available && <Typography variant="body2" sx={{ color: directionColor(market.changePercent), fontWeight: 900, whiteSpace: "nowrap" }}>{signed(market.changePercent)}%</Typography>}
      </Box>
    </ButtonBase>
  );
};

const FactorTile = ({ factor, onClick }) => (
  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
    <ButtonBase onClick={onClick} aria-label={`Open ${factor.name} chart`} sx={{ p: 1.1, border: "1px solid", borderColor: "divider", borderRadius: 1, height: "100%", width: "100%", display: "block", textAlign: "left", transition: "border-color 150ms ease, background-color 150ms ease", "&:hover": { bgcolor: "action.hover", borderColor: "primary.main" } }}>
      <Stack direction="row" justifyContent="space-between" gap={1}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>{factor.name}</Typography>
          <Typography variant="caption" color="text.secondary">{factor.theme}</Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            <Typography variant="body2" sx={{ fontWeight: 900 }}>{formatNumber(factor.price)}</Typography>
            <ChevronRightIcon fontSize="small" color="action" />
          </Stack>
          <Typography variant="caption" sx={{ color: directionColor(factor.changePercent), fontWeight: 900 }}>{signed(factor.changePercent)}%</Typography>
        </Box>
      </Stack>
      <Stack spacing={0.55} sx={{ mt: 1 }}>
        <Typography variant="caption" component="p" sx={{ m: 0, lineHeight: 1.45 }}>
          <strong>May help:</strong> {factor.positiveImpact}
        </Typography>
        <Typography variant="caption" component="p" color="text.secondary" sx={{ m: 0, lineHeight: 1.45 }}>
          <strong>May hurt:</strong> {factor.negativeImpact}
        </Typography>
      </Stack>
    </ButtonBase>
  </Grid>
);

const MoverList = ({ title, items, onOpenSymbol }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>{title}</Typography>
    <Stack divider={<Divider flexItem />}>
      {items.slice(0, 5).map((item) => (
        <ButtonBase key={item.symbol} onClick={() => onOpenSymbol(item.symbol)} aria-label={`Open ${item.name} research`} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", columnGap: 1.5, py: 0.75, px: 0.5, width: "100%", textAlign: "left", borderRadius: 0.5, "&:hover": { bgcolor: "action.hover" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 800 }}>{item.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{item.symbol}</Typography>
          </Box>
          <Box sx={{ textAlign: "right", minWidth: 88 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatNumber(item.price)}</Typography>
            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.25}>
              <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: directionColor(item.changePercent), fontWeight: 900 }}>{signed(item.changePercent)}%</Typography>
              <ChevronRightIcon sx={{ fontSize: 16 }} color="action" />
            </Stack>
          </Box>
        </ButtonBase>
      ))}
    </Stack>
  </Grid>
);

const BreadthCount = ({ label, value, color }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="h5" sx={{ color, fontWeight: 900 }}>{value ?? 0}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
);

const ModelMetric = ({ label, value, detail, color }) => (
  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, borderTop: `3px solid ${color}`, height: "100%" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
      <Typography variant="h6" sx={{ color, fontWeight: 900, textTransform: "capitalize" }}>{value}</Typography>
      {detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}
    </Paper>
  </Grid>
);

const QuoteFact = ({ label, value }) => (
  <Grid size={{ xs: 6 }}>
    <Box sx={{ py: 0.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 900 }}>{formatNumber(value)}</Typography>
    </Box>
  </Grid>
);

const SectionTitle = ({ icon, title, detail, compact = false }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: detail ? "minmax(0, 1fr) auto" : "1fr", alignItems: "center", columnGap: 1.5, mb: compact ? 1 : 1.25 }}>
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, overflow: "hidden" }}>
      {icon && <Box sx={{ color: "#0d9488", display: "flex" }}>{icon}</Box>}
      <Typography variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 900, lineHeight: 1.25 }}>{title}</Typography>
    </Stack>
    {detail && <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right", pl: 1, maxWidth: { xs: 130, sm: 260 }, lineHeight: 1.3 }}>{detail}</Typography>}
  </Box>
);

const FactRow = ({ label, value }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", columnGap: 2, py: 0.8, borderBottom: "1px solid", borderColor: "divider" }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 900, textAlign: "right", whiteSpace: "nowrap" }}>{value ?? "N/A"}</Typography>
  </Box>
);

const PriceChart = ({ data, color }) => (
  <Box sx={{ height: { xs: 230, md: 300 }, minWidth: 0 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.22} />
        <XAxis dataKey="date" minTickGap={36} tick={{ fontSize: 11 }} />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={66} />
        <ChartTooltip formatter={(value) => [formatNumber(value), "Close"]} />
        <Line type="monotone" dataKey="close" stroke={color} strokeWidth={2.25} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </Box>
);

const signed = (value) => {
  const numeric = Number(value || 0);
  return `${numeric >= 0 ? "+" : ""}${formatNumber(numeric)}`;
};

const percentOrNA = (value) => value === null || value === undefined ? "N/A" : `${formatNumber(value)}%`;
const performanceLabel = (key) => ({ oneDay: "1D", oneMonth: "1M", threeMonths: "3M", sixMonths: "6M", oneYear: "1Y" }[key] || key);

export default GlobalMarketSection;
