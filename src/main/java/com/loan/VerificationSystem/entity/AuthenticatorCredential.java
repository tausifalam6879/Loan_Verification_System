package com.loan.VerificationSystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "authenticator_credentials")
@Getter @Setter
public class AuthenticatorCredential {
    @Id private Long userId;
    @Column(length = 512) private String encryptedSecret;
    private boolean enabled;
    private long pendingUntil;
    private long lastUsedStep = -1;
    private int failedAttempts;
    private long lockedUntil;
}
