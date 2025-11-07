import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CoursePage from "../Pages/Students/CoursePage";
import SchedulePage from "../Pages/Schedule";
import StatsPage from "../Pages/Students/state";
import Students from "../Pages/Students/index";
import UsersPage from "../Pages/Users/Users";
import PrivateRoute from "../Components/PrivateRoute";
import { useAuth } from "../contexts/AuthContext";

export default function Router() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin;

  return (
    <BrowserRouter>
      <div className="container mt-4">
        <nav className="nav mb-4">
          <Link className="nav-link" to="/courses">
            Khóa học
          </Link>
          <Link className="nav-link" to="/students">
            Học viên
          </Link>
          <Link className="nav-link" to="/stats">
            Biểu đồ
          </Link>
          {isAdmin && (
            <Link className="nav-link" to="/users">
              Người dùng
            </Link>
          )}
          <Link className="nav-link" to="/schedules">
            Đăng ký lịch học cabin
          </Link>
        </nav>
        <Routes>
          <Route path="/courses" element={<CoursePage />} />
          <Route path="/students" element={<Students />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route
            path="/users"
            element={
              <PrivateRoute adminOnly={true}>
                <UsersPage />
              </PrivateRoute>
            }
          />
          <Route path="/schedules" element={<SchedulePage />} />
          <Route path="*" element={<CoursePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
