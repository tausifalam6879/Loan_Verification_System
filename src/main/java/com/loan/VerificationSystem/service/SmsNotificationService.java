package com.loan.VerificationSystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

@Service
public class SmsNotificationService {

    private final boolean smsEnabled;
    private final boolean whatsappEnabled;
    private final String twilioAccountSid;
    private final String twilioAuthToken;
    private final String smsFrom;
    private final String whatsappFrom;
    private final String defaultCountryCode;
    private final RestClient twilioClient;

    public SmsNotificationService(
            @Value("${app.sms.enabled:false}") boolean smsEnabled,
            @Value("${app.whatsapp.enabled:false}") boolean whatsappEnabled,
            @Value("${twilio.account-sid:}") String twilioAccountSid,
            @Value("${twilio.auth-token:}") String twilioAuthToken,
            @Value("${twilio.sms-from:}") String smsFrom,
            @Value("${twilio.whatsapp-from:}") String whatsappFrom,
            @Value("${twilio.api-base-url:https://api.twilio.com}") String twilioApiBaseUrl,
            @Value("${app.sms.default-country-code:+91}") String defaultCountryCode,
            @Value("${app.otp.provider-connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${app.otp.provider-read-timeout-ms:10000}") int readTimeoutMs
    ) {
        this.smsEnabled = smsEnabled;
        this.whatsappEnabled = whatsappEnabled;
        this.twilioAccountSid = twilioAccountSid;
        this.twilioAuthToken = twilioAuthToken;
        this.smsFrom = smsFrom;
        this.whatsappFrom = whatsappFrom;
        this.defaultCountryCode = normalizeCountryCode(defaultCountryCode);

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(Math.max(connectTimeoutMs, 1000)));
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(readTimeoutMs, 1000)));
        this.twilioClient = RestClient.builder()
                .baseUrl(twilioApiBaseUrl)
                .defaultHeaders(headers -> headers.setBasicAuth(twilioAccountSid, twilioAuthToken))
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isSmsEnabled() {
        return smsEnabled && hasTwilioConfig() && hasText(smsFrom);
    }

    public boolean isWhatsappEnabled() {
        return whatsappEnabled && hasTwilioConfig() && hasText(whatsappFrom);
    }

    public void sendSmsRequired(String to, String body) {
        if (!isSmsEnabled()) {
            throw new IllegalStateException("SMS OTP provider is not configured.");
        }
        sendTwilioMessage(normalizePhone(smsFrom), normalizePhone(to), body);
    }

    public void sendWhatsappRequired(String to, String body) {
        if (!isWhatsappEnabled()) {
            throw new IllegalStateException("WhatsApp OTP provider is not configured.");
        }
        sendTwilioMessage(formatWhatsapp(whatsappFrom), formatWhatsapp(to), body);
    }

    private void sendTwilioMessage(String from, String to, String body) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("From", from);
            form.add("To", to);
            form.add("Body", body);

            twilioClient.post()
                    .uri("/2010-04-01/Accounts/{sid}/Messages.json", twilioAccountSid)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            throw new IllegalStateException("OTP delivery failed: " + ex.getMessage(), ex);
        }
    }

    private boolean hasTwilioConfig() {
        return hasText(twilioAccountSid) && hasText(twilioAuthToken);
    }

    private String normalizePhone(String value) {
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

    private String formatWhatsapp(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.regionMatches(true, 0, "whatsapp:", 0, "whatsapp:".length())) {
            normalized = normalized.substring("whatsapp:".length());
        }
        return "whatsapp:" + normalizePhone(normalized);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalizeCountryCode(String value) {
        String normalized = value == null ? "+91" : value.trim();
        return normalized.startsWith("+") ? normalized : "+" + normalized;
    }
}
