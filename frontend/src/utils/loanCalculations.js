export const calculateEmi = (principal, annualRate, months) => {
  const amount = Number(principal || 0);
  const rate = Number(annualRate || 0) / 12 / 100;
  const tenure = Number(months || 0);

  if (!amount || !tenure) {
    return 0;
  }

  if (!rate) {
    return Math.round(amount / tenure);
  }

  const emi =
    (amount * rate * Math.pow(1 + rate, tenure)) /
    (Math.pow(1 + rate, tenure) - 1);

  return Math.round(emi);
};

export const calculateCreditBand = (score) => {
  const numericScore = Number(score || 0);

  if (numericScore >= 760) {
    return {
      label: "Excellent",
      color: "#10b981",
      message: "High approval chance with strong rates."
    };
  }

  if (numericScore >= 700) {
    return {
      label: "Good",
      color: "#2563eb",
      message: "Good approval chance, compare banks for best EMI."
    };
  }

  if (numericScore >= 620) {
    return {
      label: "Fair",
      color: "#f59e0b",
      message: "Approval possible, but rate may be higher."
    };
  }

  return {
    label: "Needs Improvement",
    color: "#ef4444",
    message: "Improve repayment history before applying."
  };
};

export const runFraudRiskCheck = ({
  creditScore,
  monthlyIncome,
  requestedAmount,
  identityMismatch,
  failedAttempts,
  deviceRisk
}) => {
  let score = 12;
  const reasons = [];

  if (Number(creditScore) < 620) {
    score += 24;
    reasons.push("Low credit score");
  }

  if (Number(requestedAmount) > Number(monthlyIncome) * 18) {
    score += 22;
    reasons.push("Requested amount is high versus income");
  }

  if (identityMismatch) {
    score += 30;
    reasons.push("KYC identity mismatch");
  }

  if (Number(failedAttempts) >= 3) {
    score += 18;
    reasons.push("Repeated failed verification attempts");
  }

  if (deviceRisk === "high") {
    score += 20;
    reasons.push("Suspicious device or network pattern");
  }

  const finalScore = Math.min(score, 100);

  if (finalScore >= 70) {
    return {
      score: finalScore,
      level: "High Risk",
      color: "#ef4444",
      action: "Block auto-approval and send to manual fraud review.",
      reasons
    };
  }

  if (finalScore >= 40) {
    return {
      score: finalScore,
      level: "Medium Risk",
      color: "#f59e0b",
      action: "Ask for additional documents and OTP re-verification.",
      reasons
    };
  }

  return {
    score: finalScore,
    level: "Low Risk",
    color: "#10b981",
    action: "Eligible for normal loan workflow.",
    reasons: reasons.length ? reasons : ["No major fraud signals found"]
  };
};
