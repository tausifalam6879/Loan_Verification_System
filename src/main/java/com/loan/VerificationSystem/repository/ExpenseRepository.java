package com.loan.VerificationSystem.repository;

import com.loan.VerificationSystem.entity.Expense;
import com.loan.VerificationSystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findAllByUserOrderByCreatedAtDescDateDescIdDesc(User user);

    Optional<Expense> findByIdAndUser(Long id, User user);
}
