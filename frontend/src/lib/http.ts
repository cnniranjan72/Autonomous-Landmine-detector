import axios from "axios";
import { API_URL } from "./api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // if using cookies or JWT
});

export default api;
