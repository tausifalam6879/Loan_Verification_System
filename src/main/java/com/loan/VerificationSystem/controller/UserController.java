package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.dto.LoginRequestDTO;
import com.loan.VerificationSystem.dto.LoginResponseDTO;
import com.loan.VerificationSystem.dto.UserRequestDTO;
import com.loan.VerificationSystem.dto.UserResponseDTO;
import com.loan.VerificationSystem.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/test")
    public String testBackend() {
        return "Congratulations! Loan Verification System Backend is Running Perfectly!";
    }

    @PostMapping("/register")
    public UserResponseDTO registerUser(
            @Valid @RequestBody UserRequestDTO request) {

        return userService.registerUser(request);
    }

    @PostMapping("/login")
    public LoginResponseDTO loginUser(
            @Valid @RequestBody LoginRequestDTO request) {

        return userService.loginUser(request);
    }
}