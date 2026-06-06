package com.loan.VerificationSystem.config;

import com.loan.VerificationSystem.entity.Bank;
import com.loan.VerificationSystem.entity.LoanOffer;
import com.loan.VerificationSystem.entity.LoanType;
import com.loan.VerificationSystem.repository.BankRepository;
import com.loan.VerificationSystem.repository.LoanOfferRepository;
import com.loan.VerificationSystem.repository.LoanTypeRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LoanDataSeeder {

    @Bean
    ApplicationRunner seedLoanData(BankRepository bankRepository,
                                   LoanTypeRepository loanTypeRepository,
                                   LoanOfferRepository loanOfferRepository) {
        return args -> {
            if (loanOfferRepository.count() > 0) {
                return;
            }

            Bank sbi = bankRepository.save(bank("State Bank of India", "SBI", "#1d4ed8"));
            Bank hdfc = bankRepository.save(bank("HDFC Bank", "HDFC", "#0f766e"));
            Bank indian = bankRepository.save(bank("Indian Bank", "Indian Bank", "#f59e0b"));

            LoanType personal = loanTypeRepository.save(type("Personal Loan", "personal", "credit", "#2563eb",
                    "Fast unsecured loan for personal needs."));
            LoanType home = loanTypeRepository.save(type("Home Loan", "home", "home", "#0f766e",
                    "Long-tenure home purchase, construction or renovation loan."));
            LoanType business = loanTypeRepository.save(type("Business Loan", "business", "business", "#7c3aed",
                    "Working capital and business growth financing."));
            LoanType education = loanTypeRepository.save(type("Education Loan", "education", "school", "#ea580c",
                    "Study finance for India and abroad."));
            LoanType vehicle = loanTypeRepository.save(type("Vehicle Loan", "vehicle", "car", "#0891b2",
                    "Car, two-wheeler and EV purchase loan."));
            LoanType gold = loanTypeRepository.save(type("Gold Loan", "gold", "gold", "#ca8a04",
                    "Secured loan against pledged gold."));

            loanOfferRepository.save(offer(sbi, personal, 10.00, 1200000.0, 12, 72, "1.5% onwards", 700,
                    "Quick approval, flexible EMI, no collateral",
                    "PAN, Aadhaar, salary slips, bank statement"));
            loanOfferRepository.save(offer(hdfc, personal, 10.75, 1500000.0, 12, 60, "Up to 2%", 720,
                    "Premium salaried profile offers, instant checks",
                    "KYC, income proof, bank statement"));
            loanOfferRepository.save(offer(sbi, home, 8.40, 8000000.0, 60, 360, "0.5% onwards", 690,
                    "Low rate, long tenure, balance transfer support",
                    "Property papers, KYC, income proof, bank statement"));
            loanOfferRepository.save(offer(hdfc, business, 12.75, 5000000.0, 12, 84, "2% onwards", 700,
                    "MSME friendly, working capital support, fast assessment",
                    "GST certificate, ITR, bank statement, business proof"));
            loanOfferRepository.save(offer(indian, education, 9.25, 3000000.0, 12, 180, "Low or nil", 660,
                    "Moratorium support, India and abroad education",
                    "Admission letter, fee structure, KYC, co-applicant income"));
            loanOfferRepository.save(offer(hdfc, vehicle, 8.90, 2500000.0, 12, 84, "1% onwards", 675,
                    "On-road funding, EV support, dealer integration",
                    "KYC, income proof, vehicle quotation, bank statement"));
            loanOfferRepository.save(offer(indian, gold, 7.95, 2000000.0, 3, 36, "Minimal", 600,
                    "Quick disbursal, secured loan, lower rate",
                    "KYC, address proof, gold valuation"));
        };
    }

    private Bank bank(String name, String shortName, String themeColor) {
        Bank bank = new Bank();
        bank.setName(name);
        bank.setShortName(shortName);
        bank.setThemeColor(themeColor);
        return bank;
    }

    private LoanType type(String name, String slug, String iconName, String color, String description) {
        LoanType loanType = new LoanType();
        loanType.setName(name);
        loanType.setSlug(slug);
        loanType.setIconName(iconName);
        loanType.setColor(color);
        loanType.setDescription(description);
        return loanType;
    }

    private LoanOffer offer(Bank bank, LoanType type, Double rate, Double maxAmount,
                            Integer minTenure, Integer maxTenure, String processingFee,
                            Integer minCreditScore, String highlights, String documents) {
        LoanOffer offer = new LoanOffer();
        offer.setBank(bank);
        offer.setLoanType(type);
        offer.setInterestRate(rate);
        offer.setMaxAmount(maxAmount);
        offer.setMinTenureMonths(minTenure);
        offer.setMaxTenureMonths(maxTenure);
        offer.setProcessingFee(processingFee);
        offer.setMinCreditScore(minCreditScore);
        offer.setHighlights(highlights);
        offer.setDocumentsRequired(documents);
        return offer;
    }
}
