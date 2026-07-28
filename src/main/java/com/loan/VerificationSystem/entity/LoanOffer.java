package com.loan.VerificationSystem.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "loan_offers")
public class LoanOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    private Bank bank;

    @ManyToOne(fetch = FetchType.EAGER)
    private LoanType loanType;

    @Column(nullable = false)
    private Double interestRate;

    @Column(nullable = false)
    private Double maxAmount;

    private Double minAmount = 25000.0;

    @Column(nullable = false)
    private Integer minTenureMonths;

    @Column(nullable = false)
    private Integer maxTenureMonths;

    private String processingFee;

    private Double processingFeePercent = 0.5;

    private Integer minCreditScore;

    @Column(length = 1200)
    private String highlights;

    @Column(length = 1200)
    private String documentsRequired;

    private Boolean active = true;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }
}
