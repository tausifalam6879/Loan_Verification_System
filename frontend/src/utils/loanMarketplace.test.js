import {
  calculateOfferMetrics,
  evaluateOfferEligibility,
  filterAndSortLoanOffers,
  processingFeePercent
} from "./loanMarketplace";

const offer = {
  id: 1,
  interestRate: 10,
  minAmount: 50000,
  maxAmount: 1000000,
  minTenureMonths: 12,
  maxTenureMonths: 60,
  minCreditScore: 700,
  processingFeePercent: 1,
  active: true,
  loanType: { slug: "personal" }
};

describe("loan marketplace intelligence", () => {
  test("handles the initial state before an offer is selected", () => {
    expect(processingFeePercent(null)).toBe(0);
    expect(calculateOfferMetrics(null, 100000, 12).processingFee).toBe(99);
  });

  test("calculates transparent loan cost", () => {
    const metrics = calculateOfferMetrics(offer, 500000, 48);
    expect(metrics.emi).toBeGreaterThan(0);
    expect(metrics.totalInterest).toBeGreaterThan(0);
    expect(metrics.processingFee).toBe(5000);
  });

  test("explains why an offer is not eligible", () => {
    const result = evaluateOfferEligibility(offer, { amount: 1200000, tenureMonths: 72, creditScore: 650 });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(3);
  });

  test("ranks eligible offers before review offers", () => {
    const strictOffer = { ...offer, id: 2, interestRate: 8, minCreditScore: 800 };
    const rows = filterAndSortLoanOffers([strictOffer, offer], {
      loanType: "personal",
      amount: 500000,
      tenureMonths: 48,
      creditScore: 735,
      sortBy: "match"
    });
    expect(rows[0].offer.id).toBe(1);
    expect(rows[0].eligibility.eligible).toBe(true);
  });
});
