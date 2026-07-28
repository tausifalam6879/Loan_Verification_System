import { fireEvent, render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material";
import FinancialCommandCenter from "./FinancialCommandCenter";

const renderDashboard = (props = {}) => {
  const defaults = {
    expenses: [
      { id: 1, amount: 5500, category: "Food", merchant: "Groceries", date: "2026-07-04" },
      { id: 2, amount: 1200, category: "Travel", merchant: "Metro", date: "2026-07-08" }
    ],
    totalIncome: 50000,
    budgets: { food: 5000 },
    profile: { fullName: "Tausif Alam", creditScore: 735 },
    applications: [{ id: 1, status: "UNDER_REVIEW" }],
    onOpen: jest.fn(),
    onRefresh: jest.fn(),
    onExport: jest.fn(),
    incomeInput: 50000,
    setIncomeInput: jest.fn(),
    isEditingIncome: false,
    setIsEditingIncome: jest.fn(),
    onSaveIncome: jest.fn(),
    referenceDate: new Date(2026, 6, 28)
  };

  return render(
    <ThemeProvider theme={createTheme()}>
      <FinancialCommandCenter {...defaults} {...props} />
    </ThemeProvider>
  );
};

test("renders the command center, health, alerts, money flow and actions", () => {
  renderDashboard();

  expect(screen.getByRole("heading", { name: /Financial Command Center/i })).toBeInTheDocument();
  expect(screen.queryByText(/Tausif Alam/i)).not.toBeInTheDocument();
  expect(screen.getByText(/Signed-in account data/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Financial health/i).length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { name: /Priority alerts/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Six-month money flow/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Quick actions/i })).toBeInTheDocument();
  expect(screen.getByText(/Food budget is at 110%/i)).toBeInTheDocument();
});

test("quick actions and income edit remain interactive", () => {
  const onOpen = jest.fn();
  const setIsEditingIncome = jest.fn();
  renderDashboard({ onOpen, setIsEditingIncome });

  fireEvent.click(screen.getByRole("button", { name: /Compare loans/i }));
  expect(onOpen).toHaveBeenCalledWith("loans");

  fireEvent.click(screen.getByRole("button", { name: /Edit monthly income/i }));
  expect(setIsEditingIncome).toHaveBeenCalledWith(true);
});
