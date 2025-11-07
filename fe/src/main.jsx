import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/main.css";
import PrivateRoute from "./Components/PrivateRoute";
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
import SchedulePage from "./Pages/Schedule";

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
            <Route path="courses" element={<CoursePage />} />
            <Route path="students/new" element={<StudentsNew />} />
            <Route path="students" element={<Students />} />
            <Route path="stats" element={<StatsPage />} />
            <Route
              path="users"
              element={
                <PrivateRoute adminOnly={true}>
                  <UsersPage />
                </PrivateRoute>
              }
            />
            <Route path="schedules" element={<SchedulePage />} />
          </Route>
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
