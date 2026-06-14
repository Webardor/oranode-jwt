import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const browserBaseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
const API_BASE_URL = configuredBaseUrl || browserBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

export const login = async ({ username, password }) => {
  const response = await api.post("/api/login", {
    username,
    password
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Login failed");
  }

  return response.data;
};

export const logout = async (accessToken) => {
  if (!accessToken) {
    return;
  }

  await api.post(
    "/api/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
};
