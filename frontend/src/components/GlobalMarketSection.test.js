import { buildMarketAlerts } from "./GlobalMarketSection";

const quote = (symbol, name, changePercent, kind = "company") => ({
  symbol,
  name,
  changePercent,
  kind,
  status: "available"
});

test("classifies material index and company moves without flagging normal noise", () => {
  const alerts = buildMarketAlerts([
    quote("^N225", "Nikkei 225", -3.1, "index"),
    quote("INFY.NS", "Infosys", -2.2),
    quote("AAPL", "Apple", 3.4),
    quote("MSFT", "Microsoft", 0.7)
  ]);

  expect(alerts.map(({ id }) => id)).toEqual([
    "^N225:critical",
    "INFY.NS:warning",
    "AAPL:upside"
  ]);
});

test("ignores unavailable, missing and duplicate quotes", () => {
  const alerts = buildMarketAlerts([
    quote("TSLA", "Tesla", -5.2),
    quote("TSLA", "Tesla duplicate", -6.5),
    { ...quote("NYT", "New York Times", -8), status: "unavailable" },
    { symbol: "AMZN", name: "Amazon", status: "available" }
  ]);

  expect(alerts).toHaveLength(1);
  expect(alerts[0].id).toBe("TSLA:critical");
});
