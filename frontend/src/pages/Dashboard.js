import React, { useMemo, useState } from "react";
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
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import ExpenseForm from "../components/ExpenseForm";
import ExpensePieChart from "../components/ExpensePieChart";
import InvestmentSection from "../components/InvestmentSection";
import LoanSection from "../components/loans/LoanSection";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TopCards from "../components/TopCards";
import TransactionTable from "../components/TransactionTable";
import useExpenses from "../hooks/useExpenses";
import { exportExpensesToCSV } from "../utils/exportCsv";
import AiAssistant from "../components/AiAssistant";
import { logout } from "../services/authService";

const Dashboard = ({ themeMode, activeMode, onThemeModeChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    expenses,
    totalExpense,
    loading,
    error,
    loadExpenses,
    createExpense,
    removeExpense
  } = useExpenses();

  const [totalIncome, setTotalIncome] = useState(() => {
    const saved = localStorage.getItem("userIncome");
    return saved ? Number(saved) : 50000;
  });
  const [incomeInput, setIncomeInput] = useState(totalIncome);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tabValue, setTabValue] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showRecents, setShowRecents] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: ""
  });
  const role = localStorage.getItem("role") || "USER";
  const email = localStorage.getItem("email") || "";

  const balance = totalIncome - totalExpense;
  const budgetPercentage =
    totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
  const workspaceByPath = {
    "/": "overview",
    "/expense": "expense",
    "/transactions": "transactions",
    "/loans": "loans",
    "/payments": "payments",
    "/applications": "applications",
    "/investments": "investments"
  };
  const pathByWorkspace = {
    overview: "/",
    expense: "/expense",
    transactions: "/transactions",
    loans: "/loans",
    payments: "/payments",
    applications: "/applications",
    investments: "/investments"
  };
  const activeWorkspace = workspaceByPath[location.pathname] || "overview";
  const isOverview = activeWorkspace === "overview";
  const pageMeta = {
    expense: {
      title: "Expense Entry and Analytics",
      subtitle: "Add expenses and review category analytics from backend records."
    },
    transactions: {
      title: "Recent Transactions",
      subtitle: "Search, filter, sort and delete transaction records."
    },
    loans: {
      title: "Loan Marketplace",
      subtitle: "Browse backend loan offers and open the application flow."
    },
    payments: {
      title: "Payment Gateway",
      subtitle: "Use UPI, card or net banking checkout and record the ledger entry."
    },
    applications: {
      title: "Saved Loan Applications",
      subtitle: "Open server-saved loan applications and inspect full details."
    },
    investments: {
      title: "FD and Investment Comparison",
      subtitle: "Compare FD/SIP options and save selected bookings."
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
        const matchesTab =
          tabValue === "All" || category === tabValue.toLowerCase();
        const matchesSearch =
          description.includes(search) || category.includes(search);

        return matchesTab && matchesSearch;
      })
      .sort((a, b) =>
        sortOrder === "desc"
          ? Number(b.amount || 0) - Number(a.amount || 0)
          : Number(a.amount || 0) - Number(b.amount || 0)
      );
  }, [expenses, searchQuery, sortOrder, tabValue]);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddExpense = async (expense) => {
    const success = await createExpense(expense);
    showMessage(
      success ? "Expense added successfully." : "Could not add expense.",
      success ? "success" : "error"
    );
    return success;
  };

  const handleGatewayPayment = async ({ amount, payee, method }) => {
    const success = await createExpense({
      amount: Number(amount),
      category: "payment",
      description: `Payment to ${payee} via ${method}`
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
    const success = await removeExpense(id);
    showMessage(
      success ? "Expense deleted successfully." : "Could not delete expense.",
      success ? "success" : "error"
    );
  };

  const handleSaveIncome = () => {
    const newIncome = Number(incomeInput) || 0;
    setTotalIncome(newIncome);
    localStorage.setItem("userIncome", newIncome);
    setIsEditingIncome(false);
    showMessage("Income updated successfully.");
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(expenses);
    setDrawerOpen(false);
    showMessage("CSV exported successfully.");
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
        showRecents={showRecents}
        setShowRecents={setShowRecents}
        handleExportCSV={handleExportCSV}
        onOpenDashboard={() => openWorkspace("overview")}
        onOpenAnalytics={() => openWorkspace("expense")}
        onOpenCategories={() => {
          setShowRecents(true);
          openWorkspace("transactions");
        }}
        onOpenReports={() => openWorkspace("applications")}
        onOpenLoans={scrollToLoans}
        onOpenApplications={() => openWorkspace("applications")}
        onOpenAdmin={() => navigate("/admin")}
        onLogout={handleLogout}
        role={role}
      />

      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          background:
            activeMode === "dark"
              ? "linear-gradient(180deg, rgba(13, 148, 136, 0.22) 0%, rgba(15, 23, 42, 0.92) 18rem, rgba(2, 6, 23, 1) 34rem)"
              : "linear-gradient(180deg, rgba(8, 47, 73, 0.16) 0%, rgba(13, 148, 136, 0.12) 18rem, rgba(255, 255, 255, 0) 34rem)",
          pt: 11,
          px: { xs: 2, md: 4 },
          pb: 4
        }}
      >
        {isOverview ? (
          <Box id="dashboard-top">
            <DashboardHeader
              onRefresh={loadExpenses}
              onExport={handleExportCSV}
            />
          </Box>
        ) : (
          <PageHeader
            title={pageMeta[activeWorkspace]?.title || "Workspace"}
            subtitle={pageMeta[activeWorkspace]?.subtitle || ""}
          />
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {isOverview && (
          <>
            <TopCards
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              budgetPercentage={budgetPercentage}
              isEditingIncome={isEditingIncome}
              setIsEditingIncome={setIsEditingIncome}
              incomeInput={incomeInput}
              setIncomeInput={setIncomeInput}
              handleSaveIncome={handleSaveIncome}
            />

            <WorkspaceCards
              activeWorkspace={activeWorkspace}
              expensesCount={expenses.length}
              filteredCount={filteredAndSortedExpenses.length}
              onOpen={openWorkspace}
            />
          </>
        )}

        <Box id="workspace-panel" sx={{ mt: 2.5 }}>
          {activeWorkspace === "expense" && (
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <ExpenseForm onAddExpense={handleAddExpense} loading={loading} />
              </Grid>

              <Grid size={{ xs: 12, md: 7 }} id="analytics-section">
                <ExpensePieChart expenses={expenses} loading={loading} />
              </Grid>
            </Grid>
          )}

          {activeWorkspace === "transactions" && (
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
                tabValue,
                setTabValue
              }}
              onDelete={handleDeleteExpense}
              loading={loading}
            />
          )}

          {["loans", "payments", "applications"].includes(activeWorkspace) && (
            <LoanSection
              balance={balance}
              onRecordPayment={handleGatewayPayment}
              view={activeWorkspace}
            />
          )}

          {activeWorkspace === "investments" && <InvestmentSection />}
        </Box>

        <AiAssistant
          balance={balance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
        />

        {!isOverview && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => openWorkspace("overview")}
            variant="contained"
            sx={{
              position: "fixed",
              right: { xs: 18, md: 34 },
              bottom: { xs: 86, md: 96 },
              zIndex: 1250,
              borderRadius: 2,
              px: 2.25,
              py: 1.15,
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(90deg, #0f766e, #2563eb)",
              boxShadow: "0 14px 30px rgba(15, 23, 42, 0.24)",
              "&:hover": {
                background: "linear-gradient(90deg, #0d9488, #1d4ed8)"
              }
            }}
          >
            Back to dashboard
          </Button>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
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
        theme.palette.mode === "dark"
          ? "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(8, 47, 73, 0.92))"
          : "linear-gradient(135deg, #ffffff, #eef6ff)",
      boxShadow: "0 16px 38px rgba(15, 23, 42, 0.1)"
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
          Separate Webpage
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

const WorkspaceCards = ({
  activeWorkspace,
  expensesCount,
  filteredCount,
  onOpen
}) => {
  const cards = [
    {
      id: "expense",
      title: "Add Expense",
      subtitle: "Entry form and category analytics",
      icon: <AddCircleIcon />,
      color: "#16a34a",
      surface: "linear-gradient(145deg, #dcfce7, #f7fee7)",
      meta: "Budget ledger"
    },
    {
      id: "transactions",
      title: "Recent Transactions",
      subtitle: "Open the list, filters and delete actions",
      icon: <ReceiptLongIcon />,
      color: "#2563eb",
      surface: "linear-gradient(145deg, #dbeafe, #eff6ff)",
      meta: `${filteredCount}/${expensesCount} records`
    },
    {
      id: "loans",
      title: "Loan Marketplace",
      subtitle: "Backend offers, EMI and application form",
      icon: <AccountBalanceIcon />,
      color: "#7c3aed",
      surface: "linear-gradient(145deg, #ede9fe, #f5f3ff)",
      meta: "Spring Boot linked"
    },
    {
      id: "payments",
      title: "Payment Gateway",
      subtitle: "UPI, card and net banking checkout",
      icon: <PaymentsIcon />,
      color: "#ea580c",
      surface: "linear-gradient(145deg, #ffedd5, #fff7ed)",
      meta: "Dynamic checkout"
    },
    {
      id: "applications",
      title: "Saved Applications",
      subtitle: "Open saved loan applications and full details",
      icon: <AssignmentTurnedInIcon />,
      color: "#0891b2",
      surface: "linear-gradient(145deg, #cffafe, #ecfeff)",
      meta: "Database records"
    },
    {
      id: "investments",
      title: "FD / Investments",
      subtitle: "Compare FD and SIP options, save bookings",
      icon: <SavingsIcon />,
      color: "#ca8a04",
      surface: "linear-gradient(145deg, #fef3c7, #fefce8)",
      meta: "Comparison"
    }
  ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))"
            : "linear-gradient(145deg, #ffffff, #f8fafc)",
        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)"
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
              Clean SPA Workspace
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Open only the card you want to work with
            </Typography>
          </Box>
          <AssessmentIcon sx={{ color: "#2563eb", fontSize: 34 }} />
        </Box>

        <Grid container spacing={1.5}>
          {cards.map((card) => {
            const active = activeWorkspace === card.id;

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={card.id}>
                <Card
                  elevation={0}
                  onClick={() => onOpen(card.id)}
                  sx={{
                    height: "100%",
                    minHeight: 158,
                    cursor: "pointer",
                    borderRadius: 2,
                    background: card.surface,
                    border: active
                      ? `2px solid ${card.color}`
                      : "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: active
                      ? `0 16px 34px ${card.color}2e`
                      : "0 10px 24px rgba(15, 23, 42, 0.08)",
                    color: "#0f172a",
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: `0 18px 36px ${card.color}2e`
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
                    <Typography sx={{ mt: 2, fontWeight: 900, fontSize: "1.05rem" }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#475569", mt: 0.5 }}>
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
