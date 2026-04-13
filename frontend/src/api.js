import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cattle_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    // Return response normally
    return response;
  },
  (error) => {
    // Handle global errors e.g. unauthorized
    if (error.response?.status === 401) {
      // Potentially logout here or refresh token
      // localStorage.removeItem('cattle_token');
      // localStorage.removeItem('cattle_user');
      // window.location.href = '/login';
    }
    
    // Smooth out error message from backend
    const message = error.response?.data?.message || error.message || "حدث خطأ غير متوقع";
    error.friendlyMessage = message;
    
    return Promise.reject(error);
  }
);

export default api;
