// src/axiosConfig.ts
import axios from "axios";

const instance = axios.create({
baseURL: import.meta.env.VITE_API_BASE_URL, // uses env variable
  withCredentials: true,
});

// Add token to Authorization header
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
