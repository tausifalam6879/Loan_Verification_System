package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UserRequestDTO {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @Pattern(regexp = "^$|^[0-9+\\-\\s]{10,20}$", message = "Invalid mobile number")
    private String mobile;

    @NotBlank(message = "Password is required")
    private String password;

    private String role;

    private String otpToken;

    private String otpChannel = "EMAIL";
}
