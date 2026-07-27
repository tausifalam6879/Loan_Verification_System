package com.loan.VerificationSystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loan.VerificationSystem.dto.MarketAgentRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class MarketIntelligenceService {

    private final RestClient restClient;
    private final String aiServiceUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public MarketIntelligenceService(
            @Value("${app.ai.service-url:http://localhost:8000}") String aiServiceUrl,
            ObjectMapper objectMapper
    ) {
        this.aiServiceUrl = normalizeServiceUrl(aiServiceUrl);
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        this.restClient = RestClient.builder()
                .baseUrl(this.aiServiceUrl)
                .build();
    }

    public Map<String, Object> getOverview(boolean refresh) {
        return get("/market/overview", Map.of("refresh", refresh));
    }

    public Map<String, Object> getAnalysis(String symbol, boolean refresh) {
        return get("/market/analysis", Map.of("symbol", symbol, "refresh", refresh));
    }

    public Map<String, Object> getFactors(boolean refresh) {
        return get("/market/factors", Map.of("refresh", refresh));
    }

    public Map<String, Object> getBreadth(boolean refresh) {
        return get("/market/breadth", Map.of("refresh", refresh));
    }

    public Map<String, Object> getCompany(String symbol, boolean refresh) {
        return get("/market/company", Map.of("symbol", symbol, "refresh", refresh));
    }

    public Map<String, Object> getNewsFeed(boolean refresh) {
        return get("/market/news-feed", Map.of("limit", 12, "refresh", refresh));
    }

    public Map<String, Object> getNews(String symbol) {
        try {
            return requireBody(restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/market/news")
                            .queryParam("symbol", symbol)
                            .queryParam("limit", 8)
                            .build())
                    .retrieve()
                    .body(Map.class));
        } catch (RestClientResponseException error) {
            throw upstreamError(error);
        } catch (RestClientException error) {
            throw unavailable(error);
        }
    }

    public Map<String, Object> askAgent(MarketAgentRequestDTO request) {
        Map<String, Object> payload = Map.of(
                "message", request.message(),
                "symbol", request.symbol() == null ? "" : request.symbol(),
                "recent_messages", request.recentMessages() == null ? List.of() : request.recentMessages()
        );
        try {
            String requestJson = objectMapper.writeValueAsString(payload);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/market/agent"))
                    .timeout(Duration.ofSeconds(90))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Market intelligence upstream error: " + response.body()
                );
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() { });
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw unavailable(error);
        } catch (ResponseStatusException error) {
            throw error;
        } catch (Exception error) {
            throw unavailable(error);
        }
    }

    private Map<String, Object> get(String path, Map<String, ?> queryParams) {
        try {
            Map<?, ?> body;
            if (queryParams == null || queryParams.isEmpty()) {
                body = restClient.get().uri(path).retrieve().body(Map.class);
            } else {
                body = restClient.get()
                        .uri(uriBuilder -> {
                            uriBuilder.path(path);
                            queryParams.forEach(uriBuilder::queryParam);
                            return uriBuilder.build();
                        })
                        .retrieve()
                        .body(Map.class);
            }
            return requireBody(body);
        } catch (RestClientResponseException error) {
            throw upstreamError(error);
        } catch (RestClientException error) {
            throw unavailable(error);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> requireBody(Map<?, ?> body) {
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Market intelligence service returned an empty response.");
        }
        return (Map<String, Object>) body;
    }

    private ResponseStatusException unavailable(Exception error) {
        return new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Market intelligence service is unavailable. Start the Python AI service on port 8000.",
                error
        );
    }

    private ResponseStatusException upstreamError(RestClientResponseException error) {
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Market intelligence upstream error: " + error.getResponseBodyAsString(),
                error
        );
    }

    private static String normalizeServiceUrl(String serviceUrl) {
        String normalized = serviceUrl == null ? "" : serviceUrl.trim().replaceAll("/+$", "");
        if (normalized.isBlank()) {
            return "http://localhost:8000";
        }
        return normalized.matches("^[a-zA-Z][a-zA-Z0-9+.-]*://.*") ? normalized : "http://" + normalized;
    }
}
