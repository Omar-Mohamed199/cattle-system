import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cattle_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "حدث خطأ غير متوقع";

    error.friendlyMessage = message;

    console.error("API ERROR:", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
    });

    return Promise.reject(error);
  }
);

export default api;