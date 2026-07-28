import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { validateSession } from './services/authService';

jest.mock('./services/authService', () => {
  const actual = jest.requireActual('./services/authService');
  return {
    ...actual,
    validateSession: jest.fn(async () => ({
      email: global.localStorage.getItem('email'),
      role: global.localStorage.getItem('role') || 'USER'
    }))
  };
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  validateSession.mockImplementation(async () => ({
    email: localStorage.getItem('email'),
    role: localStorage.getItem('role') || 'USER'
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.location.hash = "#/";
});

const authenticateDemoUser = () => {
  const token = "demo-session-app-test";
  const email = "user@example.com";
  localStorage.setItem("fintrackDemoAccountsV1", JSON.stringify([
    {
      id: 1,
      fullName: "Demo User",
      email,
      mobile: "9876543210",
      role: "USER",
      creditScore: 735
    }
  ]));
  sessionStorage.setItem(`fintrackDemoSessionV1:${token}`, JSON.stringify({
    token,
    email,
    role: "USER",
    expiresAt: Date.now() + 30 * 60 * 1000
  }));
  localStorage.setItem("token", token);
  localStorage.setItem("role", "USER");
  localStorage.setItem("email", email);
};

test('redirects unauthenticated users to login', async () => {
  await act(async () => {
    render(<App />);
  });
  expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
  expect(screen.getAllByLabelText(/Email/i)[0]).toBeInTheDocument();
  expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
});

test('renders the authenticated financial command center overview', async () => {
  authenticateDemoUser();
  window.location.hash = "#/";

  render(<App />);

  expect(await screen.findByRole("heading", { name: /Financial Command Center/i })).toBeInTheDocument();
  expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
  expect(screen.getAllByText(/Financial health/i).length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { name: /Priority alerts/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Your financial workspaces/i })).toBeInTheDocument();
});

test('renders the authenticated loan marketplace route', async () => {
  authenticateDemoUser();
  window.location.hash = "#/loans";

  render(<App />);

  expect((await screen.findAllByRole("heading", { name: /Loan Marketplace/i })).length).toBeGreaterThan(0);
});

test('renders the authenticated payment command center route', async () => {
  authenticateDemoUser();
  window.location.hash = "#/payments";

  render(<App />);

  expect((await screen.findAllByRole("heading", { name: /Payment Gateway/i })).length).toBeGreaterThan(0);
  expect(await screen.findByRole("heading", { name: /Payment history/i })).toBeInTheDocument();
});

test('renders the authenticated loan application center route', async () => {
  authenticateDemoUser();
  window.location.hash = "#/applications";

  render(<App />);

  expect(await screen.findByRole("heading", { name: /Loan Application Center/i })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /Your applications/i })).toBeInTheDocument();
});

test('opens saved applications from the loan marketplace', async () => {
  authenticateDemoUser();
  window.location.hash = "#/loans";

  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /Open saved applications page/i }));

  expect(await screen.findByRole("heading", { name: /Loan Application Center/i })).toBeInTheDocument();
  expect(window.location.hash).toBe("#/applications");
});

test('renders the authenticated profile command center route', async () => {
  authenticateDemoUser();
  window.location.hash = "#/profile";

  render(<App />);

  expect(await screen.findByText(/Account command center/i)).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /Financial snapshot/i })).toBeInTheDocument();
});

test('renders the authenticated savings planner without mixing the market workspace', async () => {
  authenticateDemoUser();
  window.location.hash = "#/investments";

  render(<App />);

  expect(await screen.findByRole("heading", { name: /Savings & Investment Planner/i })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /Build and compare a savings plan/i })).toBeInTheDocument();
  expect(screen.queryByText(/FD and SIP \(Existing\)/i)).not.toBeInTheDocument();
});
