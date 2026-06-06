export const fixedDepositProducts = [
  {
    bank: "State Bank of India",
    type: "Regular FD",
    tenure: "7 days - 10 years",
    rate: "3.50% - 6.75% p.a.",
    seniorRate: "Up to 7.25% p.a.",
    minAmount: "Rs. 1,000",
    process: "Choose tenure, complete KYC, fund from savings account, download FD receipt.",
    notes: "Premature withdrawal and TDS rules depend on tenure and customer profile."
  },
  {
    bank: "HDFC Bank",
    type: "Sweep-in / Regular FD",
    tenure: "7 days - 10 years",
    rate: "3.00% - 7.00% p.a.",
    seniorRate: "Up to 7.50% p.a.",
    minAmount: "Rs. 5,000",
    process: "Open FD online or branch, select payout/cumulative option, verify nominee.",
    notes: "Good fit for emergency corpus when sweep-in is enabled."
  },
  {
    bank: "Indian Bank",
    type: "IND SECURE / Term Deposit",
    tenure: "444 days and standard tenures",
    rate: "Around 6.60% p.a. for 444 days",
    seniorRate: "Around 7.10% - 7.35% p.a.",
    minAmount: "Rs. 1,000",
    process: "Select deposit scheme, submit KYC/nominee, fund deposit, track maturity.",
    notes: "Special scheme rates can change or be withdrawn by the bank."
  },
  {
    bank: "Kotak Mahindra Bank",
    type: "Regular FD",
    tenure: "7 days - 10 years",
    rate: "2.75% - 7.10% p.a.",
    seniorRate: "Up to 7.60% p.a.",
    minAmount: "Rs. 5,000",
    process: "Book from net banking/app, choose auto-renewal, add nominee and maturity account.",
    notes: "Compare callable vs non-callable FD before locking large deposits."
  }
];

export const mutualFundProducts = [
  {
    category: "Liquid Fund",
    risk: "Low to Moderate",
    horizon: "1 day - 12 months",
    expectedReturn: "Market linked, often used for cash parking",
    process: "Complete KYC, invest lump sum, keep emergency money accessible.",
    suitableFor: "Short-term surplus, emergency reserve, low volatility preference."
  },
  {
    category: "Short Duration Debt Fund",
    risk: "Moderate",
    horizon: "1 - 3 years",
    expectedReturn: "Market linked debt returns",
    process: "Check portfolio quality, expense ratio, exit load and taxation.",
    suitableFor: "Planned expenses where FD alternatives are being compared."
  },
  {
    category: "Hybrid Fund",
    risk: "Moderate to High",
    horizon: "3+ years",
    expectedReturn: "Debt plus equity market linked returns",
    process: "Choose aggressive/balanced category, start SIP, review annually.",
    suitableFor: "Investors who want equity exposure with some debt allocation."
  },
  {
    category: "Index / Flexi Cap Equity Fund",
    risk: "High",
    horizon: "5+ years",
    expectedReturn: "Fully market linked, no guaranteed return",
    process: "Use SIP, define goal, avoid short-term withdrawals, track benchmark.",
    suitableFor: "Long-term wealth creation with high volatility tolerance."
  }
];

export const paymentGatewayOptions = [
  {
    id: "gpay",
    label: "Google Pay",
    rail: "UPI",
    helper: "Fast UPI collect request for verified mobile number."
  },
  {
    id: "phonepe",
    label: "PhonePe",
    rail: "UPI",
    helper: "UPI intent style payment with transaction reference."
  },
  {
    id: "upi",
    label: "Any UPI App",
    rail: "UPI",
    helper: "Pay with BHIM, Paytm, bank UPI or another UPI app."
  },
  {
    id: "card",
    label: "Debit / Credit Card",
    rail: "Card",
    helper: "Demo card payment for processing fee."
  },
  {
    id: "netbanking",
    label: "Net Banking",
    rail: "Bank",
    helper: "Redirect style bank payment confirmation."
  }
];

export const aiTrainingTopics = [
  {
    keywords: ["fd", "fixed deposit", "deposit", "interest"],
    answer:
      "FD me principal mostly safe hota hai aur return fixed hota hai. Compare bank, tenure, senior citizen rate, premature penalty, TDS and auto-renewal before booking."
  },
  {
    keywords: ["mutual fund", "sip", "equity", "debt", "liquid"],
    answer:
      "Mutual funds market linked hote hain. Liquid/debt short horizon ke liye, hybrid medium risk ke liye, aur equity/index funds 5+ years ke goals ke liye better fit ho sakte hain."
  },
  {
    keywords: ["gpay", "google pay", "phonepe", "upi", "payment gateway"],
    answer:
      "Processing fee payment demo gateway me Google Pay, PhonePe, Any UPI App, Card aur Net Banking options hain. Payment ke baad backend payment status PAID mark karta hai."
  },
  {
    keywords: ["fraud", "kyc", "risk", "duplicate", "failed attempts"],
    answer:
      "Fraud detection credit score, loan-to-income ratio, Aadhaar/PAN/IFSC format, duplicate applicant signals, failed attempts, KYC mismatch and device/IP risk ko combine karke score banata hai."
  },
  {
    keywords: ["loan", "emi", "approval", "documents"],
    answer:
      "Loan approval credit score, income, existing EMI, requested amount, documents, bank limit and fraud score par depend karta hai. Aadhaar, PAN, bank account, IFSC, nominee and income details important hain."
  }
];
