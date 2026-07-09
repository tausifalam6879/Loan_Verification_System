package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpRequestDTO {

    @Email(message = "Invalid email format")
    private String email;

    private String mobile;

    private String channel = "EMAIL";

    @NotBlank(message = "OTP purpose is required")
    private String purpose;
}
