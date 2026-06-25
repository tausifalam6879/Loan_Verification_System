package com.loan.VerificationSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OtpResponseDTO {
    private String message;
    private boolean otpRequired;
    private String otpToken;
}
