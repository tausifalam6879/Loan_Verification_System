package com.loan.VerificationSystem.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

    private String aadhaarNumber;

    private String panNumber;

    private String passportPhotoUrl;

    private String nomineeName;

    private String nomineeRelation;

    private String nomineePhone;

    private String bankAccountNumber;

    private String ifscCode;

    private String employmentType;

    private Double existingEmi;

    private String loanPurpose;

    private String city;

    private String pincode;

    @Column(length = 1200)
    private String address;

    @Column(length = 1000)
    private String passportPhotoDataUrl;

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
}
