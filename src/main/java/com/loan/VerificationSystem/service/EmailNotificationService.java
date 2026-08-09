package com.loan.VerificationSystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.lang.reflect.InvocationTargetException;
import java.time.Duration;
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

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(Math.max(connectTimeoutMs, 1000)));
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(readTimeoutMs, 1000)));
        this.resendClient = RestClient.builder()
                .baseUrl(resendBaseUrl)
                .requestFactory(requestFactory)
                .build();
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
        } catch (RestClientException ex) {
            throw new IllegalStateException("Email delivery failed: " + ex.getMessage(), ex);
        }
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
}
