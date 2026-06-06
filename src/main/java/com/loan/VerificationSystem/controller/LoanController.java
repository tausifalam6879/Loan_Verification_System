package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.LoanOffer;
import com.loan.VerificationSystem.service.LoanService;
import com.loan.VerificationSystem.service.LoanService.PaymentRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@CrossOrigin(origins = "*")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @GetMapping("/offers")
    public List<LoanOffer> getOffers() {
        return loanService.getAllOffers();
    }

    @GetMapping("/offers/{id}")
    public LoanOffer getOffer(@PathVariable Long id) {
        return loanService.getOffer(id);
    }

    @PostMapping("/apply")
    public LoanApplication apply(@Valid @RequestBody LoanApplication application) {
        return loanService.apply(application);
    }

    @GetMapping("/applications")
    public List<LoanApplication> getApplications() {
        return loanService.getApplications();
    }

    @PostMapping("/applications/{id}/payment")
    public LoanApplication markProcessingFeePaid(@PathVariable Long id, @Valid @RequestBody PaymentRequest paymentRequest) {
        return loanService.markProcessingFeePaid(id, paymentRequest);
    }
}
