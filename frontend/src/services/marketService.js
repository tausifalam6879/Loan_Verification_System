import api from "../api/axiosConfig";

const REQUEST_TIMEOUT_MS = 8000;
const CACHE_PREFIX = "fintrack.market.v2";
const SNAPSHOT_URL = `${process.env.PUBLIC_URL || ""}/data/market-snapshot.json`;

let snapshotPromise;

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

const loadScheduledSnapshot = async () => {
  if (!snapshotPromise) {
    snapshotPromise = fetch(SNAPSHOT_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Snapshot request failed (${response.status})`);
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

const requestWithFallback = async ({ cacheKey, liveRequest, selectSnapshot, unavailableMessage }) => {
  try {
    const data = await liveRequest();
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
      snapshot = await loadScheduledSnapshot();
      snapshotData = selectSnapshot(snapshot);
    } catch (snapshotError) {
      snapshot = null;
    }

    const cacheTimestamp = timestampValue(cached?.savedAt);
    const snapshotTimestamp = timestampValue(snapshot?.generatedAt);
    if (cached?.data && (!snapshotData || cacheTimestamp >= snapshotTimestamp)) {
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

const getLive = async (url, params) => {
  const response = await api.get(url, { params, timeout: REQUEST_TIMEOUT_MS });
  return response.data;
};

export const getGlobalMarketOverview = (refresh = false) => requestWithFallback({
  cacheKey: "overview",
  liveRequest: () => getLive("/market/overview", { refresh }),
  selectSnapshot: (snapshot) => snapshot.overview,
  unavailableMessage: "Market overview is temporarily unavailable from both the live API and the scheduled snapshot."
});

export const getMarketAnalysis = (symbol, refresh = false) => {
  const cleaned = normaliseSymbol(symbol);
  return requestWithFallback({
    cacheKey: `analysis.${cleaned}`,
    liveRequest: () => getLive("/market/analysis", { symbol: cleaned, refresh }),
    selectSnapshot: (snapshot) => snapshot.analyses?.[cleaned],
    unavailableMessage: `Live analysis for ${cleaned || "this symbol"} is unavailable and it is not included in the scheduled interview snapshot.`
  });
};

export const getMarketFactors = (refresh = false) => requestWithFallback({
  cacheKey: "factors",
  liveRequest: () => getLive("/market/factors", { refresh }),
  selectSnapshot: (snapshot) => snapshot.factors,
  unavailableMessage: "Macro factor data is temporarily unavailable."
});

export const getMarketBreadth = (refresh = false) => requestWithFallback({
  cacheKey: "breadth",
  liveRequest: () => getLive("/market/breadth", { refresh }),
  selectSnapshot: (snapshot) => snapshot.breadth,
  unavailableMessage: "India market breadth is temporarily unavailable."
});

export const getCompanyResearch = (symbol, refresh = false) => {
  const cleaned = normaliseSymbol(symbol);
  return requestWithFallback({
    cacheKey: `company.${cleaned}`,
    liveRequest: () => getLive("/market/company", { symbol: cleaned, refresh }),
    selectSnapshot: (snapshot) => snapshot.companies?.[cleaned],
    unavailableMessage: `Live company research for ${cleaned || "this symbol"} is unavailable and it is not included in the scheduled interview snapshot.`
  });
};

export const getMarketNewsFeed = (refresh = false) => requestWithFallback({
  cacheKey: "news-feed",
  liveRequest: () => getLive("/market/news-feed", { refresh }),
  selectSnapshot: (snapshot) => snapshot.newsFeed,
  unavailableMessage: "Current market headlines are temporarily unavailable."
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
    const response = await api.post("/market/agent", {
      message,
      symbol,
      recentMessages: recentMessages.map(({ role, content }) => ({ role, content }))
    }, { timeout: REQUEST_TIMEOUT_MS });
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
};
