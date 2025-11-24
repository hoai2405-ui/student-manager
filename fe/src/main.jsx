import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/main.css";
import PrivateRoute from "./Components/PrivateRoute";
import ErrorBoundary from "./Components/ErrorBoundary";
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
import CreateSchedule from "./Pages/Schedule/CreateSchedule";
import RegisterSchedule from "./Pages/Schedule/RegisterSchedule";
import RegisteredSchedules from "./Pages/Schedule/RegisteredSchedules";
import StudentsXML from "./Pages/Students/StudentsXML";

// Component to redirect to schedules page
function RedirectToSchedules() {
  React.useEffect(() => {
    window.location.href = '/schedules';
  }, []);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
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
              <Route path="schedules/register/:scheduleId" element={<RegisterSchedule />} />
              <Route path="registered-schedules" element={<RegisteredSchedules />} />
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
