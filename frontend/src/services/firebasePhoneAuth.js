import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const FIREBASE_APP_NAME = "fintrack-phone-test";
let recaptchaVerifier;

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

export const isFirebasePhoneConfigReady = (config = {}) => (
  hasText(config.apiKey) &&
  hasText(config.authDomain) &&
  hasText(config.projectId) &&
  hasText(config.appId)
);

export const normalizeFirebasePhone = (value, defaultCountryCode = "+91") => {
  let normalized = String(value || "").replace(/[\s()-]/g, "");
  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }
  if (!normalized.startsWith("+") && /^\d{10}$/.test(normalized)) {
    normalized = `${defaultCountryCode}${normalized}`;
  } else if (!normalized.startsWith("+") && /^0\d{10}$/.test(normalized)) {
    normalized = `${defaultCountryCode}${normalized.slice(1)}`;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Mobile number must include a valid country code, for example +919876543210.");
  }
  return normalized;
};

const getFirebaseAuth = (config) => {
  if (!isFirebasePhoneConfigReady(config)) {
    throw new Error("Firebase test phone verification is not configured.");
  }

  const app = getApps().some((candidate) => candidate.name === FIREBASE_APP_NAME)
    ? getApp(FIREBASE_APP_NAME)
    : initializeApp(config, FIREBASE_APP_NAME);
  return getAuth(app);
};

export const clearFirebaseRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = undefined;
  }
};

export const startFirebasePhoneVerification = async (config, mobile, containerId) => {
  const auth = getFirebaseAuth(config);
  clearFirebaseRecaptcha();
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "normal"
  });

  try {
    return await signInWithPhoneNumber(
      auth,
      normalizeFirebasePhone(mobile),
      recaptchaVerifier
    );
  } catch (error) {
    clearFirebaseRecaptcha();
    throw error;
  }
};

export const finishFirebasePhoneVerification = async (confirmationResult, code) => {
  if (!confirmationResult) {
    throw new Error("Start Firebase test verification first.");
  }

  const credential = await confirmationResult.confirm(String(code || "").trim());
  return {
    idToken: await credential.user.getIdToken(),
    phoneNumber: credential.user.phoneNumber || ""
  };
};
