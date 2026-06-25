package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.entity.AuditLog;
import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.service.AdminService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return adminService.getAllUsers();
    }

    @GetMapping("/applications")
    public List<LoanApplication> getAllApplications() {
        return adminService.getAllApplications();
    }

    @PutMapping("/applications/{id}/approve")
    public LoanApplication approveApplication(
            @PathVariable Long id) {

        return adminService.approveApplication(id);
    }

    @PutMapping("/applications/{id}/reject")
    public LoanApplication rejectApplication(
            @PathVariable Long id) {

        return adminService.rejectApplication(id);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return adminService.getDashboardStats();
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> getAuditLogs() {
        return adminService.getAuditLogs();
    }
}
