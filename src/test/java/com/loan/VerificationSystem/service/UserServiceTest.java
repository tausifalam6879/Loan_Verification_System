package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.dto.UserProfileUpdateDTO;
import com.loan.VerificationSystem.dto.UserResponseDTO;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.repository.UserRepository;
import com.loan.VerificationSystem.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private OtpService otpService;

    @Mock
    private EmailNotificationService emailNotificationService;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void authenticateUser() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@example.com", "ignored")
        );
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void updatesOnlyEditableProfileFieldsForAuthenticatedUser() {
        User user = new User();
        user.setId(7L);
        user.setFullName("Old Name");
        user.setEmail("user@example.com");
        user.setMobile(null);
        user.setRole("USER");
        user.setLoanApplications(new ArrayList<>());

        UserProfileUpdateDTO request = new UserProfileUpdateDTO();
        request.setFullName(" Updated User ");
        request.setMobile("98765 43210");

        when(userRepository.findByEmail("user@example.com")).thenReturn(user);
        when(userRepository.findByMobile("9876543210")).thenReturn(null);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponseDTO response = userService.updateCurrentUser(request);

        assertThat(response.getFullName()).isEqualTo("Updated User");
        assertThat(response.getMobile()).isEqualTo("9876543210");
        assertThat(response.getEmail()).isEqualTo("user@example.com");
        verify(userRepository).save(user);
    }
}
