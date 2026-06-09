package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.dto.LoginRequestDTO;
import com.loan.VerificationSystem.dto.LoginResponseDTO;
import com.loan.VerificationSystem.dto.UserRequestDTO;
import com.loan.VerificationSystem.dto.UserResponseDTO;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.repository.UserRepository;
import com.loan.VerificationSystem.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public UserResponseDTO registerUser(UserRequestDTO request) {

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

        user.setRole(normalizeRole(request.getRole()));

        User savedUser = userRepository.save(user);

        return mapToResponse(savedUser);
    }

    public LoginResponseDTO loginUser(LoginRequestDTO request) {

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

    private UserResponseDTO mapToResponse(User user) {

        UserResponseDTO response = new UserResponseDTO();

        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());

        return response;
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "USER";
        }

        String normalized = role.trim().toUpperCase(Locale.ROOT).replace("ROLE_", "");
        return "ADMIN".equals(normalized) ? "ADMIN" : "USER";
    }
}
