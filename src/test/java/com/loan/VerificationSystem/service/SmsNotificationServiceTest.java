package com.loan.VerificationSystem.service;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SmsNotificationServiceTest {

    @Test
    void requiresCredentialsAndSenderForEachTwilioChannel() {
        SmsNotificationService configured = service(true, true, "AC123", "token", "+12025550123", "whatsapp:+14155238886");
        SmsNotificationService missingSmsSender = service(true, true, "AC123", "token", "", "whatsapp:+14155238886");

        assertThat(configured.isSmsEnabled()).isTrue();
        assertThat(configured.isWhatsappEnabled()).isTrue();
        assertThat(missingSmsSender.isSmsEnabled()).isFalse();
        assertThat(missingSmsSender.isWhatsappEnabled()).isTrue();
    }

    @Test
    void convertsPlainIndianNumberToE164ForTwilio() throws Exception {
        SmsNotificationService service = service(true, true, "AC123", "token", "+12025550123", "whatsapp:+14155238886");
        Method normalizePhone = SmsNotificationService.class.getDeclaredMethod("normalizePhone", String.class);
        normalizePhone.setAccessible(true);

        assertThat(normalizePhone.invoke(service, "98765 43210")).isEqualTo("+919876543210");
        assertThat(normalizePhone.invoke(service, "0091-98765-43210")).isEqualTo("+919876543210");
    }

    @Test
    void rejectsNumbersThatCannotBeConvertedToE164() throws Exception {
        SmsNotificationService service = service(true, true, "AC123", "token", "+12025550123", "whatsapp:+14155238886");
        Method normalizePhone = SmsNotificationService.class.getDeclaredMethod("normalizePhone", String.class);
        normalizePhone.setAccessible(true);

        assertThatThrownBy(() -> invoke(normalizePhone, service, "1234"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("country code");
    }

    @Test
    void sendsSmsAndWhatsappOtpThroughTwilioHttpsContract() throws Exception {
        List<Map<String, String>> requests = new CopyOnWriteArrayList<>();
        AtomicReference<String> authorization = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/2010-04-01/Accounts/AC123/Messages.json", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            requests.add(parseForm(body));
            exchange.sendResponseHeaders(201, -1);
            exchange.close();
        });
        server.start();

        try {
            SmsNotificationService service = service(
                    true,
                    true,
                    "AC123",
                    "token",
                    "+12025550123",
                    "whatsapp:+14155238886",
                    "http://127.0.0.1:" + server.getAddress().getPort()
            );

            service.sendSmsRequired("98765 43210", "Your login OTP is 123456.");
            service.sendWhatsappRequired("+919876543210", "Your login OTP is 654321.");

            assertThat(authorization.get()).startsWith("Basic ");
            assertThat(requests).hasSize(2);
            assertThat(requests.get(0)).containsEntry("From", "+12025550123").containsEntry("To", "+919876543210");
            assertThat(requests.get(1))
                    .containsEntry("From", "whatsapp:+14155238886")
                    .containsEntry("To", "whatsapp:+919876543210");
        } finally {
            server.stop(0);
        }
    }

    private Object invoke(Method method, Object target, String value) throws Throwable {
        try {
            return method.invoke(target, value);
        } catch (InvocationTargetException ex) {
            throw ex.getCause();
        }
    }

    private SmsNotificationService service(boolean smsEnabled,
                                           boolean whatsappEnabled,
                                           String sid,
                                           String token,
                                           String smsFrom,
                                           String whatsappFrom) {
        return service(smsEnabled, whatsappEnabled, sid, token, smsFrom, whatsappFrom, "https://api.twilio.com");
    }

    private SmsNotificationService service(boolean smsEnabled,
                                           boolean whatsappEnabled,
                                           String sid,
                                           String token,
                                           String smsFrom,
                                           String whatsappFrom,
                                           String apiBaseUrl) {
        return new SmsNotificationService(
                smsEnabled,
                whatsappEnabled,
                sid,
                token,
                smsFrom,
                whatsappFrom,
                apiBaseUrl,
                "+91",
                1000,
                1000
        );
    }

    private Map<String, String> parseForm(String body) {
        return List.of(body.split("&")).stream()
                .map(pair -> pair.split("=", 2))
                .collect(Collectors.toMap(
                        pair -> URLDecoder.decode(pair[0], StandardCharsets.UTF_8),
                        pair -> URLDecoder.decode(pair.length > 1 ? pair[1] : "", StandardCharsets.UTF_8)
                ));
    }
}
