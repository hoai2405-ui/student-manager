import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Button, Typography, Progress, Tag } from "antd";
import {
  UsergroupAddOutlined,
  BookOutlined,
  PlusOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Column } from '@ant-design/charts';
import axios from "../../Common/axios";
import DashboardBanner from "./dashboardbanner";

const { Text } = Typography;

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0 });
  const [statusStats, setStatusStats] = useState([]);

  useEffect(() => {
    axios.get("/api/quick-stats").then((res) => setStats(res.data));
    axios.get("/api/stats").then((res) => {
      setStatusStats(res.data);
    });
  }, []);



  const passRate = stats.students > 0
    ? Math.round((statusStats.find(s => s.status === 'dat')?.count || 0) / stats.students * 100)
    : 0;

  return (
    <div className="app-container" style={{
      padding: '0',
      minHeight: '100vh',
      background: 'transparent'
    }}>
      {/* Banner Welcome + thời tiết, ngày giờ */}
      <DashboardBanner />

      {/* Container for content */}
      <div style={{
        
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 var(--space-xl) var(--space-2xl)'
      }}>
        {/* Thống kê nhanh */}
        <div className="dashboard-stats animate-stagger">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-color)' }}>
            <UsergroupAddOutlined style={{ fontSize: '2rem', marginRight: 'var(--space-sm)' }} />
            {stats.students}
          </div>
          <div className="stat-label">Tổng học viên</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success-color)' }}>
            <BookOutlined style={{ fontSize: '2rem', marginRight: 'var(--space-sm)' }} />
            {stats.courses}
          </div>
          <div className="stat-label">Tổng khóa học</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning-color)' }}>
            <TrophyOutlined style={{ fontSize: '2rem', marginRight: 'var(--space-sm)' }} />
            {passRate}%
          </div>
          <div className="stat-label">Tỷ lệ đạt</div>
          <Progress
            percent={passRate}
            strokeColor="var(--accent-color)"
            trailColor="var(--border-color)"
            showInfo={false}
            style={{ marginTop: 'var(--space-lg)' }}
          />
        </div>

        <div className="stat-card">
          <button
            className="btn-modern"
            onClick={() => (window.location.href = "/students/new")}
            style={{
              width: '100%',
              padding: 'var(--space-xl)',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginTop: 'var(--space-lg)'
            }}
          >
            <PlusOutlined style={{ fontSize: 24, marginRight: 'var(--space-sm)' }} />
            Thêm học viên mới
          </button>
        </div>
        </div>

        {/* Biểu đồ và thống kê chi tiết gộp lại */}
        <div className="dashboard-chart animate-fade-in-up">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-xl)',
          paddingBottom: 'var(--space-md)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <CheckCircleOutlined style={{ color: 'var(--success-color)', fontSize: 24 }} />
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Thống kê trạng thái học viên</h3>
        </div>

        {/* Thống kê trạng thái học viên */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-xl)',
          marginTop: 'var(--space-xl)'
        }}>
          {[
            { status: 'dat', label: 'Đạt', color: 'var(--success-color)', icon: <CheckCircleOutlined />, bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)', description: 'Học viên đã hoàn thành khóa học' },
            { status: 'chua thi', label: 'Chưa thi', color: 'var(--warning-color)', icon: <ClockCircleOutlined />, bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', description: 'Học viên chưa tham gia thi' },
            { status: 'vang', label: 'Vắng', color: 'var(--text-muted)', icon: <CloseCircleOutlined />, bg: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(100, 116, 139, 0.05) 100%)', description: 'Học viên vắng thi' },
            { status: 'rot', label: 'Rớt', color: 'var(--error-color)', icon: <CloseCircleOutlined />, bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', description: 'Học viên không đạt yêu cầu' }
          ].map((statusInfo, index) => {
            const stat = statusStats.find(s => s.status === statusInfo.status);
            const count = stat ? stat.count : 0;

            return (
              <div
                key={index}
                className="animate-fade-in-up card-admin"
                style={{
                  background: statusInfo.bg,
                  border: `2px solid ${statusInfo.color}30`,
                  animationDelay: `${index * 0.15}s`,
                  cursor: 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 'var(--radius-xl)',
                    background: statusInfo.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 28,
                    boxShadow: `0 8px 16px ${statusInfo.color}40`
                  }}>
                    {statusInfo.icon}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-xs)',
                      lineHeight: 1.2
                    }}>
                      {statusInfo.label}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.3
                    }}>
                      {statusInfo.description}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                  }}>
                    Số lượng
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: statusInfo.color,
                    textShadow: `0 2px 8px ${statusInfo.color}40`,
                    lineHeight: 1
                  }}>
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
