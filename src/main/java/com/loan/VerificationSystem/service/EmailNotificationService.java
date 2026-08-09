package com.loan.VerificationSystem.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.lang.reflect.InvocationTargetException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class EmailNotificationService {

    private final ApplicationContext applicationContext;
    private final boolean mailEnabled;
    private final String provider;
    private final String smtpFromAddress;
    private final String smtpHost;
    private final String smtpPassword;
    private final boolean smtpAuthEnabled;
    private final String apiFromAddress;
    private final String resendApiKey;
    private final RestClient resendClient;
    private final String gmailClientId;
    private final String gmailClientSecret;
    private final String gmailRefreshToken;
    private final RestClient googleOauthClient;
    private final RestClient gmailApiClient;
    private volatile GmailAccessToken gmailAccessToken;

    public EmailNotificationService(ApplicationContext applicationContext,
                                    @Value("${app.mail.enabled:false}") boolean mailEnabled,
                                    @Value("${app.mail.provider:smtp}") String provider,
                                    @Value("${spring.mail.username:}") String smtpFromAddress,
                                    @Value("${spring.mail.host:}") String smtpHost,
                                    @Value("${spring.mail.password:}") String smtpPassword,
                                    @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean smtpAuthEnabled,
                                    @Value("${app.mail.from:}") String apiFromAddress,
                                    @Value("${app.mail.resend-api-key:}") String resendApiKey,
                                    @Value("${app.mail.resend-base-url:https://api.resend.com}") String resendBaseUrl,
                                    @Value("${app.mail.gmail-client-id:}") String gmailClientId,
                                    @Value("${app.mail.gmail-client-secret:}") String gmailClientSecret,
                                    @Value("${app.mail.gmail-refresh-token:}") String gmailRefreshToken,
                                    @Value("${app.mail.google-oauth-base-url:https://oauth2.googleapis.com}") String googleOauthBaseUrl,
                                    @Value("${app.mail.gmail-api-base-url:https://gmail.googleapis.com}") String gmailApiBaseUrl,
                                    @Value("${app.otp.provider-connect-timeout-ms:5000}") int connectTimeoutMs,
                                    @Value("${app.otp.provider-read-timeout-ms:10000}") int readTimeoutMs) {
        this.applicationContext = applicationContext;
        this.mailEnabled = mailEnabled;
        this.provider = provider == null ? "smtp" : provider.trim().toLowerCase(Locale.ROOT);
        this.smtpFromAddress = smtpFromAddress;
        this.smtpHost = smtpHost;
        this.smtpPassword = smtpPassword;
        this.smtpAuthEnabled = smtpAuthEnabled;
        this.apiFromAddress = apiFromAddress;
        this.resendApiKey = resendApiKey;
        this.gmailClientId = gmailClientId;
        this.gmailClientSecret = gmailClientSecret;
        this.gmailRefreshToken = gmailRefreshToken;
        this.resendClient = createRestClient(resendBaseUrl, connectTimeoutMs, readTimeoutMs);
        this.googleOauthClient = createRestClient(googleOauthBaseUrl, connectTimeoutMs, readTimeoutMs);
        this.gmailApiClient = createRestClient(gmailApiBaseUrl, connectTimeoutMs, readTimeoutMs);
    }

    public boolean send(String to, String subject, String body) {
        if (!mailEnabled) {
            return false;
        }

        try {
            deliver(to, subject, body);
            return true;
        } catch (IllegalStateException ignored) {
            return false;
        }
    }

    public boolean isMailEnabled() {
        if (!mailEnabled) {
            return false;
        }
        if ("resend".equals(provider)) {
            return hasText(resendApiKey) && hasText(apiFromAddress);
        }
        if (isGmailApiProvider()) {
            return hasText(apiFromAddress)
                    && hasText(gmailClientId)
                    && hasText(gmailClientSecret)
                    && hasText(gmailRefreshToken);
        }
        if (!"smtp".equals(provider)) {
            return false;
        }
        return hasText(smtpHost)
                && hasText(smtpFromAddress)
                && (!smtpAuthEnabled || hasText(smtpPassword));
    }

    public void sendRequired(String to, String subject, String body) {
        if (!mailEnabled) {
            throw new IllegalStateException(
                    "Email delivery is disabled. Set APP_MAIL_ENABLED=true and configure the selected mail provider."
            );
        }

        deliver(to, subject, body);
    }

    private void deliver(String to, String subject, String body) {
        if (!isMailEnabled()) {
            throw new IllegalStateException(
                    "Email sender is not configured. Check the selected mail provider credentials and sender address."
            );
        }

        if ("resend".equals(provider)) {
            deliverWithResend(to, subject, body);
            return;
        }
        if (isGmailApiProvider()) {
            deliverWithGmailApi(to, subject, body);
            return;
        }

        deliverWithSmtp(to, subject, body);
    }

    private void deliverWithResend(String to, String subject, String body) {
        try {
            resendClient.post()
                    .uri("/emails")
                    .headers(headers -> headers.setBearerAuth(resendApiKey))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", apiFromAddress,
                            "to", List.of(to),
                            "subject", subject,
                            "text", body
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw providerRejected("Resend", ex);
        } catch (RestClientException ex) {
            throw new IllegalStateException("Email delivery failed: Resend is temporarily unavailable.", ex);
        }
    }

    private void deliverWithGmailApi(String to, String subject, String body) {
        try {
            gmailApiClient.post()
                    .uri("/gmail/v1/users/me/messages/send")
                    .headers(headers -> headers.setBearerAuth(getGmailAccessToken()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("raw", createRawGmailMessage(to, subject, body)))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw providerRejected("Gmail API", ex);
        } catch (RestClientException ex) {
            throw new IllegalStateException("Email delivery failed: Gmail API is temporarily unavailable.", ex);
        }
    }

    private String getGmailAccessToken() {
        GmailAccessToken cached = gmailAccessToken;
        if (isUsable(cached)) {
            return cached.value();
        }

        synchronized (this) {
            cached = gmailAccessToken;
            if (isUsable(cached)) {
                return cached.value();
            }

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("client_id", gmailClientId);
            form.add("client_secret", gmailClientSecret);
            form.add("refresh_token", gmailRefreshToken);
            form.add("grant_type", "refresh_token");

            try {
                GmailTokenResponse response = googleOauthClient.post()
                        .uri("/token")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(GmailTokenResponse.class);
                if (response == null || !hasText(response.accessToken())) {
                    throw new IllegalStateException("Email delivery failed: Gmail authorization returned no access token.");
                }

                long expiresInSeconds = response.expiresIn() > 0 ? response.expiresIn() : 3600;
                gmailAccessToken = new GmailAccessToken(
                        response.accessToken(),
                        Instant.now().plusSeconds(expiresInSeconds)
                );
                return gmailAccessToken.value();
            } catch (RestClientResponseException ex) {
                throw providerRejected("Gmail authorization", ex);
            } catch (RestClientException ex) {
                throw new IllegalStateException("Email delivery failed: Gmail authorization is temporarily unavailable.", ex);
            }
        }
    }

    private String createRawGmailMessage(String to, String subject, String body) {
        String encodedSubject = Base64.getEncoder().encodeToString(
                sanitizeHeader(subject).getBytes(StandardCharsets.UTF_8)
        );
        String encodedBody = Base64.getMimeEncoder(76, new byte[]{'\r', '\n'}).encodeToString(
                (body == null ? "" : body).getBytes(StandardCharsets.UTF_8)
        );
        String mimeMessage = "From: " + sanitizeHeader(apiFromAddress) + "\r\n"
                + "To: " + sanitizeHeader(to) + "\r\n"
                + "Subject: =?UTF-8?B?" + encodedSubject + "?=\r\n"
                + "MIME-Version: 1.0\r\n"
                + "Content-Type: text/plain; charset=UTF-8\r\n"
                + "Content-Transfer-Encoding: base64\r\n\r\n"
                + encodedBody;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
                mimeMessage.getBytes(StandardCharsets.UTF_8)
        );
    }

    private void deliverWithSmtp(String to, String subject, String body) {
        try {
            Class<?> mailSenderClass = Class.forName("org.springframework.mail.javamail.JavaMailSender");
            Class<?> messageClass = Class.forName("org.springframework.mail.SimpleMailMessage");
            Object mailSender = applicationContext.getBean(mailSenderClass);
            Object message = messageClass.getDeclaredConstructor().newInstance();

            if (hasText(smtpFromAddress)) {
                messageClass.getMethod("setFrom", String.class).invoke(message, smtpFromAddress);
            }
            messageClass.getMethod("setTo", String[].class).invoke(message, (Object) new String[]{to});
            messageClass.getMethod("setSubject", String.class).invoke(message, subject);
            messageClass.getMethod("setText", String.class).invoke(message, body);
            mailSenderClass.getMethod("send", messageClass).invoke(mailSender, message);
        } catch (InvocationTargetException ex) {
            Throwable cause = ex.getCause() == null ? ex : ex.getCause();
            throw new IllegalStateException("Email delivery failed: " + cause.getMessage(), cause);
        } catch (BeansException | ReflectiveOperationException | IllegalArgumentException ex) {
            throw new IllegalStateException(
                    "Email sender is not configured. Check spring.mail.* SMTP settings.",
                    ex
            );
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean isGmailApiProvider() {
        return "gmail-api".equals(provider) || "gmail".equals(provider);
    }

    private boolean isUsable(GmailAccessToken token) {
        return token != null && Instant.now().plusSeconds(60).isBefore(token.expiresAt());
    }

    private String sanitizeHeader(String value) {
        return value == null ? "" : value.replace('\r', ' ').replace('\n', ' ').trim();
    }

    private IllegalStateException providerRejected(String providerName, RestClientResponseException ex) {
        return new IllegalStateException(
                "Email delivery failed: " + providerName + " rejected the request (HTTP "
                        + ex.getStatusCode().value() + "). Check the email provider configuration.",
                ex
        );
    }

    private RestClient createRestClient(String baseUrl, int connectTimeoutMs, int readTimeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(Math.max(connectTimeoutMs, 1000)));
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(readTimeoutMs, 1000)));
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    private record GmailTokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("expires_in") long expiresIn
    ) {
    }

    private record GmailAccessToken(String value, Instant expiresAt) {
    }
}
