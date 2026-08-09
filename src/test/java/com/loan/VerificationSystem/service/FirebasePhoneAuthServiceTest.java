package com.loan.VerificationSystem.service;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FirebasePhoneAuthServiceTest {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void verifiesIdTokenWithFirebaseAndReturnsCanonicalPhone() throws Exception {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/accounts:lookup", exchange -> respond(
                exchange,
                200,
                "{\"users\":[{\"localId\":\"firebase-user\",\"phoneNumber\":\"+919876543210\"}]}"
        ));
        server.start();

        FirebasePhoneAuthService service = service(true);

        assertThat(service.verifyIdTokenAndGetPhone("signed-id-token"))
                .isEqualTo("+919876543210");
        assertThat(service.getPublicWebConfig())
                .containsEntry("projectId", "fintrack-test");
    }

    @Test
    void hidesFirebaseProviderErrorsBehindASafeMessage() throws Exception {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/accounts:lookup", exchange -> respond(
                exchange,
                400,
                "{\"error\":{\"message\":\"INVALID_ID_TOKEN\"}}"
        ));
        server.start();

        assertThatThrownBy(() -> service(true).verifyIdTokenAndGetPhone("bad-token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Firebase phone verification is invalid or expired.");
    }

    @Test
    void staysDisabledUntilEveryPublicWebSettingExists() {
        FirebasePhoneAuthService service = new FirebasePhoneAuthService(
                true,
                "public-api-key",
                "",
                "fintrack-test",
                "app-id",
                "+91",
                "http://127.0.0.1:1",
                1000,
                1000
        );

        assertThat(service.isEnabled()).isFalse();
        assertThat(service.getPublicWebConfig()).isEmpty();
    }

    private FirebasePhoneAuthService service(boolean enabled) {
        return new FirebasePhoneAuthService(
                enabled,
                "public-api-key",
                "fintrack-test.firebaseapp.com",
                "fintrack-test",
                "app-id",
                "+91",
                "http://localhost:" + server.getAddress().getPort(),
                1000,
                1000
        );
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] response = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, response.length);
        exchange.getResponseBody().write(response);
        exchange.close();
    }
}
