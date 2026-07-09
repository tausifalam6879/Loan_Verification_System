const CATEGORY_TRAINING = {
  Food: [
    "zomato dinner",
    "swiggy order",
    "restaurant lunch",
    "tea coffee",
    "grocery vegetables",
    "dominos pizza",
    "canteen meal",
    "breakfast snacks"
  ],
  Travel: [
    "uber ride",
    "ola cab",
    "metro recharge",
    "train ticket",
    "bus pass",
    "petrol fuel",
    "flight booking",
    "parking toll"
  ],
  Bills: [
    "jio recharge",
    "electricity bill",
    "wifi broadband",
    "mobile postpaid",
    "water bill",
    "gas cylinder",
    "credit card payment",
    "rent emi insurance"
  ],
  Shopping: [
    "amazon order",
    "flipkart shopping",
    "myntra clothes",
    "shoes purchase",
    "electronics mobile",
    "mall purchase",
    "gift purchase",
    "household items"
  ],
  Health: [
    "doctor visit",
    "medicine pharmacy",
    "hospital bill",
    "health checkup",
    "clinic consultation",
    "lab test",
    "medical insurance",
    "dental care"
  ],
  Entertainment: [
    "movie ticket",
    "netflix subscription",
    "spotify premium",
    "game purchase",
    "concert ticket",
    "outing",
    "youtube premium",
    "hotstar subscription"
  ],
  Education: [
    "course fee",
    "book purchase",
    "exam fee",
    "udemy course",
    "college fee",
    "tuition",
    "stationery",
    "certification"
  ],
  Other: [
    "miscellaneous",
    "cash withdrawal",
    "personal expense",
    "service charge",
    "maintenance",
    "unknown payment"
  ]
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "ka",
  "ki",
  "ke",
  "ko",
  "me",
  "mein",
  "my",
  "of",
  "on",
  "the",
  "to",
  "via"
]);

const tokenize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));

const toTitleCase = (value = "") =>
  value
    .toString()
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getExpenseDate = (expense) => {
  const raw = expense?.date || expense?.createdAt;
  const parsed = raw ? new Date(raw.includes("T") ? raw : `${raw}T00:00:00`) : new Date();

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatMonth = (key) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit"
  });
};

const nextMonthKey = (key) => {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month, 1);
  return getMonthKey(date);
};

const median = (values) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const buildTokenWeights = () => {
  const tokenCounts = {};
  const documentFrequency = {};

  Object.entries(CATEGORY_TRAINING).forEach(([category, examples]) => {
    tokenCounts[category] = {};

    examples.forEach((example) => {
      const uniqueTokens = new Set(tokenize(example));
      uniqueTokens.forEach((token) => {
        documentFrequency[token] = (documentFrequency[token] || 0) + 1;
      });

      tokenize(example).forEach((token) => {
        tokenCounts[category][token] = (tokenCounts[category][token] || 0) + 1;
      });
    });
  });

  return { tokenCounts, documentFrequency };
};

const { tokenCounts, documentFrequency } = buildTokenWeights();
const trainingDocumentCount = Object.values(CATEGORY_TRAINING).flat().length;

export const expenseCategories = Object.keys(CATEGORY_TRAINING);

export const predictExpenseCategory = (description = "") => {
  const tokens = tokenize(description);

  if (!tokens.length) {
    return { category: "Other", confidence: 0, scores: [] };
  }

  const phrase = description.toLowerCase();
  const scores = expenseCategories.map((category) => {
    const examples = CATEGORY_TRAINING[category];
    const phraseScore = examples.some((example) =>
      example.split(" ").some((word) => phrase.includes(word))
    )
      ? 1.2
      : 0;

    const tokenScore = tokens.reduce((score, token) => {
      const termFrequency = tokenCounts[category][token] || 0;
      const inverseFrequency = Math.log(
        (trainingDocumentCount + 1) / ((documentFrequency[token] || 0) + 1)
      );

      return score + termFrequency * (1 + inverseFrequency);
    }, 0);

    return {
      category,
      score: tokenScore + phraseScore
    };
  });

  const sorted = scores.sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const second = sorted[1]?.score || 0;
  const confidence = top.score <= 0 ? 0 : Math.min(0.96, 0.52 + (top.score - second) / (top.score + 2));

  return {
    category: top.score > 0 ? top.category : "Other",
    confidence,
    scores: sorted
  };
};

