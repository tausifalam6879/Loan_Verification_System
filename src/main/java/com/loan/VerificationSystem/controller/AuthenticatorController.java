package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.repository.UserRepository;
import com.loan.VerificationSystem.service.AuthenticatorService;
import com.loan.VerificationSystem.service.OtpService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
@RequestMapping("/api/users/authenticator")
public class AuthenticatorController {
    private final AuthenticatorService service;
    private final UserRepository users;
    private final OtpService otp;
    public AuthenticatorController(AuthenticatorService service, UserRepository users, OtpService otp) { this.service=service; this.users=users; this.otp=otp; }
    public record Proof(String password, String code, String emailOtpToken) {}
    @GetMapping
    public ResponseEntity<?> status(Authentication auth) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("enabled", service.enabled(users.findByEmail(auth.getName()).getId())));
    }
    @PostMapping("/setup")
    public ResponseEntity<?> setup(Authentication auth, @RequestBody Proof proof) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.begin(auth.getName(), proof.password()));
    }
    @PostMapping("/confirm")
    public Map<String, Boolean> confirm(Authentication auth, @RequestBody Proof proof) {
        if (!service.verify(auth.getName(), proof.code(), true)) throw new IllegalArgumentException("Code invalid, expired or already used. After five failed codes, wait five minutes.");
        return Map.of("enabled", true);
    }
    @PostMapping("/disable")
    public Map<String, Boolean> disable(Authentication auth, @RequestBody Proof proof) {
        service.checkPassword(auth.getName(), proof.password());
        boolean emailVerified = proof.emailOtpToken() != null && !proof.emailOtpToken().isBlank();
        if (emailVerified) {
            otp.validateToken(auth.getName(), null, "LOGIN", proof.emailOtpToken(), "EMAIL");
        }
        if (!service.disable(auth.getName(), proof.password(), proof.code(), emailVerified)) {
            throw new IllegalArgumentException("A fresh authenticator code or verified email OTP is required.");
        }
        return Map.of("enabled", false);
    }
}
