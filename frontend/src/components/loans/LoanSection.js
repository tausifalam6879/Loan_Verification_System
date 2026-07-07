import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
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
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
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
import { motion } from "framer-motion";
import { paymentGatewayOptions } from "../../data/financialKnowledge";
import { applyForLoan, getLoanApplications, getLoanOffer, getLoanOffers, payProcessingFee } from "../../services/loanService";
import { uploadLoanDocument } from "../../utils/cloudinaryUpload";
import { calculateCreditBand, calculateEmi, runFraudRiskCheck } from "../../utils/loanCalculations";

const iconMap = {
  credit: CreditScoreIcon,
  home: HomeIcon,
  business: BusinessCenterIcon,
  school: SchoolIcon,
  car: DirectionsCarIcon,
  gold: SavingsIcon
};

const LoanSection = ({ balance = 0, onRecordPayment, view = "loans" }) => {
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
  const [paying, setPaying] = useState(false);
  const [lastPaymentAt, setLastPaymentAt] = useState("");
  
  // Card Payment Fields
  const [cardType, setCardType] = useState("debit");
  const [cardNumber, setCardNumber] = useState("4111111111111111");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  
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
  const [email, setEmail] = useState("demo@fintrack.in");
  const [creditScore, setCreditScore] = useState(735);
  const [monthlyIncome, setMonthlyIncome] = useState(65000);
  const [requestedAmount, setRequestedAmount] = useState(600000);
  const [tenureMonths, setTenureMonths] = useState(48);
  const [identityMismatch, setIdentityMismatch] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(1);
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
    } catch (error) {
      setApiError("Could not load saved loan applications from backend.");
    } finally {
      setLoadingApplications(false);
    }
  };

  // Validation helpers to prevent negative values
  const validatePositiveNumber = (value, min = 0) => {
    const num = Number(value);
    return isNaN(num) || num < min ? "" : value;
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
  const comparisonOffers = ["SBI", "HDFC", "ICICI", "Axis"]
    .map((bankName) =>
      offers.find((offer) =>
        (offer.bank?.shortName || offer.bank?.name || "").toLowerCase().includes(bankName.toLowerCase())
      )
    )
    .filter(Boolean);
  const showLoanMarketplace = view === "loans" || view === "all";
  const showLoanDetails = view === "loans" || view === "all";
  const showPayments = view === "payments" || view === "all";
  const showSavedApplications = view === "applications" || view === "all";
  const sectionCopy = {
    loans: {
      eyebrow: "Phase 2 Loan Aggregator",
      title: "Loan Marketplace",
      description:
        "Real backend offers, backend application save, credit score and fraud risk checks."
    },
    payments: {
      eyebrow: "Dynamic Payment Gateway",
      title: "Payment Gateway",
      description:
        "Open UPI, card or net banking style checkout and record successful payments in the expense ledger."
    },
    applications: {
      eyebrow: "Saved Server Records",
      title: "Saved Loan Applications",
      description:
        "Applications saved through Spring Boot and MySQL open here as detailed SPA cards."
    },
    all: {
      eyebrow: "Phase 2 Loan Aggregator",
      title: "Loan Marketplace",
      description:
        "Real backend offers, backend application save, credit score and fraud risk checks."
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
  const autoDeviceRisk = useMemo(() => {
    if (identityMismatch || Number(failedAttempts) >= 4) {
      return "high";
    }
    if (
      Number(failedAttempts) >= 2 ||
      Number(creditScore) < Number(selectedOffer?.minCreditScore || 620) ||
      Number(requestedAmount) > Number(monthlyIncome) * 18
    ) {
      return "medium";
    }
    return "low";
  }, [creditScore, failedAttempts, identityMismatch, monthlyIncome, requestedAmount, selectedOffer]);
  const creditBand = calculateCreditBand(creditScore);
  const fraudRisk = runFraudRiskCheck({
    creditScore,
    monthlyIncome,
    requestedAmount,
    identityMismatch,
    failedAttempts,
    deviceRisk: autoDeviceRisk
  });
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
    const failedAttemptsNum = Number(failedAttempts);
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

    if (failedAttemptsNum < 0) {
      alert("Failed attempts cannot be negative");
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
        loanOffer: { id: selectedOffer.id },
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
        pincode,
        identityMismatch,
        failedAttempts: failedAttemptsNum,
        deviceRisk: autoDeviceRisk
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
      setApiError("Document upload failed. Check Cloudinary settings or try again.");
    } finally {
      setUploadingDocument("");
    }
  };

  const handlePayProcessingFee = async () => {
    if (!applicationResult?.id) {
      return;
    }
    setPaying(true);
    setApiError("");

    try {
      const amount = Math.max(99, Math.round(Number(requestedAmount || 0) * 0.005));
      const result = await payProcessingFee(applicationResult.id, {
        amount,
        reference: `${paymentMethod.toUpperCase()}-${Date.now()}`
      });
      setApplicationResult(result);
      setLastPaymentAt(new Date().toISOString());
      setPaymentOpen(false);
      setSnackbarOpen(true);
      loadApplications();
    } catch (error) {
      setApiError("Payment update failed. Please check Spring Boot backend.");
    } finally {
      setPaying(false);
    }
  };

  const handleOpenGateway = (methodId = paymentMethod) => {
    setPaymentMethod(methodId);
    setGatewayAmount((current) => current || "");
    setPaymentRecipient((current) =>
      current || selectedOffer?.bank?.name || "Loan Processing Fee"
    );
    setGatewayStep("ready");
    setLastPaymentAt("");
    setGatewayOpen(true);
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
    
    if (amount > Number(balance || 0)) {
      setApiError("Insufficient balance for this payment amount.");
      return;
    }

    setGatewayStep("processing");
    setPaying(true);
    setApiError("");

    try {
      const paidAt = new Date().toISOString();
      if (applicationResult?.id) {
        const result = await payProcessingFee(applicationResult.id, {
          amount,
          reference: `${paymentMethod.toUpperCase()}-${Date.now()}`
        });
        setApplicationResult(result);
        loadApplications();
      }
      if (onRecordPayment) {
        const recorded = await onRecordPayment({
          amount,
          payee: paymentRecipient.trim(),
          method: selectedPayment.label,
          paidAt
        });
        if (!recorded) {
          throw new Error("Payment expense save failed");
        }
      }
      setLastPaymentAt(paidAt);
      setGatewayStep("success");
      setSnackbarOpen(true);
    } catch (error) {
      setGatewayStep("ready");
      setApiError("Payment update failed. Please check Spring Boot backend.");
    } finally {
      setPaying(false);
    }
  };

  const handleOpenSelectedApplication = () => {
    if (selectedOffer) {
      setApplicationOpen(true);
    }
  };

  const scrollToSavedApplications = () => {
    setApplicationOpen(false);
    setPaymentOpen(false);
    window.setTimeout(() => {
      document.getElementById("loan-applications")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };

  return (
    <Box sx={{ mt: 3.5 }}>
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
        <Box>
          <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
            {currentCopy.eyebrow}
          </Typography>
          <Typography variant="h4" sx={{ color: "text.primary", fontWeight: 900 }}>
            {currentCopy.title}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {currentCopy.description}
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
          {showSavedApplications && view !== "applications" && (
            <Button
              variant="outlined"
              onClick={scrollToSavedApplications}
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
                background: "linear-gradient(90deg, #0d9488, #2563eb)",
                color: "#ffffff",
                "&:hover": { background: "linear-gradient(90deg, #0f766e, #1d4ed8)" }
              }}
            >
              Open Application
            </Button>
          )}
        </Stack>
      </Box>

      {apiError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {apiError}
        </Alert>
      )}

      {showLoanMarketplace && (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          border: "1px solid rgba(148, 163, 184, 0.25)",
          background:
            "linear-gradient(135deg, #083344 0%, #0f766e 50%, #2563eb 100%)",
          boxShadow: "0 24px 60px rgba(8, 47, 73, 0.22)"
        }}
      >
        {loadingOffers ? (
          <Box sx={{ py: 6, display: "grid", placeItems: "center", color: "#ffffff" }}>
            <CircularProgress sx={{ color: "#a3e635" }} />
            <Typography sx={{ mt: 2 }}>Loading loan offers from backend...</Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {offers.map((offer) => {
              const loanType = offer.loanType;
              const LoanIcon = iconMap[loanType.iconName] || AccountBalanceIcon;
              const active = offer.id === selectedOffer?.id;
              const color = loanType.color || "#2563eb";

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={offer.id}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                    <Card
                      onClick={() => handleSelectOffer(offer)}
                      elevation={0}
                      sx={{
                        cursor: "pointer",
                        minHeight: 220,
                        borderRadius: 3,
                        border: active ? `2px solid #a3e635` : "1px solid rgba(255,255,255,0.16)",
                        background: active
                          ? "linear-gradient(145deg, #ecfccb, #d9f99d)"
                          : offerCardSurface(color),
                        boxShadow: active
                          ? "0 18px 36px rgba(163, 230, 53, 0.25)"
                          : "0 14px 30px rgba(15, 23, 42, 0.18)",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%"
                      }}
                    >
                      <CardContent sx={{ p: 2, pb: 0, display: "flex", flexDirection: "column", height: "100%", gap: 1.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Box sx={iconBoxStyle(color)}>
                            <LoanIcon />
                          </Box>
                          <Chip
                            size="small"
                            label={`${offer.interestRate}%`}
                            sx={{ bgcolor: "#0f172a", color: "#ffffff", fontWeight: 900 }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ color: "#0f172a", fontWeight: 900, mb: 0.5, fontSize: "1rem" }}>
                            {loanType.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#475569", minHeight: 40, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {loanType.description}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color, fontWeight: 900, mt: 1.5, fontSize: "0.95rem" }}>
                            {offer.bank.shortName} | Rs. {Number(offer.maxAmount).toLocaleString("en-IN")}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                            {offer.minTenureMonths} - {offer.maxTenureMonths} months
                          </Typography>
                          <Button
                            fullWidth
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                              mt: 1.5,
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 900,
                              bgcolor: `${color}18`,
                              color
                            }}
                          >
                            View and Apply
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>
      )}

      {showLoanMarketplace && comparisonOffers.length > 0 && (
        <Card sx={{ ...panelStyle, mt: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Loan Comparison
            </Typography>
            <Typography variant="body2" sx={{ color: "#475569", mb: 2 }}>
              Compare available bank offers side-by-side before applying.
            </Typography>
            <Grid container spacing={1.5}>
              {comparisonOffers.map((offer) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={`compare-${offer.id}`}>
                  <Box
                    sx={{
                      height: "100%",
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                      border: "1px solid rgba(15, 23, 42, 0.1)"
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, color: offer.bank.themeColor || "#2563eb" }}>
                      {offer.bank.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mb: 1.5 }}>
                      {offer.loanType.name}
                    </Typography>
                    <ComparisonRow label="Interest" value={`${offer.interestRate}%`} />
                    <ComparisonRow
                      label="Maximum"
                      value={`Rs. ${Number(offer.maxAmount || 0).toLocaleString("en-IN")}`}
                    />
                    <ComparisonRow
                      label="Tenure"
                      value={`${offer.minTenureMonths}-${offer.maxTenureMonths} months`}
                    />
                    <ComparisonRow label="Credit score" value={`${offer.minCreditScore}+`} />
                    <ComparisonRow label="Fee" value={offer.processingFee || "-"} />
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleSelectOffer(offer)}
                      sx={{ mt: 1.5, textTransform: "none", fontWeight: 900 }}
                    >
                      Select Offer
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

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
              Real Loan Application
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
                        <TextField fullWidth required label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
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
                          <input hidden accept="image/*,.pdf" type="file" onChange={(event) => handleDocumentChange(event, "aadhaar")} />
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
                          <input hidden accept="image/*,.pdf" type="file" onChange={(event) => handleDocumentChange(event, "pan")} />
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
                            <input hidden accept="image/*" type="file" onChange={(event) => handleDocumentChange(event, "photo")} />
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
                          inputProps={{ inputMode: "tel", maxLength: 16 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Bank account number" value={bankAccountNumber} onChange={(event) => setBankAccountNumber(event.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="IFSC code" value={ifscCode} onChange={(event) => setIfscCode(event.target.value.toUpperCase())} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Existing EMI" type="number" value={existingEmi} onChange={(event) => setExistingEmi(validateMonthlyIncome(event.target.value))} inputProps={{ min: 0, step: 0.01 }} />
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
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControlLabel control={<Checkbox checked={identityMismatch} onChange={(event) => setIdentityMismatch(event.target.checked)} />} label="KYC mismatch" />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth label="Failed attempts" type="number" value={failedAttempts} onChange={(event) => setFailedAttempts(validatePositiveNumber(event.target.value, 0))} inputProps={{ min: 0, step: 1 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid rgba(15, 23, 42, 0.12)" }}>
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                            Auto device/IP risk
                          </Typography>
                          <Typography sx={{ color: autoDeviceRisk === "high" ? "#ef4444" : autoDeviceRisk === "medium" ? "#f59e0b" : "#10b981", fontWeight: 900, textTransform: "uppercase" }}>
                            {autoDeviceRisk}
                          </Typography>
                        </Box>
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
                        <Alert severity={applicationResult.fraudLevel === "HIGH" ? "error" : "success"} sx={{ borderRadius: 2 }}>
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
              background: "linear-gradient(90deg, #0d9488, #2563eb)",
              "&:hover": { background: "linear-gradient(90deg, #0f766e, #1d4ed8)" }
            }}
          >
            Submit to Server
          </Button>
        </DialogActions>
      </Dialog>

      {showPayments && (
        <PaymentGatewayOverview
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          onStartPayment={handleOpenGateway}
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
                      {selectedOffer.bank.name} real offer from backend
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                  <LoanFact label="Interest Rate" value={`${selectedOffer.interestRate}% p.a.`} />
                  <LoanFact label="Max Amount" value={`Rs. ${Number(selectedOffer.maxAmount).toLocaleString("en-IN")}`} />
                  <LoanFact label="Tenure" value={`${selectedOffer.minTenureMonths} - ${selectedOffer.maxTenureMonths} months`} />
                  <LoanFact label="Min Score" value={selectedOffer.minCreditScore} />
                </Grid>

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
                  Real Loan Application
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Applicant name" value={applicantName} onChange={(event) => setApplicantName(event.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Credit score" type="number" value={creditScore} onChange={(event) => setCreditScore(validateCreditScore(event.target.value))} inputProps={{ min: 300, max: 900 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Monthly income" type="number" value={monthlyIncome} onChange={(event) => setMonthlyIncome(validateMonthlyIncome(event.target.value))} inputProps={{ min: 0, step: 0.01 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Loan amount" type="number" value={requestedAmount} onChange={(event) => setRequestedAmount(validateLoanAmount(event.target.value))} inputProps={{ min: 0, step: 0.01 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Tenure months" type="number" value={tenureMonths} onChange={(event) => setTenureMonths(validateTenure(event.target.value))} inputProps={{ min: 1, step: 1 }} />
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
                Same values are submitted to Spring Boot and stored with fraud score/status.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel control={<Checkbox checked={identityMismatch} onChange={(event) => setIdentityMismatch(event.target.checked)} />} label="KYC identity mismatch" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Failed attempts" type="number" value={failedAttempts} onChange={(event) => setFailedAttempts(validatePositiveNumber(event.target.value, 0))} inputProps={{ min: 0, step: 1 }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#ecfeff", border: "1px solid rgba(14, 116, 144, 0.14)" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                  Auto device/IP risk
                </Typography>
                <Typography sx={{ color: autoDeviceRisk === "high" ? "#ef4444" : autoDeviceRisk === "medium" ? "#f59e0b" : "#10b981", fontWeight: 900, textTransform: "uppercase" }}>
                  {autoDeviceRisk}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Based on failed attempts, KYC signal, income fit, and credit score.
                </Typography>
              </Box>
            </Grid>
          </Grid>

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
              <Alert severity={applicationResult.fraudLevel === "HIGH" ? "error" : "success"} sx={{ borderRadius: 2 }}>
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
                          onClick={scrollToSavedApplications}
                          sx={{ alignSelf: "flex-start", borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                        >
                          Open Saved Applications
                        </Button>
                      </Stack>
                    )}
        </CardContent>
      </Card>
      )}

      {showSavedApplications && (
      <Box id="loan-applications" sx={{ mt: 2.5 }}>
        <Card sx={panelStyle}>
          <CardContent sx={{ p: 3 }}>
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
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Box sx={iconBoxStyle("#0d9488", 44)}>
                  <AssignmentTurnedInIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Saved Loan Applications
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Applications saved in Spring Boot server and MySQL database.
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                onClick={loadApplications}
                disabled={loadingApplications}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
              >
                Refresh Saved
              </Button>
            </Box>

            {loadingApplications ? (
              <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                <CircularProgress />
              </Box>
            ) : applications.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "#ecfeff",
                  border: "1px dashed rgba(14, 116, 144, 0.28)",
                  textAlign: "center"
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>No saved applications yet</Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Open a loan card, fill details, and submit to server.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1.5}>
                {applications.map((application) => (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={application.id}>
                    <Card
                      onClick={() => setSelectedApplication(application)}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 2,
                        background: "linear-gradient(145deg, #e0f2fe, #f0fdfa)",
                        border: "1px solid rgba(14, 116, 144, 0.16)",
                        boxShadow: "0 10px 24px rgba(8, 47, 73, 0.1)"
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Typography sx={{ fontWeight: 900 }}>
                            #{application.id} {application.applicantName}
                          </Typography>
                          <Chip
                            size="small"
                            label={application.status || "SAVED"}
                            sx={{ bgcolor: "#082f49", color: "#ffffff", fontWeight: 900 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: "#475569", mt: 0.75 }}>
                          {application.loanOffer?.bank?.shortName} | {application.loanOffer?.loanType?.name}
                        </Typography>
                        <Typography sx={{ color: "#2563eb", fontWeight: 900, mt: 1 }}>
                          Rs. {Number(application.requestedAmount || 0).toLocaleString("en-IN")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                          Fraud {application.fraudLevel || "-"} | Score {application.fraudScore ?? "-"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>
      )}

      <Dialog
        open={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Saved Application Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedApplication && (
            <Grid container spacing={1.5}>
              <SavedFact label="Application ID" value={`#${selectedApplication.id}`} />
              <SavedFact label="Applicant" value={selectedApplication.applicantName} />
              <SavedFact label="Email" value={selectedApplication.email} />
              <SavedFact label="Loan" value={selectedApplication.loanOffer?.loanType?.name} />
              <SavedFact label="Bank" value={selectedApplication.loanOffer?.bank?.name} />
              <SavedFact label="Amount" value={`Rs. ${Number(selectedApplication.requestedAmount || 0).toLocaleString("en-IN")}`} />
              <SavedFact label="Aadhaar" value={selectedApplication.aadhaarNumber} />
              <SavedFact label="PAN" value={selectedApplication.panNumber} />
              <SavedFact label="Aadhaar Document" value={selectedApplication.aadhaarDocumentUrl || selectedApplication.aadhaarDocumentDataUrl ? "Uploaded" : "-"} />
              <SavedFact label="PAN Document" value={selectedApplication.panDocumentUrl || selectedApplication.panDocumentDataUrl ? "Uploaded" : "-"} />
              <SavedFact label="Nominee" value={`${selectedApplication.nomineeName || "-"} ${selectedApplication.nomineeRelation ? `(${selectedApplication.nomineeRelation})` : ""}`} />
              <SavedFact label="Nominee Phone" value={selectedApplication.nomineePhone} />
              <SavedFact label="Bank Account" value={selectedApplication.bankAccountNumber} />
              <SavedFact label="IFSC" value={selectedApplication.ifscCode} />
              <SavedFact label="Employment" value={selectedApplication.employmentType} />
              <SavedFact label="Eligibility Status" value={selectedApplication.status} />
              <SavedFact label="Fraud" value={`${selectedApplication.fraudLevel || "-"} / ${selectedApplication.fraudScore ?? "-"}`} />
              <SavedFact label="Auto Device Risk" value={selectedApplication.deviceRisk} />
              <SavedFact label="Payment" value={`${selectedApplication.paymentStatus || "UNPAID"} ${selectedApplication.paymentReference ? `(${selectedApplication.paymentReference})` : ""}`} />
              <SavedFact label="Purpose" value={selectedApplication.loanPurpose} />
              <SavedFact label="Address" value={selectedApplication.address} wide />
              <SavedFact label="Automatic Verification" value={selectedApplication.verificationSummary} wide />
              <SavedFact label="Decision Reason" value={selectedApplication.decisionReason} wide />
              {(selectedApplication.passportPhotoDataUrl || selectedApplication.passportPhotoUrl) && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#ecfeff" }}>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                      Passport Photo
                    </Typography>
                    <Box
                      component="img"
                      src={selectedApplication.passportPhotoDataUrl || selectedApplication.passportPhotoUrl}
                      alt="Applicant passport"
                      sx={{ display: "block", mt: 1, width: 96, height: 96, objectFit: "cover", borderRadius: 2 }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedApplication(null)}>Close</Button>
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
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Demo gateway: application #{applicationResult?.id} ke liye {selectedPayment.label} payment reference se processing fee mark paid hogi.
            </Alert>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ecfeff" }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Rs. {Math.max(99, Math.round(Number(requestedAmount || 0) * 0.005)).toLocaleString("en-IN")}
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
            startIcon={paying ? <CircularProgress size={18} color="inherit" /> : <PaymentsIcon />}
            onClick={handlePayProcessingFee}
            disabled={paying || !applicationResult?.id}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
          >
            Pay with {selectedPayment.label}
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
          <Chip label={selectedPayment.rail} sx={{ bgcolor: "#ccfbf1", color: "#0f766e", fontWeight: 900 }} />
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
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
                  inputProps={{ min: 0.01, step: 0.01 }}
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
                    onChange={(event) => setCardNumber(event.target.value.replace(/\s/g, ''))}
                    fullWidth 
                    sx={gatewayInputStyle}
                    placeholder="Enter 16-digit card number"
                    inputProps={{ maxLength: 16 }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField 
                    label="Expiry (MM/YY)" 
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(event.target.value)}
                    fullWidth 
                    sx={gatewayInputStyle}
                    placeholder="MM/YY"
                    inputProps={{ maxLength: 5 }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField 
                    label="CVV" 
                    value={cardCvv}
                    onChange={(event) => setCardCvv(event.target.value)}
                    fullWidth 
                    sx={gatewayInputStyle}
                    placeholder="123"
                    inputProps={{ maxLength: 4 }}
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
                bgcolor: gatewayStep === "success" ? "#dcfce7" : "#eff6ff",
                border: `1px solid ${gatewayStep === "success" ? "rgba(16, 185, 129, 0.28)" : "rgba(37, 99, 235, 0.18)"}`
              }}
            >
              <Typography sx={{ color: gatewayStep === "success" ? "#047857" : "#1d4ed8", fontWeight: 900 }}>
                {gatewayStep === "success" ? "Payment successful" : gatewayStep === "processing" ? "Processing payment..." : "Ready for payment authorization"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#475569" }}>
                {gatewayStep === "success"
                  ? applicationResult?.id
                    ? "Backend payment status updated to PAID and expense ledger balance deducted."
                    : "Payment saved in expenses, so dashboard balance is deducted."
                  : "Fill amount and recipient, then authorize to record the payment in expense ledger."}
              </Typography>
              {gatewayStep === "success" && formattedLastPaymentAt && (
                <Typography variant="caption" sx={{ color: "#047857", fontWeight: 900 }}>
                  Paid on {formattedLastPaymentAt}
                </Typography>
              )}
            </Box>
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
            Authorize Payment
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

const offerCardSurface = (color) =>
  `linear-gradient(145deg, ${color}1f, rgba(255,255,255,0.9) 48%, ${color}12)`;

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

const PaymentGatewayOverview = ({ paymentMethod, setPaymentMethod, onStartPayment }) => (
  <Card sx={{ ...panelStyle, mt: 2.5 }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          mb: 2
        }}
      >
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={iconBoxStyle("#0d9488", 44)}>
            <PaymentsIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 900 }}>
              Payment Gateway
            </Typography>
            <Typography variant="body2" sx={{ color: "#475569" }}>
              Processing fee payment options shown before and after application save.
            </Typography>
          </Box>
        </Box>
        <Chip
          label="Demo gateway"
          sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: "#ccfbf1", color: "#0f766e", fontWeight: 900 }}
        />
      </Box>

      <Grid container spacing={1.25}>
        {paymentGatewayOptions.map((method) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={method.id}>
            <PaymentMethodCard
              method={method}
              selected={paymentMethod === method.id}
              onSelect={() => {
                setPaymentMethod(method.id);
                onStartPayment(method.id);
              }}
              compact
            />
          </Grid>
        ))}
      </Grid>
    </CardContent>
  </Card>
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
        minHeight: compact ? 76 : 88,
        borderRadius: 2,
        textAlign: "left",
        textTransform: "none",
        border: selected ? "2px solid #0d9488" : "1px solid rgba(15, 23, 42, 0.14)",
        bgcolor: selected ? "#ccfbf1" : "#ffffff",
        color: "#0f172a",
        "&:hover": {
          bgcolor: selected ? "#99f6e4" : "#f8fafc"
        }
      }}
    >
      <Box
        sx={{
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: selected ? "#0d9488" : "rgba(37, 99, 235, 0.12)",
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
  background: "linear-gradient(145deg, #ccfbf1, #eff6ff)",
  border: "1px solid rgba(14, 116, 144, 0.16)",
  boxShadow: "0 14px 35px rgba(8, 47, 73, 0.12)",
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
