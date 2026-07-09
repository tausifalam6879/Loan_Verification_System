package com.loan.VerificationSystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class SmsNotificationService {

    private final boolean smsEnabled;
    private final boolean whatsappEnabled;
    private final String twilioAccountSid;
    private final String twilioAuthToken;
    private final String smsFrom;
    private final String whatsappFrom;

    public SmsNotificationService(
            @Value("${app.sms.enabled:false}") boolean smsEnabled,
            @Value("${app.whatsapp.enabled:false}") boolean whatsappEnabled,
            @Value("${twilio.account-sid:}") String twilioAccountSid,
            @Value("${twilio.auth-token:}") String twilioAuthToken,
            @Value("${twilio.sms-from:}") String smsFrom,
            @Value("${twilio.whatsapp-from:}") String whatsappFrom
    ) {
        this.smsEnabled = smsEnabled;
        this.whatsappEnabled = whatsappEnabled;
        this.twilioAccountSid = twilioAccountSid;
        this.twilioAuthToken = twilioAuthToken;
        this.smsFrom = smsFrom;
        this.whatsappFrom = whatsappFrom;
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
        sendTwilioMessage(smsFrom, normalizePhone(to), body);
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

            RestClient.builder()
                    .baseUrl("https://api.twilio.com")
                    .defaultHeaders(headers -> headers.setBasicAuth(twilioAccountSid, twilioAuthToken))
                    .build()
                    .post()
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
        return value == null ? "" : value.replaceAll("[\\s-]", "");
    }

    private String formatWhatsapp(String value) {
        String normalized = normalizePhone(value);
        return normalized.startsWith("whatsapp:") ? normalized : "whatsapp:" + normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
