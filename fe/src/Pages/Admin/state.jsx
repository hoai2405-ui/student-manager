import { useEffect, useState } from "react";
import { Table, Card, Spin, Row, Col, Statistic, Progress, Tag } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "../../Common/axios";
import { BookOutlined, UserOutlined, TeamOutlined, TrophyOutlined, ClockCircleOutlined } from "@ant-design/icons";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/learning-stats").then((res) => {
      setStats(res.data);
      setLoading(false);
    }).catch((err) => {
      console.error("Error loading learning stats:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Không thể tải dữ liệu thống kê</p>
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho biểu đồ tiến độ môn học
  const subjectProgressData = stats.subject_progress?.map(subject => ({
    name: subject.subject_name,
    code: subject.code,
    totalLessons: subject.total_lessons || 0,
    completedLessons: subject.completed_lessons || 0,
    learnedHours: Math.round(subject.total_learned_hours * 10) / 10,
    completionRate: Math.round(subject.avg_completion_rate || 0),
  })) || [];

  // Chuẩn bị dữ liệu cho biểu đồ khóa học
  const courseStatsData = stats.course_stats?.map(course => ({
    name: course.ten_khoa_hoc,
    students: course.total_students || 0,
    passed: course.passed_students || 0,
    failed: course.failed_students || 0,
    avgHours: Math.round((course.avg_study_hours || 0) * 10) / 10,
  })) || [];

  // Cột cho bảng học viên
  const studentColumns = [
    {
      title: 'Họ tên',
      dataIndex: 'ho_va_ten',
      key: 'ho_va_ten',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'CCCD',
      dataIndex: 'so_cmt',
      key: 'so_cmt',
    },
    {
      title: 'Hạng GPLX',
      dataIndex: 'hang_gplx',
      key: 'hang_gplx',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Giờ đã học',
      dataIndex: 'learned_hours',
      key: 'learned_hours',
      render: (hours) => `${Math.round(hours * 10) / 10}h`,
      sorter: (a, b) => b.learned_hours - a.learned_hours,
    },
    {
      title: 'Môn đã bắt đầu',
      dataIndex: 'subjects_started',
      key: 'subjects_started',
      render: (count, record) => `${count}/${record.total_subjects}`,
    },
  ];

  // Cột cho bảng môn học
  const subjectColumns = [
    {
      title: 'Môn học',
      dataIndex: 'subject_name',
      key: 'subject_name',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.code}</div>
        </div>
      )
    },
    {
      title: 'Bài giảng',
      dataIndex: 'total_lessons',
      key: 'total_lessons',
      render: (total, record) => `${record.completed_lessons || 0}/${total}`,
    },
    {
      title: 'Giờ đã học',
      dataIndex: 'total_learned_hours',
      key: 'total_learned_hours',
      render: (hours) => `${Math.round(hours * 10) / 10}h`,
    },
    {
      title: 'Tỷ lệ hoàn thành',
      dataIndex: 'avg_completion_rate',
      key: 'avg_completion_rate',
      render: (rate) => (
        <Progress
          percent={Math.round(rate || 0)}
          size="small"
          status={rate >= 80 ? 'success' : rate >= 50 ? 'active' : 'exception'}
        />
      ),
    },
  ];

  // Cột cho bảng khóa học
  const courseColumns = [
    {
      title: 'Tên khóa học',
      dataIndex: 'ten_khoa_hoc',
      key: 'ten_khoa_hoc',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.ma_khoa_hoc} - {record.hang_gplx}</div>
        </div>
      )
    },
    {
      title: 'Số học viên',
      dataIndex: 'total_students',
      key: 'total_students',
    },
    {
      title: 'Đạt',
      dataIndex: 'passed_students',
      key: 'passed_students',
      render: (passed, record) => (
        <span style={{ color: '#52c41a' }}>{passed}</span>
      ),
    },
    {
      title: 'Rớt',
      dataIndex: 'failed_students',
      key: 'failed_students',
      render: (failed) => (
        <span style={{ color: '#ff4d4f' }}>{failed}</span>
      ),
    },
    {
      title: 'TB giờ học',
      dataIndex: 'avg_study_hours',
      key: 'avg_study_hours',
      render: (hours) => `${hours}h`,
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "32px", fontSize: "28px", fontWeight: "bold" }}>
        📊 Thống kê học tập
      </h1>

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: "32px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng học viên"
              value={stats.overview?.total_students || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng khóa học"
              value={stats.overview?.total_courses || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng môn học"
              value={stats.overview?.total_subjects || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng bài giảng"
              value={stats.overview?.total_lessons || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      

      {/* Bảng chi tiết */}
      <Row gutter={[16, 16]} style={{ marginTop: "32px" }}>
        <Col xs={24}>
          <Card title="👨‍🎓 Top học viên tích cực" style={{ marginBottom: "16px" }}>
            <Table
              dataSource={stats.student_progress || []}
              columns={studentColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="📖 Tiến độ môn học chi tiết">
            <Table
              dataSource={stats.subject_progress || []}
              columns={subjectColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="🏫 Thống kê khóa học chi tiết">
            <Table
              dataSource={stats.course_stats || []}
              columns={courseColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
