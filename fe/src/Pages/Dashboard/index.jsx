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
      background: 'var(--surface-secondary)'
    }}>
      {/* Banner Welcome + thời tiết, ngày giờ */}
      <DashboardBanner />

      {/* Container for content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--space-2xl) var(--space-xl)'
      }}>

      </div>
    </div>
  );
}
