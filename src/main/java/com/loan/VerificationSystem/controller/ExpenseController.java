package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.entity.Expense;
import com.loan.VerificationSystem.response.ApiResponse;
import com.loan.VerificationSystem.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping("/add")
    public ApiResponse<Expense> addExpense(@Valid @RequestBody Expense expense) {

        Expense savedExpense = expenseService.addExpense(expense);

        return new ApiResponse<>(
                true,
                "Expense added successfully",
                savedExpense
        );
    }

    @GetMapping("/all")
    public ApiResponse<List<Expense>> getAllExpenses() {

        return new ApiResponse<>(
                true,
                "Expenses fetched successfully",
                expenseService.getAllExpenses()
        );
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<String> deleteExpense(@PathVariable Long id) {

        expenseService.deleteExpense(id);

        return new ApiResponse<>(
                true,
                "Expense deleted successfully",
                null
        );
    }
}