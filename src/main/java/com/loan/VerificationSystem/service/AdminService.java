package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.exception.ResourceNotFoundException;
import com.loan.VerificationSystem.repository.LoanApplicationRepository;
import com.loan.VerificationSystem.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final LoanApplicationRepository loanApplicationRepository;

    public AdminService(UserRepository userRepository,
                        LoanApplicationRepository loanApplicationRepository) {
        this.userRepository = userRepository;
        this.loanApplicationRepository = loanApplicationRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<LoanApplication> getAllApplications() {
        return loanApplicationRepository.findAll();
    }

    public LoanApplication approveApplication(Long id) {

        LoanApplication application =
                loanApplicationRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Application not found"));

        application.setStatus("APPROVED");

        return loanApplicationRepository.save(application);
    }

    public LoanApplication rejectApplication(Long id) {

        LoanApplication application =
                loanApplicationRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Application not found"));

        application.setStatus("REJECTED");

        return loanApplicationRepository.save(application);
    }

    public Map<String, Object> getDashboardStats() {

        Map<String, Object> stats = new HashMap<>();

        stats.put("totalUsers",
                userRepository.count());

        stats.put("totalApplications",
                loanApplicationRepository.count());

        stats.put("approvedLoans",
                loanApplicationRepository.countByStatus("APPROVED"));

        stats.put("rejectedLoans",
                loanApplicationRepository.countByStatus("REJECTED"));

        stats.put("preApprovedLoans",
                loanApplicationRepository.countByStatus("PRE_APPROVED"));

        return stats;
    }
}