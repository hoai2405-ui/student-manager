import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


// --- IMPORTS CỦA ADMIN ---
import CoursePage from "../Pages/Admin/CoursePage";
import SchedulePage from "../Pages/Schedule";
import Dashboard from "../Pages/Dashboard";
import RegisteredSchedules from "../Pages/Schedule/RegisteredSchedules";
import StatsPage from "../Pages/Admin/state";
import Students from "../Pages/Admin/index";
import CreateStudent from "../Pages/Admin/createStudent";
import UsersPage from "../Pages/Users/Users";
import ManageLessons from "../Pages/Lessons/ManageLessons"; // Kiểm tra lại đường dẫn này xem đúng file chưa nhé
import AdminAssessment from "../Pages/Admin/Assessment";
import PrivateRoute from "../Components/PrivateRoute";
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
import StudentExams from "../Pages/Student/Exams";
import StudentPractice from "../Pages/Student/Practice";
import LearningHistory from "../Pages/Student/LearningHistory";


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

          {/* 6. Ôn tập */}
          <Route path="practice" element={<StudentPractice />} />

          {/* 7. Thi thử */}
          <Route path="exams" element={<StudentExams />} />

          <Route path="simulation" element={<SimulationPage />} />
          <Route path="history" element={<LearningHistory />} />
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
          <Route key="admin-students-new" path="students/new" element={<CreateStudent />} />
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

          <Route
            path="assessment"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminAssessment />
              </PrivateRoute>
            }
          />
        </Route>

        {/* =========================================
            PHẦN 3: ĐIỀU HƯỚNG MẶC ĐỊNH
           ========================================= */}
        <Route path="/" element={<Navigate to="/student/login" />} />
        {/* Các đường dẫn lạ thì đẩy về trang đăng nhập phù hợp */}
        <Route path="*" element={<Navigate to="/student/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
