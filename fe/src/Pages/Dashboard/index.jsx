import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Button, Typography, Space } from "antd";
import {
  UsergroupAddOutlined,
  BookOutlined,
  PlusOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import axios from "../../Common/axios";
import DashboardBanner from "./dashboardbanner";

const { Title, Text } = Typography;

export default function Dashboard() {
  const { user } = useAuth();
  const userInfo = user?.user;
  const [stats, setStats] = useState({ students: 0, courses: 0 });

  useEffect(() => {
    axios.get("/api/quick-stats").then((res) => setStats(res.data));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      {/* Banner Welcome + thời tiết, ngày giờ */}
      <DashboardBanner />

      {/* Thống kê nhanh */}
      <Row
        gutter={[16, 16]}
        justify="center"
        style={{ marginTop: 12, marginBottom: 16 }}
      >
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 14,
              background: "linear-gradient(90deg,#2196f3 60%,#fff 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px #0002",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<Text style={{ color: "#fff" }}>Tổng học viên</Text>}
              value={stats.students}
              prefix={
                <UsergroupAddOutlined style={{ color: "#fff", fontSize: 22 }} />
              }
              valueStyle={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 32,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 14,
              background: "linear-gradient(90deg,#673ab7 60%,#fff 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px #0002",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<Text style={{ color: "#fff" }}>Tổng khoá học</Text>}
              value={stats.courses}
              prefix={<BookOutlined style={{ color: "#fff", fontSize: 22 }} />}
              valueStyle={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 32,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 14,
              background: "linear-gradient(90deg,#ff9800 60%,#fff 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px #0002",
              minHeight: 114,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            bodyStyle={{ padding: 24, textAlign: "center" }}
          >
            <Button
              icon={<PlusOutlined />}
              type="primary"
              shape="round"
              size="large"
              style={{
                background: "#ff9800",
                border: "none",
                fontWeight: 600,
                fontSize: 17,
                minWidth: 140,
                letterSpacing: 0.5,
                boxShadow: "0 2px 10px #ff980032",
              }}
              onClick={() => (window.location.href = "/students/new")}
            >
              Thêm học viên mới
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Gợi ý sang trang thống kê */}
      <div style={{ textAlign: "center", margin: "32px 0 0 0" }}>
        <BarChartOutlined style={{ fontSize: 38, color: "#2196f3" }} />
        <div style={{ color: "#555", fontSize: 16, marginTop: 10 }}>
          Vào mục <b>Thống kê</b> để xem chi tiết trạng thái học viên!
        </div>
      </div>
    </div>
  );
}
