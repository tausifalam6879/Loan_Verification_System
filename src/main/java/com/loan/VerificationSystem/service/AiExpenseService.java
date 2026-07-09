package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.dto.ExpenseCategoryRequestDTO;
import com.loan.VerificationSystem.dto.ExpenseCategoryResponseDTO;
import com.loan.VerificationSystem.dto.ExpensePredictionScoreDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AiExpenseService {

    private final RestClient restClient;

    public AiExpenseService(@Value("${app.ai.service-url:http://localhost:8000}") String aiServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }

    public ExpenseCategoryResponseDTO predictCategory(ExpenseCategoryRequestDTO request) {
        try {
            ExpenseCategoryResponseDTO response = restClient.post()
                    .uri("/expense-category")
                    .body(Map.of("description", request.description()))
                    .retrieve()
                    .body(ExpenseCategoryResponseDTO.class);

            if (response != null) {
                return new ExpenseCategoryResponseDTO(
                        response.category(),
                        response.confidence(),
                        response.modelVersion(),
                        "python-ml-service",
                        response.topPredictions()
                );
            }
        } catch (RestClientException ignored) {
            // Keep the main app usable when the optional Python ML service is offline.
        }

        return fallbackPrediction(request.description());
    }

    private ExpenseCategoryResponseDTO fallbackPrediction(String description) {
        String text = description == null ? "" : description.toLowerCase(Locale.ROOT);
        String category = "Other";
        double confidence = 0.48;

        if (containsAny(text, "zomato", "swiggy", "food", "dinner", "lunch", "pizza", "grocery")) {
            category = "Food";
            confidence = 0.72;
        } else if (containsAny(text, "uber", "ola", "metro", "train", "bus", "petrol", "fuel", "flight")) {
            category = "Travel";
            confidence = 0.72;
        } else if (containsAny(text, "recharge", "bill", "electricity", "wifi", "rent", "emi", "insurance")) {
            category = "Bills";
            confidence = 0.7;
        } else if (containsAny(text, "amazon", "flipkart", "myntra", "shopping", "clothes", "shoes", "mobile")) {
            category = "Shopping";
            confidence = 0.7;
        } else if (containsAny(text, "doctor", "medicine", "hospital", "clinic", "pharmacy")) {
            category = "Health";
            confidence = 0.68;
        }

        return new ExpenseCategoryResponseDTO(
                category,
                confidence,
                "java-keyword-fallback",
                "spring-fallback",
                List.of(new ExpensePredictionScoreDTO(category, confidence))
        );
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
