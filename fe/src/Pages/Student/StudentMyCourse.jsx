import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ReadOutlined,
  CarOutlined,
  ToolOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";

const StudentMyCourses = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách môn học
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/subjects")
      .then((res) => {
        setSubjects(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        message.error("Lỗi tải danh sách môn học");
        setLoading(false);
      });
  }, []);

  const handleStartLearning = (subjectId) => {
    navigate(`/student/subjects/${subjectId}`);
  };

  // Hàm chọn Icon theo mã môn
  const getIcon = (code) => {
    switch (code) {
      case "PL":
        return <SafetyCertificateOutlined />;
      case "DD":
        return <ReadOutlined />;
      case "CT":
        return <ToolOutlined />;
      case "KT":
        return <CarOutlined />;
      case "MP":
        return <DesktopOutlined />;
      default:
        return <PlayCircleFilled />;
    }
  };

  // Hàm chọn màu nền gradient cho header theo mã môn
  const getTheme = (code) => {
    switch (code) {
      case "PL":
        return "bg-gradient-to-r from-blue-500 to-cyan-500"; // Xanh dương cho Pháp luật
      case "DD":
        return "bg-gradient-to-r from-purple-500 to-indigo-500"; // Tím cho Đạo đức
      case "CT":
        return "bg-gradient-to-r from-pink-400 to-rose-400"; // Hồng cam cho Cấu tạo
      case "KT":
        return "bg-gradient-to-r from-green-400 to-teal-400"; // Xanh lá cho Kỹ thuật
      case "MP":
        return "bg-gradient-to-r from-yellow-400 to-orange-400"; // Vàng cam cho Mô phỏng
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"; // Mặc định
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-[#003a8c] pl-3 uppercase">
          Danh sách môn học
        </h2>
      </div>

      {loading ? (
        <div className="text-center p-20">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {subjects.map((sub) => (
            <Col xs={24} md={12} key={sub.id}>
              {/* --- CARD DESIGN --- */}
              <div
                onClick={() => handleStartLearning(sub.id)}
                className={`group bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 active:scale-95 active:shadow-inner duration-150`}
              >
                {/* 1. Phần Header Màu (Gradient riêng cho từng môn) */}
                <div
                  className={`h-28 flex items-center justify-center px-4 relative group-hover:opacity-90 transition-opacity ${getTheme(
                    sub.code
                  )}`}
                >
                  <h3 className="text-white font-bold text-lg text-center uppercase m-0 leading-snug">
                    {sub.name}
                  </h3>
                </div>

                {/* 2. Phần Icon Tròn (Nổi ở giữa) */}
                <div className="flex justify-center -mt-8 relative z-10">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-[#0050b3] text-3xl border-4 border-gray-50 group-hover:scale-110 transition-transform duration-300">
                    {getIcon(sub.code)}
                  </div>
                </div>

                {/* 3. Phần Thông tin (Chữ đen nền trắng) */}
                <div className="pt-4 pb-6 px-6">
                  <div className="flex justify-between items-center divide-x divide-gray-200">
                    {/* Cột Số bài giảng (Giả định hoặc lấy từ DB nếu có) */}
                    <div className="flex-1 text-center pr-2">
                      <div className="text-2xl font-bold text-gray-700 group-hover:text-[#0050b3] transition-colors">
                        20
                      </div>
                      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">
                        Số bài giảng
                      </div>
                    </div>

                    {/* Cột Thời lượng */}
                    <div className="flex-1 text-center pl-2">
                      <div className="text-2xl font-bold text-gray-700 group-hover:text-[#0050b3] transition-colors">
                        {sub.total_hours}h
                      </div>
                      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">
                        Thời lượng
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default StudentMyCourses;
