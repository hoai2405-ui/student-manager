import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import CoursePage from "../Pages/Students/CoursePage";

import StatsPage from "../Pages/Students/state";
import Students from "../Pages/Students/index";

export default function Router() {
  return (
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
      </nav>
      <Routes>
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/students" element={<Students />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<CoursePage />} /> {/* route mặc định */}
      </Routes>
    </div>
  );
}
