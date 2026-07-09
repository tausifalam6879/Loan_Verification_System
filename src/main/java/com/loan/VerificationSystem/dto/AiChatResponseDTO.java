package com.loan.VerificationSystem.dto;

import java.util.List;

public record AiChatResponseDTO(
        String answer,
        boolean usedContext,
        List<String> suggestedQuestions,
        String provider,
        String model,
        boolean liveProvider
) {
}
