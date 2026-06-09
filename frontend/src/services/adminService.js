import api from "../api/axiosConfig";

export const getDashboardStats = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getAdminApplications = async () => {
  const response = await api.get("/admin/applications");
  return response.data;
};

export const approveApplication = async (id) => {
  const response = await api.put(`/admin/applications/${id}/approve`);
  return response.data;
};

export const rejectApplication = async (id) => {
  const response = await api.put(`/admin/applications/${id}/reject`);
  return response.data;
};
