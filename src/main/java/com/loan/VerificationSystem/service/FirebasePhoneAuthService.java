package com.loan.VerificationSystem.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FirebasePhoneAuthService {

    private final boolean phoneEnabled;
    private final String apiKey;
    private final String authDomain;
    private final String projectId;
    private final String appId;
    private final String defaultCountryCode;
    private final RestClient identityToolkitClient;

    public FirebasePhoneAuthService(
            @Value("${app.firebase.phone.enabled:false}") boolean phoneEnabled,
            @Value("${app.firebase.web-api-key:}") String apiKey,
            @Value("${app.firebase.auth-domain:}") String authDomain,
            @Value("${app.firebase.project-id:}") String projectId,
            @Value("${app.firebase.app-id:}") String appId,
            @Value("${app.sms.default-country-code:+91}") String defaultCountryCode,
            @Value("${app.firebase.identity-toolkit-base-url:https://identitytoolkit.googleapis.com}") String identityToolkitBaseUrl,
            @Value("${app.otp.provider-connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${app.otp.provider-read-timeout-ms:10000}") int readTimeoutMs
    ) {
        this.phoneEnabled = phoneEnabled;
        this.apiKey = trim(apiKey);
        this.authDomain = trim(authDomain);
        this.projectId = trim(projectId);
        this.appId = trim(appId);
        this.defaultCountryCode = normalizeCountryCode(defaultCountryCode);

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(Math.max(connectTimeoutMs, 1000)));
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(readTimeoutMs, 1000)));
        this.identityToolkitClient = RestClient.builder()
                .baseUrl(identityToolkitBaseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isEnabled() {
        return phoneEnabled
                && hasText(apiKey)
                && hasText(authDomain)
                && hasText(projectId)
                && hasText(appId);
    }

    public Map<String, String> getPublicWebConfig() {
        if (!isEnabled()) {
            return Map.of();
        }

        Map<String, String> config = new LinkedHashMap<>();
        config.put("apiKey", apiKey);
        config.put("authDomain", authDomain);
        config.put("projectId", projectId);
        config.put("appId", appId);
        return config;
    }

    public String verifyIdTokenAndGetPhone(String idToken) {
        if (!isEnabled()) {
            throw new IllegalStateException("Firebase test phone verification is not configured.");
        }

        try {
            AccountLookupResponse response = identityToolkitClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/accounts:lookup")
                            .queryParam("key", apiKey)
                            .build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("idToken", idToken))
                    .retrieve()
                    .body(AccountLookupResponse.class);

            FirebaseUser user = response == null || response.users() == null || response.users().isEmpty()
                    ? null
                    : response.users().get(0);
            if (user == null || user.disabled() || !hasText(user.phoneNumber())) {
                throw new RuntimeException("Firebase phone verification is invalid or expired.");
            }
            return normalizePhone(user.phoneNumber());
        } catch (RestClientResponseException ex) {
            throw new RuntimeException("Firebase phone verification is invalid or expired.", ex);
        } catch (RestClientException ex) {
            throw new IllegalStateException("Firebase phone verification is temporarily unavailable.", ex);
        }
    }

    public String normalizePhone(String value) {
        String normalized = value == null ? "" : value.replaceAll("[\\s()\\-]", "");
        if (normalized.startsWith("00")) {
            normalized = "+" + normalized.substring(2);
        }
        if (!normalized.startsWith("+") && normalized.matches("\\d{10}")) {
            normalized = defaultCountryCode + normalized;
        } else if (!normalized.startsWith("+") && normalized.matches("0\\d{10}")) {
            normalized = defaultCountryCode + normalized.substring(1);
        }
        if (!normalized.matches("\\+[1-9]\\d{7,14}")) {
            throw new IllegalArgumentException("Mobile number must include a valid country code, for example +919876543210.");
        }
        return normalized;
    }

    private String normalizeCountryCode(String value) {
        String normalized = value == null || value.isBlank() ? "+91" : value.trim();
        return normalized.startsWith("+") ? normalized : "+" + normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private record AccountLookupResponse(List<FirebaseUser> users) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FirebaseUser(
            @JsonProperty("phoneNumber") String phoneNumber,
            @JsonProperty("disabled") boolean disabled
    ) {
    }
}
