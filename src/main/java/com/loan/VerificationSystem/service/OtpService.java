package com.loan.VerificationSystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final Map<String, OtpEntry> otpEntries = new ConcurrentHashMap<>();
    private final Map<String, TokenEntry> tokenEntries = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final EmailNotificationService emailNotificationService;
    private final boolean otpEnabled;

    public OtpService(EmailNotificationService emailNotificationService,
                      @Value("${app.otp.enabled:false}") boolean otpEnabled) {
        this.emailNotificationService = emailNotificationService;
        this.otpEnabled = otpEnabled;
    }

    public boolean isOtpEnabled() {
        return otpEnabled;
    }

    public void sendOtp(String email, String purpose) {
        if (!otpEnabled) {
            return;
        }

        String normalizedEmail = normalizeEmail(email);
        String normalizedPurpose = normalizePurpose(purpose);
        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        String otpKey = key(normalizedEmail, normalizedPurpose);
        otpEntries.put(otpKey, new OtpEntry(otp, Instant.now().plusSeconds(300)));

        try {
            emailNotificationService.sendRequired(
                    normalizedEmail,
                    "FinTrack OTP Verification",
                    "Your " + normalizedPurpose.toLowerCase(Locale.ROOT) + " OTP is " + otp + ". It expires in 5 minutes."
            );
        } catch (RuntimeException ex) {
            otpEntries.remove(otpKey);
            throw ex;
        }
    }

    public String verifyOtp(String email, String purpose, String otp) {
        if (!otpEnabled) {
            return null;
        }

        String normalizedEmail = normalizeEmail(email);
        String normalizedPurpose = normalizePurpose(purpose);
        OtpEntry entry = otpEntries.get(key(normalizedEmail, normalizedPurpose));
        if (entry == null || entry.expiresAt().isBefore(Instant.now()) || !entry.otp().equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        otpEntries.remove(key(normalizedEmail, normalizedPurpose));
        String token = UUID.randomUUID().toString();
        tokenEntries.put(token, new TokenEntry(normalizedEmail, normalizedPurpose, Instant.now().plusSeconds(600)));
        return token;
    }

    public void validateToken(String email, String purpose, String otpToken) {
        if (!otpEnabled) {
            return;
        }

        TokenEntry entry = tokenEntries.remove(otpToken);
        if (entry == null
                || entry.expiresAt().isBefore(Instant.now())
                || !entry.email().equals(normalizeEmail(email))
                || !entry.purpose().equals(normalizePurpose(purpose))) {
            throw new RuntimeException("OTP verification required");
        }
    }

    private String key(String email, String purpose) {
        return email + ":" + purpose;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePurpose(String purpose) {
        return purpose == null ? "" : purpose.trim().toUpperCase(Locale.ROOT);
    }

    private record OtpEntry(String otp, Instant expiresAt) {
    }

    private record TokenEntry(String email, String purpose, Instant expiresAt) {
    }
}
