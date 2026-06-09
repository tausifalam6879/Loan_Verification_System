package com.loan.VerificationSystem.dto;

import lombok.Data;

@Data
public class LoanApplicationResponseDTO {

    private Long id;

    private String applicantName;

    private String email;

    private Double requestedAmount;

    private Integer creditScore;

    private String status;

    private Integer fraudScore;

    private String fraudLevel;

    private String decisionReason;

    private Boolean processingFeePaid;

    private String paymentStatus;
}