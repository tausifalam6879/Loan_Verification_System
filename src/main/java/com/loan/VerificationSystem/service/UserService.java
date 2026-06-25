package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.dto.LoginRequestDTO;
import com.loan.VerificationSystem.dto.LoginResponseDTO;
import com.loan.VerificationSystem.dto.OtpRequestDTO;
import com.loan.VerificationSystem.dto.OtpResponseDTO;
import com.loan.VerificationSystem.dto.OtpVerifyRequestDTO;
import com.loan.VerificationSystem.dto.UserRequestDTO;
import com.loan.VerificationSystem.dto.UserResponseDTO;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.repository.UserRepository;
import com.loan.VerificationSystem.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailNotificationService emailNotificationService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       OtpService otpService,
                       EmailNotificationService emailNotificationService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.emailNotificationService = emailNotificationService;
    }

    public UserResponseDTO registerUser(UserRequestDTO request) {
        otpService.validateToken(request.getEmail(), "REGISTER", request.getOtpToken());

        User existingUser = userRepository.findByEmail(request.getEmail());

        if (existingUser != null) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setRole("USER");

        User savedUser = userRepository.save(user);
        emailNotificationService.send(
                savedUser.getEmail(),
                "FinTrack account created",
                "Your FinTrack account has been created successfully."
        );

        return mapToResponse(savedUser);
    }

    public LoginResponseDTO loginUser(LoginRequestDTO request) {
        otpService.validateToken(request.getEmail(), "LOGIN", request.getOtpToken());

        User user = userRepository.findByEmail(request.getEmail());

        if (user == null) {
            throw new RuntimeException("Invalid email or password");
        }

        boolean matches = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!matches) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.getEmail()
        );

        return new LoginResponseDTO(
                token,
                user.getEmail(),
                user.getRole()
        );
    }

    public OtpResponseDTO requestOtp(OtpRequestDTO request) {
        otpService.sendOtp(request.getEmail(), request.getPurpose());
        String message = otpService.isOtpEnabled()
                ? "OTP sent to email."
                : "OTP is disabled. Start backend with APP_OTP_ENABLED=true, APP_MAIL_ENABLED=true and SMTP credentials.";
        return new OtpResponseDTO(message, otpService.isOtpEnabled(), null);
    }

    public OtpResponseDTO verifyOtp(OtpVerifyRequestDTO request) {
        String token = otpService.verifyOtp(request.getEmail(), request.getPurpose(), request.getOtp());
        String message = otpService.isOtpEnabled()
                ? "OTP verified."
                : "OTP is disabled for this environment.";
        return new OtpResponseDTO(message, otpService.isOtpEnabled(), token);
    }

    public UserResponseDTO getCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("Authenticated user not found");
        }

        return mapToResponse(user);
    }

    private UserResponseDTO mapToResponse(User user) {

        UserResponseDTO response = new UserResponseDTO();

        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setTotalApplications((long) user.getLoanApplications().size());
        response.setCreditScore(user.getLoanApplications().stream()
                .map(com.loan.VerificationSystem.entity.LoanApplication::getCreditScore)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(null));

        return response;
    }
}
