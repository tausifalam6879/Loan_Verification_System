package com.loan.VerificationSystem.repository;

import com.loan.VerificationSystem.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    // Aage chalkar hum yahan custom queries likhenge (jaise ek mahine ka total kharcha)
}