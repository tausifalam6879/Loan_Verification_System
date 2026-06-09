import api from "../api/axiosConfig";

export const getLoanOffers = async () => {
  const response = await api.get("/loans/offers");
  return response.data;
};

export const getLoanOffer = async (id) => {
  const response = await api.get(`/loans/offers/${id}`);
  return response.data;
};

export const applyForLoan = async (application) => {
  const response = await api.post("/loans/apply", application);
  return response.data;
};

export const getLoanApplications = async () => {
  const response = await api.get("/loans/my-applications");
  return response.data;
};

export const getAllLoanApplications = async () => {
  const response = await api.get("/loans/applications");
  return response.data;
};

export const payProcessingFee = async (applicationId, payment) => {
  const response = await api.post(`/loans/applications/${applicationId}/payment`, payment);
  return response.data;
};
