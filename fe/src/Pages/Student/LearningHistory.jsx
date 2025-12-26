import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Progress, Space, Spin, Table, Tag, Typography, message } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "../../Common/axios";

const { Title } = Typography;

export default function LearningHistory() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/student/learning-history");
        setRows(res.data || []);
      } catch (e) {
        message.error(e?.response?.data?.message || "Lỗi tải lịch sử học");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const data = useMemo(() => {
    return (rows || []).map((r, idx) => {
      const durationMinutes = Number(r.duration_minutes || 45);
      const learnedSeconds = Number(r.learned_seconds || 0);
      const percent = durationMinutes > 0 ? Math.min(100, Math.round((learnedSeconds / (durationMinutes * 60)) * 100)) : 0;
      return {
        key: r.lesson_id || idx,
        ...r,
        durationMinutes,
        learnedSeconds,
        percent,
      };
    });
  }, [rows]);

  const columns = [
    {
      title: "Môn",
      dataIndex: "subject_name",
      render: (t) => <b>{t}</b>,
    },
    {
      title: "Bài học",
      dataIndex: "title",
      render: (t) => <span>{t}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s) => {
        if (s === "completed") return <Tag color="green">Đã học</Tag>;
        if (s === "in_progress") return <Tag color="blue">Đang học</Tag>;
        if (s === "not_started") return <Tag>Chưa học</Tag>;
        return <Tag>Chưa học</Tag>;
      },
    },
    {
      title: "Tiến độ",
      dataIndex: "percent",
      width: 220,
      render: (p, record) => (
        <Progress
          percent={p}
          status={record.status === "completed" ? "success" : "active"}
        />
      ),
    },
    {
      title: "Hành động",
      dataIndex: "lesson_id",
      width: 160,
      render: (lessonId, record) => (
        <Space>
          {record.status === "completed" ? (
            <Tag color="green">Hoàn thành</Tag>
          ) : record.status === "in_progress" ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/student/learning/${lessonId}`)}
            >
              Tiếp tục
            </Button>
          ) : (
            <Tag>Chưa học</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={4} style={{ margin: 0 }}>Lịch sử học</Title>
        </div>
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <Spin />
            </div>
          ) : (
            <Table columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
          )}
        </div>
      </Card>
    </div>
  );
}
