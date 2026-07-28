package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.entity.Expense;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.exception.ResourceNotFoundException;
import com.loan.VerificationSystem.repository.ExpenseRepository;
import com.loan.VerificationSystem.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    private ExpenseService expenseService;
    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(7L);
        currentUser.setEmail("user@example.com");
        currentUser.setRole("USER");
        currentUser.setFullName("Expense User");
        currentUser.setPassword("encoded");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(currentUser.getEmail(), null)
        );
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(currentUser);
        expenseService = new ExpenseService(expenseRepository, userRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listsOnlyAuthenticatedUsersExpenses() {
        Expense expense = expense(500.0, "Food");
        when(expenseRepository.findAllByUserOrderByCreatedAtDescDateDescIdDesc(currentUser))
                .thenReturn(List.of(expense));

        List<Expense> result = expenseService.getAllExpenses();

        assertEquals(List.of(expense), result);
        verify(expenseRepository).findAllByUserOrderByCreatedAtDescDateDescIdDesc(currentUser);
        verify(expenseRepository, never()).findAll();
    }

    @Test
    void assignsAuthenticatedUserWhenAddingExpense() {
        Expense request = expense(850.0, "Travel");
        request.setId(99L);
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Expense saved = expenseService.addExpense(request);

        assertSame(currentUser, saved.getUser());
        assertNull(saved.getId());
        verify(expenseRepository).save(saved);
    }

    @Test
    void refusesToDeleteExpenseNotOwnedByAuthenticatedUser() {
        when(expenseRepository.findByIdAndUser(44L, currentUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> expenseService.deleteExpense(44L));

        verify(expenseRepository, never()).delete(any(Expense.class));
    }

    private Expense expense(double amount, String category) {
        Expense expense = new Expense();
        expense.setAmount(amount);
        expense.setCategory(category);
        expense.setDescription("Test expense");
        return expense;
    }
}
