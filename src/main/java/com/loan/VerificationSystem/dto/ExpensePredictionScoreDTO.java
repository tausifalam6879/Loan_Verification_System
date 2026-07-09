package com.loan.VerificationSystem.dto;

public record ExpensePredictionScoreDTO(
        String category,
        double confidence
) {
}
