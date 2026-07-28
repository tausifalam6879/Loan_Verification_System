const formatMoney = (value) => Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const maskPaymentIdentity = ({ methodId, upiId, cardNumber, bankName }) => {
  if (["gpay", "phonepe", "upi"].includes(methodId)) {
    const [name = "", handle = ""] = String(upiId || "").split("@");
    if (!name || !handle) return "Protected UPI ID";
    return `${name.slice(0, 2)}${"X".repeat(Math.max(2, name.length - 2))}@${handle}`;
  }
  if (methodId === "card") {
    const digits = String(cardNumber || "").replace(/\D/g, "");
    return digits ? `Card ending ${digits.slice(-4)}` : "Protected card";
  }
  return bankName || "Selected bank";
};

export const buildPaymentReceipt = ({
  reference,
  applicationId,
  amount,
  recipient,
  methodId,
  methodLabel,
  paymentIdentity,
  paidAt,
  status = "SUCCESS",
  failureReason = ""
}) => ({
  id: reference,
  reference,
  applicationId: applicationId || null,
  amount: Number(amount || 0),
  recipient: String(recipient || "").trim(),
  methodId,
  methodLabel,
  paymentIdentity,
  paidAt,
  status,
  failureReason
});

export const receiptToText = (receipt) => [
  "FINTRACK PAYMENT RECEIPT",
  "Demo transaction - no real money moved",
  "",
  `Status: ${receipt.status}`,
  `Reference: ${receipt.reference}`,
  `Application: ${receipt.applicationId ? `#${receipt.applicationId}` : "General payment"}`,
  `Amount: Rs. ${formatMoney(receipt.amount)}`,
  `Recipient: ${receipt.recipient}`,
  `Method: ${receipt.methodLabel}`,
  `Payment identity: ${receipt.paymentIdentity}`,
  `Date: ${new Date(receipt.paidAt).toLocaleString("en-IN")}`,
  receipt.failureReason ? `Failure reason: ${receipt.failureReason}` : ""
].filter(Boolean).join("\n");

export const paymentProgressSteps = (gatewayStep) => {
  const order = gatewayStep === "failed" ? 2 : { ready: 1, processing: 2, success: 4 }[gatewayStep] || 1;
  return [
    { label: "Checkout created", complete: order >= 1 },
    { label: "Authorization", complete: order >= 2 },
    { label: "Processing", complete: order >= 3 || gatewayStep === "success" },
    { label: "Receipt issued", complete: gatewayStep === "success" }
  ];
};
