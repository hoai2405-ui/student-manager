import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Spin, Tag, Button } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ReadOutlined,
  CarOutlined,
  ToolOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu môn học
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/subjects")
      .then((res) => {
        setSubjects(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Hàm xác định màu sắc và Icon dựa trên Mã môn (Code) cho giống ảnh mẫu
  const getCardStyle = (code) => {
    switch (code) {
      case "PL": // Pháp luật
        return { bg: "#00c292", icon: <SafetyCertificateOutlined /> }; // Xanh lá
      case "DD": // Đạo đức
        return { bg: "#4099ff", icon: <ReadOutlined /> }; // Xanh dương
      case "CT": // Cấu tạo
        return { bg: "#ffc107", icon: <ToolOutlined />, text: "black" }; // Vàng
      case "KT": // Kỹ thuật
        return { bg: "#28a745", icon: <CarOutlined /> }; // Xanh lá đậm
      case "MP": // Mô phỏng
        return { bg: "#6c757d", icon: <DesktopOutlined /> }; // Xám
      default:
        return { bg: "#17a2b8", icon: <ReadOutlined /> };
    }
  };

  const handleGoToDetail = (id) => {
    navigate(`/student/subjects/${id}`);
  };

  // Card hiển thị thông tin từng môn
  const SubjectCard = ({ data }) => {
    const style = getCardStyle(data.code);
    const textColor = style.text === "black" ? "text-gray-800" : "text-white";

    // Giả lập giờ học hiện tại (Sau này bạn sẽ lấy từ DB bảng tracking)
    const learnedHours = 0;

    return (
      <div
        className="rounded-lg shadow-md overflow-hidden relative flex flex-col h-40"
        style={{ backgroundColor: style.bg }}
      >
        {/* Icon nền chìm */}
        <div
          className={`absolute right-2 top-2 text-7xl opacity-20 ${textColor}`}
        >
          {style.icon}
        </div>

        <div className={`p-4 ${textColor} flex-1`}>
          <h3 className="font-bold text-sm uppercase m-0 leading-tight pr-8">
            {data.name}
          </h3>

          <div className="mt-3">
            <div className="text-3xl font-bold flex items-baseline">
              {learnedHours}
              <span className="text-xl">/{data.total_hours} (h)</span>
            </div>
            <div className="text-xs font-semibold opacity-90 mt-1">
              Chưa hoàn thành
            </div>
          </div>
        </div>

        {/* Footer Card */}
        <div
          onClick={() => handleGoToDetail(data.id)}
          className="bg-black/10 py-2 px-4 cursor-pointer hover:bg-black/20 transition flex justify-between items-center text-xs font-bold text-white"
        >
          <span>Chi tiết bài giảng</span>
          <ArrowRightOutlined />
        </div>
      </div>
    );
  };

  return (
    <div className="p-0">
      <div className="bg-white p-4 mb-6 rounded shadow-sm text-center">
        <h2 className="text-xl font-bold text-gray-700 uppercase m-0">
          HỆ THỐNG HỌC LÝ THUYẾT LÁI XE TRỰC TUYẾN | E-LEARNING DRIVING
        </h2>
      </div>

      {loading ? (
        <div className="text-center p-10">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {/* Render 5 môn học từ DB */}
          {subjects.map((sub) => (
            <Col xs={24} md={12} lg={8} key={sub.id}>
              <SubjectCard data={sub} />
            </Col>
          ))}

          {/* Render Card Kết quả (Card màu đỏ cuối cùng giống ảnh) */}
          <Col xs={24} md={12} lg={8}>
            <div className="rounded-lg shadow-md overflow-hidden relative flex flex-col h-40 bg-[#dc3545]">
              <div className="absolute right-2 top-2 text-7xl opacity-20 text-white">
                <ReadOutlined />
              </div>
              <div className="p-4 text-white flex-1">
                <h3 className="font-bold text-sm uppercase m-0">Kết quả</h3>
                <div className="mt-3">
                  <div className="text-2xl font-bold">Chưa hoàn thành</div>
                  <div className="text-xs opacity-90 mt-1">
                    Bạn cần hoàn thành tất cả các môn học
                  </div>
                </div>
              </div>
              <div className="bg-black/10 py-2 px-4 cursor-pointer hover:bg-black/20 transition flex justify-between items-center text-xs font-bold text-white">
                <span>Kết quả học cuối cùng</span>
                <ArrowRightOutlined />
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* Phần tiện ích và thông tin bên dưới (Giữ nguyên hoặc custom thêm) */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={16}>
          {/* Bạn có thể thêm phần các nút Tiện ích vào đây cho giống ảnh */}
          <div className="bg-white p-4 rounded shadow-sm border h-full">
            <h4 className="font-bold text-gray-600 border-b pb-2 mb-4">
              🛠 TIỆN ÍCH
            </h4>
            <Button block className="mb-2 text-left">
              🎧 HỌC THEO GIÁO TRÌNH
            </Button>
            <Button block className="mb-2 text-left">
              ❓ ÔN TẬP
            </Button>
            <Button block className="mb-2 text-left" danger>
              🏷 QUY CHẾ
            </Button>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="bg-white p-4 rounded shadow-sm border h-full">
            <h4 className="font-bold text-gray-600 border-b pb-2 mb-4">
              ℹ THÔNG TIN CỦA TÔI
            </h4>
            {/* Lấy thông tin từ localStorage hiển thị vào đây */}
            <p>Học viên: ...</p>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;
