import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material";
import AiAssistant from "./AiAssistant";
import { sendAiChatMessage } from "../services/chatService";

jest.mock("../services/chatService", () => ({
  sendAiChatMessage: jest.fn()
}));

const expenses = [
  { id: 1, amount: 5000, category: "Food", description: "Groceries", date: "2026-07-04" },
  { id: 2, amount: 1200, category: "Travel", description: "Metro", date: "2026-07-08" }
];

const renderCopilot = (props = {}) => {
  const defaults = {
    balance: 13800,
    totalIncome: 20000,
    totalExpense: 6200,
    expenses,
    applications: [{ id: 1, status: "UNDER_REVIEW" }],
    page: "applications",
    onOpen: jest.fn()
  };

  return {
    ...render(
      <ThemeProvider theme={createTheme()}>
        <AiAssistant {...defaults} {...props} />
      </ThemeProvider>
    ),
    props: { ...defaults, ...props }
  };
};

beforeEach(() => {
  sendAiChatMessage.mockReset();
});

test("shows an account brief and sends contextual questions to the secure chat service", async () => {
  const onOpen = jest.fn();
  sendAiChatMessage.mockResolvedValue({
    answer: "One application is under review. Open Application Center for the next step.",
    usedContext: true,
    suggestedQuestions: ["What application needs attention?"],
    provider: "local-analytics",
    model: "repository-context",
    liveProvider: false
  });
  renderCopilot({ onOpen });

  fireEvent.click(screen.getByRole("button", { name: /FinTrack Copilot/i }));
  expect(screen.getByText(/Account brief/i)).toBeInTheDocument();
  expect(screen.getByText(/1 pending application/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText("Summarize my loan applications"));

  await waitFor(() => expect(sendAiChatMessage).toHaveBeenCalledWith(expect.objectContaining({
    message: "Summarize my loan applications",
    page: "applications"
  })));
  expect(await screen.findByText(/One application is under review/i)).toBeInTheDocument();
  expect(screen.getByText("Secure backend analytics")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Open applications"));
  expect(onOpen).toHaveBeenCalledWith("applications");
});

test("falls back to local screen analytics when the backend is unavailable", async () => {
  sendAiChatMessage.mockRejectedValue(new Error("offline"));
  renderCopilot({ page: "overview" });

  fireEvent.click(screen.getByRole("button", { name: /FinTrack Copilot/i }));
  fireEvent.click(screen.getByText("Where can I save money?"));

  expect(await screen.findByText("Local analytics fallback")).toBeInTheDocument();
  expect(screen.getByText(/largest recorded category is Food/i)).toBeInTheDocument();
});

