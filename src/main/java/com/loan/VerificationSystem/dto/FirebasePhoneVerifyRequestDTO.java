package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FirebasePhoneVerifyRequestDTO {

    @NotBlank(message = "Mobile number is required")
    private String mobile;

    @NotBlank(message = "OTP purpose is required")
    private String purpose;

    @NotBlank(message = "Firebase verification proof is required")
    @Size(max = 8192, message = "Firebase verification proof is invalid")
    private String idToken;
}
