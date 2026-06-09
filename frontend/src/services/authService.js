import api from "../api/axiosConfig";

export const login = async (credentials) => {
  const response = await api.post("/users/login", credentials);
  const { token, role, email } = response.data;

  localStorage.setItem("token", token);
  localStorage.setItem("role", role || "USER");
  localStorage.setItem("email", email || credentials.email);

  return response.data;
};

export const register = async (payload) => {
  const response = await api.post("/users/register", payload);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
};

export const getCurrentAuth = () => ({
  token: localStorage.getItem("token"),
  role: localStorage.getItem("role"),
  email: localStorage.getItem("email")
});
