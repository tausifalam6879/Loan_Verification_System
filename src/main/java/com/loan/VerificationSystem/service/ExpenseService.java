package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.entity.Expense;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.exception.ResourceNotFoundException;
import com.loan.VerificationSystem.repository.ExpenseRepository;
import com.loan.VerificationSystem.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    public Expense addExpense(Expense expense) {
        expense.setId(null);
        expense.setCreatedAt(null);
        expense.setUser(getCurrentUser());
        if (expense.getDate() == null) {
            expense.setDate(LocalDate.now());
        }
        if (expense.getRecurring() == null) {
            expense.setRecurring(false);
        }

        return expenseRepository.save(expense);
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllByUserOrderByCreatedAtDescDateDescIdDesc(getCurrentUser());
    }

    public Expense updateExpense(Long id, Expense request) {
        User currentUser = getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setMerchant(request.getMerchant());
        expense.setPaymentMethod(request.getPaymentMethod());
        expense.setRecurring(Boolean.TRUE.equals(request.getRecurring()));
        expense.setDate(request.getDate() == null ? expense.getDate() : request.getDate());

        return expenseRepository.save(expense);
    }

    public void deleteExpense(Long id) {
        User currentUser = getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        expenseRepository.delete(expense);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return user;
    }
}
