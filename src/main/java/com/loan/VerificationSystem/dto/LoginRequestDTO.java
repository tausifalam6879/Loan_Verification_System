package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequestDTO {

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^$|^[0-9+\\-\\s]{10,20}$", message = "Invalid mobile number")
    private String mobile;

    private String channel = "PASSWORD";

    private String password;

    private String otpToken;
}
