import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Card, Button, Typography, Breadcrumb, Tag, Spin, message, Modal } from "antd";
import { PlayCircleOutlined, BookOutlined, HomeOutlined, FilePdfOutlined, VideoCameraOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "../../Common/axios";

const { Title } = Typography;

const StudentCourseDetail = () => {
  const { subjectcode } = useParams();
  const navigate = useNavigate();
  
  const [lessons, setLessons] = useState([]);
  const [subjectName, setSubjectName] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);
  
  // 👇 QUAN TRỌNG: Đã thêm state này để lưu tiến độ
  const [progressData, setProgressData] = useState({}); 

  useEffect(() => {
    setLoading(true);

    axios.get("/api/subjects")
      .then((res) => {
        const subjects = res.data;
        const currentSubject = subjects.find(s =>
          s.code === subjectcode || s.subject_code === subjectcode || s.ma_mon === subjectcode
        );

        if (currentSubject) {
            setSubjectName(currentSubject.name || currentSubject.subject_name || "Môn học");
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

  const fetchLessons = async (subjectId) => {
    try {
      // 1. Load lessons
      const studentInfoRaw = localStorage.getItem("studentInfo");
      let hangGplx = "";
      try {
        hangGplx = studentInfoRaw ? JSON.parse(studentInfoRaw)?.hang_gplx || "" : "";
      } catch {
        hangGplx = "";
      }

      const lessonsRes = await axios.get(`/api/lessons?subject_id=${subjectId}&hang_gplx=${encodeURIComponent(hangGplx)}`);
      const lessonsData = lessonsRes.data || [];
      setLessons(lessonsData);

      // 2. Load progress (nếu có token)
      const token = localStorage.getItem("studentToken"); // Lấy token
      
      if (token && lessonsData.length > 0) {
        const progressPromises = lessonsData.map(lesson =>
          axios.get(`/api/progress/${lesson.id}`)
            .then(res => ({ lessonId: lesson.id, progress: res.data.learned_seconds || 0 }))
            .catch(() => ({ lessonId: lesson.id, progress: 0 }))
        );

        const progressResults = await Promise.all(progressPromises);
        const progressMap = {};
        progressResults.forEach(item => {
          progressMap[item.lessonId] = item.progress;
        });
        setProgressData(progressMap); // Lưu vào state
      }

    } catch (err) {
      console.error("Load lessons error:", err);
    } finally {
        setLoading(false);
    }
  };

  // Helper functions
  const getProgressPercent = (lesson) => {
  const learned = progressData[lesson.id] || 0;
  const durationMinutes = lesson.effective_duration_minutes || lesson.duration_minutes || 45;
  const total = durationMinutes * 60;
  return Math.min((learned / total) * 100, 100);
  };

  const isCompleted = (lesson) => {
    return getProgressPercent(lesson) >= 80;
  };

  const showIncompleteWarning = (record) => {
    if (record.lesson_order <= 1) {
      navigate(`/student/learning/${record.id}`);
      return;
    }

    const previous = lessons.find(
      (lesson) => lesson.lesson_order === record.lesson_order - 1
    );
    if (!previous) {
      navigate(`/student/learning/${record.id}`);
      return;
    }

    const prevPercent = getProgressPercent(previous);
    if (prevPercent >= 80) {
      navigate(`/student/learning/${record.id}`);
      return;
    }

    Modal.confirm({
      title: "Bài trước chưa hoàn thành",
      content: "Bạn có muốn tiếp tục học bài này không?",
      okText: "Vẫn học",
      cancelText: "Quay lại",
      onOk: () => navigate(`/student/learning/${record.id}`),
    });
  };

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
        <div className="flex items-center gap-2">
          <div>
            <div className={`font-bold text-base ${isCompleted(record) ? 'text-green-600' : 'text-gray-800'}`}>
              {text}
            </div>
            {record.lesson_code && <div className="text-xs text-gray-500">Mã: {record.lesson_code}</div>}
          </div>
          {isCompleted(record) && (
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: '20px' }} />
          )}
        </div>
      )
    },
    {
      title: 'Tiến độ', width: 120, align: 'center',
      render: (_, record) => (
        <div className="text-center">
          <div className={`text-sm font-semibold ${isCompleted(record) ? 'text-green-600' : 'text-blue-600'}`}>
            {Math.round(getProgressPercent(record))}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className={`h-2 rounded-full ${isCompleted(record) ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${getProgressPercent(record)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      title: 'Thao tác', key: 'action', width: 150, align: 'center',
      render: (_, record) =>
        isCompleted(record) ? (
          <Tag color="green">Hoàn thành</Tag>
        ) : (
          <Button
            type="primary"
            shape="round"
            icon={<PlayCircleOutlined />}
            className="bg-blue-600 hover:bg-blue-500"
            onClick={() => showIncompleteWarning(record)}
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
                    <span className="text-gray-500">
                      Tổng số: <b>{lessons.length}</b> bài giảng
                      {/* Đã thêm kiểm tra progressData tồn tại */}
                      {progressData && Object.keys(progressData).length > 0 && (
                        <span className="ml-2">
                          • Đã hoàn thành: <b className="text-green-600">
                            {lessons.filter(lesson => {
                                const learned = progressData[lesson.id] || 0;
                                const total = (lesson.duration_minutes || 45) * 60;
                                return (learned / total) * 100 >= 80;
                            }).length}
                          </b>
                        </span>
                      )}
                    </span>
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