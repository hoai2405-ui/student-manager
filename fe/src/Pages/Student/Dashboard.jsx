import React from "react";
import { Card, Row, Col, Typography, Avatar, Tag } from "antd";
import {
  BookOutlined,
  CarOutlined,
  ToolOutlined,
  LaptopOutlined,
  SafetyCertificateOutlined,
  UserOutlined, // Thay cho TrafficLight
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Component Card màu sắc (Custom Antd Card)
const DashboardCard = ({ title, value, total, color, icon }) => (
  <Card
    bordered={false}
    hoverable
    style={{
      background: color, // Màu nền
      color: "#fff",
      borderRadius: "8px",
      position: "relative",
      overflow: "hidden",
      height: "100%",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    }}
    bodyStyle={{ padding: "16px" }}
  >
    {/* Icon nền chìm */}
    <div
      style={{
        position: "absolute",
        right: "-10px",
        top: "-10px",
        fontSize: "80px",
        opacity: 0.2,
        color: "#fff",
        transform: "rotate(-10deg)",
      }}
    >
      {icon}
    </div>

    {/* Nội dung chính */}
    <div style={{ position: "relative", zIndex: 1 }}>
      <div
        style={{
          textTransform: "uppercase",
          fontSize: "12px",
          fontWeight: "bold",
          borderBottom: "1px solid rgba(255,255,255,0.3)",
          paddingBottom: "4px",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "32px", fontWeight: "bold" }}>
        {value}/{total}{" "}
        <span style={{ fontSize: "14px", fontWeight: "normal" }}>(câu)</span>
      </div>
      <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.9 }}>
        Đang học
      </div>
    </div>

    {/* Footer Link */}
    <div
      style={{
        marginTop: "12px",
        textAlign: "right",
        fontSize: "12px",
        cursor: "pointer",
        position: "relative",
        zIndex: 1,
      }}
    >
      Chi tiết ➔
    </div>
  </Card>
);

const Dashboard = () => {
  // Lấy dữ liệu an toàn
  const student = JSON.parse(localStorage.getItem("studentInfo")) || {};

  return (
    <div style={{ padding: "0" }}>
      {/* Tiêu đề */}
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <Title
          level={4}
          style={{ margin: 0, color: "#444", textTransform: "uppercase" }}
        >
          HỆ THỐNG HỌC LÝ THUYẾT LÁI XE TRỰC TUYẾN
        </Title>
      </Card>

      <Row gutter={[16, 16]}>
        {/* CỘT CÁC MÔN HỌC (Chiếm 2/3 màn hình trên Desktop) */}
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <DashboardCard
                title="Pháp luật GTĐB"
                value="0"
                total="600"
                color="#10b981" // emerald-500
                icon={<SafetyCertificateOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <DashboardCard
                title="Đạo đức người lái xe"
                value="0"
                total="20"
                color="#0284c7" // sky-600
                icon={<BookOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <DashboardCard
                title="Kỹ thuật lái xe"
                value="0"
                total="35"
                color="#059669" // emerald-600
                icon={<CarOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <DashboardCard
                title="Cấu tạo sửa chữa"
                value="0"
                total="30"
                color="#fbbf24" // amber-400
                icon={<ToolOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <DashboardCard
                title="Mô phỏng 120 tình huống"
                value="0"
                total="120"
                color="#4b5563" // gray-600
                icon={<LaptopOutlined />}
              />
            </Col>
          </Row>
        </Col>

        {/* CỘT THÔNG TIN HỌC VIÊN (Chiếm 1/3 màn hình) */}
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderLeft: "4px solid #1890ff",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", gap: "16px" }}>
              {/* Ảnh chân dung */}
              <Avatar
                shape="square"
                size={100}
                src={student.anh_chan_dung}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#f0f0f0", border: "1px solid #ddd" }}
              />

              {/* Thông tin chữ */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Title
                  level={4}
                  style={{ margin: "0 0 8px 0", color: "#cf1322" }}
                >
                  {student.ho_va_ten || "Học Viên"}
                </Title>
                <Text strong>
                  SBD: <Text type="secondary">{student.so_cmt || "---"}</Text>
                </Text>
                <Text strong>
                  Hạng:{" "}
                  <Text type="secondary">{student.hang_gplx || "B2"}</Text>
                </Text>
                <div style={{ marginTop: "8px" }}>
                  <Tag color="success">● Đang trực tuyến</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
