import { marketApi } from "../api/axiosConfig";

const REQUEST_TIMEOUT_MS = 8000;
// Render's free instances sleep after inactivity.  A first request can need
// enough time to start both the API and its market-data service, so a hosted
// deployment must not be downgraded to the scheduled snapshot after 8–20 sec.
const HOSTED_LIVE_TIMEOUT_MS = 125000;
// Agent answers run several grounded tools (quote, technical history, news and
// macro factors), so they need a longer budget than a single market quote.
const AGENT_REQUEST_TIMEOUT_MS = 90000;
const QUOTE_REQUEST_TIMEOUT_MS = 20000;
const SNAPSHOT_RECHECK_MS = 60000;
const CACHE_PREFIX = "fintrack.market.v4";
const SNAPSHOT_URL = `${process.env.PUBLIC_URL || ""}/data/market-snapshot.json`;
const isHostedBackend = /^https?:\/\/(?!localhost(?::|\/)|127\.0\.0\.1(?::|\/))/i.test(process.env.REACT_APP_API_BASE_URL || "");

const MARKET_BOARD = [
  { symbol: "^NSEI", name: "Nifty 50", kind: "index", sector: "Indices" },
  { symbol: "^BSESN", name: "BSE Sensex", kind: "index", sector: "Indices" },
  { symbol: "RELIANCE.NS", name: "Reliance", kind: "company", sector: "Energy" },
  { symbol: "ONGC.NS", name: "ONGC", kind: "company", sector: "Energy" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", kind: "company", sector: "Banking" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", kind: "company", sector: "Banking" },
  { symbol: "SBIN.NS", name: "SBI", kind: "company", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys", kind: "company", sector: "Technology" },
  { symbol: "TCS.NS", name: "TCS", kind: "company", sector: "Technology" },
  { symbol: "WIPRO.NS", name: "Wipro", kind: "company", sector: "Technology" },
  { symbol: "AAPL", name: "Apple", kind: "company", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft", kind: "company", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet", kind: "company", sector: "Technology" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", kind: "company", sector: "Automobile" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", kind: "company", sector: "Automobile" },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", kind: "company", sector: "Automobile" },
  { symbol: "TSLA", name: "Tesla", kind: "company", sector: "Automobile" },
  { symbol: "ITC.NS", name: "ITC", kind: "company", sector: "Consumer" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", kind: "company", sector: "Consumer" },
  { symbol: "AMZN", name: "Amazon", kind: "company", sector: "Consumer" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharma", kind: "company", sector: "Healthcare" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", kind: "company", sector: "Telecom" },
  { symbol: "NETWORK18.NS", name: "Network18", kind: "company", sector: "Media" },
  { symbol: "NYT", name: "New York Times", kind: "company", sector: "Media" }
];

let snapshotPromise;
let lastForcedSnapshotAt = 0;
let snapshotLoadedAt = 0;

const normaliseSymbol = (symbol) => String(symbol || "").trim().toUpperCase();

const getStorage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch (error) {
    return null;
  }
};

const readCache = (key) => {
  try {
    const raw = getStorage()?.getItem(`${CACHE_PREFIX}.${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    getStorage()?.setItem(`${CACHE_PREFIX}.${key}`, JSON.stringify({
      data,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    // Storage can be disabled or full; the scheduled snapshot remains available.
  }
};

const loadScheduledSnapshot = async (force = false) => {
  const now = Date.now();
  if (force && now - lastForcedSnapshotAt > 1000) {
    snapshotPromise = undefined;
    lastForcedSnapshotAt = now;
  }
  if (!force && snapshotPromise && now - snapshotLoadedAt >= SNAPSHOT_RECHECK_MS) {
    snapshotPromise = undefined;
  }
  if (!snapshotPromise) {
    const separator = SNAPSHOT_URL.includes("?") ? "&" : "?";
    const requestUrl = force ? `${SNAPSHOT_URL}${separator}refresh=${now}` : SNAPSHOT_URL;
    snapshotPromise = fetch(requestUrl, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Snapshot request failed (${response.status})`);
        snapshotLoadedAt = Date.now();
        return response.json();
      })
      .catch((error) => {
        snapshotPromise = undefined;
        throw error;
      });
  }
  return snapshotPromise;
};

