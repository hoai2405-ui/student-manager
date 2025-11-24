import axios from "axios";

const api = import.meta.env.VITE_API_URL || "";

const instance = axios.create({
  baseURL: api,
  withCredentials: false,
});

// Request interceptor để tự động thêm token vào mọi request
instance.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    try {
      const authData = localStorage.getItem("auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (error) {
      console.error("Error parsing auth data:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi 401 (unauthorized)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      // Redirect to login nếu không phải đang ở trang login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
