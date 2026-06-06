package com.loan.VerificationSystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true, message = "Amount must be 0 or greater")
    private Double amount;

    @Column(nullable = false)
    private String category; // Jaise: Rent, Food, EMI

    private String description;

    @Column(nullable = false)
    private LocalDate date;
}