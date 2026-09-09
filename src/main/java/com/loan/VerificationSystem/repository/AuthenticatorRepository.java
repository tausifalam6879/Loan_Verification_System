package com.loan.VerificationSystem.repository;
import com.loan.VerificationSystem.entity.AuthenticatorCredential;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AuthenticatorRepository extends JpaRepository<AuthenticatorCredential, Long> {}
