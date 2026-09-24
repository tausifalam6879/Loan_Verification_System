import { fireEvent, render, screen } from "@testing-library/react";
import PaymentWorkspace from "./PaymentWorkspace";

test("selecting a method does not pay; validated details are forwarded to checkout", () => {
  const setPaymentMethod = jest.fn();
  const onStartPayment = jest.fn();
  render(<PaymentWorkspace paymentMethod="gpay" setPaymentMethod={setPaymentMethod} onStartPayment={onStartPayment} />);
  expect(screen.getByRole("button", { name: /Continue to checkout/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /PhonePe/ }));
  expect(setPaymentMethod).toHaveBeenCalledWith("phonepe");
  expect(onStartPayment).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("textbox", { name: /Send to/ }), { target: { value: "Campus shop" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: /Amount/ }), { target: { value: "150" } });
  fireEvent.click(screen.getByRole("button", { name: /Continue to checkout/ }));
  expect(onStartPayment).toHaveBeenCalledWith("gpay", "general", { recipient: "Campus shop", amount: "150" });
});
test("recent recipients come only from successful history and receipt downloads remain available", () => {
  const onDownloadReceipt = jest.fn();
  const receipt = { reference: "TEST-1", recipient: "Store", amount: 50, methodLabel: "UPI", status: "SUCCESS", paidAt: "2026-09-24T12:00:00Z" };
  render(<PaymentWorkspace paymentMethod="gpay" paymentHistory={[receipt, { ...receipt, reference: "TEST-2", recipient: "Failed store", status: "FAILED" }]} onDownloadReceipt={onDownloadReceipt} />);
  fireEvent.click(screen.getByRole("button", { name: /Store Use recipient name/ }));
  expect(screen.getByRole("textbox", { name: /Send to/ })).toHaveValue("Store");
  expect(screen.queryByRole("button", { name: /Failed store Use recipient name/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  expect(onDownloadReceipt).toHaveBeenCalledWith(receipt);
});