export const analyzeExpenses = (expenses = [], totalIncome = 0) => {
  const normalizedExpenses = expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount || 0),
    category: toTitleCase(expense.category || "Other"),
    parsedDate: getExpenseDate(expense)
  }));

  const totalExpense = normalizedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotalsMap = new Map();
  const categoryMonthTotalsMap = new Map();
  const monthlyTotalsMap = new Map();

  normalizedExpenses.forEach((expense) => {
    const monthKey = getMonthKey(expense.parsedDate);
    categoryTotalsMap.set(
      expense.category,
      (categoryTotalsMap.get(expense.category) || 0) + expense.amount
    );
    monthlyTotalsMap.set(monthKey, (monthlyTotalsMap.get(monthKey) || 0) + expense.amount);

    const categoryMonthKey = `${expense.category}-${monthKey}`;
    categoryMonthTotalsMap.set(
      categoryMonthKey,
      (categoryMonthTotalsMap.get(categoryMonthKey) || 0) + expense.amount
    );
  });

  const categoryTotals = [...categoryTotalsMap.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyTotals = [...monthlyTotalsMap.entries()]
    .map(([key, amount]) => ({ key, month: formatMonth(key), amount }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const recentMonths = monthlyTotals.slice(-6);
  const recentValues = recentMonths.map((item) => item.amount);
  const latestMonth = monthlyTotals[monthlyTotals.length - 1];
  const previousMonth = monthlyTotals[monthlyTotals.length - 2];
  const latestMonthKey = latestMonth?.key || getMonthKey(new Date());
  const forecastMonthKey = nextMonthKey(latestMonthKey);
  const lastThreeAverage =
    recentValues.slice(-3).reduce((sum, value) => sum + value, 0) /
    Math.max(1, recentValues.slice(-3).length);
  const slope =
    recentValues.length > 1
      ? (recentValues[recentValues.length - 1] - recentValues[0]) / (recentValues.length - 1)
      : 0;
  const forecastAmount = Math.max(
    0,
    Math.round(lastThreeAverage * 0.72 + (recentValues[recentValues.length - 1] || 0) * 0.18 + slope * 0.1)
  );

  const categoryAmounts = normalizedExpenses.reduce((groups, expense) => {
    groups[expense.category] = groups[expense.category] || [];
    groups[expense.category].push(expense.amount);
    return groups;
  }, {});

  const anomalies = normalizedExpenses
    .map((expense) => {
      const values = categoryAmounts[expense.category] || [];
      const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
      const variance =
        values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
        Math.max(1, values.length);
      const standardDeviation = Math.sqrt(variance);
      const categoryMedian = median(values);
      const zScore = standardDeviation > 0 ? (expense.amount - average) / standardDeviation : 0;
      const threshold = Math.max(average + standardDeviation * 1.8, categoryMedian * 2.4, 1200);
      const isAnomaly = values.length >= 3 && expense.amount >= threshold && expense.amount > average * 1.7;

      return {
        ...expense,
        average,
        median: categoryMedian,
        zScore,
        severity: zScore >= 2.5 || expense.amount >= categoryMedian * 4 ? "high" : "medium",
        reason: `${expense.category} expense is higher than your usual Rs. ${Math.round(average).toLocaleString("en-IN")} pattern.`,
        isAnomaly
      };
    })
    .filter((expense) => expense.isAnomaly)
    .sort((a, b) => b.parsedDate - a.parsedDate)
    .slice(0, 5);

  const topCategory = categoryTotals[0] || { category: "No data", amount: 0, percentage: 0 };
  const latestAmount = latestMonth?.amount || 0;
  const previousAmount = previousMonth?.amount || 0;
  const monthChangePercent =
    previousAmount > 0 ? Math.round(((latestAmount - previousAmount) / previousAmount) * 100) : 0;
  const spendingRatio = totalIncome > 0 ? Math.round((latestAmount / totalIncome) * 100) : 0;
  const targetMonthlySpend = Math.round(Number(totalIncome || 0) * 0.72);
  const suggestedCut = Math.max(0, latestAmount - targetMonthlySpend);

  const recommendations = [];

  if (topCategory.amount > 0) {
    recommendations.push(
      `${topCategory.category} is your biggest category at ${topCategory.percentage}%. Set a weekly cap and review large entries first.`
    );
  }

  if (monthChangePercent > 20) {
    recommendations.push(
      `Latest month spending is ${monthChangePercent}% higher than the previous month. Reduce discretionary spends by Rs. ${Math.round((latestAmount - previousAmount) * 0.35).toLocaleString("en-IN")} to cool it down.`
    );
  }

  if (forecastAmount > targetMonthlySpend && totalIncome > 0) {
    recommendations.push(
      `Next month may reach Rs. ${forecastAmount.toLocaleString("en-IN")}. Keep expenses under Rs. ${targetMonthlySpend.toLocaleString("en-IN")} to protect savings.`
    );
  }

  if (anomalies.length > 0) {
    recommendations.push(
      `Review ${anomalies[0].category} transaction of Rs. ${anomalies[0].amount.toLocaleString("en-IN")} because it looks unusual for your history.`
    );
  }

  if (suggestedCut > 0) {
    recommendations.push(
      `To keep a healthier savings buffer, reduce around Rs. ${suggestedCut.toLocaleString("en-IN")} this month.`
    );
  }

  if (!recommendations.length) {
    recommendations.push("Your current spending pattern looks controlled. Keep tracking daily entries for stronger forecasts.");
  }

  const categoryTrends = categoryTotals.slice(0, 6).map((item) => {
    const current = categoryMonthTotalsMap.get(`${item.category}-${latestMonthKey}`) || 0;
    const previous = previousMonth
      ? categoryMonthTotalsMap.get(`${item.category}-${previousMonth.key}`) || 0
      : 0;
    const changePercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

    return {
      ...item,
      current,
      previous,
      changePercent
    };
  });

  return {
    totalExpense,
    categoryTotals,
    monthlyTotals: recentMonths,
    categoryTrends,
    forecast: {
      monthKey: forecastMonthKey,
      month: formatMonth(forecastMonthKey),
      amount: forecastAmount,
      basis: recentValues.length >= 3 ? "weighted recent months + trend" : "available expense history"
    },
    anomalies,
    recommendations: recommendations.slice(0, 5),
    summary: {
      topCategory,
      latestMonth: latestMonth?.month || "No data",
      latestAmount,
      previousAmount,
      monthChangePercent,
      spendingRatio,
      targetMonthlySpend,
      suggestedCut,
      transactionCount: normalizedExpenses.length
    }
  };
};
