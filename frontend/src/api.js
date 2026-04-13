import axios from "axios";

// تأكد إن ال API URL موجود
const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  console.error("❌ VITE_API_URL is not defined!");
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Request interceptor (إضافة التوكن)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cattle_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Response interceptor (التعامل مع الأخطاء)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // لو unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("cattle_token");
      localStorage.removeItem("cattle_user");

      // يرجعك login
      window.location.href = "/login";
    }

    // رسالة error مفهومة
    const message =
      error.response?.data?.message ||
      error.message ||
      "حدث خطأ غير متوقع";

    error.friendlyMessage = message;

    return Promise.reject(error);
  }
);

export default api;