import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Card,
  Button,
  Typography,
  Breadcrumb,
  Tag,
  Tooltip,
} from "antd";
import {
  PlayCircleOutlined,
  HomeOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;

const StudentCourseDetail = () => {
  const { subjectId } = useParams(); // Lấy ID môn từ URL
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [subjectName, setSubjectName] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Lấy tên môn học để hiển thị trên tiêu đề
    axios.get("http://localhost:3001/api/subjects").then((res) => {
      // Lưu ý: ID trong DB là số, subjectId từ URL là chuỗi, nên cần so sánh lỏng (==) hoặc ép kiểu
      const sub = res.data.find((s) => s.id == subjectId);
      if (sub) setSubjectName(sub.name);
      else setSubjectName("Môn học không tồn tại");
    });

    // 2. Lấy danh sách bài giảng bạn đã thêm trong Admin
    axios
      .get(`http://localhost:3001/api/lessons?subject_id=${subjectId}`)
      .then((res) => {
        setLessons(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [subjectId]);

  // --- CẤU HÌNH CỘT CHO BẢNG ---
  const columns = [
    {
      title: "STT",
      dataIndex: "lesson_order",
      width: 70,
      align: "center",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Loại",
      width: 80,
      align: "center",
      render: (_, record) => {
        // Kiểm tra xem bài này là PDF hay Video để hiện icon tương ứng
        if (record.pdf_url)
          return (
            <FilePdfOutlined style={{ fontSize: "24px", color: "#ff4d4f" }} />
          );
        if (record.video_url)
          return (
            <VideoCameraOutlined
              style={{ fontSize: "24px", color: "#1890ff" }}
            />
          );
        return <Tag>---</Tag>;
      },
    },
    {
      title: "Tên bài giảng",
      dataIndex: "title",
      render: (text, record) => (
        <div>
          <div className="font-bold text-base text-gray-800">{text}</div>
          {record.lesson_code && (
            <div className="text-xs text-gray-500">
              Mã: {record.lesson_code}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      width: 150,
      render: () => <Tag color="default">Chưa học</Tag>, // Sau này làm logic tiến độ sẽ sửa chỗ này
    },
    {
      title: "Thao tác", // 👇 ĐÂY LÀ PHẦN BẠN CẦN
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          shape="round"
          icon={<PlayCircleOutlined />}
          className="bg-blue-600 hover:bg-blue-500"
          // Khi bấm nút này, nó sẽ nhảy sang trang Learning và hiển thị đúng bài đó
          onClick={() => navigate(`/student/learning/${record.id}`)}
        >
          Vào học
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Breadcrumb điều hướng */}
      <Breadcrumb 
  className="mb-4"
  items={[
    {
      title: <a href="/student"><HomeOutlined /> Trang chủ</a>,
    },
    {
      title: <a href="/student/learning">Môn học</a>,
    },
    {
      title: <span className="font-bold text-blue-600">{subjectName}</span>,
    },
  ]}
/>

      <Card className="shadow-md border-t-4 border-t-blue-600 rounded-lg">
        {/* Header của Card */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">
              <CheckCircleOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {subjectName}
              </Title>
              <span className="text-gray-500">
                Tổng số: <b>{lessons.length}</b> bài giảng
              </span>
            </div>
          </div>
          {/* Nút quay lại */}
          <Button onClick={() => navigate("/student/learning")}>
            Quay lại danh sách môn
          </Button>
        </div>

        {/* Bảng danh sách bài học */}
        <Table
          columns={columns}
          dataSource={lessons}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          locale={{ emptyText: "Chưa có bài giảng nào được thêm vào môn này." }}
        />
      </Card>
    </div>
  );
};

export default StudentCourseDetail;
