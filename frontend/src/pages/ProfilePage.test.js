import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProfilePage from "./ProfilePage";
import { getProfile, updateProfile } from "../services/authService";
import { getLoanApplications } from "../services/loanService";

jest.mock("../services/authService", () => ({
  getCurrentAuth: jest.fn(() => ({ token: "demo-jwt-token", role: "USER", email: "user@example.com" })),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  logout: jest.fn()
}));

jest.mock("../services/loanService", () => ({
  getLoanApplications: jest.fn()
}));

beforeEach(() => {
  getProfile.mockResolvedValue({
    id: 1,
    fullName: "Demo User",
    email: "user@example.com",
    mobile: "",
    role: "USER",
    totalApplications: 1,
    creditScore: 735
  });
  getLoanApplications.mockResolvedValue([
    {
      id: 4,
      requestedAmount: 600000,
      creditScore: 735,
      status: "PRE_APPROVED",
      paymentStatus: "UNPAID",
      createdAt: "2026-07-28T10:00:00",
      loanOffer: {
        bank: { shortName: "ICICI" },
        loanType: { name: "Education Loan" }
      }
    }
  ]);
  updateProfile.mockResolvedValue({
    id: 1,
    fullName: "Updated User",
    email: "user@example.com",
    mobile: "9876543210",
    role: "USER",
    totalApplications: 1,
    creditScore: 735
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("loads financial context and updates editable profile details", async () => {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );

  expect(await screen.findByRole("heading", { name: /Financial snapshot/i })).toBeInTheDocument();
  expect(screen.getByText(/not a live CIBIL or Experian bureau pull/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Edit profile/i }));
  fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Updated User" } });
  fireEvent.change(screen.getByLabelText(/Mobile number/i), { target: { value: "9876543210" } });
  fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));

  await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ fullName: "Updated User", mobile: "9876543210" }));
  expect(await screen.findByText(/Profile updated successfully/i)).toBeInTheDocument();
  expect(screen.getAllByText("Updated User").length).toBeGreaterThan(0);
});
