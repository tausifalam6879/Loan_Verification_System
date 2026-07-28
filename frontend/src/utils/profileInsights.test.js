import {
  getCreditScoreBand,
  getProfileCompleteness,
  getSessionDetails,
  summarizeProfileApplications
} from "./profileInsights";

test("builds clear credit score bands", () => {
  expect(getCreditScoreBand(780).label).toBe("Excellent");
  expect(getCreditScoreBand(735).label).toBe("Good");
  expect(getCreditScoreBand(null).progress).toBe(0);
});

test("summarizes profile applications and fee state", () => {
  const summary = summarizeProfileApplications([
    { id: 1, status: "PRE_APPROVED", paymentStatus: "UNPAID", createdAt: "2026-07-01T10:00:00" },
    { id: 2, status: "PENDING_REVIEW", paymentStatus: "PAID", createdAt: "2026-07-02T10:00:00" },
    { id: 3, status: "REJECTED", paymentStatus: "UNPAID", createdAt: "2026-07-03T10:00:00" }
  ]);

  expect(summary).toMatchObject({ total: 3, approved: 1, review: 1, blocked: 1, feePending: 2 });
  expect(summary.recent[0].id).toBe(3);
});

test("calculates completeness and tolerates non-JWT demo sessions", () => {
  expect(getProfileCompleteness({ fullName: "Demo User", email: "demo@example.com", creditScore: 735 })).toMatchObject({ percent: 75, missing: ["mobile number"] });
  expect(getSessionDetails("demo-jwt-token")).toMatchObject({ status: "active", expiresAt: null });
});
