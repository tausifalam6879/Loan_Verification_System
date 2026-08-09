import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  clearFirebaseRecaptcha,
  finishFirebasePhoneVerification,
  isFirebasePhoneConfigReady,
  normalizeFirebasePhone,
  startFirebasePhoneVerification
} from "./firebasePhoneAuth";

jest.mock("firebase/app", () => ({
  getApp: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn()
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  RecaptchaVerifier: jest.fn(),
  signInWithPhoneNumber: jest.fn()
}));

const config = {
  apiKey: "public-key",
  authDomain: "fintrack.firebaseapp.com",
  projectId: "fintrack",
  appId: "app-id"
};

beforeEach(() => {
  jest.clearAllMocks();
  getApps.mockReturnValue([]);
  initializeApp.mockReturnValue({ name: "fintrack-phone-test" });
  getAuth.mockReturnValue({ name: "auth" });
  RecaptchaVerifier.mockImplementation(() => ({ clear: jest.fn() }));
  clearFirebaseRecaptcha();
});

test("normalizes Indian test numbers and validates public config", () => {
  expect(normalizeFirebasePhone("98765 43210")).toBe("+919876543210");
  expect(normalizeFirebasePhone("+1 (650) 555-3434")).toBe("+16505553434");
  expect(() => normalizeFirebasePhone("123")).toThrow("valid country code");
  expect(isFirebasePhoneConfigReady(config)).toBe(true);
  expect(isFirebasePhoneConfigReady({ apiKey: "only-one-field" })).toBe(false);
});

test("starts Firebase verification with reCAPTCHA and returns confirmation", async () => {
  const confirmation = { confirm: jest.fn() };
  signInWithPhoneNumber.mockResolvedValue(confirmation);

  await expect(
    startFirebasePhoneVerification(config, "9876543210", "recaptcha")
  ).resolves.toBe(confirmation);

  expect(initializeApp).toHaveBeenCalledWith(config, "fintrack-phone-test");
  expect(RecaptchaVerifier).toHaveBeenCalledWith(
    { name: "auth" },
    "recaptcha",
    { size: "normal" }
  );
  expect(signInWithPhoneNumber).toHaveBeenCalledWith(
    { name: "auth" },
    "+919876543210",
    expect.any(Object)
  );
  expect(getApp).not.toHaveBeenCalled();
});

test("exchanges the fixed test code for a Firebase ID token", async () => {
  const getIdToken = jest.fn().mockResolvedValue("signed-id-token");
  const confirmation = {
    confirm: jest.fn().mockResolvedValue({
      user: { getIdToken, phoneNumber: "+919876543210" }
    })
  };

  await expect(finishFirebasePhoneVerification(confirmation, " 123456 ")).resolves.toEqual({
    idToken: "signed-id-token",
    phoneNumber: "+919876543210"
  });
  expect(confirmation.confirm).toHaveBeenCalledWith("123456");
});
