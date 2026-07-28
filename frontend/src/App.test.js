import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
  window.location.hash = "#/";
});

test('redirects unauthenticated users to login', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
  expect(screen.getAllByLabelText(/Email/i)[0]).toBeInTheDocument();
  expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
});

test('renders the authenticated loan marketplace route', async () => {
  localStorage.setItem("token", "test-token");
  localStorage.setItem("role", "USER");
  localStorage.setItem("email", "user@example.com");
  window.location.hash = "#/loans";

  render(<App />);

  expect((await screen.findAllByRole("heading", { name: /Loan Marketplace/i })).length).toBeGreaterThan(0);
});

test('renders the authenticated payment command center route', async () => {
  localStorage.setItem("token", "test-token");
  localStorage.setItem("role", "USER");
  localStorage.setItem("email", "user@example.com");
  window.location.hash = "#/payments";

  render(<App />);

  expect((await screen.findAllByRole("heading", { name: /Payment Gateway/i })).length).toBeGreaterThan(0);
  expect(await screen.findByRole("heading", { name: /Payment history/i })).toBeInTheDocument();
});

test('renders the authenticated loan application center route', async () => {
  localStorage.setItem("token", "test-token");
  localStorage.setItem("role", "USER");
  localStorage.setItem("email", "user@example.com");
  window.location.hash = "#/applications";

  render(<App />);

  expect(await screen.findByRole("heading", { name: /Loan Application Center/i })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /Your applications/i })).toBeInTheDocument();
});

test('opens saved applications from the loan marketplace', async () => {
  localStorage.setItem("token", "test-token");
  localStorage.setItem("role", "USER");
  localStorage.setItem("email", "user@example.com");
  window.location.hash = "#/loans";

  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: /Open saved applications page/i }));

  expect(await screen.findByRole("heading", { name: /Loan Application Center/i })).toBeInTheDocument();
  expect(window.location.hash).toBe("#/applications");
});

test('renders the authenticated profile command center route', async () => {
  localStorage.setItem("token", "test-token");
  localStorage.setItem("role", "USER");
  localStorage.setItem("email", "user@example.com");
  window.location.hash = "#/profile";

  render(<App />);

  expect(await screen.findByText(/Account command center/i)).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /Financial snapshot/i })).toBeInTheDocument();
});
