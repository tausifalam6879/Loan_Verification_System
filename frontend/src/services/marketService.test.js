import api from "../api/axiosConfig";
import {
  askMarketAgent,
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
      macroFactor: {
        factors: [{ factor: "Crude Oil", changePercent: -7.36, scoreContribution: 1.3, reason: "Lower crude can ease India's import pressure." }]
      }
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
  expect(result.__dataMeta.mode).toBe("scheduled-snapshot");
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/data/market-snapshot.json"), { cache: "no-store" });
});

test("returns scheduled ML evidence instead of an empty analysis", async () => {
  const result = await getMarketAnalysis("^nsei");

  expect(result.outlook).toBe("NEUTRAL");
  expect(result.model.backtestAccuracy).toBe(50.5);
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
