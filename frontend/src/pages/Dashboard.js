import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CssBaseline,
  Grid,
  Snackbar,
  Typography
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonIcon from "@mui/icons-material/Person";
import PaymentsIcon from "@mui/icons-material/Payments";
import SavingsIcon from "@mui/icons-material/Savings";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import FinancialCommandCenter from "../components/dashboard/FinancialCommandCenter";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseBudgetPlanner from "../components/ExpenseBudgetPlanner";
import ExpenseIntelligencePanel from "../components/ExpenseIntelligencePanel";
import ExpenseOverviewCards from "../components/ExpenseOverviewCards";
import ExpensePieChart from "../components/ExpensePieChart";
import InvestmentMarketHub from "../components/InvestmentMarketHub";
import LoanSection from "../components/loans/LoanSection";
import MonthlyExpenseChart from "../components/MonthlyExpenseChart";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TransactionTable from "../components/TransactionTable";
import useExpenses from "../hooks/useExpenses";
import { exportExpensesToCSV } from "../utils/exportCsv";
import AiAssistant from "../components/AiAssistant";
import { getProfile, logout } from "../services/authService";
import { getLoanApplications } from "../services/loanService";
import { demoMode, resetDemoState } from "../api/demoAdapter";

const Dashboard = ({ themeMode, activeMode, onThemeModeChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "USER";
  const email = localStorage.getItem("email") || "demo";
  const incomeStorageKey = `userIncome:${email}`;
  const budgetStorageKey = `expenseBudgets:${email}`;
  const {
    expenses,
    loading,
    error,
    loadExpenses,
    createExpense,
    editExpense,
    removeExpense
  } = useExpenses();

  const [totalIncome, setTotalIncome] = useState(() => {
    const saved = localStorage.getItem(incomeStorageKey) || localStorage.getItem("userIncome");
    return saved ? Number(saved) : 50000;
  });
  const [incomeInput, setIncomeInput] = useState(totalIncome);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tabValue, setTabValue] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortKey, setSortKey] = useState("date");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showRecents] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem(budgetStorageKey);
      return saved
        ? JSON.parse(saved)
        : { food: 6000, travel: 3000, bills: 3500, shopping: 4000, rent: 10000 };
    } catch (error) {
      return { food: 6000, travel: 3000, bills: 3500, shopping: 4000, rent: 10000 };
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overviewAccount, setOverviewAccount] = useState({
    profile: { email, role, creditScore: null },
    applications: [],
    loading: false,
    refreshedAt: ""
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
    undoExpense: null
  });

  useEffect(() => {
    localStorage.setItem(budgetStorageKey, JSON.stringify(budgets));
  }, [budgetStorageKey, budgets]);

  const currentMonthExpense = useMemo(() => {
    const now = new Date();
    return expenses.reduce((sum, expense) => {
      const raw = expense.date || expense.createdAt;
      if (!raw) return sum;
      const parsed = new Date(String(raw).includes("T") ? raw : `${raw}T00:00:00`);
      const isCurrentMonth =
        !Number.isNaN(parsed.getTime()) &&
        parsed.getFullYear() === now.getFullYear() &&
        parsed.getMonth() === now.getMonth();
      return sum + (isCurrentMonth ? Number(expense.amount || 0) : 0);
    }, 0);
  }, [expenses]);

  const balance = totalIncome - currentMonthExpense;
  const workspaceByPath = {
    "/": "overview",
    "/expense": "expense",
    "/transactions": "expense",
    "/loans": "loans",
    "/payments": "payments",
    "/applications": "applications",
    "/investments": "investments",
    "/markets": "markets"
  };
  const pathByWorkspace = {
    overview: "/",
    expense: "/expense",
    loans: "/loans",
    payments: "/payments",
    applications: "/applications",
    investments: "/investments",
    markets: "/markets",
    profile: "/profile"
  };
  const activeWorkspace = workspaceByPath[location.pathname] || "overview";
  const isOverview = activeWorkspace === "overview";

  const loadOverviewAccount = useCallback(async () => {
    setOverviewAccount((current) => ({ ...current, loading: true }));
    const [profileResult, applicationsResult] = await Promise.allSettled([
      getProfile(),
      getLoanApplications()
    ]);

    setOverviewAccount((current) => ({
      profile: profileResult.status === "fulfilled"
        ? profileResult.value
        : current.profile,
      applications: applicationsResult.status === "fulfilled" && Array.isArray(applicationsResult.value)
        ? applicationsResult.value
        : current.applications,
      loading: false,
      refreshedAt: new Date().toISOString()
    }));
  }, []);

  useEffect(() => {
    if (activeWorkspace !== "markets") loadOverviewAccount();
  }, [activeWorkspace, loadOverviewAccount]);
  const pageMeta = {
    expense: {
      title: "Expense Page",
      subtitle: "Add expenses, review charts, and manage transaction records together."
    },
    loans: {
      title: "Loan Marketplace",
      subtitle: "Browse backend loan offers and open the application flow."
    },
    payments: {
      title: "Payment Gateway",
      subtitle: "Pay with UPI, card, or net banking and record the payment in the expense ledger."
    },
    applications: {
      title: "Loan Application Center",
      subtitle: "Track decisions, verification progress, payment status and application details."
    },
    investments: {
      title: "Savings & Investment Planner",
      subtitle: "Calculate FD maturity, explore SIP projection ranges and save comparison plans."
    },
    markets: {
      title: "Global Market Intelligence",
      subtitle: "Track global indices, market signals, news factors and research evidence."
    }
  };

  const uniqueCategories = useMemo(() => {
    const categories = expenses
      .map((expense) => (expense.category || "").toLowerCase())
      .filter(Boolean);

    return ["All", ...new Set(categories)];
  }, [expenses]);

  const filteredAndSortedExpenses = useMemo(() => {
    const search = searchQuery.toLowerCase();

    return expenses
      .filter((expense) => {
        const category = (expense.category || "").toLowerCase();
        const description = (expense.description || "").toLowerCase();
        const merchant = (expense.merchant || "").toLowerCase();
        const paymentMethod = (expense.paymentMethod || "").toLowerCase();
        const expenseDate = String(expense.date || expense.createdAt || "").slice(0, 10);
        const matchesTab =
          tabValue === "All" || category === tabValue.toLowerCase();
        const matchesSearch =
          description.includes(search) ||
          category.includes(search) ||
          merchant.includes(search) ||
          paymentMethod.includes(search);
        const matchesFrom = !dateFrom || (expenseDate && expenseDate >= dateFrom);
        const matchesTo = !dateTo || (expenseDate && expenseDate <= dateTo);

        return matchesTab && matchesSearch && matchesFrom && matchesTo;
      })
      .sort((a, b) => {
        let comparison;
        if (sortKey === "amount") {
          comparison = Number(a.amount || 0) - Number(b.amount || 0);
        } else if (sortKey === "category") {
          comparison = String(a.category || "").localeCompare(String(b.category || ""));
        } else {
          comparison = String(a.date || a.createdAt || "").localeCompare(String(b.date || b.createdAt || ""));
        }
        return sortOrder === "desc" ? -comparison : comparison;
      });
  }, [dateFrom, dateTo, expenses, searchQuery, sortKey, sortOrder, tabValue]);

  const showMessage = (message, severity = "success", undoExpense = null) => {
    setSnackbar({ open: true, message, severity, undoExpense });
  };

  const toLocalExpenseTimestamp = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    const pad = (number) => String(number).padStart(2, "0");
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

    return {
      date: day,
      createdAt: `${day}T${time}`
    };
  };

  const handleAddExpense = async (expense) => {
    const success = await createExpense(expense);
    showMessage(
      success ? "Expense added successfully." : "Could not add expense.",
      success ? "success" : "error"
    );
    return success;
  };

  const handleUpdateExpense = async (id, expense) => {
    const success = await editExpense(id, expense);
    showMessage(
      success ? "Expense updated successfully." : "Could not update expense.",
      success ? "success" : "error"
    );
    if (success) setEditingExpense(null);
    return success;
  };

  const handleGatewayPayment = async ({ amount, payee, method, paidAt }) => {
    const paymentTime = toLocalExpenseTimestamp(paidAt);
    const success = await createExpense({
      amount: Number(amount),
      category: "payment",
      description: `Payment to ${payee} via ${method}`,
      date: paymentTime.date,
      createdAt: paymentTime.createdAt
    });
    showMessage(
      success
        ? `Payment recorded. Balance deducted by Rs. ${Number(amount).toLocaleString("en-IN")}.`
        : "Payment could not be recorded in expenses.",
      success ? "success" : "error"
    );
    return success;
  };

  const handleDeleteExpense = async (id) => {
    const deletedExpense = expenses.find((expense) => Number(expense.id) === Number(id)) || null;
    const success = await removeExpense(id);
    if (success && Number(editingExpense?.id) === Number(id)) {
      setEditingExpense(null);
    }
    showMessage(
      success ? "Expense deleted. You can undo this action." : "Could not delete expense.",
      success ? "success" : "error",
      success ? deletedExpense : null
    );
    return success;
  };

  const handleUndoDelete = async () => {
    const deletedExpense = snackbar.undoExpense;
    if (!deletedExpense) return;
    const expenseToRestore = { ...deletedExpense };
    delete expenseToRestore.id;
    delete expenseToRestore.createdAt;
    const restored = await createExpense(expenseToRestore);
    showMessage(
      restored ? "Expense restored successfully." : "Expense could not be restored.",
      restored ? "success" : "error"
    );
  };

  const handleSaveIncome = () => {
    const newIncome = Number(incomeInput) || 0;
    updateMonthlyIncome(newIncome);
    setIsEditingIncome(false);
    showMessage("Income updated successfully.");
  };

  const updateMonthlyIncome = (value) => {
    const nextIncome = Math.max(0, Number(value) || 0);
    setTotalIncome(nextIncome);
    setIncomeInput(nextIncome);
    localStorage.setItem(incomeStorageKey, nextIncome);
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(expenses);
    setDrawerOpen(false);
    showMessage("CSV exported successfully.");
  };

  const handleRefreshOverview = async () => {
    await Promise.allSettled([loadExpenses(), loadOverviewAccount()]);
  };

  const handleExportFilteredCSV = () => {
    exportExpensesToCSV(filteredAndSortedExpenses);
    showMessage(`${filteredAndSortedExpenses.length} filtered transactions exported.`);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    window.setTimeout(() => {
      document.getElementById("expense-entry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleResetDemo = async () => {
    resetDemoState();
    setEditingExpense(null);
    await loadExpenses();
    showMessage("Demo expenses restored to the multi-month sample.");
  };

  const openWorkspace = (workspace) => {
    navigate(pathByWorkspace[workspace] || "/");
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const scrollToLoans = () => {
    openWorkspace("loans");
  };

  return (
    <>
      <CssBaseline />

      <Navbar
        setDrawerOpen={setDrawerOpen}
        balance={balance}
        themeMode={themeMode}
        onThemeModeChange={onThemeModeChange}
        role={role}
        email={email}
        onLogout={handleLogout}
      />

      <Sidebar
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        handleExportCSV={handleExportCSV}
        onOpenDashboard={() => openWorkspace("overview")}
        onOpenExpense={() => openWorkspace("expense")}
        onOpenLoans={scrollToLoans}
        onOpenPayments={() => openWorkspace("payments")}
        onOpenApplications={() => openWorkspace("applications")}
        onOpenInvestments={() => openWorkspace("investments")}
        onOpenMarkets={() => openWorkspace("markets")}
        onOpenAdmin={() => navigate("/admin")}
        onOpenProfile={() => {
          navigate("/profile");
          setDrawerOpen(false);
        }}
        onLogout={handleLogout}
        role={role}
      />

      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          background:
            activeMode === "soft"
              ? "radial-gradient(circle at top right, rgba(205, 159, 204, 0.24), transparent 28rem), linear-gradient(180deg, #fae8eb 0%, #fff5e8 36rem, #edf5ff 100%)"
              : "linear-gradient(180deg, rgba(8, 47, 73, 0.16) 0%, rgba(13, 148, 136, 0.12) 18rem, rgba(255, 255, 255, 0) 34rem)",
          pt: 11,
          px: { xs: 2, md: 4 },
          pb: 4
        }}
      >
        {!isOverview && activeWorkspace !== "markets" ? (
          <PageHeader
            title={pageMeta[activeWorkspace]?.title || "Workspace"}
            subtitle={pageMeta[activeWorkspace]?.subtitle || ""}
          />
        ) : null}

        {error && ["overview", "expense"].includes(activeWorkspace) && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {isOverview && (
          <>
            <FinancialCommandCenter
              expenses={expenses}
              totalIncome={totalIncome}
              budgets={budgets}
              profile={overviewAccount.profile}
              applications={overviewAccount.applications}
              onOpen={openWorkspace}
              onRefresh={handleRefreshOverview}
              onExport={handleExportCSV}
              incomeInput={incomeInput}
              setIncomeInput={setIncomeInput}
              isEditingIncome={isEditingIncome}
              setIsEditingIncome={setIsEditingIncome}
              onSaveIncome={handleSaveIncome}
              loading={loading || overviewAccount.loading}
              refreshedAt={overviewAccount.refreshedAt}
            />

            <WorkspaceCards
              activeWorkspace={activeWorkspace}
              expensesCount={expenses.length}
              currentMonthExpense={currentMonthExpense}
              applicationsCount={overviewAccount.applications.length}
              creditScore={overviewAccount.profile?.creditScore}
              savedPlansCount={readSavedPlanCount(email)}
              onOpen={openWorkspace}
            />
          </>
        )}

        <Box id="workspace-panel" sx={{ mt: activeWorkspace === "markets" ? 0.5 : 2.5 }}>
          {activeWorkspace === "expense" && (
            <>
              <ExpenseOverviewCards
                expenses={expenses}
                totalIncome={totalIncome}
                onIncomeChange={updateMonthlyIncome}
                isDemoMode={demoMode}
                onResetDemo={handleResetDemo}
              />

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 5 }} id="expense-entry">
                  <ExpenseForm
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    editingExpense={editingExpense}
                    onCancelEdit={() => setEditingExpense(null)}
                    loading={loading}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 7 }} id="analytics-section">
                  <ExpensePieChart expenses={expenses} loading={loading} />
                </Grid>
              </Grid>

              <ExpenseBudgetPlanner
                expenses={expenses}
                budgets={budgets}
                onBudgetsChange={setBudgets}
              />

              <MonthlyExpenseChart expenses={expenses} />

              <ExpenseIntelligencePanel
                expenses={expenses}
                totalIncome={totalIncome}
              />

              <Box sx={{ mt: 2.5 }}>
                <TransactionTable
                  showRecents={showRecents}
                  tableData={{
                    expenses: filteredAndSortedExpenses,
                    categories: uniqueCategories
                  }}
                  filters={{
                    searchQuery,
                    setSearchQuery,
                    sortOrder,
                    setSortOrder,
                    sortKey,
                    setSortKey,
                    tabValue,
                    setTabValue,
                    dateFrom,
                    setDateFrom,
                    dateTo,
                    setDateTo
                  }}
                  onDelete={handleDeleteExpense}
                  onEdit={handleEditExpense}
                  onExport={handleExportFilteredCSV}
                  loading={loading}
                />
              </Box>
            </>
          )}

          {["loans", "payments", "applications"].includes(activeWorkspace) && (
            <LoanSection
              balance={balance}
              onRecordPayment={handleGatewayPayment}
              onOpenApplications={() => openWorkspace("applications")}
              view={activeWorkspace}
            />
          )}

          {activeWorkspace === "investments" && <InvestmentMarketHub initialTab="investments" />}
          {activeWorkspace === "markets" && <InvestmentMarketHub initialTab="markets" />}
        </Box>

        {activeWorkspace !== "markets" && (
          <AiAssistant
            balance={balance}
            totalIncome={totalIncome}
            totalExpense={currentMonthExpense}
            expenses={expenses}
            applications={overviewAccount.applications}
            page={activeWorkspace}
            onOpen={openWorkspace}
          />
        )}

        {!isOverview && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => openWorkspace("overview")}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 2.25,
                py: 1.15,
                textTransform: "none",
                fontWeight: 900,
                background: "linear-gradient(90deg, #0f766e, #2563eb)"
              }}
            >
              Back to dashboard
            </Button>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.undoExpense ? 6000 : 2500}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          action={
            snackbar.undoExpense ? (
              <Button color="inherit" size="small" onClick={handleUndoDelete} sx={{ fontWeight: 900 }}>
                Undo
              </Button>
            ) : null
          }
          onClose={() =>
            setSnackbar((current) => ({ ...current, open: false }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const PageHeader = ({ title, subtitle }) => (
  <Card
    elevation={0}
    sx={{
      mb: 2.5,
      borderRadius: 2,
      border: "1px solid rgba(15, 23, 42, 0.08)",
      background: (theme) =>
        theme.fintrackMode === "soft"
          ? "linear-gradient(135deg, #fffafb, #f3e8f4, #eaf3ff)"
          : "linear-gradient(135deg, #ffffff, #eef6ff)",
      boxShadow: (theme) => theme.fintrackMode === "soft"
        ? "0 8px 24px rgba(75, 52, 96, 0.08)"
        : "0 16px 38px rgba(15, 23, 42, 0.1)"
    }}
  >
    <CardContent
      sx={{
        p: 2.5,
        display: "flex",
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", md: "row" },
        gap: 2
      }}
    >
      <Box>
        <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
          FinTrack Workspace
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
          {title}
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const readSavedPlanCount = (email) => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(`savedInvestmentPlansV2:${String(email || "demo").toLowerCase()}`) || "[]"
    );
    return Array.isArray(saved) ? saved.length : 0;
  } catch (error) {
    return 0;
  }
};

const formatCompactCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Number(value || 0) >= 100000 ? "compact" : "standard"
  }).format(Number(value || 0));

