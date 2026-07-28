const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Math.round(safeNumber(value));

export const calculateFdProjection = ({
  principal,
  annualRate,
  years,
  taxRate = 0,
  compoundsPerYear = 4
}) => {
  const safePrincipal = Math.max(0, safeNumber(principal));
  const safeRate = Math.max(0, safeNumber(annualRate)) / 100;
  const safeYears = Math.max(0, safeNumber(years));
  const frequency = Math.max(1, safeNumber(compoundsPerYear, 4));
  const maturity = safePrincipal * Math.pow(1 + safeRate / frequency, frequency * safeYears);
  const interest = Math.max(0, maturity - safePrincipal);
  const estimatedTax = interest * (Math.min(100, Math.max(0, safeNumber(taxRate))) / 100);

  return {
    principal: roundMoney(safePrincipal),
    maturity: roundMoney(maturity),
    interest: roundMoney(interest),
    estimatedTax: roundMoney(estimatedTax),
    postTaxMaturity: roundMoney(maturity - estimatedTax)
  };
};

const futureValueOfMonthlySip = (monthlyAmount, annualRate, months) => {
  const monthlyRate = Math.max(0, safeNumber(annualRate)) / 1200;
  if (monthlyRate === 0) return monthlyAmount * months;
  return monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
};

export const calculateSipProjection = ({ monthlyAmount, annualRate, years }) => {
  const monthly = Math.max(0, safeNumber(monthlyAmount));
  const months = Math.max(0, Math.round(safeNumber(years) * 12));
  const baseRate = Math.max(0, safeNumber(annualRate));
  const invested = monthly * months;
  const lowRate = Math.max(2, baseRate - 3);
  const highRate = baseRate + 3;
  const low = futureValueOfMonthlySip(monthly, lowRate, months);
  const projected = futureValueOfMonthlySip(monthly, baseRate, months);
  const high = futureValueOfMonthlySip(monthly, highRate, months);

  return {
    invested: roundMoney(invested),
    projected: roundMoney(projected),
    estimatedGain: roundMoney(Math.max(0, projected - invested)),
    low: roundMoney(low),
    high: roundMoney(high),
    lowRate,
    baseRate,
    highRate,
    months
  };
};

export const recommendFundCategory = ({ risk, years }) => {
  const horizon = safeNumber(years);
  if (horizon <= 1) return "Liquid Fund";
  if (risk === "Low") return "Short Duration Debt Fund";
  if (risk === "High" && horizon >= 5) return "Index / Flexi Cap Equity Fund";
  return "Hybrid Fund";
};

export const getInvestmentFit = ({ goal, risk, years }) => {
  const horizon = safeNumber(years);
  if (goal === "Emergency fund") {
    return {
      label: "Liquidity first",
      detail: "Emergency money should remain easy to access. Compare sweep-in FD and liquid-fund risks before locking it."
    };
  }
  if (horizon <= 2 || risk === "Low") {
    return {
      label: "Stability focused",
      detail: "The selected horizon or risk preference favours predictable returns over aggressive market exposure."
    };
  }
  if (horizon >= 5 && risk === "High") {
    return {
      label: "Long-horizon growth",
      detail: "A long horizon can absorb more volatility, but SIP outcomes remain market linked and are never guaranteed."
    };
  }
  return {
    label: "Balanced comparison",
    detail: "Compare the FD certainty with the SIP projection range, liquidity needs and your ability to handle volatility."
  };
};

export const formatIndianCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(safeNumber(value));
