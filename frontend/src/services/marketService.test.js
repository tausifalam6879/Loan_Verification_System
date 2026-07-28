import api from "../api/axiosConfig";
import {
  askMarketAgent,
  getCompanyResearch,
  getGlobalMarketOverview,
  getMarketAnalysis,
  resetMarketFallbackStateForTests
} from "./marketService";

jest.mock("../api/axiosConfig", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

const snapshot = {
  generatedAt: "2026-07-27T16:00:00Z",
  source: "Yahoo Finance via scheduled GitHub refresh",
  overview: {
    markets: [{ symbol: "^NSEI", name: "Nifty 50", status: "available", price: 23995.95, changePercent: 0.96 }],
    availableMarkets: 1,
    totalMarkets: 1
  },
  breadth: {
    advances: 13,
    declines: 2,
    unchanged: 1,
    topGainers: [{ name: "Infosys", changePercent: 3.68 }],
    topLosers: [{ name: "ONGC", changePercent: -4.1 }]
  },
  analyses: {
    "^NSEI": {
      symbol: "^NSEI",
      name: "Nifty 50",
      outlook: "NEUTRAL",
      probabilityUp: 51.8,
      dataAsOf: "2026-07-27T00:00:00+05:30",
      model: { backtestAccuracy: 50.5, quality: "weak" },
      history: [{ date: "2026-07-27", close: 23995.95 }],
      macroFactor: {
        factors: [{ factor: "Crude Oil", changePercent: -7.36, scoreContribution: 1.3, reason: "Lower crude can ease India's import pressure." }]
      }
    }
  },
  companies: {
    "RELIANCE.NS": {
      symbol: "RELIANCE.NS",
      name: "Reliance Industries Limited",
      quote: { price: 1280 },
      history: [{ date: "2026-07-27", close: 1280 }]
    }
  }
};

beforeEach(() => {
  localStorage.clear();
  resetMarketFallbackStateForTests();
  api.get.mockRejectedValue(new Error("backend offline"));
  api.post.mockRejectedValue(new Error("backend offline"));
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => snapshot
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("uses the scheduled market snapshot when the cloud backend is unavailable", async () => {
  const result = await getGlobalMarketOverview();

  expect(result.availableMarkets).toBe(1);
  expect(result.markets[0].price).toBe(23995.95);
  expect(result.watchlist.map((item) => item.symbol)).toEqual(["RELIANCE.NS", "^NSEI"]);
  expect(result.watchlist[0].kind).toBe("company");
  expect(result.__dataMeta.mode).toBe("scheduled-snapshot");
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/data/market-snapshot.json"), { cache: "no-store" });
});

test("downloads a newer scheduled snapshot when refresh is requested", async () => {
  const newerSnapshot = {
    ...snapshot,
    generatedAt: "2026-07-27T17:00:00Z",
    overview: {
      ...snapshot.overview,
      markets: [{ ...snapshot.overview.markets[0], price: 24025.5 }]
    }
  };
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => snapshot })
    .mockResolvedValueOnce({ ok: true, json: async () => newerSnapshot });

  const first = await getGlobalMarketOverview();
  const refreshed = await getGlobalMarketOverview(true);

  expect(first.markets[0].price).toBe(23995.95);
  expect(refreshed.markets[0].price).toBe(24025.5);
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch.mock.calls[1][0]).toContain("refresh=");
});

test("returns scheduled ML evidence instead of an empty analysis", async () => {
  const result = await getMarketAnalysis("^nsei");

  expect(result.outlook).toBe("NEUTRAL");
  expect(result.model.backtestAccuracy).toBe(50.5);
  expect(result.__dataMeta.mode).toBe("scheduled-snapshot");
});

test("rejects an incomplete HTTP 200 company payload and uses the valid snapshot", async () => {
  api.get.mockResolvedValueOnce({ data: { symbol: "RELIANCE.NS", quote: {} } });

  const result = await getCompanyResearch("RELIANCE.NS");

  expect(result.name).toBe("Reliance Industries Limited");
  expect(result.quote.price).toBe(1280);
  expect(result.__dataMeta.mode).toBe("scheduled-snapshot");
});

test("returns a clearly labelled analytics answer when the LLM backend is offline", async () => {
  const result = await askMarketAgent({
    message: "Kal Nifty ko kaun se factors affect kar sakte hain?",
    symbol: "^NSEI"
  });

  expect(result.llmUsed).toBe(false);
  expect(result.llmStatus).toBe("offline");
  expect(result.answer).toContain("verified analytics fallback");
  expect(result.answer).toContain("Crude Oil");
});
