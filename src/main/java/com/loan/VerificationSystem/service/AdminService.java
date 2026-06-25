package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.entity.AuditLog;
import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.exception.ResourceNotFoundException;
import com.loan.VerificationSystem.repository.AuditLogRepository;
import com.loan.VerificationSystem.repository.LoanApplicationRepository;
import com.loan.VerificationSystem.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailNotificationService emailNotificationService;

    public AdminService(UserRepository userRepository,
                        LoanApplicationRepository loanApplicationRepository,
                        AuditLogRepository auditLogRepository,
                        EmailNotificationService emailNotificationService) {
        this.userRepository = userRepository;
        this.loanApplicationRepository = loanApplicationRepository;
        this.auditLogRepository = auditLogRepository;
        this.emailNotificationService = emailNotificationService;
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
        LoanApplication saved = loanApplicationRepository.save(application);
        recordDecision(saved, "APPROVED");
        notifyApplicant(saved, "Loan Approved", "Your loan application #" + saved.getId() + " has been approved.");
        return saved;
    }

    public LoanApplication rejectApplication(Long id) {

        LoanApplication application =
                loanApplicationRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Application not found"));

        application.setStatus("REJECTED");
        LoanApplication saved = loanApplicationRepository.save(application);
        recordDecision(saved, "REJECTED");
        notifyApplicant(saved, "Loan Rejected", "Your loan application #" + saved.getId() + " has been rejected.");
        return saved;
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
        stats.put("lowRisk",
                loanApplicationRepository.countByFraudLevelIgnoreCase("LOW"));
        stats.put("mediumRisk",
                loanApplicationRepository.countByFraudLevelIgnoreCase("MEDIUM"));
        stats.put("highRisk",
                loanApplicationRepository.countByFraudLevelIgnoreCase("HIGH"));

        return stats;
    }

    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc();
    }

    private void recordDecision(LoanApplication application, String decision) {
        AuditLog log = new AuditLog();
        log.setActorEmail(SecurityContextHolder.getContext().getAuthentication().getName());
        log.setAction("LOAN_" + decision);
        log.setEntityType("LOAN_APPLICATION");
        log.setEntityId(application.getId());
        log.setDetails("Admin " + decision.toLowerCase() + " application #"
                + application.getId() + " for " + application.getApplicantName());
        auditLogRepository.save(log);
    }

    private void notifyApplicant(LoanApplication application, String subject, String body) {
        if (application.getEmail() != null && !application.getEmail().isBlank()) {
            emailNotificationService.send(application.getEmail(), "FinTrack " + subject, body);
        }
    }
}
