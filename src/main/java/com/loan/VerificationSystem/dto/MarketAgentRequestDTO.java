package com.loan.VerificationSystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record MarketAgentRequestDTO(
        @NotBlank @Size(max = 1200) String message,
        @Size(max = 20) String symbol,
        List<Map<String, Object>> recentMessages
) {
}
