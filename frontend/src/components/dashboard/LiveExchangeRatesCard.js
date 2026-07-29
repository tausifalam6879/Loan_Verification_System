import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogContent, DialogTitle, Divider, Stack, TextField, Typography
} from "@mui/material";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import { marketApi } from "../../api/axiosConfig";

const CACHE_KEY = "fintrack.inr-exchange-rates.v4";
const REFRESH_INTERVAL_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

const featuredCurrencies = [
  { code: "USD", country: "United States", name: "US Dollar", yahooSymbol: "USDINR=X", digits: 2 },
  { code: "EUR", country: "Eurozone", name: "Euro", yahooSymbol: "EURINR=X", digits: 2 },
  { code: "GBP", country: "United Kingdom", name: "British Pound", yahooSymbol: "GBPINR=X", digits: 2 },
  { code: "AED", country: "United Arab Emirates", name: "UAE Dirham", yahooSymbol: "AEDINR=X", digits: 2 },
  { code: "JPY", country: "Japan", name: "Japanese Yen", yahooSymbol: "JPYINR=X", digits: 4 },
  { code: "SGD", country: "Singapore", name: "Singapore Dollar", yahooSymbol: "SGDINR=X", digits: 2 },
  { code: "AUD", country: "Australia", name: "Australian Dollar", yahooSymbol: "AUDINR=X", digits: 2 },
  { code: "CAD", country: "Canada", name: "Canadian Dollar", yahooSymbol: "CADINR=X", digits: 2 }
];

const formatRupees = (value, digits = 2) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const currencyName = (code) => {
  try { return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) || code; } catch (error) { return code; }
};

