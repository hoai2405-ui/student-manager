import React from "react";
import ReactDOM from "react-dom/client";
// import App from './App.js'
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/main.css";
import PrivateRoute from "./Components/PrivateRoute";
import ErrorBoundary from "./Components/ErrorBoundary";
import LoginPage from "./Pages/Auth/Login";
import AdminLayout from "./Layout/AdminLayout";
import UsersPage from "./Pages/Users/Users";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Nhớ import Navigate
import Students from "./Pages/Students/index";
import StatsPage from "./Pages/Students/state";
import CoursePage from "./Pages/Students/CoursePage";
import StudentsNew from "./Pages/Students/createStudent";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./Pages/Dashboard/index";
import SchedulePage from "./Pages/Schedule";
import CreateSchedule from "./Pages/Schedule/CreateSchedule";
import RegisterSchedule from "./Pages/Schedule/RegisterSchedule";
import RegisteredSchedules from "./Pages/Schedule/RegisteredSchedules";
import StudentsXML from "./Pages/Students/StudentsXML";
import ManageLessons from "./Pages/Lessons/ManageLessons";

// Import Student Pages
import LoginStudent from "./Pages/Student/LoginStudent";
import StudentLayout from "./Layout/StudentLayout";
import StudentDashboard from "./Pages/Student/Dashboard";
import Learning from "./Pages/Student/Learning";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. ĐIỀU HƯỚNG MẶC ĐỊNH: Vào web là chuyển ngay tới Login Học viên */}
            <Route
              path="/"
              element={<Navigate to="/student/login" replace />}
            />

            {/* 2. KHU VỰC HỌC VIÊN */}
            <Route path="/student/login" element={<LoginStudent />} />

            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="learning" element={<Learning />} />
              <Route path="courses" element={<CoursePage />} />
            </Route>

            {/* 3. KHU VỰC QUẢN TRỊ (ADMIN) - Giờ đây phải gõ /admin mới vào được */}

            {/* Trang login Admin */}
            <Route path="/admin/login" element={<LoginPage />} />

            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
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
