package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.dto.ExpenseCategoryRequestDTO;
import com.loan.VerificationSystem.dto.ExpenseCategoryResponseDTO;
import com.loan.VerificationSystem.response.ApiResponse;
import com.loan.VerificationSystem.service.AiExpenseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/expenses")
@CrossOrigin(origins = "*")
public class AiExpenseController {

    private final AiExpenseService aiExpenseService;

    public AiExpenseController(AiExpenseService aiExpenseService) {
        this.aiExpenseService = aiExpenseService;
    }

    @PostMapping("/category")
    public ApiResponse<ExpenseCategoryResponseDTO> predictCategory(
            @Valid @RequestBody ExpenseCategoryRequestDTO request
    ) {
        return new ApiResponse<>(
                true,
                "Expense category predicted successfully",
                aiExpenseService.predictCategory(request)
        );
    }
}
