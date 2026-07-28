package com.loan.VerificationSystem.repository;

import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {

    boolean existsByAadhaarNumber(String aadhaarNumber);

    boolean existsByPanNumber(String panNumber);

    boolean existsByEmail(String email);

    boolean existsByNomineePhone(String nomineePhone);

    List<LoanApplication> findByUser(User user);

    Optional<LoanApplication> findByIdAndUser(Long id, User user);

    boolean existsByAadhaarNumberAndUserNot(String aadhaarNumber, User user);

    boolean existsByPanNumberAndUserNot(String panNumber, User user);

    long countByStatus(String status);

    long countByFraudLevelIgnoreCase(String fraudLevel);
}
