import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CloseIcon from "@mui/icons-material/Close";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HomeIcon from "@mui/icons-material/Home";
import PaymentsIcon from "@mui/icons-material/Payments";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SavingsIcon from "@mui/icons-material/Savings";
import SchoolIcon from "@mui/icons-material/School";
import SecurityIcon from "@mui/icons-material/Security";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MarketplaceOffers from "./MarketplaceOffers";
import ApplicationsWorkspace from "./ApplicationsWorkspace";
import PaymentWorkspace from "./PaymentWorkspace";
import { paymentGatewayOptions } from "../../data/financialKnowledge";
import { applyForLoan, getLoanApplications, getLoanOffer, getLoanOffers, payProcessingFee } from "../../services/loanService";
import { uploadLoanDocument } from "../../utils/cloudinaryUpload";
import { calculateCreditBand, calculateEmi, runFraudRiskCheck } from "../../utils/loanCalculations";
import {
  calculateOfferMetrics,
  evaluateOfferEligibility,
  filterAndSortLoanOffers
} from "../../utils/loanMarketplace";
import {
  enrichApplications,
  filterAndSortApplications,
  summarizeApplications
} from "../../utils/applicationDashboard";
import {
  buildPaymentReceipt,
  maskPaymentIdentity,
  paymentProgressSteps,
  receiptToText
} from "../../utils/paymentGateway";

const iconMap = {
  credit: CreditScoreIcon,
  home: HomeIcon,
  business: BusinessCenterIcon,
  school: SchoolIcon,
  car: DirectionsCarIcon,
  gold: SavingsIcon
};

