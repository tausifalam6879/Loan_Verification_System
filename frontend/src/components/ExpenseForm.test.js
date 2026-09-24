import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExpenseForm from "./ExpenseForm";
jest.mock("../services/aiExpenseService", () => ({ predictExpenseCategoryWithMl: jest.fn().mockResolvedValue(null) }));

test("saving keeps the existing expense payload including optional fields", async () => {
  const onAddExpense = jest.fn().mockResolvedValue(true);
  const { container } = render(<ExpenseForm onAddExpense={onAddExpense} />);
  fireEvent.change(screen.getByRole("spinbutton", { name: /Amount/ }), { target: { value: "125.50" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Description/ }), { target: { value: "Notebook" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Category/ }), { target: { value: "Education" } });
  fireEvent.click(screen.getByRole("button", { name: /Add merchant/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "Merchant" }), { target: { value: "Campus store" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Recurring expense" }));
  fireEvent.submit(container.querySelector("form"));
  await waitFor(() => expect(onAddExpense).toHaveBeenCalledWith(expect.objectContaining({
    amount: 125.5, description: "Notebook", category: "Education", merchant: "Campus store", recurring: true, paymentMethod: "UPI"
  })));
});
test("editing reveals saved merchant and recurring details without losing them", async () => {
  const onUpdateExpense = jest.fn().mockResolvedValue(true);
  const { container } = render(<ExpenseForm editingExpense={{ id: 9, amount: 799, category: "Bills", description: "Internet", merchant: "ISP", recurring: true, date: "2026-09-10", paymentMethod: "Card" }} onUpdateExpense={onUpdateExpense} />);
  expect(screen.getByRole("textbox", { name: "Merchant" })).toHaveValue("ISP");
  expect(screen.getByRole("checkbox", { name: "Recurring expense" })).toBeChecked();
  fireEvent.submit(container.querySelector("form"));
  await waitFor(() => expect(onUpdateExpense).toHaveBeenCalledWith(9, expect.objectContaining({ merchant: "ISP", recurring: true, paymentMethod: "Card", date: "2026-09-10" })));
});
