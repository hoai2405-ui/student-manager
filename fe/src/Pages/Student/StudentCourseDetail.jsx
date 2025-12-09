import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Card, Button, Typography, Breadcrumb, Tag, Spin, message } from "antd";
import { PlayCircleOutlined, BookOutlined, HomeOutlined, FilePdfOutlined, VideoCameraOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;

const StudentCourseDetail = () => {
  // 👇 Lấy code từ URL - tên param phải khớp với route
  const { subjectcode } = useParams();
  const navigate = useNavigate();
  
  const [lessons, setLessons] = useState([]);
  const [subjectName, setSubjectName] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 1. Lấy danh sách tất cả môn học trước
    axios.get("http://localhost:3001/api/subjects")
      .then((res) => {
        const subjects = res.data;
        console.log("Danh sách subjects:", subjects);
        console.log("Tìm subject với code:", subjectcode);

        // 2. Tìm môn học có CODE trùng với URL (kiểm tra nhiều tên field có thể)
        const currentSubject = subjects.find(s =>
          s.code === subjectcode || s.subject_code === subjectcode || s.ma_mon === subjectcode
        );

        console.log("Subject tìm được:", currentSubject);

        if (currentSubject) {
            setSubjectName(currentSubject.name || currentSubject.subject_name || "Môn học");

            // 3. Có ID rồi thì mới gọi API lấy bài giảng (dùng subject_id)
            fetchLessons(currentSubject.id);
        } else {
            message.error("Không tìm thấy môn học này!");
            setSubjectName("Môn học không tồn tại");
            setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi gọi API subjects:", err);
        setLoading(false);
      });

  }, [subjectcode]);

  const fetchLessons = (subjectId) => {
    axios.get(`http://localhost:3001/api/lessons?subject_id=${subjectId}`)
      .then((res) => {
        setLessons(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // ... (Phần columns và render bên dưới GIỮ NGUYÊN KHÔNG ĐỔI) ...
  const columns = [
    { 
      title: 'STT', dataIndex: 'lesson_order', width: 70, align: 'center',
      render: (text) => <b>{text}</b>
    },
    {
      title: 'Loại', width: 80, align: 'center',
      render: (_, record) => {
        if (record.pdf_url) return <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />;
        if (record.video_url) return <VideoCameraOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
        return <Tag>---</Tag>;
      }
    },
    {
      title: 'Tên bài giảng', dataIndex: 'title',
      render: (text, record) => (
        <div>
            <div className="font-bold text-base text-gray-800">{text}</div>
            {record.lesson_code && <div className="text-xs text-gray-500">Mã: {record.lesson_code}</div>}
        </div>
      )
    },
    {
      title: 'Thao tác', key: 'action', width: 150, align: 'center',
      render: (_, record) => (
        <Button 
            type="primary" shape="round" icon={<PlayCircleOutlined />} className="bg-blue-600 hover:bg-blue-500"
            onClick={() => navigate(`/student/learning/${record.id}`)}
        >
            Vào học
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumb className="mb-4"
        items={[
            { title: <a href="/student">Trang chủ</a> },
            { title: <a href="/student/learning">Môn học</a> },
            { title: <span className="font-bold text-blue-600">{subjectName}</span> },
        ]}
      />

      <Card className="shadow-md border-t-4 border-t-blue-600 rounded-lg">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">
                    <BookOutlined />
                </div>
                <div>
                    <Title level={4} style={{ margin: 0 }}>{subjectName}</Title>
                    <span className="text-gray-500">Tổng số: <b>{lessons.length}</b> bài giảng</span>
                </div>
            </div>
            <Button onClick={() => navigate('/student/learning')}>Quay lại</Button>
        </div>

        <Table 
            columns={columns} 
            dataSource={lessons} 
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            bordered
            locale={{ emptyText: 'Chưa có bài giảng nào.' }}
        />
      </Card>
    </div>
  );
};

export default StudentCourseDetail;
