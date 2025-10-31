import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

export default api;