const LoanSection = ({ balance = 0, onRecordPayment, onOpenApplications, view = "loans" }) => {
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingOfferDetail, setLoadingOfferDetail] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [applicationResult, setApplicationResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayStep, setGatewayStep] = useState("ready");
  const [payerUpi, setPayerUpi] = useState("demo@upi");
  const [gatewayAmount, setGatewayAmount] = useState("");
  const [paymentRecipient, setPaymentRecipient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("gpay");
  const [paymentContext, setPaymentContext] = useState("general");
  const [paying, setPaying] = useState(false);
  const [lastPaymentAt, setLastPaymentAt] = useState("");
  const [latestReceipt, setLatestReceipt] = useState(null);
  
  // Card Payment Fields
  const [cardType, setCardType] = useState("debit");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // Net Banking Fields
  const [selectedBank, setSelectedBank] = useState("sbi");
  
  // Banks list
  const banksList = [
    { id: "sbi", name: "State Bank of India" },
    { id: "hdfc", name: "HDFC Bank" },
    { id: "icici", name: "ICICI Bank" },
    { id: "axis", name: "Axis Bank" },
    { id: "kotak", name: "Kotak Mahindra Bank" },
    { id: "indian", name: "Indian Bank" },
    { id: "boi", name: "Bank of India" },
    { id: "pnb", name: "Punjab National Bank" }
  ];
  
  const cardTypes = [
    { id: "debit", label: "Debit Card" },
    { id: "credit", label: "Credit Card" },
    { id: "prepaid", label: "Prepaid Card" }
  ];

  const [applicantName, setApplicantName] = useState("Demo Applicant");
  const [email] = useState(() => localStorage.getItem("email") || "demo@fintrack.in");
  const paymentHistoryStorageKey = `fintrackPaymentHistory:${email}`;
  const [paymentHistory, setPaymentHistory] = useState(() => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem(paymentHistoryStorageKey) || "[]");
      return Array.isArray(storedHistory) ? storedHistory : [];
    } catch (error) {
      return [];
    }
  });
  const [creditScore, setCreditScore] = useState(735);
  const [monthlyIncome, setMonthlyIncome] = useState(65000);
  const [requestedAmount, setRequestedAmount] = useState(600000);
  const [tenureMonths, setTenureMonths] = useState(48);
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [offerSort, setOfferSort] = useState("match");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [passportPhotoUrl, setPassportPhotoUrl] = useState("");
  const [passportPhotoDataUrl, setPassportPhotoDataUrl] = useState("");
  const [aadhaarDocumentUrl, setAadhaarDocumentUrl] = useState("");
  const [aadhaarDocumentDataUrl, setAadhaarDocumentDataUrl] = useState("");
  const [panDocumentUrl, setPanDocumentUrl] = useState("");
  const [panDocumentDataUrl, setPanDocumentDataUrl] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");
  const [nomineePhone, setNomineePhone] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [employmentType, setEmploymentType] = useState("salaried");
  const [existingEmi, setExistingEmi] = useState(0);
  const [loanPurpose, setLoanPurpose] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all");
  const [applicationSort, setApplicationSort] = useState("newest");
  const [applicationsRefreshedAt, setApplicationsRefreshedAt] = useState("");

  useEffect(() => {
    localStorage.setItem(paymentHistoryStorageKey, JSON.stringify(paymentHistory.slice(0, 25)));
  }, [paymentHistory, paymentHistoryStorageKey]);

  useEffect(() => {
    const loadOffers = async () => {
      setLoadingOffers(true);
      setApiError("");

      try {
        const data = await getLoanOffers();
        setOffers(data);
        if (data.length > 0) {
          setSelectedOffer(data[0]);
          setRequestedAmount(Math.min(600000, data[0].maxAmount));
          setTenureMonths(Math.min(48, data[0].maxTenureMonths));
        }
      } catch (error) {
        setApiError("Loan backend is not reachable. Start Spring Boot on port 8081.");
      } finally {
        setLoadingOffers(false);
      }
    };

    loadOffers();
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoadingApplications(true);

    try {
      const data = await getLoanApplications();
      setApplications(data);
      setApplicationsRefreshedAt(new Date().toISOString());
    } catch (error) {
      setApiError("Could not load saved loan applications from backend.");
    } finally {
      setLoadingApplications(false);
    }
  };

  const validateCreditScore = (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 300 || num > 900) return "";
    return value;
  };

  const validateMonthlyIncome = (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) return "";
    return value;
  };

  const validateLoanAmount = (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) return "";
    return value;
  };

  const validateTenure = (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 1) return "";
    return value;
  };

  const validatePaymentAmount = (value) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) return "";
    return value;
  };

  const sanitizeMobileInput = (value) => value.replace(/[^\d+\-\s()]/g, "");

  const normalizeIndianMobile = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith("0")) {
      return digits.slice(1);
    }
    return digits;
  };

  const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(normalizeIndianMobile(value));

  const isValidUpiId = (value) => /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9]{2,}$/.test(String(value || "").trim());

  const selectedLoanType = selectedOffer?.loanType;
  const SelectedIcon = selectedLoanType
    ? iconMap[selectedLoanType.iconName] || AccountBalanceIcon
    : AccountBalanceIcon;
  const accentColor = selectedLoanType?.color || "#2563eb";
  const selectedPayment = paymentGatewayOptions.find((method) => method.id === paymentMethod) || paymentGatewayOptions[0];
  const isLoanFeeCheckout = paymentContext === "loan-fee" && Boolean(applicationResult?.id);
  const gatewayProgress = paymentProgressSteps(gatewayStep);
  const formattedLastPaymentAt = lastPaymentAt
    ? new Date(lastPaymentAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    : "";
  const marketplaceRows = useMemo(
    () => filterAndSortLoanOffers(offers, {
      loanType: loanTypeFilter,
      amount: requestedAmount,
      tenureMonths,
      creditScore,
      sortBy: offerSort
    }),
    [creditScore, loanTypeFilter, offerSort, offers, requestedAmount, tenureMonths]
  );
  const enrichedApplications = useMemo(
    () => enrichApplications(applications, offers),
    [applications, offers]
  );
  const applicationSummary = useMemo(
    () => summarizeApplications(enrichedApplications),
    [enrichedApplications]
  );
  const visibleApplications = useMemo(
    () => filterAndSortApplications(enrichedApplications, {
      search: applicationSearch,
      status: applicationStatusFilter,
      sort: applicationSort
    }),
    [applicationSearch, applicationSort, applicationStatusFilter, enrichedApplications]
  );
  const showLoanMarketplace = view === "loans" || view === "all";
  const showLoanDetails = view === "loans" || view === "all";
  const showPayments = view === "payments" || view === "all";
  const showSavedApplications = view === "applications" || view === "all";
  const sectionCopy = {
    loans: {
      eyebrow: "Phase 2 Loan Aggregator",
      title: "Loan Marketplace",
      description:
        "Backend-served demo offers, personalized eligibility, transparent costs and secure application checks."
    },
    payments: {
      eyebrow: "Dynamic Payment Gateway",
      title: "Payment Gateway",
      description:
        "Open UPI, card or net banking style checkout and record successful payments in the expense ledger."
    },
    applications: {
      eyebrow: "Application Tracking",
      title: "Application Center",
      description:
        "Review verification progress, lender decisions, payment state and protected application details."
    },
    all: {
      eyebrow: "Phase 2 Loan Aggregator",
      title: "Loan Marketplace",
      description:
        "Backend-served demo offers, personalized eligibility, transparent costs and secure application checks."
    }
  };
  const currentCopy = sectionCopy[view] || sectionCopy.loans;

  const estimatedEmi = useMemo(
    () =>
      calculateEmi(
        requestedAmount,
        selectedOffer?.interestRate || 10,
        tenureMonths
      ),
    [requestedAmount, selectedOffer, tenureMonths]
  );
  const creditBand = calculateCreditBand(creditScore);
  const fraudRisk = runFraudRiskCheck({
    creditScore,
    monthlyIncome,
    requestedAmount,
    identityMismatch: false,
    failedAttempts: 0,
    deviceRisk: "low"
  });
  const selectedMetrics = useMemo(
    () => calculateOfferMetrics(selectedOffer, requestedAmount, tenureMonths),
    [requestedAmount, selectedOffer, tenureMonths]
  );
  const selectedEligibility = useMemo(
    () => evaluateOfferEligibility(selectedOffer, { amount: requestedAmount, tenureMonths, creditScore }),
    [creditScore, requestedAmount, selectedOffer, tenureMonths]
  );
  const approvalFit = Math.max(
    12,
    Math.min(96, Number(creditScore) / 9 - fraudRisk.score / 3)
  );
  const hasRequiredApplicationFields =
    applicantName.trim() &&
    email.trim() &&
    aadhaarNumber.trim() &&
    panNumber.trim() &&
    nomineeName.trim() &&
    isValidIndianMobile(nomineePhone) &&
    bankAccountNumber.trim() &&
    ifscCode.trim() &&
    pincode.trim() &&
    Number(monthlyIncome) > 0 &&
    Number(requestedAmount) > 0 &&
    Number(creditScore) > 0 &&
    Number(tenureMonths) > 0;

  const applyOfferDefaults = (offer) => {
    setRequestedAmount((current) =>
      Math.min(Number(current) || 600000, offer.maxAmount)
    );
    setTenureMonths((current) =>
      Math.min(
        Math.max(Number(current) || 48, offer.minTenureMonths),
        offer.maxTenureMonths
      )
    );
  };

  const handleSelectOffer = async (offer) => {
    setSelectedOffer(offer);
    setApplicationResult(null);
    setApiError("");
    setApplicationOpen(true);
    setLoadingOfferDetail(true);
    applyOfferDefaults(offer);

    try {
      const detail = await getLoanOffer(offer.id);
      setSelectedOffer(detail);
      applyOfferDefaults(detail);
    } catch (error) {
      setApiError("Could not load loan detail from backend.");
    } finally {
      setLoadingOfferDetail(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedOffer) {
      return;
    }

    // Validate all numeric fields before submission
    const creditScoreNum = Number(creditScore);
    const monthlyIncomeNum = Number(monthlyIncome);
    const requestedAmountNum = Number(requestedAmount);
    const tenureMonthsNum = Number(tenureMonths);
    const existingEmiNum = Number(existingEmi) || 0;
    const normalizedNomineePhone = normalizeIndianMobile(nomineePhone);

    if (creditScoreNum < 300 || creditScoreNum > 900) {
      alert("Credit score must be between 300 and 900");
      return;
    }

    if (monthlyIncomeNum < 0) {
      alert("Monthly income cannot be negative");
      return;
    }

    if (requestedAmountNum < 0) {
      alert("Loan amount cannot be negative");
      return;
    }

    if (tenureMonthsNum < 1) {
      alert("Tenure must be at least 1 month");
      return;
    }

    if (existingEmiNum < 0) {
      alert("Existing EMI cannot be negative");
      return;
    }

    if (!isValidIndianMobile(normalizedNomineePhone)) {
      setApiError("Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      const result = await applyForLoan({
        loanOfferId: selectedOffer.id,
        applicantName,
        email,
        monthlyIncome: monthlyIncomeNum,
        requestedAmount: requestedAmountNum,
        creditScore: creditScoreNum,
        tenureMonths: tenureMonthsNum,
        aadhaarNumber,
        panNumber,
        passportPhotoUrl,
        passportPhotoDataUrl,
        aadhaarDocumentUrl,
        aadhaarDocumentDataUrl,
        panDocumentUrl,
        panDocumentDataUrl,
        nomineeName,
        nomineeRelation,
        nomineePhone: normalizedNomineePhone,
        bankAccountNumber,
        ifscCode,
        employmentType,
        existingEmi: existingEmiNum,
        loanPurpose,
        address,
        city,
        pincode
      });

      setApplicationResult(result);
      setSnackbarOpen(true);
      loadApplications();
    } catch (error) {
      setApiError("Application submit failed. Please check Spring Boot backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentChange = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingDocument(type);
    setApiError("");

    try {
      const uploaded = await uploadLoanDocument(file);
      if (type === "photo") {
        setPassportPhotoUrl(uploaded.url);
        setPassportPhotoDataUrl(uploaded.dataUrl);
      }
      if (type === "aadhaar") {
        setAadhaarDocumentUrl(uploaded.url);
        setAadhaarDocumentDataUrl(uploaded.dataUrl);
      }
      if (type === "pan") {
        setPanDocumentUrl(uploaded.url);
        setPanDocumentDataUrl(uploaded.dataUrl);
      }
    } catch (error) {
      setApiError(error?.message || "Document upload failed. Check Cloudinary settings or try again.");
    } finally {
      setUploadingDocument("");
    }
  };

  const recordPaymentReceipt = (receipt) => {
    setLatestReceipt(receipt);
    setPaymentHistory((current) => [
      receipt,
      ...current.filter((item) => item.reference !== receipt.reference)
    ].slice(0, 25));
  };

  const handleDownloadReceipt = (receipt = latestReceipt) => {
    if (!receipt) return;
    const file = new Blob([receiptToText(receipt)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fintrack-receipt-${receipt.reference}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenGateway = (methodId = paymentMethod, context = "general", draft = {}) => {
    const isLoanFee = context === "loan-fee" && Boolean(applicationResult?.id);
    setPaymentMethod(methodId);
    setPaymentContext(isLoanFee ? "loan-fee" : "general");
    setGatewayAmount(isLoanFee ? String(selectedMetrics.processingFee) : String(draft.amount || ""));
    setPaymentRecipient(isLoanFee ? `${selectedOffer?.bank?.name || "Lender"} processing fee` : String(draft.recipient || ""));
    setGatewayStep("ready");
    setLastPaymentAt("");
    setLatestReceipt(null);
    setApiError("");
    setGatewayOpen(true);
  };

  const handlePayProcessingFee = () => {
    if (!applicationResult?.id || applicationResult.paymentStatus === "PAID") return;
    setPaymentOpen(false);
    handleOpenGateway(paymentMethod, "loan-fee");
  };

  const handleCompleteGatewayPayment = async () => {
    const amount = Number(gatewayAmount);
    
    // Strict validation - reject any non-positive amounts
    if (isNaN(amount) || amount < 0.01) {
      setApiError("Payment amount must be greater than Rs. 0.01. Negative or zero amounts are not allowed.");
      return;
    }
    
    if (!paymentRecipient.trim()) {
      setApiError("Recipient name is required.");
      return;
    }

    if (["gpay", "phonepe", "upi"].includes(paymentMethod) && !isValidUpiId(payerUpi)) {
      setApiError("Enter a valid UPI ID, for example name@upi.");
      return;
    }

    if (paymentMethod === "card") {
      if (!/^\d{16}$/.test(cardNumber)) {
        setApiError("Enter a valid 16-digit card number.");
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        setApiError("Enter card expiry in MM/YY format.");
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv)) {
        setApiError("Enter a valid 3 or 4-digit CVV.");
        return;
      }
    }
    
    const isLoanFeePayment = paymentContext === "loan-fee" && Boolean(applicationResult?.id);
    if (isLoanFeePayment && Math.abs(amount - selectedMetrics.processingFee) > 0.01) {
      setApiError(`Loan processing fee is locked at Rs. ${selectedMetrics.processingFee.toLocaleString("en-IN")}.`);
      return;
    }

    if (amount > Number(balance || 0)) {
      setApiError("Insufficient balance for this payment amount.");
      return;
    }

    setGatewayStep("processing");
    setPaying(true);
    setApiError("");

    const paidAt = new Date().toISOString();
    const generatedReference = `${paymentMethod.toUpperCase()}-${Date.now()}`;
    const selectedBankName = banksList.find((bank) => bank.id === selectedBank)?.name;
    const paymentIdentity = maskPaymentIdentity({
      methodId: paymentMethod,
      upiId: payerUpi,
      cardNumber,
      bankName: selectedBankName
    });

    try {
      let confirmedReference = generatedReference;
      if (isLoanFeePayment) {
        const result = await payProcessingFee(applicationResult.id, {
          amount,
          reference: generatedReference
        });
        confirmedReference = result.paymentReference || generatedReference;
        setApplicationResult(result);
        loadApplications();
      }
      if (onRecordPayment) {
        const recorded = await onRecordPayment({
          amount,
          payee: paymentRecipient.trim(),
          method: selectedPayment.label,
          paidAt,
          reference: confirmedReference,
          applicationId: isLoanFeePayment ? applicationResult.id : null
        });
        if (!recorded) {
          throw new Error("Payment expense save failed");
        }
      }
      const receipt = buildPaymentReceipt({
        reference: confirmedReference,
        applicationId: isLoanFeePayment ? applicationResult.id : null,
        amount,
        recipient: paymentRecipient,
        methodId: paymentMethod,
        methodLabel: selectedPayment.label,
        paymentIdentity,
        paidAt
      });
      recordPaymentReceipt(receipt);
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setLastPaymentAt(paidAt);
      setGatewayStep("success");
      setSnackbarOpen(true);
    } catch (error) {
      const failedReceipt = buildPaymentReceipt({
        reference: generatedReference,
        applicationId: isLoanFeePayment ? applicationResult.id : null,
        amount,
        recipient: paymentRecipient,
        methodId: paymentMethod,
        methodLabel: selectedPayment.label,
        paymentIdentity,
        paidAt,
        status: "FAILED",
        failureReason: "Authorization or ledger update failed"
      });
      recordPaymentReceipt(failedReceipt);
      setGatewayStep("failed");
      setApiError("Payment failed safely. No retry will reuse this transaction reference.");
    } finally {
      setPaying(false);
    }
  };

  const handleOpenSelectedApplication = () => {
    if (selectedOffer) {
      setApplicationOpen(true);
    }
  };

  const openSavedApplications = () => {
    setApplicationOpen(false);
    setPaymentOpen(false);

    if (view === "loans" && typeof onOpenApplications === "function") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      onOpenApplications();
      return;
    }

    window.setTimeout(() => {
      document.getElementById("loan-applications")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };

  const handleOpenSavedPayment = (application) => {
    if (!application.loanOffer) {
      setApiError("This older application has no lender reference, so its fee cannot be calculated safely.");
      return;
    }
    setApplicationResult(application);
    setSelectedOffer(application.loanOffer);
    setRequestedAmount(Number(application.requestedAmount || 0));
    setTenureMonths(Number(application.tenureMonths || application.loanOffer.minTenureMonths || 12));
    setSelectedApplication(null);
    setPaymentOpen(true);
  };

  const handleDownloadApplicationSummary = (application) => {
    const offer = application.loanOffer;
    const summary = [
      "FINTRACK LOAN APPLICATION SUMMARY",
      "",
      `Application ID: #${application.id}`,
      `Applicant: ${application.applicantName || "-"}`,
      `Lender: ${offer?.bank?.name || "Not recorded"}`,
      `Loan product: ${offer?.loanType?.name || "Not recorded"}`,
      `Requested amount: Rs. ${Number(application.requestedAmount || 0).toLocaleString("en-IN")}`,
      `Decision: ${formatApplicationStatus(application.status)}`,
      `Payment: ${application.paymentStatus || "UNPAID"}`,
      `Created: ${formatApplicationDate(application.createdAt)}`,
      `Aadhaar: ${application.maskedAadhaarNumber || "Protected"}`,
      `PAN: ${application.maskedPanNumber || "Protected"}`,
      `Decision reason: ${application.decisionReason || "Not available"}`
    ].join("\n");
    const file = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `loan-application-${application.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box className={`loan-workspace loan-workspace-${view}`} sx={{ mt: 0 }}>
      {(view === "loans" || view === "all") && (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 2
        }}
      >
        <Box sx={{ display: view === "all" ? "block" : "none" }}>
          <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
            {currentCopy.eyebrow}
          </Typography>
          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 900 }}>
            {currentCopy.title}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {currentCopy.description}
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
          {view === "loans" && (
            <Button
              variant="outlined"
              onClick={openSavedApplications}
              aria-label="Open saved applications page"
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
            >
              Saved applications
            </Button>
          )}
          {showSavedApplications && view !== "applications" && (
            <Button
              variant="outlined"
              onClick={openSavedApplications}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
            >
              View Saved Applications
            </Button>
          )}
          {showLoanMarketplace && (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleOpenSelectedApplication}
              disabled={!selectedOffer || submitting}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                background: "linear-gradient(90deg, #5546e9, #7849fa)",
                color: "#ffffff",
                "&:hover": { background: "linear-gradient(90deg, #0f766e, #1d4ed8)" }
              }}
            >
              Open Application
            </Button>
          )}
        </Stack>
      </Box>
      )}

      {apiError && (
        <Alert severity="warning" sx={{ ...alertStyleBySeverity.warning, mb: 2 }}>
          {apiError}
        </Alert>
      )}

      {showLoanMarketplace && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: 3,
            color: "#0f172a",
            border: "1px solid rgba(14, 116, 144, 0.18)",
            background: "#ffffff"
          }}
        >
          <Stack direction={{ xs: "column", lg: "row" }} sx={{ justifyContent: "space-between", gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 900 }}>Find your best-fit offer</Typography>
              <Typography variant="body2" sx={{ color: "#475569" }}>Change your profile once; EMI, eligibility and total cost update across every lender.</Typography>
            </Box>
            <Chip
              label={`${marketplaceRows.length} matching offers`}
              variant="outlined"
              sx={{ color: "#0f766e", borderColor: "#14b8a6", fontWeight: 900, alignSelf: { xs: "flex-start", lg: "center" } }}
            />
          </Stack>
          <Grid container spacing={1.25}>
            <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
              <TextField select fullWidth size="small" label="Loan type" value={loanTypeFilter} onChange={(event) => setLoanTypeFilter(event.target.value)} sx={marketplaceFilterStyle}>
                <MenuItem value="all">All loan types</MenuItem>
                {[...new Map(offers.map((offer) => [offer.loanType?.slug, offer.loanType])).values()].filter(Boolean).map((type) => (
                  <MenuItem key={type.slug} value={type.slug}>{type.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
              <TextField fullWidth size="small" type="number" label="Required amount" value={requestedAmount} onChange={(event) => setRequestedAmount(validateLoanAmount(event.target.value))} slotProps={{ htmlInput: { min: 1 } }} sx={marketplaceFilterStyle} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
              <TextField fullWidth size="small" type="number" label="Tenure months" value={tenureMonths} onChange={(event) => setTenureMonths(validateTenure(event.target.value))} slotProps={{ htmlInput: { min: 1 } }} sx={marketplaceFilterStyle} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
              <TextField fullWidth size="small" type="number" label="Credit score" value={creditScore} onChange={(event) => setCreditScore(validateCreditScore(event.target.value))} slotProps={{ htmlInput: { min: 300, max: 900 } }} sx={marketplaceFilterStyle} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
              <TextField select fullWidth size="small" label="Sort offers" value={offerSort} onChange={(event) => setOfferSort(event.target.value)} sx={marketplaceFilterStyle}>
                <MenuItem value="match">Best eligibility match</MenuItem>
                <MenuItem value="rate">Lowest interest rate</MenuItem>
                <MenuItem value="emi">Lowest EMI</MenuItem>
                <MenuItem value="total">Lowest total repayment</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      )}

      {showLoanMarketplace && <MarketplaceOffers rows={marketplaceRows} loading={loadingOffers} selectedId={selectedOffer?.id} tenureMonths={tenureMonths} onSelect={handleSelectOffer} />}

      <Dialog
        open={applicationOpen}
        onClose={() => setApplicationOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #ecfeff, #eff6ff)",
            border: "1px solid rgba(14, 116, 144, 0.18)",
            color: "#0f172a"
          }
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            pb: 1
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
              Secure Loan Application
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {selectedLoanType?.name || "Loan Offer"}
            </Typography>
          </Box>
          <Button
            startIcon={<CloseIcon />}
            onClick={() => setApplicationOpen(false)}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Close
          </Button>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "rgba(14, 116, 144, 0.14)", color: "#0f172a" }}>
          {loadingOfferDetail || !selectedOffer ? (
            <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, fontWeight: 800 }}>
                Loading offer details from server...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Card sx={panelStyle}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                      <Box sx={iconBoxStyle(accentColor, 56)}>
                        <SelectedIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                          {selectedLoanType.name}
                        </Typography>
                        <Typography sx={{ color: "#475569" }}>
                          {selectedOffer.bank.name}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.25} sx={{ mb: 2 }}>
                      <LoanFact label="Interest Rate" value={`${selectedOffer.interestRate}% p.a.`} />
                      <LoanFact label="Max Amount" value={`Rs. ${Number(selectedOffer.maxAmount).toLocaleString("en-IN")}`} />
                      <LoanFact label="Tenure" value={`${selectedOffer.minTenureMonths} - ${selectedOffer.maxTenureMonths} months`} />
                      <LoanFact label="Min Score" value={selectedOffer.minCreditScore} />
                    </Grid>

                    <DetailBlock title="Highlights" text={selectedOffer.highlights} />
                    <Divider sx={{ my: 1.5 }} />
                    <DetailBlock title="Documents Required" text={selectedOffer.documentsRequired} />
                    <Divider sx={{ my: 1.5 }} />
                    <DetailBlock title="Processing Fee" text={selectedOffer.processingFee} />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Card sx={panelStyle}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                      Fill Applicant Details
                    </Typography>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Applicant name" value={applicantName} onChange={(event) => setApplicantName(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Authenticated email" value={email} slotProps={{ input: { readOnly: true } }} helperText="Applications are always linked to the signed-in account." />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Credit score" type="number" value={creditScore} onChange={(event) => setCreditScore(validateCreditScore(event.target.value))} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Monthly income" type="number" value={monthlyIncome} onChange={(event) => setMonthlyIncome(validateMonthlyIncome(event.target.value))} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Loan amount" type="number" value={requestedAmount} onChange={(event) => setRequestedAmount(validateLoanAmount(event.target.value))} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Tenure months" type="number" value={tenureMonths} onChange={(event) => setTenureMonths(validateTenure(event.target.value))} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Aadhaar number" value={aadhaarNumber} onChange={(event) => setAadhaarNumber(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="PAN number" value={panNumber} onChange={(event) => setPanNumber(event.target.value.toUpperCase())} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={uploadingDocument === "aadhaar" ? <CircularProgress size={18} /> : <UploadFileIcon />}
                          fullWidth
                          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                        >
                          Upload Aadhaar
                          <input hidden accept="image/jpeg,image/png,application/pdf" type="file" onChange={(event) => handleDocumentChange(event, "aadhaar")} />
                        </Button>
                        {(aadhaarDocumentUrl || aadhaarDocumentDataUrl) && (
                          <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 900 }}>
                            Aadhaar document attached
                          </Typography>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={uploadingDocument === "pan" ? <CircularProgress size={18} /> : <UploadFileIcon />}
                          fullWidth
                          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                        >
                          Upload PAN
                          <input hidden accept="image/jpeg,image/png,application/pdf" type="file" onChange={(event) => handleDocumentChange(event, "pan")} />
                        </Button>
                        {(panDocumentUrl || panDocumentDataUrl) && (
                          <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 900 }}>
                            PAN document attached
                          </Typography>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack spacing={1}>
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                          >
                            Upload passport photo
                            <input hidden accept="image/jpeg,image/png" type="file" onChange={(event) => handleDocumentChange(event, "photo")} />
                          </Button>
                          <TextField fullWidth label="Photo URL optional" value={passportPhotoUrl} onChange={(event) => {
                            setPassportPhotoUrl(event.target.value);
                            setPassportPhotoDataUrl("");
                          }} />
                          {(passportPhotoDataUrl || passportPhotoUrl) && (
                            <Box
                              component="img"
                              src={passportPhotoDataUrl || passportPhotoUrl}
                              alt="Applicant preview"
                              sx={{ width: 84, height: 84, objectFit: "cover", borderRadius: 2, border: "1px solid rgba(14, 116, 144, 0.2)" }}
                            />
                          )}
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Employment type</InputLabel>
                          <Select label="Employment type" value={employmentType} onChange={(event) => setEmploymentType(event.target.value)}>
                            <MenuItem value="salaried">Salaried</MenuItem>
                            <MenuItem value="self-employed">Self-employed</MenuItem>
                            <MenuItem value="business">Business</MenuItem>
                            <MenuItem value="student">Student</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Nominee name" value={nomineeName} onChange={(event) => setNomineeName(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Nominee relation" value={nomineeRelation} onChange={(event) => setNomineeRelation(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          required
                          label="Nominee mobile number"
                          value={nomineePhone}
                          onChange={(event) => setNomineePhone(sanitizeMobileInput(event.target.value))}
                          error={Boolean(nomineePhone) && !isValidIndianMobile(nomineePhone)}
                          helperText="Use a 10-digit Indian mobile number."
                          slotProps={{ htmlInput: { inputMode: "tel", maxLength: 16 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Bank account number" value={bankAccountNumber} onChange={(event) => setBankAccountNumber(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="IFSC code" value={ifscCode} onChange={(event) => setIfscCode(event.target.value.toUpperCase())} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Existing EMI" type="number" value={existingEmi} onChange={(event) => setExistingEmi(validateMonthlyIncome(event.target.value))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Loan purpose" value={loanPurpose} onChange={(event) => setLoanPurpose(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth multiline minRows={2} label="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="City" value={city} onChange={(event) => setCity(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Pincode" value={pincode} onChange={(event) => setPincode(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Alert
                          severity="info"
                          sx={{
                            borderRadius: 2,
                            color: "#075985",
                            bgcolor: "#f0f9ff",
                            border: "1px solid #7dd3fc",
                            "& .MuiAlert-icon": { color: "#0284c7" }
                          }}
                        >
                          Verification, duplicate-application and risk signals are generated by the backend. Applicants cannot edit these protected values.
                        </Alert>
                      </Grid>
                    </Grid>

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "#ecfeff",
                        border: "1px solid rgba(14, 116, 144, 0.14)"
                      }}
                    >
                      <Stack spacing={1.5}>
                        <ScoreRow icon={<CreditScoreIcon />} title={`Credit Score: ${creditBand.label}`} subtitle={creditBand.message} color={creditBand.color} value={Math.min(Number(creditScore) / 9, 100)} />
                        <ScoreRow icon={<SecurityIcon />} title={`Fraud Risk ${fraudRisk.level}: ${fraudRisk.score}/100`} subtitle={fraudRisk.action} color={fraudRisk.color} value={fraudRisk.score} />
                        <ScoreRow icon={<AccountBalanceIcon />} title={`Estimated EMI: Rs. ${estimatedEmi.toLocaleString("en-IN")}`} subtitle={`Approval fit: ${Math.round(approvalFit)}%`} color="#2563eb" value={approvalFit} />
                      </Stack>
                    </Box>

                    {applicationResult && (
                      <Stack spacing={1.5} sx={{ mt: 2 }}>
                        <Alert
                          severity={applicationResult.fraudLevel === "HIGH" ? "error" : "success"}
                          sx={alertStyleBySeverity[applicationResult.fraudLevel === "HIGH" ? "error" : "success"]}
                        >
                          Application #{applicationResult.id} saved on server. Status: {applicationResult.status}. Fraud Score: {applicationResult.fraudScore}/100.
                        </Alert>
                        <Button
                          variant="contained"
                          startIcon={<PaymentsIcon />}
                          onClick={() => setPaymentOpen(true)}
                          disabled={applicationResult.paymentStatus === "PAID"}
                          sx={{ alignSelf: "flex-start", borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                        >
                          {applicationResult.paymentStatus === "PAID" ? "Processing Fee Paid" : "Pay Processing Fee"}
                        </Button>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setApplicationOpen(false)}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
            onClick={handleSubmitApplication}
            disabled={
              !selectedOffer ||
              !hasRequiredApplicationFields ||
              submitting ||
              loadingOfferDetail
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(90deg, #5546e9, #7849fa)",
              "&:hover": { background: "linear-gradient(90deg, #0f766e, #1d4ed8)" }
            }}
          >
            Submit to Server
          </Button>
        </DialogActions>
      </Dialog>

      {showPayments && (
        <PaymentWorkspace
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          onStartPayment={handleOpenGateway}
          paymentHistory={paymentHistory}
          onDownloadReceipt={handleDownloadReceipt}
        />
      )}

      {showLoanDetails && selectedOffer && (
        <Grid container spacing={2.5} sx={{ mt: 2.5 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={panelStyle}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                  <Box sx={iconBoxStyle(accentColor, 56)}>
                    <SelectedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {selectedLoanType.name}
                    </Typography>
                    <Typography sx={{ color: "#64748b" }}>
                      {selectedOffer.bank.name} backend-served demo offer
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                  <LoanFact label="Interest Rate" value={`${selectedOffer.interestRate}% p.a.`} />
                  <LoanFact label="Max Amount" value={`Rs. ${Number(selectedOffer.maxAmount).toLocaleString("en-IN")}`} />
                  <LoanFact label="Tenure" value={`${selectedOffer.minTenureMonths} - ${selectedOffer.maxTenureMonths} months`} />
                  <LoanFact label="Min Score" value={selectedOffer.minCreditScore} />
                  <LoanFact label="Your EMI" value={`Rs. ${selectedMetrics.emi.toLocaleString("en-IN")}`} />
                  <LoanFact label="Total Interest" value={`Rs. ${selectedMetrics.totalInterest.toLocaleString("en-IN")}`} />
                  <LoanFact label="Total Repayment" value={`Rs. ${selectedMetrics.totalPayable.toLocaleString("en-IN")}`} />
                  <LoanFact label="Processing Fee" value={`Rs. ${selectedMetrics.processingFee.toLocaleString("en-IN")}`} />
                </Grid>

                <Alert
                  severity={selectedEligibility.eligible ? "success" : "warning"}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    color: selectedEligibility.eligible ? "#166534" : "#9a3412",
                    bgcolor: selectedEligibility.eligible ? "#ecfdf5" : "#fff7ed",
                    border: `1px solid ${selectedEligibility.eligible ? "#86efac" : "#fdba74"}`,
                    "& .MuiAlert-icon": { color: selectedEligibility.eligible ? "#16a34a" : "#ea580c" }
                  }}
                >
                  {selectedEligibility.eligible
                    ? "Your current amount, tenure and credit score meet this offer's basic eligibility rules."
                    : `Manual review signals: ${selectedEligibility.reasons.join(" · ")}`}
                </Alert>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailBlock title="Highlights" text={selectedOffer.highlights} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailBlock title="Documents" text={selectedOffer.documentsRequired} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailBlock title="Processing Fee" text={selectedOffer.processingFee} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={panelStyle}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                  Eligibility Preview
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Applicant name" value={applicantName} onChange={(event) => setApplicantName(event.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Authenticated email" value={email} slotProps={{ input: { readOnly: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Credit score" type="number" value={creditScore} onChange={(event) => setCreditScore(validateCreditScore(event.target.value))} slotProps={{ htmlInput: { min: 300, max: 900 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Monthly income" type="number" value={monthlyIncome} onChange={(event) => setMonthlyIncome(validateMonthlyIncome(event.target.value))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Loan amount" type="number" value={requestedAmount} onChange={(event) => setRequestedAmount(validateLoanAmount(event.target.value))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Tenure months" type="number" value={tenureMonths} onChange={(event) => setTenureMonths(validateTenure(event.target.value))} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#ecfeff",
                    border: "1px solid rgba(14, 116, 144, 0.14)"
                  }}
                >
                  <Stack spacing={1.5}>
                    <ScoreRow icon={<CreditScoreIcon />} title={`Credit Score: ${creditBand.label}`} subtitle={creditBand.message} color={creditBand.color} value={Math.min(Number(creditScore) / 9, 100)} />
                    <ScoreRow icon={<SecurityIcon />} title={`Approval Fit: ${Math.round(approvalFit)}%`} subtitle={`Estimated EMI: Rs. ${estimatedEmi.toLocaleString("en-IN")}`} color="#2563eb" value={approvalFit} />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {showLoanDetails && (
      <Card sx={{ ...panelStyle, mt: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
            <Box sx={iconBoxStyle("#7c3aed", 44)}>
              <PsychologyIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Backend Fraud Detection Signals
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Spring Boot generates verification signals and stores the resulting risk score, reasons and application status.
              </Typography>
            </Box>
          </Box>

          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              color: "#075985",
              bgcolor: "#f0f9ff",
              border: "1px solid #7dd3fc",
              "& .MuiAlert-icon": { color: "#0284c7" }
            }}
          >
            Applicants submit KYC and financial details only. Duplicate-application, consistency and risk signals are calculated on the server and cannot be edited by applicants.
          </Alert>

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: "#fef3c7",
              border: "1px solid rgba(217, 119, 6, 0.18)"
            }}
          >
            <ScoreRow icon={<SecurityIcon />} title={`${fraudRisk.level}: ${fraudRisk.score}/100`} subtitle={fraudRisk.action} color={fraudRisk.color} value={fraudRisk.score} />
          </Box>

          {applicationResult && (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Alert
                severity={applicationResult.fraudLevel === "HIGH" ? "error" : "success"}
                sx={alertStyleBySeverity[applicationResult.fraudLevel === "HIGH" ? "error" : "success"]}
              >
                Application #{applicationResult.id} saved in backend. Status: {applicationResult.status}. Fraud Score: {applicationResult.fraudScore}/100.
              </Alert>
                        <Button
                          variant="contained"
                          startIcon={<PaymentsIcon />}
                          onClick={() => setPaymentOpen(true)}
                          disabled={applicationResult.paymentStatus === "PAID"}
                sx={{ alignSelf: "flex-start", borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                        >
                          {applicationResult.paymentStatus === "PAID" ? "Processing Fee Paid" : "Pay Processing Fee"}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={openSavedApplications}
                          sx={{ alignSelf: "flex-start", borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                        >
                          Open Saved Applications
                        </Button>
                      </Stack>
                    )}
        </CardContent>
      </Card>
      )}

      {showSavedApplications && <ApplicationsWorkspace
        applications={enrichedApplications} visibleApplications={visibleApplications}
        summary={applicationSummary} loading={loadingApplications}
        search={applicationSearch} onSearch={setApplicationSearch}
        status={applicationStatusFilter} onStatus={setApplicationStatusFilter}
        sort={applicationSort} onSort={setApplicationSort}
        onRefresh={loadApplications} refreshedAt={applicationsRefreshedAt}
        onDetails={setSelectedApplication} onPayment={handleOpenSavedPayment}
        onDownload={handleDownloadApplicationSummary}
      />}

      <Dialog
        open={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: "#f8fafc", color: "#0f172a" } }}
      >
        <DialogTitle sx={{ color: "#0f172a", fontWeight: 900 }}>
          Application #{selectedApplication?.id} details
        </DialogTitle>
        <DialogContent dividers>
          {selectedApplication && (
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <ApplicationJourney application={selectedApplication} />
              </Grid>
              <SavedFact label="Application ID" value={`#${selectedApplication.id}`} />
              <SavedFact label="Applicant" value={selectedApplication.applicantName} />
              <SavedFact label="Email" value={selectedApplication.email} />
              <SavedFact label="Loan" value={selectedApplication.loanOffer?.loanType?.name || "Loan type not recorded"} />
              <SavedFact label="Bank" value={selectedApplication.loanOffer?.bank?.name || "Lender not recorded"} />
              <SavedFact label="Amount" value={`Rs. ${Number(selectedApplication.requestedAmount || 0).toLocaleString("en-IN")}`} />
              <SavedFact label="Aadhaar" value={selectedApplication.maskedAadhaarNumber || "Protected"} />
              <SavedFact label="PAN" value={selectedApplication.maskedPanNumber || "Protected"} />
              <SavedFact label="Aadhaar Document" value={selectedApplication.aadhaarDocumentUploaded ? "Securely stored" : "-"} />
              <SavedFact label="PAN Document" value={selectedApplication.panDocumentUploaded ? "Securely stored" : "-"} />
              <SavedFact label="Nominee" value={`${selectedApplication.nomineeName || "-"} ${selectedApplication.nomineeRelation ? `(${selectedApplication.nomineeRelation})` : ""}`} />
              <SavedFact label="Nominee Phone" value={selectedApplication.maskedNomineePhone || "Protected"} />
              <SavedFact label="Bank Account" value={selectedApplication.maskedBankAccountNumber || "Protected"} />
              <SavedFact label="IFSC" value={selectedApplication.ifscCode} />
              <SavedFact label="Employment" value={selectedApplication.employmentType} />
              <SavedFact label="Eligibility Status" value={formatApplicationStatus(selectedApplication.status)} />
              <SavedFact label="Fraud" value={`${selectedApplication.fraudLevel || "-"} / ${selectedApplication.fraudScore ?? "-"}`} />
              <SavedFact label="Auto Device Risk" value={selectedApplication.deviceRisk} />
              <SavedFact label="Payment" value={`${selectedApplication.paymentStatus || "UNPAID"} ${selectedApplication.paymentReference ? `(${selectedApplication.paymentReference})` : ""}`} />
              <SavedFact label="Purpose" value={selectedApplication.loanPurpose} />
              <SavedFact label="Address" value={selectedApplication.address} wide />
              <SavedFact label="Automatic Verification" value={selectedApplication.verificationSummary} wide />
              <SavedFact label="Decision Reason" value={selectedApplication.decisionReason} wide />
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => handleDownloadApplicationSummary(selectedApplication)} sx={{ textTransform: "none", fontWeight: 900 }}>Download summary</Button>
          {selectedApplication?.paymentStatus !== "PAID" && (
            <Button onClick={() => handleOpenSavedPayment(selectedApplication)} disabled={!selectedApplication?.loanOffer} variant="outlined" sx={{ textTransform: "none", fontWeight: 900 }}>Pay fee</Button>
          )}
          <Button onClick={() => setSelectedApplication(null)} variant="contained" sx={{ textTransform: "none", fontWeight: 900 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #f8fafc, #ecfeff)",
            color: "#0f172a"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Processing Fee Payment</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info" sx={alertStyleBySeverity.info}>
              Demo mode: no real money moves. Application #{applicationResult?.id} ka backend-calculated fee aur lender checkout me locked rahenge.
            </Alert>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ecfeff" }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Rs. {selectedMetrics.processingFee.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <Grid container spacing={1.25}>
              {paymentGatewayOptions.map((method) => (
                <Grid size={{ xs: 12, sm: 6 }} key={method.id}>
                  <PaymentMethodCard
                    method={method}
                    selected={paymentMethod === method.id}
                    onSelect={() => setPaymentMethod(method.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPaymentOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<PaymentsIcon />}
            onClick={handlePayProcessingFee}
            disabled={!applicationResult?.id || applicationResult?.paymentStatus === "PAID"}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
          >
            Continue with {selectedPayment.label}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={gatewayOpen}
        onClose={() => !paying && setGatewayOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #ffffff, #ecfeff)",
            color: "#0f172a",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#0f766e",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.86, fontWeight: 800 }}>
              Secure Demo Checkout
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {selectedPayment.label}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Chip label="SIMULATION" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 900 }} />
            <Chip label={selectedPayment.rail} sx={{ bgcolor: "#ccfbf1", color: "#0f766e", fontWeight: 900 }} />
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <PaymentProgress steps={gatewayProgress} failed={gatewayStep === "failed"} />

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f0fdfa", border: "1px solid rgba(13, 148, 136, 0.18)" }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                Available Balance
              </Typography>
              <Typography variant="h5" sx={{ color: "#0f172a", fontWeight: 900 }}>
                Rs. {Number(balance || 0).toLocaleString("en-IN")}
              </Typography>
              <Typography variant="body2" sx={{ color: "#475569" }}>
                Payment successful hote hi ye amount expenses me add hoga aur balance deduct hoga.
              </Typography>
            </Box>

            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Payment amount"
                  type="number"
                  value={gatewayAmount}
                  onChange={(event) => setGatewayAmount(validatePaymentAmount(event.target.value))}
                  fullWidth
                  required
                  sx={gatewayInputStyle}
                  slotProps={{
                    input: { readOnly: isLoanFeeCheckout },
                    htmlInput: { min: 0.01, step: 0.01 }
                  }}
                  helperText={isLoanFeeCheckout ? "Locked to the backend-calculated processing fee." : "Enter the demo payment amount."}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Payee / recipient name"
                  value={paymentRecipient}
                  onChange={(event) => setPaymentRecipient(event.target.value)}
                  fullWidth
                  required
                  sx={gatewayInputStyle}
                  slotProps={{ input: { readOnly: isLoanFeeCheckout } }}
                  helperText={isLoanFeeCheckout ? "Locked to the selected lender application." : "Enter a demo recipient."}
                />
              </Grid>
            </Grid>

            {["gpay", "phonepe", "upi"].includes(paymentMethod) ? (
              <TextField
                label="UPI ID"
                value={payerUpi}
                onChange={(event) => setPayerUpi(event.target.value.trim())}
                error={Boolean(payerUpi) && !isValidUpiId(payerUpi)}
                helperText="Example: name@upi"
                fullWidth
                sx={gatewayInputStyle}
              />
            ) : paymentMethod === "card" ? (
              <Grid container spacing={1.25}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth sx={gatewayInputStyle}>
                    <InputLabel>Card Type</InputLabel>
                    <Select label="Card Type" value={cardType} onChange={(event) => setCardType(event.target.value)}>
                      {cardTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField 
                    label="Card number" 
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, ""))}
                    fullWidth 
                    sx={gatewayInputStyle}
                    placeholder="Enter 16-digit card number"
                    slotProps={{ htmlInput: { maxLength: 16 } }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField 
                    label="Expiry (MM/YY)" 
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(event.target.value.replace(/[^\d/]/g, ""))}
                    fullWidth 
                    sx={gatewayInputStyle}
                    placeholder="MM/YY"
                    slotProps={{ htmlInput: { maxLength: 5 } }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField 
                    label="CVV" 
                    value={cardCvv}
                    onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, ""))}
                    fullWidth 
                    sx={gatewayInputStyle}
                    placeholder="123"
                    slotProps={{ htmlInput: { maxLength: 4 } }}
                    type="password"
                  />
                </Grid>
              </Grid>
            ) : (
              <FormControl fullWidth sx={gatewayInputStyle}>
                <InputLabel>Bank</InputLabel>
                <Select label="Bank" value={selectedBank} onChange={(event) => setSelectedBank(event.target.value)}>
                  {banksList.map((bank) => (
                    <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: gatewayStep === "success" ? "#dcfce7" : gatewayStep === "failed" ? "#fef2f2" : "#eff6ff",
                border: `1px solid ${gatewayStep === "success" ? "#86efac" : gatewayStep === "failed" ? "#fca5a5" : "#93c5fd"}`
              }}
            >
              <Typography sx={{ color: gatewayStep === "success" ? "#047857" : gatewayStep === "failed" ? "#b91c1c" : "#1d4ed8", fontWeight: 900 }}>
                {gatewayStep === "success"
                  ? "Payment successful"
                  : gatewayStep === "failed"
                    ? "Payment failed safely"
                    : gatewayStep === "processing"
                      ? "Processing payment..."
                      : "Ready for payment authorization"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#475569" }}>
                {gatewayStep === "success"
                  ? isLoanFeeCheckout
                    ? "Backend payment status updated to PAID and expense ledger balance deducted."
                    : "Payment saved in expenses, so dashboard balance is deducted."
                  : gatewayStep === "failed"
                    ? "No success receipt was issued. Review the message above and retry with a new reference."
                    : isLoanFeeCheckout
                      ? "Verify the locked fee and lender, then authorize the demo payment."
                      : "Fill amount and recipient, then authorize to record the payment in expense ledger."}
              </Typography>
              {gatewayStep === "success" && formattedLastPaymentAt && (
                <Typography variant="caption" sx={{ color: "#047857", fontWeight: 900 }}>
                  Paid on {formattedLastPaymentAt}
                </Typography>
              )}
            </Box>

            {gatewayStep === "success" && latestReceipt && (
              <PaymentReceiptCard receipt={latestReceipt} onDownload={() => handleDownloadReceipt(latestReceipt)} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGatewayOpen(false)} disabled={paying} sx={{ textTransform: "none", fontWeight: 800 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={paying ? <CircularProgress size={18} color="inherit" /> : <PaymentsIcon />}
            onClick={handleCompleteGatewayPayment}
            disabled={paying || gatewayStep === "success"}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
          >
            {gatewayStep === "failed" ? "Retry with new reference" : "Authorize Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" variant="filled" onClose={() => setSnackbarOpen(false)}>
          Loan workflow updated successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
};

const iconBoxStyle = (color, size = 48) => ({
  width: size,
  height: size,
  borderRadius: 2,
  bgcolor: `${color}18`,
  color,
  display: "grid",
  placeItems: "center"
});


const LoanFact = ({ label, value }) => (
  <Grid size={{ xs: 6, md: 3 }}>
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: "#e0f2fe",
        border: "1px solid rgba(37, 99, 235, 0.12)"
      }}
    >
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#0f172a", fontWeight: 900 }}>{value}</Typography>
    </Box>
  </Grid>
);

const formatApplicationStatus = (status) => String(status || "SUBMITTED")
  .toLowerCase()
  .replaceAll("_", " ")
  .replace(/\b\w/g, (character) => character.toUpperCase());

const formatApplicationDate = (value) => {
  if (!value) return "Date not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date not recorded"
    : parsed.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};


const ApplicationJourney = ({ application }) => {
  const status = application.status || "SUBMITTED";
  const isPreApproved = status === "PRE_APPROVED";
  const steps = [
    { label: "Submitted", detail: "Application saved", complete: true },
    { label: "Verification", detail: "KYC and fraud checks completed", complete: Boolean(application.status) },
    {
      label: isPreApproved ? "Pre-approved" : "Review decision",
      detail: status.replaceAll("_", " "),
      complete: Boolean(application.status),
      warning: !isPreApproved
    },
    {
      label: "Processing fee",
      detail: application.paymentStatus === "PAID" ? "Payment verified" : "Pending",
      complete: application.paymentStatus === "PAID"
    }
  ];

  return (
    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <Typography sx={{ color: "#0f172a", fontWeight: 900, mb: 1.5 }}>Application journey</Typography>
      <Grid container spacing={1}>
        {steps.map((step, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={step.label}>
            <Box
              sx={{
                height: "100%",
                p: 1.25,
                borderRadius: 2,
                bgcolor: step.complete ? (step.warning ? "#fff7ed" : "#ecfdf5") : "#ffffff",
                border: `1px solid ${step.complete ? (step.warning ? "#fdba74" : "#86efac") : "#cbd5e1"}`
              }}
            >
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 900 }}>
                STEP {index + 1}
              </Typography>
              <Typography sx={{ color: "#0f172a", fontWeight: 900 }}>{step.label}</Typography>
              <Typography variant="caption" sx={{ color: "#475569" }}>
                {step.detail}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const SavedFact = ({ label, value, wide = false }) => (
  <Grid size={{ xs: 12, sm: wide ? 12 : 6 }}>
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#ecfeff" }}>
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#0f172a", fontWeight: 900 }}>
        {value || "-"}
      </Typography>
    </Box>
  </Grid>
);

const DetailBlock = ({ title, text }) => (
  <Box>
    <Typography sx={{ color: "#0f172a", fontWeight: 900, mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: "#475569" }}>
      {text}
    </Typography>
  </Box>
);

const ScoreRow = ({ icon, title, subtitle, color, value }) => (
  <Box>
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", mb: 0.75 }}>
      <Box sx={{ color, display: "flex" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "#0f172a", fontWeight: 900 }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>{subtitle}</Typography>
      </Box>
    </Box>
    <LinearProgress variant="determinate" value={Math.max(0, Math.min(value, 100))} sx={{ height: 8, borderRadius: 8, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: color } }} />
  </Box>
);

const ComparisonRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, py: 0.6 }}>
    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography variant="caption" sx={{ color: "#0f172a", fontWeight: 900, textAlign: "right" }}>
      {value}
    </Typography>
  </Box>
);

const paymentIconMap = {
  gpay: SmartphoneIcon,
  phonepe: AccountBalanceWalletIcon,
  upi: PaymentsIcon,
  card: CreditCardIcon,
  netbanking: AccountBalanceIcon
};

const PaymentProgress = ({ steps, failed = false }) => (
  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
    <Typography variant="caption" sx={{ color: "#475569", fontWeight: 900 }}>
      PAYMENT PROGRESS
    </Typography>
    <Grid container spacing={1} sx={{ mt: 0.25 }}>
      {steps.map((step, index) => {
        const failedStep = failed && index === 2;
        return (
          <Grid size={{ xs: 6, sm: 3 }} key={step.label}>
            <Box
              sx={{
                height: "100%",
                p: 1,
                borderRadius: 1.5,
                bgcolor: failedStep ? "#fef2f2" : step.complete ? "#ecfdf5" : "#ffffff",
                border: `1px solid ${failedStep ? "#fca5a5" : step.complete ? "#86efac" : "#cbd5e1"}`
              }}
            >
              <Typography variant="caption" sx={{ color: failedStep ? "#b91c1c" : step.complete ? "#166534" : "#64748b", fontWeight: 900 }}>
                {failedStep ? "FAILED" : step.complete ? "DONE" : `STEP ${index + 1}`}
              </Typography>
              <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800 }}>
                {step.label}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  </Box>
);

const PaymentReceiptCard = ({ receipt, onDownload }) => (
  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #86efac" }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
      <Box>
        <Typography sx={{ color: "#166534", fontWeight: 900 }}>Demo payment receipt</Typography>
        <Typography variant="caption" sx={{ color: "#64748b" }}>No real money was transferred.</Typography>
      </Box>
      <Chip size="small" label={receipt.status} sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 900 }} />
    </Box>
    <ComparisonRow label="Reference" value={receipt.reference} />
    <ComparisonRow label="Amount" value={`Rs. ${receipt.amount.toLocaleString("en-IN")}`} />
    <ComparisonRow label="Recipient" value={receipt.recipient} />
    <ComparisonRow label="Method" value={`${receipt.methodLabel} · ${receipt.paymentIdentity}`} />
    <ComparisonRow label="Paid at" value={new Date(receipt.paidAt).toLocaleString("en-IN")} />
    <Button onClick={onDownload} variant="outlined" size="small" sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontWeight: 900 }}>
      Download receipt
    </Button>
  </Box>
);

const PaymentMethodCard = ({ method, selected, onSelect, compact = false }) => {
  const MethodIcon = paymentIconMap[method.id] || PaymentsIcon;

  return (
    <Button
      fullWidth
      onClick={onSelect}
      sx={{
        justifyContent: "flex-start",
        gap: 1.25,
        p: compact ? 1.25 : 1.5,
        minHeight: compact ? 104 : 110,
        borderRadius: 2,
        textAlign: "left",
        textTransform: "none",
        border: selected ? "2px solid #7950f2" : "1px solid #dfe5fa",
        bgcolor: selected ? "#f5f1ff" : "#ffffff",
        color: "#0f172a",
        "&:hover": {
          bgcolor: selected ? "#ede5ff" : "#f8fafc"
        }
      }}
    >
      <Box
        sx={{
          width: compact ? 52 : 48,
          height: compact ? 52 : 48,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: selected ? "#7547ea" : "rgba(37, 99, 235, 0.12)",
          color: selected ? "#ffffff" : "#2563eb",
          flex: "0 0 auto"
        }}
      >
        <MethodIcon />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "#0f172a", fontWeight: 900, lineHeight: 1.2 }}>
          {method.label}
        </Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
          {method.rail}
        </Typography>
        <Typography variant="body2" sx={{ color: "#475569", display: compact ? "none" : "block" }}>
          {method.helper}
        </Typography>
      </Box>
    </Button>
  );
};

const panelStyle = {
  borderRadius: 3,
  background: "#ffffff",
  border: "1px solid rgba(14, 116, 144, 0.16)",
  boxShadow: "0 4px 20px rgba(69,75,135,.04)",
  color: "#0f172a",
  "& .MuiInputLabel-root": {
    color: "#334155"
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#0d9488"
  },
  "& .MuiInputBase-input": {
    color: "#0f172a"
  },
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255, 255, 255, 0.64)",
    color: "#0f172a",
    "& fieldset": {
      borderColor: "rgba(14, 116, 144, 0.22)"
    },
    "&:hover fieldset": {
      borderColor: "rgba(13, 148, 136, 0.55)"
    },
    "&.Mui-focused fieldset": {
      borderColor: "#0d9488"
    }
  },
  "& .MuiSelect-select": {
    color: "#0f172a"
  },
  "& .MuiFormControlLabel-label": {
    color: "#0f172a"
  },
  "& .MuiCheckbox-root": {
    color: "#0d9488"
  }
};

const alertStyleBySeverity = {
  info: {
    borderRadius: 2,
    color: "#075985",
    bgcolor: "#f0f9ff",
    border: "1px solid #7dd3fc",
    "& .MuiAlert-icon": { color: "#0284c7" }
  },
  success: {
    borderRadius: 2,
    color: "#166534",
    bgcolor: "#ecfdf5",
    border: "1px solid #86efac",
    "& .MuiAlert-icon": { color: "#16a34a" }
  },
  warning: {
    borderRadius: 2,
    color: "#9a3412",
    bgcolor: "#fff7ed",
    border: "1px solid #fdba74",
    "& .MuiAlert-icon": { color: "#ea580c" }
  },
  error: {
    borderRadius: 2,
    color: "#991b1b",
    bgcolor: "#fef2f2",
    border: "1px solid #fca5a5",
    "& .MuiAlert-icon": { color: "#dc2626" }
  }
};

const marketplaceFilterStyle = {
  "& .MuiInputLabel-root": {
    color: "#475569"
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#0f766e"
  },
  "& .MuiInputBase-root": {
    color: "#0f172a",
    backgroundColor: "#ffffff"
  },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    color: "#0f172a",
    WebkitTextFillColor: "#0f172a",
    fontWeight: 700
  },
  "& .MuiSelect-icon": {
    color: "#475569"
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#94a3b8" },
    "&:hover fieldset": { borderColor: "#0d9488" },
    "&.Mui-focused fieldset": { borderColor: "#0d9488" }
  }
};

const gatewayInputStyle = {
  "& .MuiInputLabel-root": {
    color: "#334155"
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#0d9488"
  },
  "& .MuiInputBase-input": {
    color: "#0f172a"
  },
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    "& fieldset": {
      borderColor: "rgba(14, 116, 144, 0.24)"
    },
    "&:hover fieldset": {
      borderColor: "#0d9488"
    },
    "&.Mui-focused fieldset": {
      borderColor: "#0d9488"
    }
  },
  "& .MuiSelect-select": {
    color: "#0f172a"
  }
};

export default LoanSection;
