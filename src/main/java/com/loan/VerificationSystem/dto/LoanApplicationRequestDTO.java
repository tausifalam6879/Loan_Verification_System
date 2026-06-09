package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class LoanApplicationRequestDTO {

    private Long loanOfferId;

    private String applicantName;

    private String email;

    @DecimalMin(value = "0.0")
    private Double monthlyIncome;

    @DecimalMin(value = "0.0")
    private Double requestedAmount;

    @Min(300)
    private Integer creditScore;

    @Min(1)
    private Integer tenureMonths;

    private String aadhaarNumber;

    private String panNumber;

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