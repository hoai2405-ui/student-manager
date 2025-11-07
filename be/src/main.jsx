import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/main.css";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./Pages/Auth/Login";
import AdminLayout from "./Layout/AdminLayout";
import UsersPage from "./Pages/Users/Users";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Students from "./Pages/Students/index";
import StatsPage from "./Pages/Students/state";
import CoursePage from "./Pages/Students/CoursePage";
import StudentsNew from "./Pages/Students/createStudent";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./Pages/Dashboard/index";
import { useAuth } from "./contexts/AuthContext"
import { ROUTES_PATH } from "./Common/constants";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path={ROUTES_PATH.COURSES.slice(1)} element={<Courses />} />
            <Route path="students/new" element={<StudentsNew />} />
            <Route
              path={ROUTES_PATH.STUDENTS.slice(1)}
              element={<Students />}
            />
            <Route path={ROUTES_PATH.STATS.slice(1)} element={<Stats />} />
            <Route path="users" element={<UsersPage />} />
            {/* Trang Users chỉ dành cho Admin */}
            <Route
              path={ROUTES_PATH.USERS.slice(1)}
              element={
                <PrivateRoute adminOnly>
                  <Users />
                </PrivateRoute>
              }
            />
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
