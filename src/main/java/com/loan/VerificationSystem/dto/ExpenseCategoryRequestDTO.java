package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExpenseCategoryRequestDTO(
        @NotBlank(message = "Description is required")
        @Size(min = 2, max = 200, message = "Description must be between 2 and 200 characters")
        String description
) {
}
