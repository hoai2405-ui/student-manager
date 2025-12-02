import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { QuestionCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";

const { Title } = Typography;

const StudentMyCourses = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách môn học từ Database
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
    // Chuyển sang trang danh sách bài học (StudentCourseDetail)
    navigate(`/student/subjects/${subjectId}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-700 mb-6 uppercase border-l-4 border-blue-600 pl-3">
        Môn học của tôi
      </h2>

      {loading ? (
        <div className="text-center p-10">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {subjects.map((sub) => (
            <Col xs={24} sm={12} md={8} lg={8} key={sub.id}>
              {/* --- CARD MÔN HỌC (STYLE MÀU TÍM XANH) --- */}
              <div
                className="rounded-xl p-5 relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Màu tím xanh gradient
                  minHeight: "220px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onClick={() => handleStartLearning(sub.id)}
              >
                {/* Icon nền chìm */}
                <div className="absolute -right-4 top-10 text-9xl opacity-10 text-white transform rotate-12 group-hover:scale-110 transition-transform">
                  <QuestionCircleOutlined />
                </div>

                {/* Nội dung trên */}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-base uppercase border-b border-white/30 pb-2 mb-3 leading-snug">
                    {sub.name}
                  </h3>

                  <div className="flex items-baseline gap-1 text-white">
                    <span className="text-4xl font-bold">0/20</span>
                    <span className="text-sm font-normal opacity-80">
                      (bài)
                    </span>
                  </div>

                  <p className="text-white/80 text-sm mt-1">Chưa bắt đầu</p>
                </div>

                {/* Nút vào học ở dưới */}
                <div className="relative z-10 text-right mt-4">
                  <span className="text-white font-bold text-sm inline-flex items-center gap-2 group-hover:underline">
                    Vào học ngay <ArrowRightOutlined />
                  </span>
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
