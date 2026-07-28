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

test("keeps Copilot account-scoped and returns contextual demo analytics after login", async () => {
  await call("/api/users/register", "post", {
    fullName: "Copilot User",
    email: "copilot@example.com",
    mobile: "9000012345",
    password: "copilot-password"
  });

  await expect(
    call("/api/ai/chat", "post", { message: "What needs my attention?", page: "overview" })
  ).rejects.toMatchObject({ response: { status: 401 } });

  const loginResponse = await call("/api/users/login", "post", {
    email: "copilot@example.com",
    channel: "PASSWORD",
    password: "copilot-password"
  });
  const chatResponse = await call(
    "/api/ai/chat",
    "post",
    { message: "Summarize my loan applications", page: "applications" },
    loginResponse.data.token
  );

  expect(chatResponse.data.success).toBe(true);
  expect(chatResponse.data.data.usedContext).toBe(true);
  expect(chatResponse.data.data.provider).toBe("demo-analytics");
  expect(chatResponse.data.data.answer).toMatch(/signed-in account/i);
});

test("isolates saved financial data between registered browser-demo accounts", async () => {
  await call("/api/users/register", "post", {
    fullName: "First User",
    email: "first@example.com",
    mobile: "9000000001",
    password: "first-password"
  });
  await call("/api/users/register", "post", {
    fullName: "Second User",
    email: "second@example.com",
    mobile: "9000000002",
    password: "second-password"
  });

  const firstLogin = await call("/api/users/login", "post", {
    email: "first@example.com",
    channel: "PASSWORD",
    password: "first-password"
  });
  const secondLogin = await call("/api/users/login", "post", {
    email: "second@example.com",
    channel: "PASSWORD",
    password: "second-password"
  });

  await call(
    "/api/expenses/add",
    "post",
    { amount: 321, category: "Other", description: "First account only" },
    firstLogin.data.token
  );

  const firstExpenses = await call("/api/expenses/all", "get", undefined, firstLogin.data.token);
  const secondExpenses = await call("/api/expenses/all", "get", undefined, secondLogin.data.token);

  expect(firstExpenses.data.data).toEqual(
    expect.arrayContaining([expect.objectContaining({ description: "First account only" })])
  );
  expect(secondExpenses.data.data).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ description: "First account only" })])
  );
});
