package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoanApplicationRequestDTO {

    @NotNull(message = "Loan offer is required")
    private Long loanOfferId;

    @NotBlank(message = "Applicant name is required")
    @Size(max = 120)
    private String applicantName;

    @Email(message = "Enter a valid email")
    private String email;

    @NotNull
    @DecimalMin(value = "0.01", message = "Monthly income must be greater than 0")
    private Double monthlyIncome;

    @NotNull
    @DecimalMin(value = "0.01", message = "Requested amount must be greater than 0")
    private Double requestedAmount;

    @NotNull
    @Min(300)
    @Max(900)
    private Integer creditScore;

    @NotNull
    @Min(1)
    private Integer tenureMonths;

    private String aadhaarNumber;

    private String panNumber;

    private String passportPhotoUrl;

    @Size(max = 5_000_000, message = "Passport photo is too large")
    private String passportPhotoDataUrl;

    private String aadhaarDocumentUrl;

    @Size(max = 5_000_000, message = "Aadhaar document is too large")
    private String aadhaarDocumentDataUrl;

    private String panDocumentUrl;

    @Size(max = 5_000_000, message = "PAN document is too large")
    private String panDocumentDataUrl;

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

    private String address;
}
