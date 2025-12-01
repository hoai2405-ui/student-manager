import React, { useEffect, useState } from "react";
import { Card, Typography, Row, Col, Button, Statistic, Space } from "antd";
import {
  BarChartOutlined,
  UserAddOutlined,
  TeamOutlined,
  BookOutlined,
  TrophyOutlined,
  RocketOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import axios from "../../Common/axios";

const { Title, Paragraph, Text } = Typography;

export default function DashboardBanner() {
  const [quickStats, setQuickStats] = useState({ students: 0, courses: 0 });
  const [weather, setWeather] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState([]);

  // Fetch quick statistics (BE: /api/quick-stats)
  useEffect(() => {
    axios.get("/api/quick-stats").then((res) => setQuickStats(res.data));
    axios.get("/api/stats").then((res) => setStats(res.data));
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

  const passRate = stats.length > 0 && quickStats.students > 0
    ? Math.round((stats.find(s => s.status === 'dat')?.count || 0) / quickStats.students * 100)
    : 0;

  return (
    <div className="dashboard-header">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 'var(--space-2xl)',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--space-2xl) var(--space-xl)',

      }}>
        {/* Welcome Content */}
        <div>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 2.5vw, 2.8rem)',
            fontWeight: 700,
            marginBottom: 'var(--space-lg)',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            fontFamily: 'Tahoma, sans-serif'
          }}>
            Chào mừng đến với<br />
            <span style={{ color: 'var(--accent-color)' }}>Hệ Thống Quản Lý Học Viên</span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-2xl)',
            lineHeight: 1.6,
            maxWidth: '600px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Quản lý và theo dõi học viên một cách chuyên nghiệp và hiệu quả với bảng điều khiển toàn diện, cập nhật thời gian thực và giao diện thân thiện với người dùng.
          </p>

          <div style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-2xl)'
          }}>
            <div className="card-admin" style={{
              background: 'var(--surface-bg)',
              border: '2px solid var(--accent-color)',
              color: 'var(--accent-color)',
              minWidth: '140px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg'
            }}>
              <div style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                marginBottom: 'var(--space-sm)',
                color: 'var(--accent-color)'
              }}>
                {quickStats.students}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <TeamOutlined style={{ marginRight: 'var(--space-xs)' }} />
                Học viên
              </div>
            </div>

            <div className="card-admin" style={{
              background: 'var(--surface-bg)',
              border: '2px solid var(--success-color)',
              color: 'var(--success-color)',
              minWidth: '140px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                marginBottom: 'var(--space-sm)',
                color: 'var(--success-color)'
              }}>
                {passRate}%
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <TrophyOutlined style={{ marginRight: 'var(--space-xs)' }} />
                Tỷ lệ đạt
              </div>
            </div>

            <div className="card-admin" style={{
              background: 'var(--surface-bg)',
              border: '2px solid var(--warning-color)',
              color: 'var(--warning-color)',
              minWidth: '140px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                marginBottom: 'var(--space-sm)',
                color: 'var(--warning-color)'
              }}>
                {quickStats.courses}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <BookOutlined style={{ marginRight: 'var(--space-xs)' }} />
                Khóa học
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <button
              className="btn-modern"
              onClick={() => window.location.href = '/students'}
              style={{ background: 'var(--accent-color)', border: 'none' }}
            >
              <UserAddOutlined />
              Quản lý học viên
            </button>

            <button
              className="btn-outline"
              onClick={() => window.location.href = '/schedule'}
            >
              📅 Xem lịch học
            </button>
          </div>
        </div>

        {/* Weather Widget */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="card-glass" style={{
            padding: 'var(--space-xl)',
            minWidth: '280px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated background elements */}
            <div className="animate-float" style={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontSize: 24,
              opacity: 0.6
            }}>
              {weather?.weathercode === 0 ? "☀️" : "⛅"}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-sm)',
                fontWeight: 600
              }}>
                {currentTime.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-lg)',
                fontFamily: 'monospace',
                letterSpacing: 2
              }}>
                {currentTime.toLocaleTimeString("vi-VN")}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                {weather ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <span style={{
                      fontSize: '2rem',
                      fontWeight: "bold",
                      color: 'var(--warning-color)'
                    }}>
                      {Math.round(weather.temperature)}°C
                    </span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500
                      }}>
                        {weather.weathercode === 0 ? "Nắng đẹp" : "Mây/Âm u"}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>
                        Gió {weather.windspeed} km/h
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                  }}>
                    🌤️ Đang tải thời tiết...
                  </div>
                )}
              </div>
            </motion.div>

            {/* Progress bar for day completion */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              style={{
                padding: 'var(--space-sm) 0',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440) * 100}%` }}
                transition={{ delay: 1.3, duration: 1 }}
                style={{
                  height: 6,
                  background: 'var(--gradient-primary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </motion.div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-xs)'
            }}>
              Tiến độ ngày: {Math.round(((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440) * 100)}%
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
