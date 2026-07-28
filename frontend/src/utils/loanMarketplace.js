import { calculateEmi } from "./loanCalculations";

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const processingFeePercent = (offer = {}) => {
  const safeOffer = offer || {};
  if (safeOffer.processingFeePercent != null) return number(safeOffer.processingFeePercent, 0.5);
  const match = String(safeOffer.processingFee || "").match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? number(match[1], 0.5) : 0;
};

export const calculateOfferMetrics = (offer, amount, tenureMonths) => {
  const principal = number(amount);
  const tenure = Math.max(1, number(tenureMonths, offer?.minTenureMonths || 12));
  const emi = calculateEmi(principal, offer?.interestRate, tenure);
  const totalPayable = emi * tenure;
  const totalInterest = Math.max(0, totalPayable - principal);
  const feePercent = processingFeePercent(offer);
  const processingFee = Math.max(99, Math.round(principal * feePercent / 100));

  return { emi, totalPayable, totalInterest, processingFee, feePercent };
};

export const evaluateOfferEligibility = (offer, { amount, tenureMonths, creditScore }) => {
  const reasons = [];
  const requestedAmount = number(amount);
  const tenure = number(tenureMonths);
  const score = number(creditScore);
  const minimumAmount = number(offer?.minAmount, 25000);

  if (requestedAmount < minimumAmount) reasons.push(`Minimum amount is Rs. ${minimumAmount.toLocaleString("en-IN")}`);
  if (requestedAmount > number(offer?.maxAmount)) reasons.push("Amount exceeds lender limit");
  if (tenure < number(offer?.minTenureMonths)) reasons.push("Tenure is below lender minimum");
  if (tenure > number(offer?.maxTenureMonths)) reasons.push("Tenure exceeds lender maximum");
  if (score < number(offer?.minCreditScore, 300)) reasons.push("Credit score is below lender requirement");

  return { eligible: reasons.length === 0, reasons };
};

export const filterAndSortLoanOffers = (offers = [], criteria = {}) => {
  const { loanType = "all", amount, tenureMonths, creditScore, sortBy = "match" } = criteria;
  const rows = offers
    .filter((offer) => offer.active !== false)
    .filter((offer) => loanType === "all" || offer.loanType?.slug === loanType)
    .map((offer) => ({
      offer,
      eligibility: evaluateOfferEligibility(offer, { amount, tenureMonths, creditScore }),
      metrics: calculateOfferMetrics(offer, amount, tenureMonths)
    }));

  return rows.sort((left, right) => {
    if (sortBy === "rate") return number(left.offer.interestRate) - number(right.offer.interestRate);
    if (sortBy === "emi") return left.metrics.emi - right.metrics.emi;
    if (sortBy === "total") return left.metrics.totalPayable - right.metrics.totalPayable;
    if (left.eligibility.eligible !== right.eligibility.eligible) return left.eligibility.eligible ? -1 : 1;
    return number(left.offer.interestRate) - number(right.offer.interestRate);
  });
};
