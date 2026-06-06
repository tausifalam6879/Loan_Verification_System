const BASE_URL = "http://localhost:8081/api/loans";

export const getLoanOffers = async () => {
  const response = await fetch(`${BASE_URL}/offers`);

  if (!response.ok) {
    throw new Error("Failed to fetch loan offers");
  }

  return response.json();
};

export const getLoanOffer = async (id) => {
  const response = await fetch(`${BASE_URL}/offers/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch loan offer");
  }

  return response.json();
};

export const applyForLoan = async (application) => {
  const response = await fetch(`${BASE_URL}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(application)
  });

  if (!response.ok) {
    throw new Error("Failed to submit loan application");
  }

  return response.json();
};

export const getLoanApplications = async () => {
  const response = await fetch(`${BASE_URL}/applications`);

  if (!response.ok) {
    throw new Error("Failed to fetch loan applications");
  }

  return response.json();
};

export const payProcessingFee = async (applicationId, payment) => {
  const response = await fetch(`${BASE_URL}/applications/${applicationId}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payment)
  });

  if (!response.ok) {
    throw new Error("Failed to update payment status");
  }

  return response.json();
};
