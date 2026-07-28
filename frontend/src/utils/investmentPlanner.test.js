import {
  calculateFdProjection,
  calculateSipProjection,
  getInvestmentFit,
  recommendFundCategory
} from "./investmentPlanner";

test("calculates FD maturity, interest and post-tax estimate", () => {
  const result = calculateFdProjection({
    principal: 100000,
    annualRate: 7,
    years: 3,
    taxRate: 10
  });

  expect(result.principal).toBe(100000);
  expect(result.maturity).toBeGreaterThan(120000);
  expect(result.interest).toBe(result.maturity - result.principal);
  expect(result.postTaxMaturity).toBeLessThan(result.maturity);
});

test("calculates an ordered SIP projection range", () => {
  const result = calculateSipProjection({ monthlyAmount: 5000, annualRate: 12, years: 5 });

  expect(result.invested).toBe(300000);
  expect(result.low).toBeLessThan(result.projected);
  expect(result.projected).toBeLessThan(result.high);
  expect(result.estimatedGain).toBeGreaterThan(0);
});

test("matches broad fund categories and planning guidance to horizon and risk", () => {
  expect(recommendFundCategory({ risk: "High", years: 7 })).toBe("Index / Flexi Cap Equity Fund");
  expect(recommendFundCategory({ risk: "Low", years: 3 })).toBe("Short Duration Debt Fund");
  expect(getInvestmentFit({ goal: "Emergency fund", risk: "Moderate", years: 3 }).label).toBe("Liquidity first");
});
