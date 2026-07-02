package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.entity.Expense;
import com.loan.VerificationSystem.repository.ExpenseRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public Expense addExpense(Expense expense) {

        if (expense.getDate() == null) {
            expense.setDate(LocalDate.now());
        }

        return expenseRepository.save(expense);
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll(Sort.by(
                Sort.Order.desc("createdAt"),
                Sort.Order.desc("date"),
                Sort.Order.desc("id")
        ));
    }

    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
}
