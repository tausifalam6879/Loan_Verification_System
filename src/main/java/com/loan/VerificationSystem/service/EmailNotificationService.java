package com.loan.VerificationSystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

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

    public void send(String to, String subject, String body) {
        if (!mailEnabled) {
            return;
        }

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
        } catch (BeansException | ReflectiveOperationException | IllegalArgumentException ignored) {
            return;
        }
    }
}
