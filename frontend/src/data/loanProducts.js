import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HomeIcon from "@mui/icons-material/Home";
import SavingsIcon from "@mui/icons-material/Savings";
import SchoolIcon from "@mui/icons-material/School";

export const loanProducts = [
  {
    id: "personal",
    title: "Personal Loan",
    icon: CreditScoreIcon,
    rate: "10.00%",
    maxAmount: 1200000,
    tenure: "12 - 72 months",
    processing: "1.5% onwards",
    color: "#2563eb",
    summary: "Fast unsecured loan for planned or emergency personal needs.",
    bestFor: ["Medical needs", "Travel", "Wedding", "Debt consolidation"],
    documents: ["PAN", "Aadhaar", "Salary slips", "Bank statement"],
    features: ["Quick digital approval", "No collateral", "Flexible EMI"]
  },
  {
    id: "home",
    title: "Home Loan",
    icon: HomeIcon,
    rate: "8.40%",
    maxAmount: 8000000,
    tenure: "5 - 30 years",
    processing: "0.5% onwards",
    color: "#0f766e",
    summary: "Long-tenure financing for buying, building or renovating a home.",
    bestFor: ["New home", "Plot purchase", "Renovation", "Balance transfer"],
    documents: ["Property papers", "Income proof", "KYC", "Bank statement"],
    features: ["Lower rates", "Tax benefits", "Balance transfer support"]
  },
  {
    id: "business",
    title: "Business Loan",
    icon: BusinessCenterIcon,
    rate: "12.75%",
    maxAmount: 5000000,
    tenure: "12 - 84 months",
    processing: "2% onwards",
    color: "#7c3aed",
    summary: "Working capital and expansion loans for small businesses.",
    bestFor: ["Inventory", "Equipment", "Cash flow", "Expansion"],
    documents: ["GST certificate", "ITR", "Bank statement", "Business proof"],
    features: ["MSME friendly", "Fast assessment", "Flexible repayment"]
  },
  {
    id: "education",
    title: "Education Loan",
    icon: SchoolIcon,
    rate: "9.25%",
    maxAmount: 3000000,
    tenure: "Course period + 15 years",
    processing: "Low / nil",
    color: "#ea580c",
    summary: "Study finance for India and abroad with moratorium support.",
    bestFor: ["Tuition fee", "Hostel", "Laptop", "Travel for study"],
    documents: ["Admission letter", "Fee structure", "KYC", "Co-applicant income"],
    features: ["Moratorium period", "Parent co-applicant", "Tax benefit"]
  },
  {
    id: "vehicle",
    title: "Vehicle Loan",
    icon: DirectionsCarIcon,
    rate: "8.90%",
    maxAmount: 2500000,
    tenure: "12 - 84 months",
    processing: "1% onwards",
    color: "#0891b2",
    summary: "Finance for new or used cars and two-wheelers.",
    bestFor: ["Car loan", "Bike loan", "EV purchase", "Used vehicle"],
    documents: ["KYC", "Income proof", "Vehicle quotation", "Bank statement"],
    features: ["On-road funding", "EV support", "Dealer integration"]
  },
  {
    id: "gold",
    title: "Gold Loan",
    icon: SavingsIcon,
    rate: "7.95%",
    maxAmount: 2000000,
    tenure: "3 - 36 months",
    processing: "Minimal",
    color: "#ca8a04",
    summary: "Short-term secured loan against gold ornaments.",
    bestFor: ["Emergency cash", "Business working capital", "Short tenure needs"],
    documents: ["KYC", "Gold valuation", "Address proof"],
    features: ["Secured loan", "Lower rate", "Quick disbursal"]
  },
  {
    id: "bank-comparison",
    title: "Bank Comparison",
    icon: AccountBalanceIcon,
    rate: "Compare",
    maxAmount: 0,
    tenure: "All banks",
    processing: "Varies",
    color: "#334155",
    summary: "Compare rates, EMI and approval fit across bank partners.",
    bestFor: ["Rate comparison", "Eligibility match", "Best EMI selection"],
    documents: ["Income profile", "Credit score", "Loan purpose"],
    features: ["SBI style cards", "HDFC style categories", "Indian Bank quick actions"]
  }
];
