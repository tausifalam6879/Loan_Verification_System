package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.entity.Expense;
import com.loan.VerificationSystem.repository.ExpenseRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*") // Ye line ab active hai, isse frontend connect ho payega
public class ExpenseController {

    @Autowired
    private ExpenseRepository expenseRepository;

    // 1. Naya Kharcha Save Karne Ki API (POST Request)
    @PostMapping("/add")
    public String addExpense(@Valid @RequestBody Expense expense) {
        // Automatically aaj ki date set kar do agar date nahi bheji
        if (expense.getDate() == null) {
            expense.setDate(LocalDate.now());
        }
        expenseRepository.save(expense);
        return "Naya Kharcha (Expense) Database me successfully save ho gaya!";
    }

    // 2. Saare Kharche Dekhne Ki API (GET Request)
    @GetMapping("/all")
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    // 3. Kharcha Delete Karne Ki API (DELETE Request)
    @DeleteMapping("/delete/{id}")
    public String deleteExpense(@PathVariable Long id) {
        expenseRepository.deleteById(id);
        return "Kharcha successfully delete ho gaya!";
    }
}