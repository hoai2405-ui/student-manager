import React, { useEffect, useState } from "react";
import { Card, Progress, Table, Tag, Spin, Row, Col, Statistic, Calendar, Badge } from "antd";
import { ClockCircleOutlined, BookOutlined, TrophyOutlined, CalendarOutlined } from "@ant-design/icons";
import axios from "../../Common/axios";
import { useAuth } from "../../contexts/AuthContext";

const API = "http://localhost:3001";

export default function StudentProgress() {
  console.log("🎯 Progress component is loading!");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState([]);
  const [summary, setSummary] = useState(null);

  // Get student info from localStorage (same as Dashboard)
  const localStudent = JSON.parse(localStorage.getItem("studentInfo"));
  const currentUser = localStudent || user;

  console.log("Progress: localStudent =", localStudent);
  console.log("Progress: user =", user);
  console.log("Progress: currentUser =", currentUser);

  useEffect(() => {
    console.log("Progress useEffect: currentUser?.id =", currentUser?.id);
    if (!currentUser?.id) {
      console.log("Progress: No user ID, setting empty data");
      setDashboardData([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Progress: Making API calls for user", currentUser.id);

    // Handle API calls with fallbacks (similar to Learning component)
    const dashboardReq = axios.get(`${API}/api/student/dashboard/${currentUser.id}`)
      .catch((error) => {
        console.warn("Dashboard API failed:", error.message);
        return { data: [] }; // Fallback empty data
      });

    const summaryReq = axios.get(`${API}/api/student/summary/${currentUser.id}`)
      .catch((error) => {
        console.warn("Summary API failed:", error.message);
        return { data: null }; // Fallback null data
      });

    Promise.all([dashboardReq, summaryReq])
      .then(([dashboardRes, summaryRes]) => {
        console.log("Progress: API calls completed (with fallbacks)");
        setDashboardData(dashboardRes.data || []);
        setSummary(summaryRes.data);
      })
      .finally(() => {
        console.log("Progress: Setting loading to false");
        setLoading(false);
      });
  }, [currentUser?.id]);

  const subjectColumns = [
    {
      title: 'Môn học',
      dataIndex: 'subject_name',
      key: 'subject_name',
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">{record.code}</div>
        </div>
      )
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (record) => (
        <div className="w-full">
          <Progress
            percent={record.required_hours > 0 ? Math.min((record.learned_hours / record.required_hours) * 100, 100) : 0}
            size="small"
            strokeColor="#10b981"
          />
          <div className="text-xs text-gray-600 mt-1">
            {Number(record.learned_hours || 0).toFixed(1)} / {record.required_hours}h
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record) => {
        const percent = record.required_hours > 0 ? (record.learned_hours / record.required_hours) * 100 : 0;
        if (percent >= 100) {
          return <Tag color="green">Hoàn thành</Tag>;
        } else if (percent >= 50) {
          return <Tag color="blue">Đang học</Tag>;
        } else {
          return <Tag color="orange">Bắt đầu</Tag>;
        }
      }
    }
  ];



  if (loading) {
    return <Spin className="mt-20 block text-center" size="large" />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Tiến độ học tập</h1>

        {/* Thống kê tổng quan */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng giờ đã học"
                value={summary?.total_learned?.toFixed(1) || 0}
                suffix="giờ"
                valueStyle={{ color: '#10b981' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng giờ yêu cầu"
                value={summary?.total_required || 0}
                suffix="giờ"
                valueStyle={{ color: '#3b82f6' }}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tiến độ chung"
                value={summary?.progress || 0}
                suffix="%"
                valueStyle={{ color: summary?.progress >= 100 ? '#10b981' : '#f59e0b' }}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Môn đã hoàn thành"
                value={dashboardData.filter(s => s.learned_hours >= s.required_hours).length}
                suffix={`/${dashboardData.length}`}
                valueStyle={{ color: '#8b5cf6' }}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Progress bar tổng quan */}
        <Card className="mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Tiến độ tổng thể</h3>
            <Progress
              percent={summary?.progress || 0}
              strokeColor="#10b981"
              size="large"
              status={summary?.progress >= 100 ? 'success' : 'active'}
            />
          </div>
        </Card>

        {/* Chi tiết từng môn học */}
        <Card title="Chi tiết môn học" className="mb-6">
          <Table
            dataSource={dashboardData}
            columns={subjectColumns}
            rowKey="subject_id"
            pagination={false}
            size="small"
          />
        </Card>

        {/* Lịch học và thống kê */}
        <Row gutter={[16, 16]}>
         
          <Col xs={24} lg={12}>
            <Card title="Thống kê học tập" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Môn học tích cực nhất:</span>
                  <Tag color="blue">
                    {dashboardData.reduce((max, curr) =>
                      curr.learned_hours > (max?.learned_hours || 0) ? curr : max,
                      null
                    )?.subject_name || 'Chưa có'}
                  </Tag>
                </div>
                <div className="flex justify-between items-center">
                  <span>Môn cần chú ý:</span>
                  <Tag color="orange">
                    {dashboardData
                      .filter(s => s.learned_hours < s.required_hours)
                      .sort((a, b) => (a.required_hours - a.learned_hours) - (b.required_hours - b.learned_hours))[0]
                      ?.subject_name || 'Không có'}
                  </Tag>
                </div>
                <div className="flex justify-between items-center">
                  <span>Thời gian học trung bình/ngày:</span>
                  <span className="font-semibold">
                    {summary?.total_learned ? (summary.total_learned / 30).toFixed(1) : 0} giờ
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Hạng GPLX:</span>
                  <Tag color="purple">{summary?.hang_gplx || 'Chưa xác định'}</Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
