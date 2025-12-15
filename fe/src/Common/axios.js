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
      // Redirect to the correct login page depending on current route
      try {
        const currentPath = window.location.pathname || "";
        const loginPath = currentPath.startsWith("/admin") ? "/admin/login" : "/student/login";
        if (currentPath !== loginPath) {
          window.location.href = loginPath;
        }
      } catch (e) {
        // Fallback
        window.location.href = "/student/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
