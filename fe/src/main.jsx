import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/main.css";
import PrivateRoute from "./Components/PrivateRoute";
import ErrorBoundary from "./Components/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// --- ADMIN PAGES ---
import LoginPage from "./Pages/Auth/Login";
import AdminLayout from "./Layout/AdminLayout";

import UsersPage from "./Pages/Users/Users";
import Students from "./Pages/Students/index";
import StatsPage from "./Pages/Students/state";
import CoursePage from "./Pages/Students/CoursePage";
import StudentsNew from "./Pages/Students/createStudent";
import SchedulePage from "./Pages/Schedule";
import CreateSchedule from "./Pages/Schedule/CreateSchedule";
import RegisterSchedule from "./Pages/Schedule/RegisterSchedule";
import RegisteredSchedules from "./Pages/Schedule/RegisteredSchedules";
import StudentsXML from "./Pages/Students/StudentsXML";
// 👇 Kiểm tra đường dẫn này, nếu bạn để trong Admin/Lessons thì sửa lại nhé
import ManageLessons from "./Pages/Lessons/ManageLessons";

// --- STUDENT PAGES ---
import LoginStudent from "./Pages/Student/LoginStudent";
import StudentLayout from "./Layout/StudentLayout";
import StudentDashboard from "./Pages/Student/Dashboard";
import Learning from "./Pages/Student/Learning";
// 👇 BỔ SUNG TRANG CHI TIẾT MÔN HỌC
import StudentCourseDetail from "./Pages/Student/StudentCourseDetail";
import StudentMyCourses from "./Pages/Student/StudentMyCourse";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* =========================================================
                1. ĐIỀU HƯỚNG MẶC ĐỊNH
               ========================================================= */}
            <Route
              path="/"
              element={<Navigate to="/student/login" replace />}
            />

            {/* =========================================================
                2. KHU VỰC HỌC VIÊN (STUDENT)
               ========================================================= */}
            <Route path="/student/login" element={<LoginStudent />} />

            <Route path="/student" element={<StudentLayout />}>
              {/* Trang chủ Dashboard */}
              <Route index element={<StudentDashboard />} />

              {/* Route ảo để Menu "Môn học của tôi" hoạt động */}
              <Route path="learning" element={<StudentMyCourses />} />

              {/* Trang danh sách bài học của 1 môn (Ví dụ: /student/subjects/1) */}
              <Route
                path="subjects/:subjectId"
                element={<StudentCourseDetail />}
              />

              {/* Trang học bài chi tiết (PDF/Video) (Ví dụ: /student/learning/15) */}
              <Route path="learning/:lessonId" element={<Learning />} />

              {/* Các trang phụ tránh lỗi 404 */}
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
                  <div className="p-4">
                    Chức năng Trợ lý AI đang phát triển...
                  </div>
                }
              />
            </Route>

            {/* =========================================================
                3. KHU VỰC QUẢN TRỊ (ADMIN)
               ========================================================= */}
            <Route path="/admin/login" element={<LoginPage />} />

            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              {/* Mặc định vào Admin thì vào Quản lý khóa học */}
              <Route index element={<Navigate to="courses" replace />} />

              <Route path="courses" element={<CoursePage />} />
              <Route path="lessons" element={<ManageLessons />} />
              <Route path="students/new" element={<StudentsNew />} />
              <Route path="students" element={<Students />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="students-xml" element={<StudentsXML />} />
              <Route
                path="users"
                element={
                  <PrivateRoute adminOnly={true}>
                    <UsersPage />
                  </PrivateRoute>
                }
              />
              <Route path="schedules" element={<SchedulePage />} />
              <Route path="schedules/create" element={<CreateSchedule />} />
              <Route
                path="schedules/register/:scheduleId"
                element={<RegisterSchedule />}
              />
              <Route
                path="registered-schedules"
                element={<RegisteredSchedules />}
              />
            </Route>

            {/* Xử lý 404 */}
            <Route path="*" element={<Navigate to="/student/login" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
