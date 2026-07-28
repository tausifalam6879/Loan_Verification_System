import { fireEvent, render, screen } from "@testing-library/react";
import InvestmentSection from "./InvestmentSection";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("email", "planner@example.com");
});

test("renders useful FD and SIP projections without misleading booking controls", () => {
  render(<InvestmentSection />);

  expect(screen.getByRole("heading", { name: /Build and compare a savings plan/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Fixed Deposit estimate/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /SIP projection range/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Book FD|Start SIP/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Download AI CSV/i })).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("One-time deposit"), { target: { value: "200000" } });
  expect(screen.getByText("₹2,00,000")).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByLabelText("Risk preference"));
  fireEvent.click(screen.getByRole("option", { name: "High" }));
  expect(screen.getByText("Index / Flexi Cap Equity Fund")).toBeInTheDocument();
});

test("saves the current comparison only under the authenticated account key", () => {
  render(<InvestmentSection />);

  fireEvent.click(screen.getByRole("button", { name: /Save comparison plan/i }));

  const stored = JSON.parse(localStorage.getItem("savedInvestmentPlansV2:planner@example.com"));
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ goal: "Emergency fund", fdAmount: 100000, monthlySip: 5000 });
  expect(screen.getByText(/Comparison saved to this signed-in account/i)).toBeInTheDocument();
});
