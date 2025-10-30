import axios from "axios";

// Flask backend base URL
export const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Axios instance

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
});
// Log all requests for debugging
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

export default api;
