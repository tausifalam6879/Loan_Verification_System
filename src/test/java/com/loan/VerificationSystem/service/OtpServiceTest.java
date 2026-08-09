package com.loan.VerificationSystem.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OtpServiceTest {

    @Test
    void reportsOnlyActuallyConfiguredProductionChannels() {
        EmailNotificationService emailService = mock(EmailNotificationService.class);
        SmsNotificationService smsService = mock(SmsNotificationService.class);
        when(emailService.isMailEnabled()).thenReturn(true);
        when(smsService.isSmsEnabled()).thenReturn(false);
        when(smsService.isWhatsappEnabled()).thenReturn(true);

        OtpService otpService = new OtpService(emailService, smsService, true, false);

        assertThat(otpService.isOtpEnabled()).isTrue();
        assertThat(otpService.isEmailOtpEnabled()).isTrue();
        assertThat(otpService.isMobileOtpEnabled()).isFalse();
        assertThat(otpService.isWhatsappOtpEnabled()).isTrue();
    }

    @Test
    void exposesConsoleFallbackChannelsOnlyInDevelopmentMode() {
        EmailNotificationService emailService = mock(EmailNotificationService.class);
        SmsNotificationService smsService = mock(SmsNotificationService.class);

        OtpService otpService = new OtpService(emailService, smsService, true, true);

        assertThat(otpService.isEmailOtpEnabled()).isTrue();
        assertThat(otpService.isMobileOtpEnabled()).isTrue();
        assertThat(otpService.isWhatsappOtpEnabled()).isTrue();
    }

    @Test
    void disablesEveryChannelWhenOtpFeatureIsOff() {
        EmailNotificationService emailService = mock(EmailNotificationService.class);
        SmsNotificationService smsService = mock(SmsNotificationService.class);
        when(emailService.isMailEnabled()).thenReturn(true);
        when(smsService.isSmsEnabled()).thenReturn(true);
        when(smsService.isWhatsappEnabled()).thenReturn(true);

        OtpService otpService = new OtpService(emailService, smsService, false, true);

        assertThat(otpService.isEmailOtpEnabled()).isFalse();
        assertThat(otpService.isMobileOtpEnabled()).isFalse();
        assertThat(otpService.isWhatsappOtpEnabled()).isFalse();
    }

    @Test
    void externallyVerifiedTokenRemainsBoundToMobilePurposeAndChannel() {
        EmailNotificationService emailService = mock(EmailNotificationService.class);
        SmsNotificationService smsService = mock(SmsNotificationService.class);
        OtpService otpService = new OtpService(emailService, smsService, true, false);

        String token = otpService.issueExternallyVerifiedToken(
                null,
                "9876543210",
                "REGISTER",
                "MOBILE"
        );

        otpService.validateToken(null, "9876543210", "REGISTER", token, "MOBILE");
    }
}
