package com.loan.VerificationSystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.lang.reflect.InvocationTargetException;

@Service
public class EmailNotificationService {

    private final ApplicationContext applicationContext;
    private final boolean mailEnabled;
    private final String fromAddress;

    public EmailNotificationService(ApplicationContext applicationContext,
                                    @Value("${app.mail.enabled:false}") boolean mailEnabled,
                                    @Value("${spring.mail.username:}") String fromAddress) {
        this.applicationContext = applicationContext;
        this.mailEnabled = mailEnabled;
        this.fromAddress = fromAddress;
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

    public void sendRequired(String to, String subject, String body) {
        if (!mailEnabled) {
            throw new IllegalStateException(
                    "Email delivery is disabled. Set APP_MAIL_ENABLED=true and configure SMTP credentials."
            );
        }

        deliver(to, subject, body);
    }

    private void deliver(String to, String subject, String body) {
        try {
            Class<?> mailSenderClass = Class.forName("org.springframework.mail.javamail.JavaMailSender");
            Class<?> messageClass = Class.forName("org.springframework.mail.SimpleMailMessage");
            Object mailSender = applicationContext.getBean(mailSenderClass);
            Object message = messageClass.getDeclaredConstructor().newInstance();

            if (fromAddress != null && !fromAddress.isBlank()) {
                messageClass.getMethod("setFrom", String.class).invoke(message, fromAddress);
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
}
