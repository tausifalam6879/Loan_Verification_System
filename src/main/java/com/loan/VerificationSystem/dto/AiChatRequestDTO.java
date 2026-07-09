package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

public record AiChatRequestDTO(
        @NotBlank(message = "Message is required")
        String message,
        String page,
        String conversationId,
        List<AiChatMessageDTO> recentMessages,
        List<AiChatMessageDTO> history,
        Map<String, Object> context
) {
}
