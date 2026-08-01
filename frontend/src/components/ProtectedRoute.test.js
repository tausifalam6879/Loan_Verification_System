import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { clearAuthSession, hasFreshSession, hasTrustedSession, validateSession } from "../services/authService";

jest.mock("../services/authService", () => ({
  validateSession: jest.fn(),
  hasFreshSession: jest.fn(() => false),
  hasTrustedSession: jest.fn(() => false),
  clearAuthSession: jest.fn(() => {
    global.localStorage.removeItem("token");
    global.localStorage.removeItem("role");
    global.localStorage.removeItem("email");
  })
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  hasFreshSession.mockReturnValue(false);
  hasTrustedSession.mockReturnValue(false);
  clearAuthSession.mockImplementation(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
  });
});

test("renders a freshly authenticated session without another blocking validation request", () => {
  localStorage.setItem("token", "server-issued-token");
  localStorage.setItem("role", "USER");
  hasFreshSession.mockReturnValue(true);

  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Private dashboard</div>
      </ProtectedRoute>
    </MemoryRouter>
  );

  expect(screen.getByText("Private dashboard")).toBeInTheDocument();
  expect(screen.queryByText("Verifying secure session...")).not.toBeInTheDocument();
  expect(validateSession).not.toHaveBeenCalled();
});

test("renders a known older session while refreshing its proof in the background", async () => {
  localStorage.setItem("token", "known-server-token");
  localStorage.setItem("role", "USER");
  hasFreshSession.mockReturnValue(false);
  hasTrustedSession.mockReturnValue(true);
  validateSession.mockResolvedValueOnce({ email: "user@example.com", role: "USER" });

  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Private dashboard</div>
      </ProtectedRoute>
    </MemoryRouter>
  );

  expect(screen.getByText("Private dashboard")).toBeInTheDocument();
  expect(screen.queryByText("Verifying secure session...")).not.toBeInTheDocument();
  await waitFor(() => expect(validateSession).toHaveBeenCalledTimes(1));
});

test("does not render private content when a stored token fails server validation", async () => {
  localStorage.setItem("token", "forged-or-expired-token");
  localStorage.setItem("email", "previous-user@example.com");
  validateSession.mockRejectedValueOnce({ response: { status: 401 } });

  render(
    <MemoryRouter initialEntries={["/markets"]}>
      <Routes>
        <Route path="/login" element={<div>Secure login</div>} />
        <Route
          path="/markets"
          element={
            <ProtectedRoute>
              <div>Private market and saved data</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.queryByText("Private market and saved data")).not.toBeInTheDocument();
  expect(await screen.findByText("Secure login")).toBeInTheDocument();
  await waitFor(() => expect(clearAuthSession).toHaveBeenCalled());
  expect(localStorage.getItem("email")).toBeNull();
});
