import api from "../api/axiosConfig";
import { login, requestOtp, verifyFirebasePhone, verifyOtp, warmUpAuthService } from "./authService";

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
  window.__fintrackAuthWarmup = null;
  api.get.mockReset();
  api.post.mockReset();
});

test("auth warm-up allows a bounded Render cold-start window", async () => {
  api.get.mockResolvedValueOnce({ data: { otpEnabled: true } });

  await expect(warmUpAuthService()).resolves.toEqual({ otpEnabled: true });

  expect(api.get).toHaveBeenCalledWith("/users/auth-config", { timeout: 90000 });
});

test("auth warm-up reuses the request started by the HTML shell", async () => {
  window.__fintrackAuthWarmup = Promise.resolve({
    otpEnabled: false,
    passwordLoginEnabled: true
  });

  await expect(warmUpAuthService()).resolves.toEqual({
    otpEnabled: false,
    passwordLoginEnabled: true
  });

  expect(api.get).not.toHaveBeenCalled();
});

test("login and OTP actions use bounded request timeouts", async () => {
  api.post
    .mockResolvedValueOnce({ data: { token: "jwt", role: "USER", email: "user@example.com" } })
    .mockResolvedValueOnce({ data: { otpRequired: true } })
    .mockResolvedValueOnce({ data: { otpToken: "verified" } })
    .mockResolvedValueOnce({ data: { otpToken: "firebase-verified" } });

  await login({ email: "user@example.com", password: "secret" });
  await requestOtp({ email: "user@example.com", channel: "EMAIL", purpose: "LOGIN" });
  await verifyOtp({ email: "user@example.com", channel: "EMAIL", purpose: "LOGIN", otp: "123456" });
  await verifyFirebasePhone({ mobile: "+919876543210", purpose: "LOGIN", idToken: "firebase-proof" });

  expect(api.post).toHaveBeenNthCalledWith(
    1,
    "/users/login",
    { email: "user@example.com", password: "secret" },
    { timeout: 90000 }
  );
  expect(api.post).toHaveBeenNthCalledWith(
    2,
    "/users/request-otp",
    expect.any(Object),
    { timeout: 90000 }
  );
  expect(api.post).toHaveBeenNthCalledWith(
    3,
    "/users/verify-otp",
    expect.any(Object),
    { timeout: 90000 }
  );
  expect(api.post).toHaveBeenNthCalledWith(
    4,
    "/users/verify-firebase-phone",
    expect.any(Object),
    { timeout: 90000 }
  );
});
