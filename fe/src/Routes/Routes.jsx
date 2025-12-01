import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  Navigate,
} from "react-router-dom"; // Thêm Outlet, Navigate

// --- IMPORTS CỦA ADMIN (CŨ) ---
import CoursePage from "../Pages/Students/CoursePage";
import SchedulePage from "../Pages/Schedule";
import RegisteredSchedules from "../Pages/Schedule/RegisteredSchedules";
import StudentsXML from "../Pages/Students/StudentsXML";
import StatsPage from "../Pages/Students/state";
import Students from "../Pages/Students/index";
import UsersPage from "../Pages/Users/Users";
import PrivateRoute from "../Components/PrivateRoute";
import { useAuth } from "../contexts/AuthContext";

// --- IMPORTS CỦA STUDENT (MỚI) ---
import StudentLayout from "../Layout/StudentLayout";
import StudentDashboard from "../Pages/Student/Dashboard"; // Sửa lại tên import cho chuẩn viết hoa
import LoginStudent from "../Pages/Student/LoginStudent";
import Learning from "../Pages/Student/Learning";

// --- IMPORTS CỦA ADMIN LOGIN ---
import LoginPage from "../Pages/Auth/Login";


// 1. COMPONENT NAVIGATION (GIỮ NGUYÊN CỦA BẠN - MENU ADMIN)
function Navigation() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin;
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className="nav mb-4"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
        position: "relative",
        zIndex: 10,
      }}
    >
      <Link className="nav-link" to="/admin/courses">
        Khóa học
      </Link>

      {/* Dropdown Học viên */}
      <div style={{ position: "relative", zIndex: 10000 }} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowDropdown((prev) => !prev)}
          style={{
            background: "red",
            border: "2px solid black",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "16px",
            margin: "0 10px",
          }}
        >
          👥 HỌC VIÊN {showDropdown ? "▲" : "▼"}
        </button>

        {showDropdown && (
          <div
            style={{
              position: "fixed",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "yellow",
              border: "3px solid red",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              zIndex: 10001,
              minWidth: "300px",
              padding: "10px",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              Chọn loại học viên:
            </div>
            <Link
              to="/admin/students"
              style={{
                display: "block",
                padding: "15px 20px",
                background: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "5px",
                marginBottom: "10px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: "bold",
              }}
              onClick={() => setShowDropdown(false)}
            >
              📝 THI SÁT HẠCH
            </Link>
            <Link
              to="/admin/students-xml"
              style={{
                display: "block",
                padding: "15px 20px",
                background: "#28a745",
                color: "white",
                textDecoration: "none",
                borderRadius: "5px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: "bold",
              }}
              onClick={() => setShowDropdown(false)}
            >
              📸 TỪ XML
            </Link>
          </div>
        )}
      </div>

      <Link className="nav-link" to="/admin/stats">
        Biểu đồ
      </Link>
      {isAdmin && (
        <Link className="nav-link" to="/admin/users">
          Người dùng
        </Link>
      )}
      <Link className="nav-link" to="/admin/schedules">
        Đăng ký lịch học cabin
      </Link>
      <Link className="nav-link" to="/admin/registered-schedules">
        Lịch học đã đăng ký
      </Link>
    </nav>
  );
}

// 2. TẠO LAYOUT RIÊNG CHO ADMIN (GOM NAVIGATION VÀO ĐÂY)
const AdminLayout = () => {
  return (
    <div className="container mt-4">
      {/* Chỉ hiện Navigation khi ở trang Admin */}
      <Navigation />
      {/* Outlet là nơi hiển thị nội dung các trang con (Courses, Students...) */}
      <Outlet />
    </div>
  );
};

// 3. ROUTER CHÍNH (SỬA ĐỔI LỚN TẠI ĐÂY)
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === PHẦN 1: ROUTE CỦA HỌC VIÊN (STUDENT) === */}
        {/* Trang đăng nhập học viên (Không có layout) */}
        <Route path="/student/login" element={<LoginStudent />} />
        
        {/* Các trang bên trong của học viên (Có Sidebar, Header riêng) */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />{" "}
          {/* Mặc định vào Dashboard */}
          <Route path="learning" element={<Learning />} />
          {/* Thêm các route khác của học viên tại đây */}
        </Route>
        {/* === PHẦN 2: ROUTE CỦA QUẢN TRỊ (ADMIN) === */}
        {/* Trang đăng nhập admin */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Bọc tất cả route admin vào PrivateRoute để kiểm tra đăng nhập */}
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route path="courses" element={<CoursePage />} />
          <Route path="students" element={<Students />} />
          <Route path="students-xml" element={<StudentsXML />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="schedules" element={<SchedulePage />} />
          <Route
            path="registered-schedules"
            element={<RegisteredSchedules />}
          />

          <Route
            path="users"
            element={
              <PrivateRoute adminOnly={true}>
                <UsersPage />
              </PrivateRoute>
            }
          />
        </Route>
        {/* === PHẦN 3: ĐIỀU HƯỚNG MẶC ĐỊNH === */}
        {/* Vào trang chủ ("/") thì chuyển hướng tới Login học viên hoặc Admin tùy bạn */}
        <Route path="/" element={<Navigate to="/student/login" />} />
        {/* Nếu gõ linh tinh thì về trang khóa học (Admin) hoặc 404 */}
        <Route path="*" element={<Navigate to="/admin/courses" />} />
      </Routes>
    </BrowserRouter>
  );
}