const withMeta = (data, meta) => ({
  ...data,
  __dataMeta: meta
});

const timestampValue = (value) => {
  const parsed = new Date(value || 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const fallbackError = (message, originalError) => {
  const error = new Error(message, { cause: originalError });
  error.response = { data: { message } };
  return error;
};

const requestWithFallback = async ({ cacheKey, liveRequest, selectSnapshot, isUsable, unavailableMessage, refreshSnapshot = false }) => {
  try {
    const data = await liveRequest();
    if (!isUsable(data)) throw new Error("The live endpoint returned an incomplete market payload.");
    writeCache(cacheKey, data);
    return withMeta(data, {
      mode: "live",
      source: data.source || "FinTrack cloud backend",
      fetchedAt: data.generatedAt || data.dataAsOf || new Date().toISOString()
    });
  } catch (liveError) {
    const cached = readCache(cacheKey);
    let snapshot;
    let snapshotData;

    try {
      snapshot = await loadScheduledSnapshot(refreshSnapshot);
      snapshotData = selectSnapshot(snapshot);
      if (snapshotData && !isUsable(snapshotData)) snapshotData = null;
    } catch (snapshotError) {
      snapshot = null;
    }

    const cacheTimestamp = timestampValue(cached?.savedAt);
    const snapshotTimestamp = timestampValue(snapshot?.generatedAt);
    if (cached?.data && isUsable(cached.data) && (!snapshotData || cacheTimestamp >= snapshotTimestamp)) {
      return withMeta(cached.data, {
        mode: "browser-cache",
        source: cached.data.source || "Last successful backend response",
        fetchedAt: cached.savedAt,
        fallbackReason: "The live backend did not respond."
      });
    }

    if (snapshotData) {
      return withMeta(snapshotData, {
        mode: "scheduled-snapshot",
        source: snapshot.source || "Yahoo Finance via scheduled GitHub refresh",
        fetchedAt: snapshot.generatedAt,
        fallbackReason: "The live backend did not respond."
      });
    }

    throw fallbackError(unavailableMessage, liveError);
  }
};

const getLive = async (url, params, timeout = REQUEST_TIMEOUT_MS) => {
  const response = await marketApi.get(url, {
    params,
    timeout: isHostedBackend ? Math.max(timeout, HOSTED_LIVE_TIMEOUT_MS) : timeout
  });
  return response.data;
};

const isFiniteNumber = (value) => value !== null && value !== undefined && Number.isFinite(Number(value));
const hasAvailableQuotes = (items) => Array.isArray(items) && items.some((item) => item?.status === "available" && isFiniteNumber(item.price));
const validOverview = (data) => hasAvailableQuotes(data?.markets) && Number(data?.availableMarkets) > 0;
const validFactors = (data) => hasAvailableQuotes(data?.factors);
const validBreadth = (data) => Number(data?.coverageCount) > 0 && Array.isArray(data?.topGainers) && Array.isArray(data?.topLosers);
const validAnalysis = (data) => Boolean(data?.symbol && data?.name && data?.outlook && isFiniteNumber(data?.probabilityUp) && data?.history?.length);
const validCompany = (data) => Boolean(data?.symbol && data?.name && isFiniteNumber(data?.quote?.price) && data?.history?.length);
const validNews = (data) => Array.isArray(data?.articles) && Boolean(data?.generatedAt);

const overviewFromSnapshot = (snapshot) => {
  const overview = snapshot?.overview;
  if (!overview || overview.watchlist?.length) return overview;
  const indices = new Map((overview.markets || []).map((item) => [item.symbol, item]));
  const companies = snapshot.companies || {};
  const watchlist = MARKET_BOARD.map((definition) => {
    const company = companies[definition.symbol];
    const quote = indices.get(definition.symbol) || company?.quote;
    return quote ? { ...quote, symbol: definition.symbol, name: definition.name, kind: definition.kind, sector: definition.sector } : null;
  }).filter(Boolean);
  return { ...overview, watchlist };
};

// A public GitHub Pages visit must not render an empty market workspace while
// Render wakes from sleep. Return the last verified browser data (or the
// bundled scheduled snapshot) immediately; callers can refresh the live
// endpoint in the background and replace it when it arrives.
export const getMarketOverviewPreview = async () => {
  const cached = readCache("overview");
  if (cached?.data && validOverview(cached.data)) {
    return withMeta(cached.data, {
      mode: "browser-cache",
      source: cached.data.source || "Last successful backend response",
      fetchedAt: cached.savedAt
    });
  }

  const snapshot = await loadScheduledSnapshot();
  const data = overviewFromSnapshot(snapshot);
  if (!validOverview(data)) throw new Error("The scheduled market snapshot is incomplete.");
  return withMeta(data, {
    mode: "scheduled-snapshot",
    source: snapshot.source || "Yahoo Finance via scheduled GitHub refresh",
    fetchedAt: snapshot.generatedAt
  });
};

export const getGlobalMarketOverview = (refresh = false) => requestWithFallback({
    cacheKey: "overview",
    liveRequest: () => getLive("/market/overview", { refresh }, QUOTE_REQUEST_TIMEOUT_MS),
    selectSnapshot: overviewFromSnapshot,
    isUsable: validOverview,
    unavailableMessage: "Market overview is temporarily unavailable from both the live API and the scheduled snapshot.",
    refreshSnapshot: refresh
  });

export const getMarketAnalysis = (symbol, refresh = false) => {
  const cleaned = normaliseSymbol(symbol);
  return requestWithFallback({
    cacheKey: `analysis.${cleaned}`,
    liveRequest: () => getLive("/market/analysis", { symbol: cleaned, refresh }),
    selectSnapshot: (snapshot) => snapshot.analyses?.[cleaned],
    isUsable: validAnalysis,
    unavailableMessage: `Live analysis for ${cleaned || "this symbol"} is unavailable and it is not included in the scheduled interview snapshot.`,
    refreshSnapshot: refresh
  });
};

export const getMarketFactors = (refresh = false) => requestWithFallback({
  cacheKey: "factors",
  liveRequest: () => getLive("/market/factors", { refresh }),
  selectSnapshot: (snapshot) => snapshot.factors,
  isUsable: validFactors,
  unavailableMessage: "Macro factor data is temporarily unavailable.",
  refreshSnapshot: refresh
});

export const getMarketBreadth = (refresh = false) => requestWithFallback({
  cacheKey: "breadth",
  liveRequest: () => getLive("/market/breadth", { refresh }),
  selectSnapshot: (snapshot) => snapshot.breadth,
  isUsable: validBreadth,
  unavailableMessage: "India market breadth is temporarily unavailable.",
  refreshSnapshot: refresh
});

export const getCompanyResearch = (symbol, refresh = false) => {
  const cleaned = normaliseSymbol(symbol);
  return requestWithFallback({
    cacheKey: `company.${cleaned}`,
    liveRequest: () => getLive("/market/company", { symbol: cleaned, refresh }),
    selectSnapshot: (snapshot) => snapshot.companies?.[cleaned],
    isUsable: validCompany,
    unavailableMessage: `Live company research for ${cleaned || "this symbol"} is unavailable and it is not included in the scheduled interview snapshot.`,
    refreshSnapshot: refresh
  });
};

export const getMarketNewsFeed = (refresh = false) => requestWithFallback({
  cacheKey: "news-feed",
  liveRequest: () => getLive("/market/news-feed", { refresh }),
  selectSnapshot: (snapshot) => snapshot.newsFeed,
  isUsable: validNews,
  unavailableMessage: "Current market headlines are temporarily unavailable.",
  refreshSnapshot: refresh
});

const strongestDrivers = (analysis) => [...(analysis?.macroFactor?.factors || [])]
  .sort((left, right) => Math.abs(Number(right.scoreContribution || 0)) - Math.abs(Number(left.scoreContribution || 0)))
  .slice(0, 2);

const buildSnapshotAgentAnswer = (message, symbol, snapshot) => {
  const cleaned = normaliseSymbol(symbol) || "^NSEI";
  const analysis = snapshot.analyses?.[cleaned] || snapshot.analyses?.["^NSEI"];
  if (!analysis) throw new Error("No scheduled analysis is available.");

  const lowered = message.toLowerCase();
  const asOf = new Date(analysis.dataAsOf || snapshot.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  if (/gainer|loser|breadth|advance|decline/.test(lowered)) {
    const gainers = (snapshot.breadth?.topGainers || []).slice(0, 3).map((item) => `${item.name} ${Number(item.changePercent) >= 0 ? "+" : ""}${item.changePercent}%`).join(", ");
    const losers = (snapshot.breadth?.topLosers || []).slice(0, 3).map((item) => `${item.name} ${item.changePercent}%`).join(", ");
    return `Scheduled market snapshot (${asOf}) ke hisaab se:\n- Breadth: ${snapshot.breadth?.advances || 0} advances, ${snapshot.breadth?.declines || 0} declines, ${snapshot.breadth?.unchanged || 0} flat.\n- Top gainers: ${gainers || "data unavailable"}.\n- Top losers: ${losers || "data unavailable"}.\n- Ye representative watchlist hai, poora NSE universe nahi.`;
  }

  if (/world|global|indices|index/.test(lowered)) {
    const markets = (snapshot.overview?.markets || []).filter((item) => item.status === "available").slice(0, 6)
      .map((item) => `${item.name} ${Number(item.changePercent) >= 0 ? "+" : ""}${item.changePercent}%`).join(", ");
    return `Scheduled snapshot (${asOf}) me major markets: ${markets}.\n- Isse global risk mood ka signal milta hai, lekin next-session direction guarantee nahi hoti.\n- Live backend unavailable hai, isliye ye latest scheduled evidence hai.`;
  }

  const drivers = strongestDrivers(analysis);
  const driverText = drivers.map((item) => `${item.factor} (${Number(item.changePercent) >= 0 ? "+" : ""}${item.changePercent}%): ${item.reason}`).join("\n- ");
  const accuracy = Number(analysis.model?.backtestAccuracy || 0);
  return `${analysis.name} ka scheduled evidence (${asOf}):\n- Outlook ${analysis.outlook}; probability up ${analysis.probabilityUp}%.\n- Main factors: ${driverText || "factor data unavailable"}.\n- Historical holdout accuracy ${accuracy}% (${analysis.model?.quality || "unknown"}); ${accuracy < 53 ? "model ke paas reliable directional edge nahi hai." : "signal ko risk controls ke saath dekhein."}\n- Live LLM/backend unavailable hai. Ye verified analytics fallback hai, buy/sell advice nahi.`;
};

export const askMarketAgent = async ({ message, symbol, recentMessages = [] }) => {
  try {
    const response = await marketApi.post("/market/agent", {
      message,
      symbol,
      recentMessages: recentMessages.map(({ role, content }) => ({ role, content }))
    }, { timeout: AGENT_REQUEST_TIMEOUT_MS });
    return response.data;
  } catch (liveError) {
    try {
      const snapshot = await loadScheduledSnapshot();
      return {
        answer: buildSnapshotAgentAnswer(message, symbol, snapshot),
        symbol: normaliseSymbol(symbol) || "^NSEI",
        llmUsed: false,
        llmProvider: "scheduled-snapshot",
        llmStatus: "offline",
        toolsUsed: ["scheduled_market_snapshot", "technical_prediction", "macro_market_factors"],
        usedLiveContext: false,
        suggestedQuestions: ["Top gainers aur losers batao", "Compare major global indices"]
      };
    } catch (snapshotError) {
      throw fallbackError("Market agent and scheduled analytics are temporarily unavailable.", liveError);
    }
  }
};

export const resetMarketFallbackStateForTests = () => {
  snapshotPromise = undefined;
  lastForcedSnapshotAt = 0;
  snapshotLoadedAt = 0;
};
