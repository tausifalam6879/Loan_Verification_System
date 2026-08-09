import api from "../api/axiosConfig";
import { login, requestOtp, verifyOtp, warmUpAuthService } from "./authService";

jest.mock("../api/axiosConfig", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock("../api/demoAdapter", () => ({
  revokeDemoSession: jest.fn()
}));

beforeEach(() => {
  localStorage.clear();
  api.get.mockReset();
  api.post.mockReset();
});

test("auth warm-up fails fast instead of blocking the page for 90 seconds", async () => {
  api.get.mockResolvedValueOnce({ data: { otpEnabled: true } });

  await expect(warmUpAuthService()).resolves.toEqual({ otpEnabled: true });

  expect(api.get).toHaveBeenCalledWith("/users/auth-config", { timeout: 12000 });
});

test("login and OTP actions use bounded request timeouts", async () => {
  api.post
    .mockResolvedValueOnce({ data: { token: "jwt", role: "USER", email: "user@example.com" } })
    .mockResolvedValueOnce({ data: { otpRequired: true } })
    .mockResolvedValueOnce({ data: { otpToken: "verified" } });

  await login({ email: "user@example.com", password: "secret" });
  await requestOtp({ email: "user@example.com", channel: "EMAIL", purpose: "LOGIN" });
  await verifyOtp({ email: "user@example.com", channel: "EMAIL", purpose: "LOGIN", otp: "123456" });

  expect(api.post).toHaveBeenNthCalledWith(
    1,
    "/users/login",
    { email: "user@example.com", password: "secret" },
    { timeout: 20000 }
  );
  expect(api.post).toHaveBeenNthCalledWith(
    2,
    "/users/request-otp",
    expect.any(Object),
    { timeout: 20000 }
  );
  expect(api.post).toHaveBeenNthCalledWith(
    3,
    "/users/verify-otp",
    expect.any(Object),
    { timeout: 20000 }
  );
});
