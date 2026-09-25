import { fireEvent, render, screen } from "@testing-library/react";
import MarketplaceOffers from "./MarketplaceOffers";
const offer = { id: 1, bank: { name: "Test Bank" }, loanType: { name: "Personal Loan" }, interestRate: 10, maxAmount: 500000, minTenureMonths: 12, maxTenureMonths: 60 };
const row = { offer, metrics: { emi: 12500, processingFee: 500, totalPayable: 150000 }, eligibility: { eligible: true, reasons: [] } };
test("displays provided metrics and opens the unchanged offer action", () => {
  const onSelect = jest.fn();
  render(<MarketplaceOffers rows={[row]} tenureMonths={12} onSelect={onSelect} />);
  expect(screen.getAllByText("Rs. 12,500").length).toBeGreaterThan(0);
  expect(screen.getByText(/not lender approval/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View Offer" }));
  expect(onSelect).toHaveBeenCalledWith(offer);
});
test("shows actual eligibility reasons instead of approval claims", () => {
  render(<MarketplaceOffers rows={[{ ...row, eligibility: { eligible: false, reasons: ["Amount exceeds lender limit"] } }]} />);
  expect(screen.getByText("Amount exceeds lender limit")).toBeInTheDocument();
  expect(screen.queryByText("Criteria met")).not.toBeInTheDocument();
});
