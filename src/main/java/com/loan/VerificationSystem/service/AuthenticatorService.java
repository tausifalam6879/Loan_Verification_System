package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.entity.AuthenticatorCredential;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.repository.AuthenticatorRepository;
import com.loan.VerificationSystem.repository.UserRepository;
import com.loan.VerificationSystem.security.TotpCrypto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
public class AuthenticatorService {
    private final AuthenticatorRepository repository;
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final String master;
    public AuthenticatorService(AuthenticatorRepository repository, UserRepository users, PasswordEncoder passwords, @Value("${jwt.secret}") String master) {
        this.repository = repository; this.users = users; this.passwords = passwords; this.master = master;
    }
    public boolean enabled(Long userId) { return repository.findById(userId).map(AuthenticatorCredential::isEnabled).orElse(false); }
    @Transactional
    public Map<String, Object> begin(String email, String password) {
        User user = users.lockByEmail(email);
        requirePassword(user, password);
        AuthenticatorCredential credential = repository.findById(user.getId()).orElseGet(AuthenticatorCredential::new);
        if (credential.isEnabled()) throw new IllegalArgumentException("Authenticator already enabled. Disable it before setting up another app.");
        long now = System.currentTimeMillis();
        if (credential.getLockedUntil() > now) throw new IllegalArgumentException("Too many attempts. Wait five minutes.");
        byte[] secret = TotpCrypto.secret();
        credential.setUserId(user.getId());
        credential.setEncryptedSecret(TotpCrypto.encrypt(secret, master, user.getId()));
        credential.setPendingUntil(now + 600000);
        credential.setLastUsedStep(-1);
        repository.save(credential);
        String setupKey = TotpCrypto.base32(secret);
        java.util.Arrays.fill(secret, (byte)0);
        return Map.of("setupKey", setupKey, "account", email, "issuer", "FinTrack", "expiresInSeconds", 600);
    }
    // Return failures instead of throwing: commit attempt counters and consumed steps.
    @Transactional
    public boolean verify(String email, String code, boolean confirmSetup) {
        User user = users.lockByEmail(email);
        if (user == null) return false;
        AuthenticatorCredential credential = repository.findById(user.getId()).orElse(null);
        long now = System.currentTimeMillis();
        if (credential == null || credential.getLockedUntil() > now) return false;
        if (confirmSetup ? credential.isEnabled() || credential.getPendingUntil() < now : !credential.isEnabled()) return false;
        byte[] secret = TotpCrypto.decrypt(credential.getEncryptedSecret(), master, user.getId());
        long step;
        try { step = TotpCrypto.match(secret, code, now, credential.getLastUsedStep()); }
        finally { java.util.Arrays.fill(secret, (byte)0); }
        if (step < 0) {
            int failures = credential.getFailedAttempts() + 1;
            credential.setFailedAttempts(failures >= 5 ? 0 : failures);
            if (failures >= 5) credential.setLockedUntil(now + 300000);
            repository.save(credential);
            return false;
        }
        credential.setLastUsedStep(step); credential.setFailedAttempts(0); credential.setLockedUntil(0);
        if (confirmSetup) { credential.setEnabled(true); credential.setPendingUntil(0); }
        repository.save(credential);
        return true;
    }
    public void checkPassword(String email, String password) { requirePassword(users.findByEmail(email), password); }
    private void requirePassword(User user, String password) {
        if (user == null || password == null || password.length() > 200 || !passwords.matches(password, user.getPassword())) throw new IllegalArgumentException("Current password is incorrect.");
    }
    @Transactional
    public boolean disable(String email, String password, String code, boolean emailVerified) {
        User user = users.lockByEmail(email);
        requirePassword(user, password);
        if (!emailVerified && !verify(email, code, false)) return false;
        repository.deleteById(user.getId());
        return true;
    }
}
