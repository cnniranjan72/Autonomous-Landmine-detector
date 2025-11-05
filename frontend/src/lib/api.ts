import axios from "axios";

// ✅ Automatically switch between local and production
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_URL = isLocalhost
  ? "http://127.0.0.1:5000/api"
  : "https://intellimine.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

export default api;
