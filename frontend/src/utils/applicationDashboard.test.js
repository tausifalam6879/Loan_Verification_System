import {
  applicationStatusGroup,
  enrichApplications,
  filterAndSortApplications,
  summarizeApplications
} from "./applicationDashboard";

const offers = [{ id: 3, bank: { name: "ICICI Bank" }, loanType: { name: "Education Loan" } }];
const applications = [
  { id: 1, applicantName: "Demo Applicant", loanOfferId: 3, status: "PRE_APPROVED", paymentStatus: "UNPAID", requestedAmount: 600000 },
  { id: 2, applicantName: "Review User", loanOfferId: 3, status: "NEEDS_CREDIT_REVIEW", paymentStatus: "PAID", requestedAmount: 200000 }
];

describe("application dashboard utilities", () => {
  test("resolves an application's lender and loan product", () => {
    const enriched = enrichApplications(applications, offers);
    expect(enriched[0].loanOffer.bank.name).toBe("ICICI Bank");
    expect(enriched[0].loanOffer.loanType.name).toBe("Education Loan");
  });

  test("summarizes workflow and fee states", () => {
    expect(summarizeApplications(applications)).toEqual({ total: 2, approved: 1, review: 1, blocked: 0, feePending: 1 });
    expect(applicationStatusGroup("BLOCKED_FRAUD_REVIEW")).toBe("blocked");
  });

  test("searches, filters, and sorts applications", () => {
    const enriched = enrichApplications(applications, offers);
    expect(filterAndSortApplications(enriched, { search: "ICICI", status: "unpaid" })).toHaveLength(1);
    expect(filterAndSortApplications(enriched, { sort: "amount_high" })[0].requestedAmount).toBe(600000);
  });
});
