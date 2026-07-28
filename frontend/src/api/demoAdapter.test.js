import { TextEncoder as NodeTextEncoder } from "util";
import { webcrypto } from "crypto";
import { demoAdapter } from "./demoAdapter";

const call = (url, method = "get", data, token) =>
  demoAdapter({
    url,
    method,
    data: data ? JSON.stringify(data) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

const legacyPasswordHash = async (password, salt) => {
  const input = new NodeTextEncoder().encode(`${salt}:${password}`);
  const digest = await webcrypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

beforeAll(() => {
  Object.defineProperty(window, "crypto", { configurable: true, value: webcrypto });
  global.TextEncoder = NodeTextEncoder;
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("rejects unknown OTP identities and wrong demo passwords", async () => {
  await expect(
    call("/api/users/request-otp", "post", {
      email: "unknown@example.com",
      channel: "EMAIL",
      purpose: "LOGIN"
    })
  ).rejects.toMatchObject({ response: { status: 400 } });

  await call("/api/users/register", "post", {
    fullName: "Registered User",
    email: "registered@example.com",
    mobile: "9876543210",
    password: "correct-password"
  });

  expect(localStorage.getItem("fintrackDemoAccountsV1")).not.toContain("correct-password");

  await expect(
    call("/api/users/request-otp", "post", {
      email: "registered@example.com",
      channel: "EMAIL",
      purpose: "REGISTER"
    })
  ).rejects.toMatchObject({
    response: { status: 400, data: { message: "Email already registered. Please use Login instead." } }
  });

  await expect(
    call("/api/users/login", "post", {
      email: "registered@example.com",
      channel: "PASSWORD",
      password: "wrong-password"
    })
  ).rejects.toMatchObject({ response: { status: 401 } });
});

test("accepts a legacy demo password hash once and upgrades it to PBKDF2", async () => {
  const passwordSalt = "legacy-salt";
  const passwordHash = await legacyPasswordHash("same-password", passwordSalt);
  localStorage.setItem(
    "fintrackDemoAccountsV1",
    JSON.stringify([
      {
        id: 17,
        fullName: "Existing User",
        email: "existing@example.com",
        mobile: "9000000017",
        role: "USER",
        passwordSalt,
        passwordHash
      }
    ])
  );

  const loginResponse = await call("/api/users/login", "post", {
    email: "existing@example.com",
    channel: "PASSWORD",
    password: "same-password"
  });
  const upgradedAccount = JSON.parse(localStorage.getItem("fintrackDemoAccountsV1"))[0];

  expect(loginResponse.data.token).toMatch(/^demo-session-/);
  expect(upgradedAccount.passwordAlgorithm).toBe("PBKDF2-SHA256");
  expect(upgradedAccount.passwordHash).not.toBe(passwordHash);
});

test("requires a verified demo session before returning private profile data", async () => {
  await call("/api/users/register", "post", {
    fullName: "Secure User",
    email: "secure@example.com",
    mobile: "9123456780",
    password: "secure-password"
  });

  await expect(call("/api/users/me")).rejects.toMatchObject({ response: { status: 401 } });

  const loginResponse = await call("/api/users/login", "post", {
    email: "secure@example.com",
    channel: "PASSWORD",
    password: "secure-password"
  });
  const profileResponse = await call("/api/users/me", "get", undefined, loginResponse.data.token);

  expect(profileResponse.data.email).toBe("secure@example.com");
  expect(profileResponse.data.fullName).toBe("Secure User");
});

test("binds login OTP verification to a prior request for the registered identity", async () => {
  await call("/api/users/register", "post", {
    fullName: "OTP User",
    email: "otp@example.com",
    mobile: "9988776655",
    password: "otp-password"
  });

  await expect(
    call("/api/users/verify-otp", "post", {
      email: "otp@example.com",
      channel: "EMAIL",
      purpose: "LOGIN",
      otp: "123456"
    })
  ).rejects.toMatchObject({ response: { status: 400 } });

  await call("/api/users/request-otp", "post", {
    email: "otp@example.com",
    channel: "EMAIL",
    purpose: "LOGIN"
  });
  const verified = await call("/api/users/verify-otp", "post", {
    email: "otp@example.com",
    channel: "EMAIL",
    purpose: "LOGIN",
    otp: "123456"
  });
  const loginResponse = await call("/api/users/login", "post", {
    email: "otp@example.com",
    channel: "EMAIL",
    otpToken: verified.data.otpToken
  });

  expect(loginResponse.data.token).toMatch(/^demo-session-/);
});
