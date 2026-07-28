const normalize = (value) => String(value || "").trim().toLowerCase();

export const applicationStatusGroup = (status) => {
  const value = String(status || "SUBMITTED").toUpperCase();
  if (value.includes("BLOCKED") || value.includes("REJECTED")) return "blocked";
  if (value === "APPROVED" || value === "PRE_APPROVED") return "approved";
  if (value.includes("REVIEW") || value.includes("PENDING") || value.includes("ABOVE") || value.includes("HIGH")) return "review";
  return "submitted";
};

export const resolveApplicationOffer = (application, offers = []) => {
  if (application?.loanOffer?.bank || application?.loanOffer?.loanType) return application.loanOffer;
  const offerId = application?.loanOfferId || application?.loanOffer?.id;
  return offers.find((offer) => Number(offer.id) === Number(offerId)) || null;
};

export const enrichApplications = (applications = [], offers = []) => applications.map((application) => {
  const resolvedOffer = resolveApplicationOffer(application, offers);
  return resolvedOffer ? { ...application, loanOffer: resolvedOffer } : application;
});

export const summarizeApplications = (applications = []) => ({
  total: applications.length,
  approved: applications.filter((application) => applicationStatusGroup(application.status) === "approved").length,
  review: applications.filter((application) => applicationStatusGroup(application.status) === "review").length,
  blocked: applications.filter((application) => applicationStatusGroup(application.status) === "blocked").length,
  feePending: applications.filter((application) => application.paymentStatus !== "PAID").length
});

export const filterAndSortApplications = (applications = [], criteria = {}) => {
  const { search = "", status = "all", sort = "newest" } = criteria;
  const query = normalize(search);
  const filtered = applications.filter((application) => {
    const offer = application.loanOffer;
    const haystack = [
      application.id,
      application.applicantName,
      application.status,
      application.paymentStatus,
      offer?.bank?.name,
      offer?.bank?.shortName,
      offer?.loanType?.name
    ].map(normalize).join(" ");
    if (query && !haystack.includes(query)) return false;
    if (status === "paid") return application.paymentStatus === "PAID";
    if (status === "unpaid") return application.paymentStatus !== "PAID";
    return status === "all" || applicationStatusGroup(application.status) === status;
  });

  const applicationTime = (application) => {
    const parsed = Date.parse(application.createdAt || "");
    return Number.isFinite(parsed) ? parsed : Number(application.id || 0);
  };

  return filtered.sort((left, right) => {
    if (sort === "oldest") return applicationTime(left) - applicationTime(right);
    if (sort === "amount_high") return Number(right.requestedAmount || 0) - Number(left.requestedAmount || 0);
    if (sort === "amount_low") return Number(left.requestedAmount || 0) - Number(right.requestedAmount || 0);
    return applicationTime(right) - applicationTime(left);
  });
};
