import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const browserBaseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
const API_BASE_URL = configuredBaseUrl || browserBaseUrl;
const API_URL = `${API_BASE_URL}/api/user-password`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

function unwrapList(response) {
  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error(response.data?.message || "Invalid password response");
  }

  return response.data.data;
}

function unwrapMutation(response) {
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Request failed");
  }

  return response.data;
}

export const getPasswordRecords = async () => {
  const response = await api.get("/");
  return unwrapList(response);
};

export const updatePasswordRecord = async (userId, payload) => {
  const response = await api.put(`/${userId}`, payload);
  return unwrapMutation(response);
};
