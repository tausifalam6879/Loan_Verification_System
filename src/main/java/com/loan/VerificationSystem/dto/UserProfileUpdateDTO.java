package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateDTO {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be 100 characters or fewer")
    private String fullName;

    @Pattern(regexp = "^$|^[0-9+\\-\\s]{10,20}$", message = "Invalid mobile number")
    private String mobile;
}
