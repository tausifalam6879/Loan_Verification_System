package com.loan.VerificationSystem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ExpenseCategoryResponseDTO(
        String category,
        double confidence,
        @JsonProperty("model_version")
        String modelVersion,
        String source,
        @JsonProperty("top_predictions")
        List<ExpensePredictionScoreDTO> topPredictions
) {
}
