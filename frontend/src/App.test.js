import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => []
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders dashboard navigation', async () => {
  render(<App />);
  expect(screen.getByText(/FinTech Dashboard/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
  expect(await screen.findByText(/No records found/i)).toBeInTheDocument();
});
