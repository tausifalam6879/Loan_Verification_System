package com.loan.VerificationSystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.LoanOffer;
import com.loan.VerificationSystem.repository.LoanApplicationRepository;
import com.loan.VerificationSystem.repository.LoanOfferRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class LoanService {

    private final LoanOfferRepository loanOfferRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String fraudServiceUrl;

    private static final Pattern AADHAAR_PATTERN = Pattern.compile("^[2-9][0-9]{11}$");
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");
    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    private static final Pattern ACCOUNT_PATTERN = Pattern.compile("^[0-9]{9,18}$");
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    public LoanService(LoanOfferRepository loanOfferRepository,
                       LoanApplicationRepository loanApplicationRepository,
                       ObjectMapper objectMapper,
                       @Value("${ai.fraud.service.url:http://localhost:8000/fraud-score}") String fraudServiceUrl) {
        this.loanOfferRepository = loanOfferRepository;
        this.loanApplicationRepository = loanApplicationRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.fraudServiceUrl = fraudServiceUrl;
    }

    public List<LoanOffer> getAllOffers() {
        return loanOfferRepository.findAll();
    }

    public LoanOffer getOffer(Long id) {
        return loanOfferRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan offer not found: " + id));
    }

    public List<LoanApplication> getApplications() {
        return loanApplicationRepository.findAll();
    }

    public LoanApplication apply(LoanApplication request) {
        LoanOffer offer = getOffer(request.getLoanOffer().getId());
        request.setLoanOffer(offer);
        normalizeApplication(request);

        VerificationResult verificationResult = runAutomaticVerification(request, offer);
        request.setIdentityMismatch(verificationResult.identityMismatch());
        request.setDuplicateApplicant(verificationResult.duplicateApplicant());
        request.setDeviceRisk(verificationResult.deviceRisk());
        request.setIpCountryMatchesKyc(verificationResult.ipCountryMatchesKyc());
        request.setVerificationSummary(String.join(" ", verificationResult.reasons()));

        FraudResult fraudResult = getAiFraudScore(request)
                .orElseGet(() -> calculateFraudScore(request, verificationResult));
        request.setFraudScore(fraudResult.score());
        request.setFraudLevel(fraudResult.level());
        request.setDecisionReason(fraudResult.reason() + " " + request.getVerificationSummary());

        if (fraudResult.score() >= 70) {
            request.setStatus("BLOCKED_FRAUD_REVIEW");
        } else if (verificationResult.hasCriticalFailure()) {
            request.setStatus("NEEDS_DOCUMENT_REVIEW");
        } else if (request.getCreditScore() < offer.getMinCreditScore()) {
            request.setStatus("NEEDS_CREDIT_REVIEW");
        } else if (request.getRequestedAmount() > offer.getMaxAmount()) {
            request.setStatus("AMOUNT_ABOVE_BANK_LIMIT");
        } else if (request.getRequestedAmount() > request.getMonthlyIncome() * 20) {
            request.setStatus("NEEDS_INCOME_REVIEW");
        } else if (request.getExistingEmi() != null
                && request.getExistingEmi() > request.getMonthlyIncome() * 0.45) {
            request.setStatus("EXISTING_EMI_TOO_HIGH");
        } else {
            request.setStatus("PRE_APPROVED");
        }

        return loanApplicationRepository.save(request);
    }

    public LoanApplication markProcessingFeePaid(Long id, PaymentRequest paymentRequest) {
        LoanApplication application = loanApplicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + id));
        application.setProcessingFeePaid(true);
        application.setPaymentStatus("PAID");
        application.setPaymentReference(
                paymentRequest.reference() == null || paymentRequest.reference().isBlank()
                        ? "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT)
                        : paymentRequest.reference()
        );
        application.setProcessingFeeAmount(paymentRequest.amount());
        return loanApplicationRepository.save(application);
    }

    private void normalizeApplication(LoanApplication request) {
        request.setAadhaarNumber(digitsOnly(request.getAadhaarNumber()));
        request.setPanNumber(upperTrim(request.getPanNumber()));
        request.setIfscCode(upperTrim(request.getIfscCode()));
        request.setBankAccountNumber(digitsOnly(request.getBankAccountNumber()));
        request.setNomineePhone(digitsOnly(request.getNomineePhone()));
        request.setPincode(digitsOnly(request.getPincode()));
        request.setEmail(lowerTrim(request.getEmail()));
    }

    private VerificationResult runAutomaticVerification(LoanApplication request, LoanOffer offer) {
        VerificationResult result = new VerificationResult();

        result.add(valid(AADHAAR_PATTERN, request.getAadhaarNumber()), "Aadhaar format verified.", "Invalid Aadhaar format.");
        result.add(valid(PAN_PATTERN, request.getPanNumber()), "PAN format verified.", "Invalid PAN format.");
        result.add(valid(IFSC_PATTERN, request.getIfscCode()), "IFSC format verified.", "Invalid IFSC format.");
        result.add(valid(ACCOUNT_PATTERN, request.getBankAccountNumber()), "Bank account format verified.", "Invalid bank account number.");
        result.add(valid(PINCODE_PATTERN, request.getPincode()), "Pincode format verified.", "Invalid pincode format.");

        boolean incomeFit = request.getMonthlyIncome() != null
                && request.getRequestedAmount() != null
                && request.getRequestedAmount() <= request.getMonthlyIncome() * 20;
        result.add(incomeFit, "Income-to-loan ratio is acceptable.", "Loan amount is too high against monthly income.");

        boolean duplicate = hasValue(request.getAadhaarNumber()) && loanApplicationRepository.existsByAadhaarNumber(request.getAadhaarNumber())
                || hasValue(request.getPanNumber()) && loanApplicationRepository.existsByPanNumber(request.getPanNumber())
                || hasValue(request.getEmail()) && loanApplicationRepository.existsByEmail(request.getEmail())
                || hasValue(request.getNomineePhone()) && loanApplicationRepository.existsByNomineePhone(request.getNomineePhone());
        result.duplicateApplicant = duplicate;
        if (duplicate) {
            result.reasons.add("Duplicate applicant signal found from Aadhaar/PAN/email/phone.");
        }

        result.identityMismatch = result.hasCriticalFailure() || duplicate;
        result.deviceRisk = detectDeviceRisk(request, offer, duplicate);
        result.ipCountryMatchesKyc = "auto-checked";
        return result;
    }

    private String detectDeviceRisk(LoanApplication request, LoanOffer offer, boolean duplicate) {
        if (duplicate || Boolean.TRUE.equals(request.getIdentityMismatch()) || request.getFailedAttempts() != null && request.getFailedAttempts() >= 4) {
            return "high";
        }
        if (request.getRequestedAmount() != null
                && request.getMonthlyIncome() != null
                && request.getRequestedAmount() > request.getMonthlyIncome() * 18
                || request.getCreditScore() != null && request.getCreditScore() < offer.getMinCreditScore()) {
            return "medium";
        }
        return "low";
    }

    private Optional<FraudResult> getAiFraudScore(LoanApplication request) {
        try {
            FraudRequest fraudRequest = new FraudRequest(
                    request.getApplicantName(),
                    request.getCreditScore(),
                    request.getMonthlyIncome(),
                    request.getRequestedAmount(),
                    request.getFailedAttempts() == null ? 0 : request.getFailedAttempts(),
                    Boolean.TRUE.equals(request.getIdentityMismatch()),
                    request.getDeviceRisk(),
                    true,
                    !"low".equalsIgnoreCase(request.getDeviceRisk())
            );
            String body = objectMapper.writeValueAsString(fraudRequest);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(fraudServiceUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }
            FraudApiResponse apiResponse = objectMapper.readValue(response.body(), FraudApiResponse.class);
            return Optional.of(new FraudResult(apiResponse.risk_score(), apiResponse.risk_level(), String.join(" ", apiResponse.reasons())));
        } catch (Exception error) {
            return Optional.empty();
        }
    }

    private FraudResult calculateFraudScore(LoanApplication request, VerificationResult verificationResult) {
        int score = 10;
        StringBuilder reasons = new StringBuilder();

        if (request.getCreditScore() != null && request.getCreditScore() < 620) {
            score += 24;
            reasons.append("Low credit score. ");
        }

        if (request.getMonthlyIncome() != null && request.getMonthlyIncome() > 0
                && request.getRequestedAmount() > request.getMonthlyIncome() * 18) {
            score += 22;
            reasons.append("Loan amount is high compared with income. ");
        }

        if (Boolean.TRUE.equals(request.getIdentityMismatch())) {
            score += 32;
            reasons.append("KYC identity mismatch. ");
        }

        if (request.getFailedAttempts() != null && request.getFailedAttempts() >= 3) {
            score += 18;
            reasons.append("Multiple failed verification attempts. ");
        }

        if ("medium".equalsIgnoreCase(request.getDeviceRisk())) {
            score += 12;
            reasons.append("Medium device risk. ");
        }

        if ("high".equalsIgnoreCase(request.getDeviceRisk())) {
            score += 22;
            reasons.append("High-risk device or network pattern. ");
        }

        if (Boolean.TRUE.equals(request.getDuplicateApplicant())) {
            score += 24;
            reasons.append("Duplicate applicant details. ");
        }

        if (verificationResult.hasCriticalFailure()) {
            score += 16;
            reasons.append("Automatic document validation failed. ");
        }

        int finalScore = Math.min(score, 100);
        String level = finalScore >= 70 ? "HIGH" : finalScore >= 40 ? "MEDIUM" : "LOW";
        String reason = reasons.isEmpty() ? "No major fraud signals found." : reasons.toString().trim();

        return new FraudResult(finalScore, level, reason);
    }

    private boolean valid(Pattern pattern, String value) {
        return value != null && pattern.matcher(value).matches();
    }

    private String digitsOnly(String value) {
        return value == null ? null : value.replaceAll("[^0-9]", "");
    }

    private String upperTrim(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String lowerTrim(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }

    private record FraudResult(Integer score, String level, String reason) {
    }

    public record PaymentRequest(
            @DecimalMin(value = "0.01", message = "Payment amount must be at least Rs. 0.01")
            Double amount,
            @NotBlank(message = "Payment reference is required")
            String reference) {
    }

    private record FraudRequest(
            String applicant_name,
            Integer credit_score,
            Double monthly_income,
            Double requested_amount,
            Integer failed_attempts,
            Boolean identity_mismatch,
            String device_risk,
            Boolean ip_country_matches_kyc,
            Boolean new_device
    ) {
    }

    private record FraudApiResponse(Integer risk_score, String risk_level, String decision, List<String> reasons) {
    }

    private static class VerificationResult {
        private final List<String> reasons = new java.util.ArrayList<>();
        private boolean identityMismatch;
        private boolean duplicateApplicant;
        private String deviceRisk = "low";
        private String ipCountryMatchesKyc = "unknown";
        private int failures;

        private void add(boolean passed, String success, String failure) {
            reasons.add(passed ? success : failure);
            if (!passed) {
                failures++;
            }
        }

        private boolean hasCriticalFailure() {
            return failures > 0;
        }

        private List<String> reasons() {
            return reasons;
        }

        private boolean identityMismatch() {
            return identityMismatch;
        }

        private boolean duplicateApplicant() {
            return duplicateApplicant;
        }

        private String deviceRisk() {
            return deviceRisk;
        }

        private String ipCountryMatchesKyc() {
            return ipCountryMatchesKyc;
        }
    }
}
