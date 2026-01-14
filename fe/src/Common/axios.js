import axios from "axios";

// 1. Cấu hình đường dẫn gốc
// Nếu bạn chưa cài biến môi trường thì nó sẽ dùng localhost:3001
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const instance = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. INTERCEPTOR REQUEST (QUAN TRỌNG NHẤT)
// Tự động chèn Token vào Header trước khi gửi request
instance.interceptors.request.use(
  (config) => {
    // A. Thử lấy Token của Học viên (Lưu dạng string)
    const studentToken = localStorage.getItem("studentToken");
    
    // B. Thử lấy Token của Admin (Lưu dạng JSON object)
    const adminAuth = localStorage.getItem("auth"); // hoặc "token" tùy code cũ của bạn
    let adminToken = null;
    if (adminAuth) {
        try {
            // Nếu lưu dạng JSON { user:..., token:... }
            const parsed = JSON.parse(adminAuth);
            adminToken = parsed.token;
        } catch {
            // Nếu lưu dạng string
            adminToken = adminAuth;
        }
    }

    // C. Ưu tiên đúng theo khu vực route: /student dùng studentToken, /admin dùng adminToken
    const isStudentPage = window.location.pathname.startsWith("/student");
    const token = isStudentPage ? studentToken : adminToken;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. INTERCEPTOR RESPONSE (Xử lý khi Token hết hạn)
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Nếu lỗi 401 (Chưa login) hoặc 403 (Token sai)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        const url = error.config?.url || '';
        const code = error.response?.data?.code;

        // Nếu khóa học hết hạn: KHÔNG logout, chỉ báo và điều hướng về trang chủ học viên
        if (code === 'COURSE_EXPIRED') {
            const isStudentPage = window.location.pathname.startsWith("/student");
            if (isStudentPage) {
                const msg = error.response?.data?.message || 'Khóa học đã kết thúc';
                // Dùng alert tối giản để tránh phụ thuộc antd ở layer axios.
                // (UI pages vẫn có thể show Modal nếu muốn.)
                window.alert(msg);
                window.location.href = "/student";
                return Promise.reject(error);
            }
        }

        // Skip redirect for student progress APIs (they handle errors gracefully)
        console.log("🔍 API error for URL:", url, "Status:", error.response.status);

        if (url.includes('/api/student/dashboard/') || url.includes('/api/student/summary/') || url.includes('/api/progress/') || url.includes('/api/student/learning-history')) {
            console.warn("⚠️ Student API failed, but not redirecting:", url);
            return Promise.reject(error); // Let component handle it
        }

        console.warn("⚠️ Token hết hạn hoặc không hợp lệ. Đang logout...", "URL:", url);

        // Xóa sạch token cũ
        localStorage.removeItem("studentToken");
        localStorage.removeItem("studentInfo");
        localStorage.removeItem("auth");

        // Điều hướng về trang login tương ứng
        const isStudentPage = window.location.pathname.startsWith("/student");
        if (isStudentPage) {
            window.location.href = "/student/login";
        } else {
            window.location.href = "/admin/login";
        }
    }
    return Promise.reject(error);
  }
);

export default instance;
