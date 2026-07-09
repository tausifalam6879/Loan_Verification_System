package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpVerifyRequestDTO {

    @Email(message = "Invalid email format")
    private String email;

    private String mobile;

    private String channel = "EMAIL";

    @NotBlank(message = "OTP purpose is required")
    private String purpose;

    @NotBlank(message = "OTP is required")
    private String otp;
}
