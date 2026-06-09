import api from "../api/axiosConfig";

export const getExpenses = async () => {
  const response = await api.get("/expenses/all");
  return response.data?.data || [];
};

export const addExpense = async (expense) => {
  const response = await api.post("/expenses/add", expense);
  return response.data?.data;
};

export const deleteExpense = async (id) => {
  await api.delete(`/expenses/delete/${id}`);
  return true;
};
