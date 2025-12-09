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
  const [hoveredId, setHoveredId] = useState(null); // State để xử lý hover

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

  // --- LOGIC CHUYỂN HƯỚNG QUAN TRỌNG ---
  const handleStartLearning = (subject) => {
    // Nếu là môn Mô phỏng (MP) -> Sang trang 6 chương luyện tập
    if (subject.code === 'MP') {
        navigate('/student/simulation');
    } else {
        // Các môn khác -> Sang trang danh sách bài học PDF
        navigate(`/student/subjects/${subject.code}`);
    }
  };

  // Hàm chọn Icon
  const getIcon = (code) => {
    const style = { fontSize: '32px', color: '#0050b3' };
    switch (code) {
      case "PL": return <SafetyCertificateOutlined style={style} />;
      case "DD": return <ReadOutlined style={style} />;
      case "CT": return <ToolOutlined style={style} />;
      case "KT": return <CarOutlined style={style} />;
      case "MP": return <DesktopOutlined style={style} />;
      default: return <PlayCircleFilled style={style} />;
    }
  };

  // Hàm chọn màu nền Gradient (CSS thuần)
  const getGradient = (code) => {
    switch (code) {
      case "PL": return "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"; // Xanh dương - Cyan
      case "DD": return "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)"; // Tím
      case "CT": return "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)"; // Hồng
      case "KT": return "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"; // Xanh lá
      case "MP": return "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"; // Cam
      default: return "linear-gradient(135deg, #64748b 0%, #475569 100%)"; // Xám
    }
  };

  // --- STYLES ---
  const styles = {
    container: {
      padding: "30px",
      background: "#f0f2f5",
      minHeight: "100vh",
    },
    headerTitle: {
        marginBottom: "30px",
        borderLeft: "5px solid #003a8c",
        paddingLeft: "15px",
    },
    titleText: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#333",
        textTransform: "uppercase",
        margin: 0
    },
    card: (isHovered) => ({
      background: "#fff",
      borderRadius: "12px",
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: isHovered ? "0 15px 30px rgba(0,0,0,0.15)" : "0 4px 10px rgba(0,0,0,0.05)",
      transform: isHovered ? "translateY(-5px)" : "translateY(0)",
      border: "1px solid #e0e0e0"
    }),
    cardHeader: (code) => ({
      background: getGradient(code),
      height: "110px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 15px",
      textAlign: "center",
      position: "relative"
    }),
    subjectName: {
      color: "#fff",
      fontSize: "18px",
      fontWeight: "bold",
      textTransform: "uppercase",
      lineHeight: "1.4",
      textShadow: "0 2px 4px rgba(0,0,0,0.2)"
    },
    iconWrapper: {
      width: "70px",
      height: "70px",
      background: "#fff",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "-35px auto 0 auto",
      position: "relative",
      zIndex: 1,
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      border: "4px solid #f0f2f5"
    },
    infoSection: {
      padding: "25px 20px 20px",
      display: "flex",
      justifyContent: "space-between",
      textAlign: "center"
    },
    number: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#333",
      marginBottom: "2px"
    },
    label: {
      fontSize: "12px",
      color: "#888",
      textTransform: "uppercase",
      fontWeight: "600",
      letterSpacing: "0.5px"
    },
    divider: {
      width: "1px",
      background: "#eee",
      height: "40px",
      alignSelf: "center"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerTitle}>
        <h2 style={styles.titleText}>Danh sách môn học</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {subjects.map((sub) => (
            <Col xs={24} md={12} xl={8} key={sub.id}>
              <div 
                style={styles.card(hoveredId === sub.id)}
                // 👇 Truyền cả object sub vào hàm xử lý
                onClick={() => handleStartLearning(sub)} 
                onMouseEnter={() => setHoveredId(sub.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 1. Header Màu Gradient */}
                <div style={styles.cardHeader(sub.code)}>
                  <div style={styles.subjectName}>{sub.name}</div>
                </div>

                {/* 2. Icon Tròn Nổi */}
                <div style={styles.iconWrapper}>
                  {getIcon(sub.code)}
                </div>

                {/* 3. Thông tin Số liệu */}
                <div style={styles.infoSection}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.number}>
                        {/* Số bài giả định, sau này có thể count từ DB */}
                        {sub.code === 'PL' ? 40 : (sub.code === 'MP' ? 120 : 15)}
                    </div> 
                    <div style={styles.label}>Số bài giảng</div>
                  </div>
                  
                  <div style={styles.divider}></div>

                  <div style={{ flex: 1 }}>
                    <div style={styles.number}>{sub.total_hours}h</div>
                    <div style={styles.label}>Thời lượng</div>
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
