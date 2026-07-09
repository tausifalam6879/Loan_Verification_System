package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.entity.Expense;
import com.loan.VerificationSystem.entity.LoanApplication;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.repository.ExpenseRepository;
import com.loan.VerificationSystem.repository.LoanApplicationRepository;
import com.loan.VerificationSystem.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AiDashboardContextService {

    private final ExpenseRepository expenseRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final UserRepository userRepository;

    public AiDashboardContextService(
            ExpenseRepository expenseRepository,
            LoanApplicationRepository loanApplicationRepository,
            UserRepository userRepository
    ) {
        this.expenseRepository = expenseRepository;
        this.loanApplicationRepository = loanApplicationRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> buildContext(String page) {
        List<Expense> expenses = expenseRepository.findAll(Sort.by(
                Sort.Order.desc("createdAt"),
                Sort.Order.desc("date"),
                Sort.Order.desc("id")
        ));

        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        double totalExpense = expenses.stream().mapToDouble(this::amount).sum();
        double currentMonthExpense = expenses.stream()
                .filter(expense -> expense.getDate() != null && YearMonth.from(expense.getDate()).equals(currentMonth))
                .mapToDouble(this::amount)
                .sum();

        Map<String, Double> categoryTotals = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> cleanCategory(expense.getCategory()),
                        Collectors.summingDouble(this::amount)
                ))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> round(entry.getValue()),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, Double> monthlyTotals = expenses.stream()
                .filter(expense -> expense.getDate() != null)
                .collect(Collectors.groupingBy(
                        expense -> YearMonth.from(expense.getDate()).toString(),
                        Collectors.summingDouble(this::amount)
                ))
                .entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> round(entry.getValue()),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        List<Double> recentMonthlyValues = monthlyTotals.values().stream()
                .skip(Math.max(0, monthlyTotals.size() - 3))
                .toList();
        double forecast = recentMonthlyValues.isEmpty()
                ? 0
                : round(recentMonthlyValues.stream().mapToDouble(Double::doubleValue).average().orElse(0));

        List<Map<String, Object>> recentTransactions = expenses.stream()
                .sorted(Comparator.comparing(Expense::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(this::toTransactionContext)
                .toList();

        List<Map<String, Object>> anomalies = detectAnomalies(expenses);
        List<Map<String, Object>> loanSummary = loadCurrentUserLoans();

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("page", page == null || page.isBlank() ? "dashboard" : page);
        context.put("currency", "INR");
        context.put("expenseStorageNote", "Expenses in this project are stored in a shared expense ledger; there is no user_id column on Expense yet.");
        context.put("incomeNote", "Monthly income/current balance are frontend-local values and are not stored in backend database, so backend cannot verify them unless persisted later.");
        context.put("transactionCount", expenses.size());
        context.put("totalExpenseAllTime", round(totalExpense));
        context.put("currentMonth", monthLabel(currentMonth));
        context.put("currentMonthExpense", round(currentMonthExpense));
        context.put("topCategories", categoryTotals.entrySet().stream()
                .limit(5)
                .map(entry -> Map.of("category", entry.getKey(), "amount", entry.getValue()))
                .toList());
        context.put("monthlyTotals", monthlyTotals.entrySet().stream()
                .skip(Math.max(0, monthlyTotals.size() - 6))
                .map(entry -> Map.of("month", entry.getKey(), "amount", entry.getValue()))
                .toList());
        context.put("forecastNextMonth", Map.of(
                "method", "simple moving average of recent monthly totals",
                "amount", forecast
        ));
        context.put("unusualSpending", anomalies);
        context.put("recentTransactions", recentTransactions);
        context.put("loanApplications", loanSummary);
        context.put("savingSignals", savingSignals(categoryTotals, currentMonthExpense, forecast, anomalies));
        return context;
    }

    private List<Map<String, Object>> detectAnomalies(List<Expense> expenses) {
        Map<String, List<Double>> byCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> cleanCategory(expense.getCategory()),
                        Collectors.mapping(this::amount, Collectors.toList())
                ));

        List<Map<String, Object>> anomalies = new ArrayList<>();
        for (Expense expense : expenses) {
            String category = cleanCategory(expense.getCategory());
            List<Double> values = byCategory.getOrDefault(category, List.of());
            if (values.size() < 3) {
                continue;
            }

            double average = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            double threshold = Math.max(average * 2.2, 1200);
            if (amount(expense) > threshold) {
                Map<String, Object> item = toTransactionContext(expense);
                item.put("reason", category + " amount is above usual average Rs. " + Math.round(average));
                anomalies.add(item);
            }
        }

        return anomalies.stream().limit(5).toList();
    }

    private List<String> savingSignals(
            Map<String, Double> categoryTotals,
            double currentMonthExpense,
            double forecast,
            List<Map<String, Object>> anomalies
    ) {
        List<String> tips = new ArrayList<>();
        categoryTotals.entrySet().stream().findFirst().ifPresent(top ->
                tips.add(top.getKey() + " is the highest spending category at Rs. " + Math.round(top.getValue()) + ".")
        );
        if (forecast > currentMonthExpense && currentMonthExpense > 0) {
            tips.add("Forecast is higher than current month spending; review discretionary categories early.");
        }
        if (!anomalies.isEmpty()) {
            tips.add("Review unusual transactions before making savings decisions.");
        }
        if (tips.isEmpty()) {
            tips.add("Add more expense records to generate stronger saving signals.");
        }
        return tips;
    }

    private List<Map<String, Object>> loadCurrentUserLoans() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return List.of();
        }

        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            return List.of();
        }

        return loanApplicationRepository.findByUser(user)
                .stream()
                .sorted(Comparator.comparing(LoanApplication::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(application -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", application.getId());
                    item.put("status", application.getStatus());
                    item.put("requestedAmount", application.getRequestedAmount());
                    item.put("monthlyIncome", application.getMonthlyIncome());
                    item.put("existingEmi", application.getExistingEmi());
                    item.put("creditScore", application.getCreditScore());
                    item.put("fraudScore", application.getFraudScore());
                    item.put("fraudLevel", application.getFraudLevel());
                    item.put("createdAt", Objects.toString(application.getCreatedAt(), ""));
                    return item;
                })
                .toList();
    }

    private Map<String, Object> toTransactionContext(Expense expense) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", expense.getId());
        item.put("date", Objects.toString(expense.getDate(), ""));
        item.put("category", cleanCategory(expense.getCategory()));
        item.put("description", expense.getDescription() == null ? "" : expense.getDescription());
        item.put("amount", round(amount(expense)));
        return item;
    }

    private double amount(Expense expense) {
        return expense.getAmount() == null ? 0 : expense.getAmount();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String cleanCategory(String category) {
        if (category == null || category.isBlank()) {
            return "Other";
        }
        String value = category.trim();
        return value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
    }

    private String monthLabel(YearMonth month) {
        return month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + month.getYear();
    }
}
