import api from "../api/axiosConfig";

export const predictExpenseCategoryWithMl = async (description) => {
  const response = await api.post("/ai/expenses/category", { description });
  return response.data?.data;
};
