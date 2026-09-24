import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CssBaseline,
  Grid,
  Snackbar,
  Typography
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonIcon from "@mui/icons-material/Person";
import PaymentsIcon from "@mui/icons-material/Payments";
import SavingsIcon from "@mui/icons-material/Savings";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import FinancialCommandCenter from "../components/dashboard/FinancialCommandCenter";
import WorkspaceHeading from "../components/WorkspaceHeading";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseBudgetPlanner from "../components/ExpenseBudgetPlanner";
import ExpenseIntelligencePanel from "../components/ExpenseIntelligencePanel";
import ExpenseOverviewCards from "../components/ExpenseOverviewCards";
import ExpensePieChart from "../components/ExpensePieChart";
import InvestmentMarketHub from "../components/InvestmentMarketHub";
import LoanSection from "../components/loans/LoanSection";
import MonthlyExpenseChart from "../components/MonthlyExpenseChart";
import Navbar from "../components/Navbar";
import Sidebar, { drawerWidth } from "../components/Sidebar";
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
      title: "Expense & Budgets",
      subtitle: "Track spending, manage budgets and understand where your money goes."
    },
    loans: {
      title: "Loan Marketplace",
      subtitle: "Compare loan offers and find the right fit for your needs."
    },
    payments: {
      title: "Payments",
      subtitle: "Use the secure demo gateway and keep every receipt connected to your ledger."
    },
    applications: {
      title: "Loan Applications",
      subtitle: "Track decisions, verification progress, payment status and application details."
    },
    investments: {
      title: "Savings & Investments",
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
        activeWorkspace={activeWorkspace}
        role={role}
      />

      <Box
        className="fintrack-workspace"
        sx={{
          minHeight: "100vh",
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background:
            "radial-gradient(circle at 78% 3%, rgba(126,103,246,.18), transparent 24rem), linear-gradient(180deg,#f8f9ff 0%,#f2f7ff 48%,#f7fbff 100%)",
          pt: { xs: 10, md: 12 },
          px: { xs: 1.5, sm: 2.5, lg: 3.5 },
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
              workspaceCards={<WorkspaceCards activeWorkspace={activeWorkspace} expensesCount={expenses.length} currentMonthExpense={currentMonthExpense} applicationsCount={overviewAccount.applications.length} creditScore={overviewAccount.profile?.creditScore} savedPlansCount={readSavedPlanCount(email)} onOpen={openWorkspace} />}
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
                <Grid size={{ xs: 12, md: 6 }} id="expense-entry">
                  <ExpenseForm
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    editingExpense={editingExpense}
                    onCancelEdit={() => setEditingExpense(null)}
                    loading={loading}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} id="analytics-section">
                  <ExpensePieChart expenses={expenses} loading={loading} />
                </Grid>
              </Grid>

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

const PageHeader = WorkspaceHeading;

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
      subtitle: "Track spending and set budgets.",
      icon: <AddCircleIcon />,
      color: "#16a34a",
      surface: "linear-gradient(145deg, #dcfce7, #f7fee7)",
      meta: `${expensesCount} transactions`,
      group: "Money management"
    },
    {
      id: "markets",
      title: "Global Markets",
      subtitle: "Explore markets and AI insights.",
      icon: <ShowChartIcon />,
      color: "#2563eb",
      surface: "linear-gradient(145deg, #dbeafe, #ecfeff)",
      meta: "Alerts + research",
      group: "Wealth & research"
    },
    {
      id: "loans",
      title: "Loan Marketplace",
      subtitle: "Find and compare loan offers.",
      icon: <AccountBalanceIcon />,
      color: "#7c3aed",
      surface: "linear-gradient(145deg, #ede9fe, #f5f3ff)",
      meta: "EMI + eligibility",
      group: "Borrowing"
    },
    {
      id: "payments",
      title: "Payments",
      subtitle: "Make and track demo payments.",
      icon: <PaymentsIcon />,
      color: "#0d9488",
      surface: "linear-gradient(145deg, #ccfbf1, #ecfeff)",
      meta: `${formatCompactCurrency(currentMonthExpense)} spent`,
      group: "Money management"
    },
    {
      id: "applications",
      title: "Loan Applications",
      subtitle: "View and manage applications.",
      icon: <AssignmentTurnedInIcon />,
      color: "#0891b2",
      surface: "linear-gradient(145deg, #cffafe, #ecfeff)",
      meta: `${applicationsCount} saved`,
      group: "Borrowing"
    },
    {
      id: "profile",
      title: "Profile & Security",
      subtitle: "Manage your account and security.",
      icon: <PersonIcon />,
      color: "#ea580c",
      surface: "linear-gradient(145deg, #ffedd5, #fff7ed)",
      meta: creditScore ? `Score ${creditScore}` : "Complete profile",
      group: "Account"
    },
    {
      id: "investments",
      title: "Savings & Investments",
      subtitle: "Plan savings and compare projections.",
      icon: <SavingsIcon />,
      color: "#ca8a04",
      surface: "linear-gradient(145deg, #fef3c7, #fefce8)",
      meta: `${savedPlansCount} saved plans`,
      group: "Wealth & research"
    }
  ];

  const order = ["expense", "payments", "loans", "applications", "investments", "markets", "profile"];
  return (
    <Box component="section">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.75 }}>
        <Typography variant="h6">Explore your workspaces</Typography>
        <Typography variant="body2" color="text.secondary">Everything you need, in one place</Typography>
      </Box>
      <Grid container spacing={2}>
        {order.map((id, index) => {
          const card = cards.find((item) => item.id === id);
          return (
            <Grid key={id} size={{ xs: 12, sm: 6, lg: index < 4 ? 3 : 4 }}>
              <Card component="button" type="button" onClick={() => onOpen(id)}
                sx={{ width: "100%", textAlign: "left", height: "100%", p: 2.25, cursor: "pointer", background: "#fff", display: "flex", gap: 1.75, alignItems: "flex-start", transition: "border-color .15s, transform .15s", "&:hover": { borderColor: card.color, transform: "translateY(-2px)" }, "&:focus-visible": { outline: "3px solid #8b75ff", outlineOffset: 3 } }}>
                <Box sx={{ flexShrink: 0, width: 56, height: 56, borderRadius: 2, bgcolor: `${card.color}14`, color: card.color, display: "grid", placeItems: "center", "& svg": { fontSize: 30 } }}>{card.icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 750, fontSize: 15 }}>{card.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: .6, lineHeight: 1.55 }}>{card.subtitle}</Typography>
                  <Box sx={{ mt: 1.5, py: .6, textAlign: "center", borderRadius: 1, bgcolor: "#f3f0ff", color: "#6546e8", fontWeight: 750, fontSize: 13 }}>Open →</Box>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Dashboard;
