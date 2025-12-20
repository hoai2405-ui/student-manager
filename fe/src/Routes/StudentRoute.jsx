import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


// --- IMPORTS CỦA ADMIN ---
import CoursePage from "../Pages/Students/CoursePage";
import SchedulePage from "../Pages/Schedule";
import Dashboard from "../Pages/Dashboard";
import RegisteredSchedules from "../Pages/Schedule/RegisteredSchedules";
import StatsPage from "../Pages/Students/state";
import Students from "../Pages/Students/index";
import UsersPage from "../Pages/Users/Users";
import ManageLessons from "../Pages/Lessons/ManageLessons"; // Kiểm tra lại đường dẫn này xem đúng file chưa nhé
import PrivateRoute from "../Components/PrivateRoute";
import { AuthProvider } from "../contexts/AuthContext";
import LoginPage from "../Pages/Auth/Login";
import AdminLayout from "../Layout/AdminLayout"; // Import Layout Admin

// --- IMPORTS CỦA STUDENT ---
import StudentLayout from "../Layout/StudentLayout"; // Import Layout Student
import StudentDashboard from "../Pages/Student/Dashboard";
import LoginStudent from "../Pages/Student/LoginStudent";
import Learning from "../Pages/Student/Learning";
import StudentMyCourses from "../Pages/Student/StudentMyCourse";
// 👇 Bổ sung Import trang chi tiết môn học
import StudentCourseDetail from "../Pages/Student/StudentCourseDetail";
import SimulationPage from "../Pages/Student/SimulationPage";
import StudentProgress from "../Pages/Student/Progress";


// 3. ROUTER CHÍNH
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================================
            PHẦN 1: ROUTE CỦA HỌC VIÊN (STUDENT)
           ========================================= */}

        {/* Trang đăng nhập (Không có Layout) */}
        <Route path="/student/login" element={<LoginStudent />} />

        {/* Khu vực sau khi đăng nhập (Có Sidebar, Header) */}
        <Route path="/student" element={<StudentLayout />}>
          {/* 1. Trang chủ (Dashboard) */}
          <Route index element={<StudentDashboard />} />

          {/* 2. Route ảo để Menu "Môn học của tôi" hoạt động */}
          <Route path="learning" element={<StudentMyCourses />} />

          {/* 3. Trang danh sách bài học của 1 môn */}
          {/* Khi vào đây, Sidebar vẫn hiển thị */}
          <Route path="subjects/:subjectcode" element={<StudentCourseDetail />} />

          {/* 4. Trang học bài (PDF/Video) */}
          <Route path="learning/:lessonId" element={<Learning />} />

          {/* 5. Trang tiến độ học tập */}
          <Route path="progress" element={<StudentProgress />} />

          <Route path="simulation" element={<SimulationPage />} />
          <Route
            path="history"
            element={
              <div className="p-4">
                Chức năng Lịch sử thi đang phát triển...
              </div>
            }
          />
          <Route
            path="chat-ai"
            element={
              <div className="p-4">Chức năng Trợ lý AI đang phát triển...</div>
            }
          />
        </Route>

        {/* =========================================
            PHẦN 2: ROUTE CỦA QUẢN TRỊ (ADMIN)
           ========================================= */}

        <Route path="/admin/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route key="admin-index" index element={<Dashboard />} />

          <Route key="admin-courses" path="courses" element={<CoursePage />} />
          <Route key="admin-lessons" path="lessons" element={<ManageLessons />} />
          <Route key="admin-students" path="students" element={<Students />} />
          <Route key="admin-stats" path="stats" element={<StatsPage />} />
          <Route key="admin-schedules" path="schedules" element={<SchedulePage />} />
          <Route
            key="admin-registered-schedules"
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

        {/* =========================================
            PHẦN 3: ĐIỀU HƯỚNG MẶC ĐỊNH
           ========================================= */}
        <Route path="/" element={<Navigate to="/student/login" />} />
        {/* Các đường dẫn lạ thì đẩy về trang chủ Admin hoặc Student tuỳ ý */}
        <Route path="*" element={<Navigate to="/student/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
