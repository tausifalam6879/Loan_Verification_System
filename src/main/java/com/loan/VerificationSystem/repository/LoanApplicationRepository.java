package com.loan.VerificationSystem.repository;

import com.loan.VerificationSystem.entity.LoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    boolean existsByAadhaarNumber(String aadhaarNumber);

    boolean existsByPanNumber(String panNumber);

    boolean existsByEmail(String email);

    boolean existsByNomineePhone(String nomineePhone);
}
