import {
  buildPaymentReceipt,
  maskPaymentIdentity,
  paymentProgressSteps,
  receiptToText
} from "./paymentGateway";

describe("payment gateway utilities", () => {
  test("masks sensitive payment identities", () => {
    expect(maskPaymentIdentity({ methodId: "card", cardNumber: "4111111111111234" })).toBe("Card ending 1234");
    expect(maskPaymentIdentity({ methodId: "upi", upiId: "customer@upi" })).toBe("cuXXXXXX@upi");
  });

  test("builds an interviewer-safe receipt without raw credentials", () => {
    const receipt = buildPaymentReceipt({
      reference: "UPI-123",
      applicationId: 7,
      amount: 500,
      recipient: "Demo Bank",
      methodId: "upi",
      methodLabel: "UPI",
      paymentIdentity: "cuXXXXXX@upi",
      paidAt: "2026-07-28T07:00:00.000Z"
    });

    const text = receiptToText(receipt);
    expect(receipt.status).toBe("SUCCESS");
    expect(text).toContain("Demo transaction - no real money moved");
    expect(text).toContain("Reference: UPI-123");
  });

  test("marks all progress steps complete after success", () => {
    expect(paymentProgressSteps("success").every((step) => step.complete)).toBe(true);
    expect(paymentProgressSteps("ready")[3].complete).toBe(false);
  });
});
