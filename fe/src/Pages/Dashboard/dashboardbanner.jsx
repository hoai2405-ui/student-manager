import React, { useEffect, useState } from "react";
import { Card, Typography, Row, Col, Button, Statistic, Space } from "antd";
import {
  SmileOutlined,
  BarChartOutlined,
  UserAddOutlined,
  TeamOutlined,
  BookOutlined,
} from "@ant-design/icons";
import axios from "../../Common/axios";

const { Title, Paragraph, Text } = Typography;

export default function DashboardBanner() {
  const [quickStats, setQuickStats] = useState({ students: 0, courses: 0 });
  const [weather, setWeather] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch quick statistics (BE: /api/quick-stats)
  useEffect(() => {
    axios.get("/api/quick-stats").then((res) => setQuickStats(res.data));
  }, []);

  // Auto update clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather (Hà Nội fallback)
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

  // Responsive card style
  const cardStyle = {
    borderRadius: 16,
    background: "linear-gradient(100deg,#3f7afc 0%,#49e2fc 100%)",
    color: "#fff",
    marginBottom: 32,
    boxShadow: "0 8px 32px #0001",
  };

  const bannerColStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    minHeight: 220,
  };

  return (
    <Card style={cardStyle} bodyStyle={{ padding: 20, minHeight: 200 }}>
      <Row
        gutter={[24, 24]}
        align="middle"
        justify="space-between"
        style={{ flexWrap: "wrap-reverse" }}
      >
        <Col xs={24} md={16} style={bannerColStyle}>
          <Title
            level={3}
            style={{
              color: "#fff",
              marginBottom: 8,
              fontWeight: 700,
              textShadow: "0 4px 16px #0002",
              fontSize: "1.5rem",
            }}
          >
            🎉 Chào mừng bạn đến với Hệ Thống Quản Trị Học Viên Hoàng Thịnh!
          </Title>
          <Paragraph
            style={{ fontSize: 16, color: "#f5f6fa", marginBottom: 12 }}
          >
            <BarChartOutlined style={{ color: "#ffdf00" }} />{" "}
            <b>Xem thống kê chi tiết</b>,
            <UserAddOutlined style={{ color: "#ffdf00", marginLeft: 8 }} />{" "}
            <b>Quản lý học viên dễ dàng</b>.
            <br />
            <SmileOutlined style={{ color: "#ffdf00" }} /> Dashboard hiện đại,
            chuyên nghiệp.
          </Paragraph>
          <Space size={16} style={{ margin: "8px 0 16px 0", flexWrap: "wrap" }}>
            <Statistic
              title={<Text style={{ color: "#fff" }}>Tổng học viên</Text>}
              value={quickStats.students}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#fff", fontWeight: 600 }}
              style={{
                minWidth: 120,
                background: "rgba(0,0,0,0.12)",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            />
            <Statistic
              title={<Text style={{ color: "#fff" }}>Tổng khoá học</Text>}
              value={quickStats.courses}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#fff", fontWeight: 600 }}
              style={{
                minWidth: 120,
                background: "rgba(0,0,0,0.12)",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            />
          </Space>
          <Button
            type="primary"
            size="large"
            style={{
              background: "#062bf3",
              borderRadius: 8,
              marginTop: 4,
              boxShadow: "0 4px 24px #0002",
              fontWeight: 600,
              fontSize: 16,
              width: 220,
              maxWidth: "100%",
            }}
            href="/students"
          >
            Quản lý học viên ngay
          </Button>
        </Col>
        <Col xs={24} md={8} style={{ textAlign: "center", marginTop: 8 }}>
          {/* Thời tiết + đồng hồ */}
          <div
            style={{
              background: "rgba(0,0,0,0.15)",
              borderRadius: 16,
              padding: 18,
              minWidth: 180,
              margin: "auto",
            }}
          >
            <div
              style={{
                fontSize: 15,
                color: "#fff",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              <b>
                {currentTime.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </b>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#fff",
                marginBottom: 12,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              {currentTime.toLocaleTimeString("vi-VN")}
            </div>
            <div>
              {weather ? (
                <>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: "bold",
                      color: "#ffdf00",
                    }}
                  >
                    {Math.round(weather.temperature)}°C
                  </span>
                  <span style={{ fontSize: 15, color: "#fff" }}>
                    {" "}
                    · {weather.weathercode === 0 ? "Nắng đẹp" : "Mây/Âm u"}{" "}
                  </span>
                  <br />
                  <span style={{ fontSize: 13, color: "#bff" }}>
                    Gió {weather.windspeed} km/h
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 16, color: "#fff" }}>
                  Không thể lấy thời tiết...
                </span>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
