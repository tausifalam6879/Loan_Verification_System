package com.loan.VerificationSystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OtpService.class);

    private final Map<String, OtpEntry> otpEntries = new ConcurrentHashMap<>();
    private final Map<String, TokenEntry> tokenEntries = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final EmailNotificationService emailNotificationService;
    private final SmsNotificationService smsNotificationService;
    private final boolean otpEnabled;
    private final boolean consoleFallbackEnabled;

    public OtpService(EmailNotificationService emailNotificationService,
                      SmsNotificationService smsNotificationService,
                      @Value("${app.otp.enabled:false}") boolean otpEnabled,
                      @Value("${app.otp.console-fallback.enabled:true}") boolean consoleFallbackEnabled) {
        this.emailNotificationService = emailNotificationService;
        this.smsNotificationService = smsNotificationService;
        this.otpEnabled = otpEnabled;
        this.consoleFallbackEnabled = consoleFallbackEnabled;
    }

    public boolean isOtpEnabled() {
        return otpEnabled;
    }

    public OtpDeliveryResult sendOtp(String email, String mobile, String purpose, String channel) {
        if (!otpEnabled) {
            return new OtpDeliveryResult(false, "disabled", null);
        }

        String normalizedChannel = normalizeChannel(channel);
        String destination = resolveDestination(email, mobile, normalizedChannel);
        String normalizedPurpose = normalizePurpose(purpose);
        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        String otpKey = key(destination, normalizedPurpose, normalizedChannel);
        otpEntries.put(otpKey, new OtpEntry(otp, Instant.now().plusSeconds(300)));

        String body = "Your " + normalizedPurpose.toLowerCase(Locale.ROOT) + " OTP is " + otp + ". It expires in 5 minutes.";

        try {
            if ("EMAIL".equals(normalizedChannel) && emailNotificationService.isMailEnabled()) {
                emailNotificationService.sendRequired(destination, "FinTrack OTP Verification", body);
                return new OtpDeliveryResult(true, "email", null);
            }

            if ("MOBILE".equals(normalizedChannel) && smsNotificationService.isSmsEnabled()) {
                smsNotificationService.sendSmsRequired(destination, body);
                return new OtpDeliveryResult(true, "mobile", null);
            }

            if ("WHATSAPP".equals(normalizedChannel) && smsNotificationService.isWhatsappEnabled()) {
                smsNotificationService.sendWhatsappRequired(destination, body);
                return new OtpDeliveryResult(true, "whatsapp", null);
            }
        } catch (RuntimeException ex) {
            otpEntries.remove(otpKey);
            throw ex;
        }

        if (consoleFallbackEnabled) {
            LOGGER.warn("Development OTP for {} {} [{}]: {}", normalizedChannel, destination, normalizedPurpose, otp);
            return new OtpDeliveryResult(true, "console-" + normalizedChannel.toLowerCase(Locale.ROOT), otp);
        }

        otpEntries.remove(otpKey);
        throw new IllegalStateException(normalizedChannel + " OTP provider is not configured.");
    }

    public String verifyOtp(String email, String mobile, String purpose, String otp, String channel) {
        if (!otpEnabled) {
            return null;
        }

        String normalizedChannel = normalizeChannel(channel);
        String destination = resolveDestination(email, mobile, normalizedChannel);
        String normalizedPurpose = normalizePurpose(purpose);
        String otpKey = key(destination, normalizedPurpose, normalizedChannel);
        OtpEntry entry = otpEntries.get(otpKey);
        if (entry == null || entry.expiresAt().isBefore(Instant.now()) || !entry.otp().equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        otpEntries.remove(otpKey);
        String token = UUID.randomUUID().toString();
        tokenEntries.put(token, new TokenEntry(destination, normalizedPurpose, normalizedChannel, Instant.now().plusSeconds(600)));
        return token;
    }

    public void validateToken(String email, String mobile, String purpose, String otpToken, String channel) {
        if (!otpEnabled) {
            return;
        }

        String normalizedChannel = normalizeChannel(channel);
        TokenEntry entry = tokenEntries.remove(otpToken);
        String destination = resolveDestination(email, mobile, normalizedChannel);
        if (entry == null
                || entry.expiresAt().isBefore(Instant.now())
                || !entry.destination().equals(destination)
                || !entry.purpose().equals(normalizePurpose(purpose))
                || !entry.channel().equals(normalizedChannel)) {
            throw new RuntimeException("OTP verification required");
        }
    }

    public void validateToken(String email, String purpose, String otpToken) {
        validateToken(email, null, purpose, otpToken, "EMAIL");
    }

    private String key(String destination, String purpose, String channel) {
        return channel + ":" + destination + ":" + purpose;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePurpose(String purpose) {
        return purpose == null ? "" : purpose.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeChannel(String channel) {
        String normalized = channel == null ? "EMAIL" : channel.trim().toUpperCase(Locale.ROOT);
        if (!normalized.equals("EMAIL") && !normalized.equals("MOBILE") && !normalized.equals("WHATSAPP")) {
            throw new IllegalArgumentException("Unsupported OTP channel");
        }
        return normalized;
    }

    private String resolveDestination(String email, String mobile, String channel) {
        if ("EMAIL".equals(channel)) {
            String normalizedEmail = normalizeEmail(email);
            if (normalizedEmail.isBlank()) {
                throw new IllegalArgumentException("Email is required for Email OTP");
            }
            return normalizedEmail;
        }

        String normalizedMobile = normalizeMobile(mobile);
        if (normalizedMobile.isBlank()) {
            throw new IllegalArgumentException("Mobile number is required for " + channel + " OTP");
        }
        return normalizedMobile;
    }

    private String normalizeMobile(String mobile) {
        return mobile == null ? "" : mobile.replaceAll("[\\s-]", "");
    }

    private record OtpEntry(String otp, Instant expiresAt) {
    }

    private record TokenEntry(String destination, String purpose, String channel, Instant expiresAt) {
    }

    public record OtpDeliveryResult(boolean otpRequired, String deliveryChannel, String developmentOtp) {
    }
}
