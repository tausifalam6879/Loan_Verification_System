package com.loan.VerificationSystem.service;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
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
                1000,
                1000
        );
    }
}