const WorkspaceCards = ({
  activeWorkspace,
  expensesCount,
  currentMonthExpense,
  applicationsCount,
  creditScore,
  savedPlansCount,
  onOpen
}) => {
  const cards = [
    {
      id: "expense",
      title: "Expenses & budgets",
      subtitle: "Record transactions, control category limits and review spending insights",
      icon: <AddCircleIcon />,
      color: "#16a34a",
      surface: "linear-gradient(145deg, #dcfce7, #f7fee7)",
      meta: `${expensesCount} transactions`,
      group: "Money management"
    },
    {
      id: "markets",
      title: "Global Markets",
      subtitle: "World indices, market alerts, news factors and research evidence",
      icon: <ShowChartIcon />,
      color: "#2563eb",
      surface: "linear-gradient(145deg, #dbeafe, #ecfeff)",
      meta: "Alerts + research",
      group: "Wealth & research"
    },
    {
      id: "loans",
      title: "Loan Marketplace",
      subtitle: "Compare EMI, eligibility, total cost and lender offers",
      icon: <AccountBalanceIcon />,
      color: "#7c3aed",
      surface: "linear-gradient(145deg, #ede9fe, #f5f3ff)",
      meta: "EMI + eligibility",
      group: "Borrowing"
    },
    {
      id: "payments",
      title: "Payment Gateway",
      subtitle: "Record UPI, card and net-banking payments in the expense ledger",
      icon: <PaymentsIcon />,
      color: "#0d9488",
      surface: "linear-gradient(145deg, #ccfbf1, #ecfeff)",
      meta: `${formatCompactCurrency(currentMonthExpense)} spent`,
      group: "Money management"
    },
    {
      id: "applications",
      title: "Saved Applications",
      subtitle: "Track decisions, verification and processing-fee progress",
      icon: <AssignmentTurnedInIcon />,
      color: "#0891b2",
      surface: "linear-gradient(145deg, #cffafe, #ecfeff)",
      meta: `${applicationsCount} saved`,
      group: "Borrowing"
    },
    {
      id: "profile",
      title: "Profile",
      subtitle: "Manage identity, security, application activity and credit profile",
      icon: <PersonIcon />,
      color: "#ea580c",
      surface: "linear-gradient(145deg, #ffedd5, #fff7ed)",
      meta: creditScore ? `Score ${creditScore}` : "Complete profile",
      group: "Account"
    },
    {
      id: "investments",
      title: "Savings Planner",
      subtitle: "Calculate FD maturity, SIP ranges and save comparison plans",
      icon: <SavingsIcon />,
      color: "#ca8a04",
      surface: "linear-gradient(145deg, #fef3c7, #fefce8)",
      meta: `${savedPlansCount} saved plans`,
      group: "Wealth & research"
    }
  ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        background: (theme) =>
          theme.fintrackMode === "soft"
            ? "rgba(255, 253, 253, 0.92)"
            : "linear-gradient(145deg, #ffffff, #f8fafc)",
        boxShadow: (theme) => theme.fintrackMode === "soft"
          ? "0 8px 24px rgba(75, 52, 96, 0.07)"
          : "0 16px 40px rgba(15, 23, 42, 0.08)"
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 1,
            mb: 2
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
              Explore FinTrack
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Your financial workspaces
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Open a focused workspace without leaving your private dashboard.
            </Typography>
          </Box>
          <AssessmentIcon sx={{ color: "#2563eb", fontSize: 34 }} />
        </Box>

        <Grid container spacing={1.5}>
          {cards.map((card) => {
            const active = activeWorkspace === card.id;

            return (
              <Grid size={{ xs: 12, sm: 6, xl: 3 }} key={card.id}>
                <Card
                  elevation={0}
                  onClick={() => onOpen(card.id)}
                  sx={{
                    height: "100%",
                    minHeight: 148,
                    cursor: "pointer",
                    borderRadius: 2,
                    background: (theme) => theme.fintrackMode === "soft"
                      ? "#fffdfd"
                      : card.surface,
                    border: active
                      ? `2px solid ${card.color}`
                      : "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: (theme) => theme.fintrackMode === "soft"
                      ? "0 3px 12px rgba(75, 52, 96, 0.06)"
                      : active
                        ? `0 16px 34px ${card.color}2e`
                        : "0 10px 24px rgba(15, 23, 42, 0.08)",
                    color: "text.primary",
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderColor: card.color,
                      boxShadow: (theme) => theme.fintrackMode === "soft"
                        ? `0 8px 20px ${card.color}16`
                        : `0 18px 36px ${card.color}2e`
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: 2,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: `${card.color}18`,
                          color: card.color
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: card.color, fontWeight: 900, textAlign: "right" }}
                      >
                        {card.meta}
                      </Typography>
                    </Box>
                    <Typography variant="overline" sx={{ display: "block", mt: 1.25, color: card.color, fontSize: "0.66rem", fontWeight: 900, lineHeight: 1.2 }}>
                      {card.group}
                    </Typography>
                    <Typography sx={{ mt: 0.35, fontWeight: 900, fontSize: "1.05rem" }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {card.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
