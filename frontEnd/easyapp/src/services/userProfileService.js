import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const browserBaseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
const API_BASE_URL = configuredBaseUrl || browserBaseUrl;
const API_URL = `${API_BASE_URL}/api/user-profile-new`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

function unwrapUsers(response) {
  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error(response.data?.message || "Invalid user profile response");
  }

  return response.data.data;
}

function unwrapMutation(response) {
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Request failed");
  }

  return response.data;
}

export const getUsers = async () => {
  const response = await api.get("/");
  return unwrapUsers(response);
};

export const createUser = async (userData) => {
  const response = await api.post("/", userData);
  return unwrapMutation(response);
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/${userId}`, userData);
  return unwrapMutation(response);
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/${userId}`);
  return unwrapMutation(response);
};
