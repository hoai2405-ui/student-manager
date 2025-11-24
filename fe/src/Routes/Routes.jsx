import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CoursePage from "../Pages/Students/CoursePage";
import SchedulePage from "../Pages/Schedule";
import RegisteredSchedules from "../Pages/Schedule/RegisteredSchedules";
import StudentsXML from "../Pages/Students/StudentsXML";
import StatsPage from "../Pages/Students/state";
import Students from "../Pages/Students/index";
import UsersPage from "../Pages/Users/Users";
import PrivateRoute from "../Components/PrivateRoute";
import { useAuth } from "../contexts/AuthContext";

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
      <Link className="nav-link" to="/courses">
        Khóa học
      </Link>

      {/* Dropdown Học viên */}
      <div style={{ position: "relative", zIndex: 10000 }}>
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
            textDecoration: "none",
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
            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px", textAlign: "center" }}>
              Chọn loại học viên:
            </div>
            <Link
              to="/students"
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
              to="/students-xml"
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

      <Link className="nav-link" to="/registered-schedules">
        Lịch học đã đăng ký
      </Link>
    </nav>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <div className="container mt-4">
        <Navigation />
        <Routes>
          <Route path="/courses" element={<CoursePage />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students-xml" element={<StudentsXML />} />
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
          <Route
            path="/registered-schedules"
            element={<RegisteredSchedules />}
          />
          <Route path="*" element={<CoursePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
