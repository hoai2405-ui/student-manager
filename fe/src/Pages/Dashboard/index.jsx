import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Button, Typography, Space, Divider, Table } from "antd";
import { useNavigate } from "react-router-dom";
import {
  UsergroupAddOutlined,
  BookOutlined,
  PlusOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  CloudOutlined,
  SunOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import axios from "../../Common/axios";

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, courses: 0, lessons: 0, schedules: 0 });
  const [weather, setWeather] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const userInfo = user?.user ?? user;

  useEffect(() => {
    axios.get("/api/quick-stats").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  // Auto update clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather
  useEffect(() => {
    function fetchWeather(lat, lon) {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
      )
        .then((res) => res.json())
        .then((data) => setWeather(data.current_weather))
        .catch(() => setWeather(null));
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(21.0285, 105.8542), // Hà Nội
        { timeout: 3000 }
      );
    } else {
      fetchWeather(21.0285, 105.8542);
    }
  }, []);

  // Determine weather icon
  const getWeatherIcon = () => {
    if (!weather) return null;
    if (weather.weathercode === 0) return <SunOutlined style={{ color: "#faad14", fontSize: 24 }} />;
    if ([1, 2, 3].includes(weather.weathercode)) return <CloudOutlined style={{ color: "#999", fontSize: 24 }} />;
    return <CloseCircleOutlined style={{ color: "#1890ff", fontSize: 24 }} />;
  };

  const getWeatherText = () => {
    if (!weather) return "Không thể lấy thời tiết";
    if (weather.weathercode === 0) return "Nắng đẹp";
    if ([1, 2, 3].includes(weather.weathercode)) return "Mây";
    return "Mưa";
  };

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Welcome Banner with Weather */}
      <Card
        style={{
          borderRadius: "8px",
          border: "1px solid #e8e8e8",
          background: "#fff",
          marginBottom: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Title level={3} style={{ margin: 0, color: "#262626", fontWeight: 600 }}>
              Xin chào, {userInfo?.username || "Quản trị viên"}
            </Title>
            <Paragraph style={{ color: "#8c8c8c", fontSize: "14px", marginTop: "8px", margin: "8px 0 0 0" }}>
              Đây là bảng điều khiển quản lý hệ thống học viên
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "16px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "#8c8c8c", fontWeight: 500 }}>
                  {currentTime.toLocaleDateString("vi-VN", {
                    weekday: "short",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#262626", fontFamily: "monospace" }}>
                  {currentTime.toLocaleTimeString("vi-VN")}
                </div>
              </div>
              <Divider type="vertical" style={{ height: "40px", margin: 0 }} />
              <div style={{ textAlign: "center" }}>
                <div>{getWeatherIcon()}</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#262626", marginTop: "4px" }}>
                  {weather ? `${Math.round(weather.temperature)}°C` : "N/A"}
                </div>
                <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                  {getWeatherText()}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Stats Cards - Classic Style */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        {/* Total Students */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "20px" }}
            hoverable
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text style={{ color: "#8c8c8c", fontSize: "12px", fontWeight: 500 }}>
                  TỔNG HỌC VIÊN
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <Title level={3} style={{ margin: 0, color: "#262626", fontWeight: 700 }}>
                    {stats.students}
                  </Title>
                </div>
              </div>
              <div
                style={{
                  background: "#e6f7ff",
                  padding: "10px",
                  borderRadius: "6px",
                  color: "#1890ff",
                }}
              >
                <UsergroupAddOutlined style={{ fontSize: "24px" }} />
              </div>
            </div>
          </Card>
        </Col>

        {/* Total Courses */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "20px" }}
            hoverable
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text style={{ color: "#8c8c8c", fontSize: "12px", fontWeight: 500 }}>
                  TỔNG KHOÁ HỌC
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <Title level={3} style={{ margin: 0, color: "#262626", fontWeight: 700 }}>
                    {stats.courses}
                  </Title>
                </div>
              </div>
              <div
                style={{
                  background: "#f6f0ff",
                  padding: "10px",
                  borderRadius: "6px",
                  color: "#722ed1",
                }}
              >
                <BookOutlined style={{ fontSize: "24px" }} />
              </div>
            </div>
          </Card>
        </Col>

        {/* Total Lessons */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "20px" }}
            hoverable
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text style={{ color: "#8c8c8c", fontSize: "12px", fontWeight: 500 }}>
                  TỔNG BÀI GIẢNG
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <Title level={3} style={{ margin: 0, color: "#262626", fontWeight: 700 }}>
                    {stats.lessons || 0}
                  </Title>
                </div>
              </div>
              <div
                style={{
                  background: "#fffbe6",
                  padding: "10px",
                  borderRadius: "6px",
                  color: "#d48806",
                }}
              >
                <FileTextOutlined style={{ fontSize: "24px" }} />
              </div>
            </div>
          </Card>
        </Col>

        {/* Total Schedules */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "20px" }}
            hoverable
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text style={{ color: "#8c8c8c", fontSize: "12px", fontWeight: 500 }}>
                  LỊCH HỌC
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <Title level={3} style={{ margin: 0, color: "#262626", fontWeight: 700 }}>
                    {stats.schedules || 0}
                  </Title>
                </div>
              </div>
              <div
                style={{
                  background: "#f0f5ff",
                  padding: "10px",
                  borderRadius: "6px",
                  color: "#1890ff",
                }}
              >
                <CalendarOutlined style={{ fontSize: "24px" }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24}>
          <Card
            style={{
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <Title level={4} style={{ margin: "0 0 16px 0", color: "#262626", fontWeight: 600 }}>
              Tác vụ nhanh
            </Title>
            <Space size="large" wrap>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                style={{
                  background: "#1890ff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/admin/students")}
              >
                Thêm học viên
              </Button>
              <Button
                icon={<BookOutlined />}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: "4px",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/admin/courses")}
              >
                Quản lý khoá học
              </Button>
              <Button
                icon={<BarChartOutlined />}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: "4px",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/admin/stats")}
              >
                Xem thống kê
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

     
    
    </div>
  );
}
