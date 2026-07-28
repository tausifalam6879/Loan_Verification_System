package com.loan.VerificationSystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.LoanOffer;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.exception.ResourceNotFoundException;
import com.loan.VerificationSystem.repository.LoanApplicationRepository;
import com.loan.VerificationSystem.repository.LoanOfferRepository;
import com.loan.VerificationSystem.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanOfferRepository loanOfferRepository;

    @Mock
    private LoanApplicationRepository loanApplicationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectMapper objectMapper;

    private LoanService loanService;
    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(7L);
        currentUser.setFullName("Loan User");
        currentUser.setEmail("user@example.com");
        currentUser.setPassword("encoded");
        currentUser.setRole("USER");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        currentUser.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );
        loanService = new LoanService(
                loanOfferRepository,
                loanApplicationRepository,
                userRepository,
                objectMapper,
                "http://127.0.0.1:1/fraud-score"
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void refusesToListEveryUsersApplicationsForNormalUser() {
        assertThrows(AccessDeniedException.class, loanService::getApplications);

        verify(loanApplicationRepository, never()).findAll();
    }

    @Test
    void refusesToPayForAnotherUsersApplication() {
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(currentUser);
        when(loanApplicationRepository.findByIdAndUser(44L, currentUser)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> loanService.markProcessingFeePaid(
                        44L,
                        new LoanService.PaymentRequest(500.0, "TEST-REF")
                )
        );

        verify(loanApplicationRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void calculatesProcessingFeeOnServerAndMarksOwnedApplicationPaid() {
        LoanOffer offer = new LoanOffer();
        offer.setProcessingFeePercent(1.0);

        LoanApplication application = new LoanApplication();
        application.setId(12L);
        application.setUser(currentUser);
        application.setLoanOffer(offer);
        application.setRequestedAmount(100_000.0);
        application.setPaymentStatus("UNPAID");

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(currentUser);
        when(loanApplicationRepository.findByIdAndUser(12L, currentUser))
                .thenReturn(Optional.of(application));
        when(loanApplicationRepository.save(application)).thenReturn(application);

        LoanApplication result = loanService.markProcessingFeePaid(
                12L,
                new LoanService.PaymentRequest(1_000.0, "TEST-REF")
        );

        assertSame(application, result);
        assertEquals("PAID", result.getPaymentStatus());
        assertEquals(true, result.getProcessingFeePaid());
        assertEquals(1_000.0, result.getProcessingFeeAmount());
        assertEquals("TEST-REF", result.getPaymentReference());
        verify(loanApplicationRepository).save(application);
    }

    @Test
    void rejectsClientSuppliedProcessingFeeThatDoesNotMatchOffer() {
        LoanOffer offer = new LoanOffer();
        offer.setProcessingFeePercent(1.0);

        LoanApplication application = new LoanApplication();
        application.setUser(currentUser);
        application.setLoanOffer(offer);
        application.setRequestedAmount(100_000.0);
        application.setPaymentStatus("UNPAID");

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(currentUser);
        when(loanApplicationRepository.findByIdAndUser(12L, currentUser))
                .thenReturn(Optional.of(application));

        assertThrows(
                IllegalArgumentException.class,
                () -> loanService.markProcessingFeePaid(
                        12L,
                        new LoanService.PaymentRequest(100.0, "TEST-REF")
                )
        );

        verify(loanApplicationRepository, never()).save(application);
    }
}
