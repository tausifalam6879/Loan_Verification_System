package com.loan.VerificationSystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @DecimalMin(value = "0.01", inclusive = true, message = "Amount must be greater than 0")
    private Double amount;

    @Column(nullable = false)
    @NotBlank(message = "Category is required")
    @Size(max = 60, message = "Category must be 60 characters or less")
    private String category; // Jaise: Rent, Food, EMI

    @Size(max = 240, message = "Description must be 240 characters or less")
    private String description;

    @Size(max = 100, message = "Merchant must be 100 characters or less")
    private String merchant;

    @Size(max = 40, message = "Payment method must be 40 characters or less")
    private String paymentMethod;

    private Boolean recurring = false;

    @Column(nullable = false)
    private LocalDate date;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    public void onCreate() {
        if (date == null) {
            date = LocalDate.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (recurring == null) {
            recurring = false;
        }
    }
}