const readCachedRates = () => {
  try { const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null"); return cached?.currencies ? cached : null; } catch (error) { return null; }
};
const saveRates = (data) => { try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (error) { /* Storage is optional. */ } };

const LiveExchangeRatesCard = ({ onOpenMarkets }) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [state, setState] = useState(() => readCachedRates() || ({ currencies: featuredCurrencies, referenceRates: {}, updatedAt: "", source: "Loading currency market feed", loading: true, error: "" }));

  const refreshRates = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await marketApi.get("/market/currencies", { params: { refresh: true }, timeout: REQUEST_TIMEOUT_MS });
      const payload = response.data;
      if (!Array.isArray(payload?.currencies) || !payload.currencies.length) throw new Error("Currency service returned no rates.");
      const nextState = {
        currencies: payload.currencies, referenceRates: payload.referenceRates || {}, updatedAt: payload.generatedAt || new Date().toISOString(), loading: false,
        source: payload.source || "FinTrack currency service",
        error: payload.currencies.some((currency) => currency.quoteMode !== "intraday") ? "Some featured pairs are temporarily using a labelled reference rate." : ""
      };
      saveRates(nextState);
      setState(nextState);
    } catch (error) {
      const cached = readCachedRates();
      setState(cached
        ? { ...cached, loading: false, error: "Currency service is unavailable. Showing the last verified values." }
        : { currencies: featuredCurrencies, referenceRates: {}, updatedAt: "", source: "Currency service unavailable", loading: false, error: "Start the FinTrack backend to load current currency rates." });
    }
  }, []);

  useEffect(() => {
    refreshRates();
    const interval = window.setInterval(refreshRates, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refreshRates]);

  const displayRates = useMemo(() => featuredCurrencies.map((currency) => {
    const current = state.currencies?.find((item) => item.code === currency.code);
    return { ...currency, ...current, value: Number(current?.inrValue) || null, isLive: current?.quoteMode === "intraday" };
  }), [state.currencies]);
  const allRates = useMemo(() => Object.entries(state.referenceRates || {})
    .filter(([, rate]) => Number(rate) > 0)
    .map(([code, rate]) => {
      const featured = state.currencies?.find((item) => item.code === code);
      return { code, value: Number(featured?.inrValue) || 1 / Number(rate), isLive: featured?.quoteMode === "intraday" };
    })
    .filter((currency) => `${currency.code} ${currencyName(currency.code)}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => left.code.localeCompare(right.code)), [search, state.currencies, state.referenceRates]);
  const updatedLabel = state.updatedAt ? new Date(state.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" }) : "Waiting for first update";
  const hasLiveFeed = displayRates.some((currency) => currency.isLive);

  return (
    <>
      <Card elevation={0} sx={panelStyle}>
        <CardContent sx={{ p: { xs: 2.25, md: 2.5 } }}>
          <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", gap: 1.5, mb: 2 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}><CurrencyExchangeIcon /></Box>
              <Box><Typography variant="h6" sx={{ fontWeight: 900 }}>Live INR exchange rates</Typography><Typography variant="body2" color="text.secondary">Major currency-market quotes against INR, checked every minute while this page is open.</Typography></Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
              <Chip size="small" label={hasLiveFeed ? "Live currency market feed" : state.source} color={hasLiveFeed ? "success" : "warning"} sx={{ fontWeight: 800 }} />
              <Button size="small" startIcon={state.loading ? <CircularProgress size={14} /> : <RefreshIcon />} onClick={refreshRates} disabled={state.loading} sx={buttonStyle}>Refresh now</Button>
            </Stack>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(140px, 1fr))", gap: 1.25, overflowX: "auto", pb: 0.25 }}>
            {displayRates.map((currency) => (
              <Box key={currency.code} sx={{ minWidth: 140, p: 1.35, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.38)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{currency.country}</Typography>
                <Typography variant="subtitle2" sx={{ mt: 0.65, fontWeight: 900 }}>{currency.code}</Typography>
                <Typography variant="h6" sx={{ mt: 0.4, color: "#2563eb", fontWeight: 900, whiteSpace: "nowrap" }}>Rs. {currency.value ? formatRupees(currency.value, currency.digits) : "-"}</Typography>
              <Typography variant="caption" color={currency.isLive ? "success.main" : "text.secondary"}>{currency.isLive ? "Live quote" : "Reference rate"} - {currency.name}</Typography>
              </Box>
            ))}
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 1, mt: 1.75, alignItems: { sm: "center" } }}>
            <Typography variant="caption" color={state.error ? "warning.main" : "text.secondary"}>{state.error || `Checked ${updatedLabel}. Bank, card and remittance providers may add their own margin.`}</Typography>
            <Stack direction="row" spacing={0.5}><Button size="small" onClick={() => setShowAll(true)} sx={buttonStyle}>View all currencies ({Object.keys(state.referenceRates || {}).length})</Button><Button size="small" endIcon={<OpenInNewIcon />} onClick={onOpenMarkets} sx={buttonStyle}>Open market intelligence</Button></Stack>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={showAll} onClose={() => setShowAll(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>INR currency directory</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Search by currency code or currency name. Featured country pairs use the live feed when it is available.</Typography>
          <TextField fullWidth size="small" label="Search USD, Thai baht, South African rand..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 1, mt: 2, maxHeight: 440, overflowY: "auto", pr: 0.5 }}>
            {allRates.map((currency) => <Box key={currency.code} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 900 }}>{currency.code}</Typography><Typography variant="caption" color="text.secondary">{currencyName(currency.code)}</Typography><Typography variant="body2" color="primary.main" sx={{ fontWeight: 800 }}>Rs. {formatRupees(currency.value, currency.code === "JPY" ? 4 : 2)}</Typography><Typography variant="caption" color={currency.isLive ? "success.main" : "text.secondary"}>{currency.isLive ? "Live" : "Reference"}</Typography></Box>)}
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary">One unit of the listed currency equals the shown INR amount. Values are informational, not a bank conversion quote.</Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

const panelStyle = { borderRadius: 2.5, border: "1px solid", borderColor: "divider", color: "text.primary", background: (theme) => theme.fintrackMode === "soft" ? "rgba(255, 253, 253, 0.96)" : "linear-gradient(145deg, #ffffff, #f7fbfc)", boxShadow: (theme) => theme.fintrackMode === "soft" ? "0 5px 16px rgba(75, 52, 96, 0.07)" : "0 14px 34px rgba(15, 23, 42, 0.07)" };
const buttonStyle = { borderRadius: 2, textTransform: "none", fontWeight: 900 };

export default LiveExchangeRatesCard;
