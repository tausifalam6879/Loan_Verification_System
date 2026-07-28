package com.loan.VerificationSystem.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "loan_applications")
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    private LoanOffer loanOffer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String applicantName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true, message = "Monthly income must be 0 or greater")
    private Double monthlyIncome;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true, message = "Requested amount must be 0 or greater")
    private Double requestedAmount;

    @Column(nullable = false)
    @Min(value = 300, message = "Credit score must be between 300 and 900")
    private Integer creditScore;

    @Column(nullable = false)
    @Min(value = 1, message = "Tenure months must be at least 1")
    private Integer tenureMonths;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String aadhaarNumber;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String panNumber;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String passportPhotoUrl;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String aadhaarDocumentUrl;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String panDocumentUrl;

    private String nomineeName;

    private String nomineeRelation;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String nomineePhone;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String bankAccountNumber;

    private String ifscCode;

    private String employmentType;

    private Double existingEmi;

    private String loanPurpose;

    private String city;

    private String pincode;

    @Column(length = 1200)
    private String address;

    @Column(columnDefinition = "LONGTEXT")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String passportPhotoDataUrl;

    @Column(columnDefinition = "LONGTEXT")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String aadhaarDocumentDataUrl;

    @Column(columnDefinition = "LONGTEXT")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String panDocumentDataUrl;

    private Boolean identityMismatch = false;

    @Min(value = 0, message = "Failed attempts must be 0 or greater")
    private Integer failedAttempts = 0;

    private String deviceRisk = "low";

    private String ipCountryMatchesKyc = "unknown";

    private Boolean duplicateApplicant = false;

    private Integer fraudScore;

    private String fraudLevel;

    private String status;

    @Column(length = 1200)
    private String decisionReason;

    @Column(length = 1600)
    private String verificationSummary;

    private Boolean processingFeePaid = false;

    private String paymentStatus = "UNPAID";

    private String paymentReference;

    @DecimalMin(value = "0.0", inclusive = true, message = "Processing fee must be 0 or greater")
    private Double processingFeeAmount;

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @JsonProperty("maskedAadhaarNumber")
    public String maskedAadhaarNumber() {
        return mask(aadhaarNumber, 4);
    }

    @JsonProperty("maskedPanNumber")
    public String maskedPanNumber() {
        return mask(panNumber, 3);
    }

    @JsonProperty("maskedBankAccountNumber")
    public String maskedBankAccountNumber() {
        return mask(bankAccountNumber, 4);
    }

    @JsonProperty("maskedNomineePhone")
    public String maskedNomineePhone() {
        return mask(nomineePhone, 4);
    }

    @JsonProperty("aadhaarDocumentUploaded")
    public boolean aadhaarDocumentUploaded() {
        return hasText(aadhaarDocumentUrl) || hasText(aadhaarDocumentDataUrl);
    }

    @JsonProperty("panDocumentUploaded")
    public boolean panDocumentUploaded() {
        return hasText(panDocumentUrl) || hasText(panDocumentDataUrl);
    }

    private String mask(String value, int visibleDigits) {
        if (!hasText(value)) {
            return "";
        }
        String normalized = value.trim();
        int visible = Math.min(visibleDigits, normalized.length());
        return "X".repeat(Math.max(0, normalized.length() - visible))
                + normalized.substring(normalized.length() - visible);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
