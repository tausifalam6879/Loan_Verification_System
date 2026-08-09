package com.loan.VerificationSystem.service;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;

import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class EmailNotificationServiceTest {

    private final ApplicationContext applicationContext = mock(ApplicationContext.class);

    @Test
    void enablesResendOnlyWhenApiKeyAndSenderArePresent() {
        EmailNotificationService configured = service(true, "resend", "FinTrack <login@fintrack.example>", "re_secret");
        EmailNotificationService missingSender = service(true, "resend", "", "re_secret");
        EmailNotificationService missingKey = service(true, "resend", "FinTrack <login@fintrack.example>", "");

        assertThat(configured.isMailEnabled()).isTrue();
        assertThat(missingSender.isMailEnabled()).isFalse();
        assertThat(missingKey.isMailEnabled()).isFalse();
    }

    @Test
    void keepsSmtpAvailableForConfiguredLocalDevelopment() {
        EmailNotificationService service = new EmailNotificationService(
                applicationContext,
                true,
                "smtp",
                "local@gmail.com",
                "smtp.gmail.com",
                "app-password",
                true,
                "",
                "",
                "https://api.resend.com",
                "",
                "",
                "",
                "https://oauth2.googleapis.com",
                "https://gmail.googleapis.com",
                1000,
                1000
        );

        assertThat(service.isMailEnabled()).isTrue();
    }

    @Test
    void sendsEmailOtpThroughResendHttpsContract() throws Exception {
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/emails", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        server.start();

        try {
            EmailNotificationService service = new EmailNotificationService(
                    applicationContext,
                    true,
                    "resend",
                    "",
                    "",
                    "",
                    true,
                    "FinTrack <login@fintrack.example>",
                    "re_test_key",
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    "",
                    "",
                    "",
                    "https://oauth2.googleapis.com",
                    "https://gmail.googleapis.com",
                    1000,
                    1000
            );

            service.sendRequired("user@example.com", "FinTrack OTP Verification", "Your login OTP is 123456.");

            assertThat(authorization.get()).isEqualTo("Bearer re_test_key");
            assertThat(requestBody.get())
                    .contains("\"from\":\"FinTrack <login@fintrack.example>\"")
                    .contains("\"to\":[\"user@example.com\"]")
                    .contains("\"subject\":\"FinTrack OTP Verification\"")
                    .contains("\"text\":\"Your login OTP is 123456.\"");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void enablesGmailApiOnlyWhenOauthCredentialsAndSenderArePresent() {
        EmailNotificationService configured = gmailService(
                "FinTrack <owner@gmail.com>", "client-id", "client-secret", "refresh-token", "https://example.com"
        );
        EmailNotificationService missingRefreshToken = gmailService(
                "FinTrack <owner@gmail.com>", "client-id", "client-secret", "", "https://example.com"
        );

        assertThat(configured.isMailEnabled()).isTrue();
        assertThat(missingRefreshToken.isMailEnabled()).isFalse();
    }

    @Test
    void refreshesOauthTokenAndSendsEmailThroughGmailHttpsContract() throws Exception {
        AtomicInteger tokenRequests = new AtomicInteger();
        AtomicInteger emailRequests = new AtomicInteger();
        AtomicReference<String> tokenRequestBody = new AtomicReference<>();
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> gmailRequestBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/token", exchange -> {
            tokenRequests.incrementAndGet();
            tokenRequestBody.set(URLDecoder.decode(
                    new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8),
                    StandardCharsets.UTF_8
            ));
            byte[] response = "{\"access_token\":\"gmail-access-token\",\"expires_in\":3600}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.createContext("/gmail/v1/users/me/messages/send", exchange -> {
            emailRequests.incrementAndGet();
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            gmailRequestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        server.start();

        try {
            String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
            EmailNotificationService service = gmailService(
                    "FinTrack <owner@gmail.com>",
                    "client-id",
                    "client-secret",
                    "refresh-token",
                    baseUrl
            );

            service.sendRequired("first@example.com", "FinTrack OTP Verification", "Your login OTP is 123456.");
            service.sendRequired("second@example.com", "FinTrack OTP Verification", "Your login OTP is 654321.");

            assertThat(tokenRequests.get()).isEqualTo(1);
            assertThat(emailRequests.get()).isEqualTo(2);
            assertThat(tokenRequestBody.get())
                    .contains("client_id=client-id")
                    .contains("client_secret=client-secret")
                    .contains("refresh_token=refresh-token")
                    .contains("grant_type=refresh_token");
            assertThat(authorization.get()).isEqualTo("Bearer gmail-access-token");

            String rawMessage = gmailRequestBody.get().replaceFirst("^\\{\"raw\":\"", "").replaceFirst("\"}$", "");
            String mimeMessage = new String(Base64.getUrlDecoder().decode(rawMessage), StandardCharsets.UTF_8);
            assertThat(mimeMessage)
                    .contains("From: FinTrack <owner@gmail.com>")
                    .contains("To: second@example.com")
                    .contains("Subject: =?UTF-8?B?")
                    .contains("Content-Type: text/plain; charset=UTF-8");
            String encodedBody = mimeMessage.substring(mimeMessage.indexOf("\r\n\r\n") + 4);
            assertThat(new String(Base64.getMimeDecoder().decode(encodedBody), StandardCharsets.UTF_8))
                    .isEqualTo("Your login OTP is 654321.");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void hidesProviderResponseDetailsFromPublicDeliveryErrors() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/emails", exchange -> {
            byte[] response = "{\"message\":\"secret provider account and internal configuration\"}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(403, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            EmailNotificationService service = new EmailNotificationService(
                    applicationContext,
                    true,
                    "resend",
                    "",
                    "",
                    "",
                    true,
                    "FinTrack <login@fintrack.example>",
                    "re_test_key",
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    "",
                    "",
                    "",
                    "https://oauth2.googleapis.com",
                    "https://gmail.googleapis.com",
                    1000,
                    1000
            );

            assertThatThrownBy(() -> service.sendRequired(
                    "user@example.com", "FinTrack OTP Verification", "Your login OTP is 123456."
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("HTTP 403")
                    .hasMessageNotContaining("secret provider account")
                    .hasMessageNotContaining("internal configuration");
        } finally {
            server.stop(0);
        }
    }

    private EmailNotificationService service(boolean enabled, String provider, String from, String apiKey) {
        return new EmailNotificationService(
                applicationContext,
                enabled,
                provider,
                "",
                "smtp.gmail.com",
                "",
                true,
                from,
                apiKey,
                "https://api.resend.com",
                "",
                "",
                "",
                "https://oauth2.googleapis.com",
                "https://gmail.googleapis.com",
                1000,
                1000
        );
    }

    private EmailNotificationService gmailService(String from,
                                                  String clientId,
                                                  String clientSecret,
                                                  String refreshToken,
                                                  String baseUrl) {
        return new EmailNotificationService(
                applicationContext,
                true,
                "gmail-api",
                "",
                "smtp.gmail.com",
                "",
                true,
                from,
                "",
                "https://api.resend.com",
                clientId,
                clientSecret,
                refreshToken,
                baseUrl,
                baseUrl,
                1000,
                1000
        );
    }
}
