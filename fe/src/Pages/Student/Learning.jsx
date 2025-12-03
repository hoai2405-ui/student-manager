import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Spin,
  Result,
  Typography,
  Progress,
  message,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import axios from "../../Common/axios";

const { Text, Title } = Typography;
const SERVER_URL = "http://localhost:3001";

const Learning = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // State thời gian
  const [totalSeconds, setTotalSeconds] = useState(0); // Tổng giây quy định
  const [timeLeft, setTimeLeft] = useState(0); // Thời gian còn lại (đếm ngược)
  const [timeSpent, setTimeSpent] = useState(0); // Thời gian đã học (đếm xuôi)

  // 1. Load bài học & Cài đặt thời gian ban đầu
  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/lessons/${lessonId}`)
      .then((res) => {
        const data = res.data;
        setLesson(data);

        // Chuyển phút từ DB thành giây
        // Nếu DB chưa có thì mặc định 45 phút = 2700s
        const duration = (data.duration_minutes || 45) * 60;
        setTotalSeconds(duration);
        setTimeLeft(duration);

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [lessonId]);

  // 2. Logic Đếm ngược & Đếm xuôi
  useEffect(() => {
    if (!lesson || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          message.success("Chúc mừng! Bạn đã hoàn thành thời gian học.");
          return 0;
        }
        return prev - 1;
      });

      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [lesson, timeLeft]);

  // Hàm format giây thành HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleEndSession = () => {
    Modal.confirm({
      title: "Kết thúc phiên học?",
      content: "Thời gian học của bạn sẽ được lưu lại.",
      okText: "Kết thúc",
      cancelText: "Học tiếp",
      onOk: () => navigate(-1), // Quay về
    });
  };

  if (loading)
    return (
      <div className="h-screen flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  if (!lesson) return <Result status="404" title="Không tìm thấy bài học" />;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* --- HEADER GIỐNG ẢNH MẪU --- */}
      <div className="border-b shadow-sm bg-white">
        {/* Dòng 1: Tên bài */}
        <div className="px-6 py-4 flex justify-between items-start">
          <div>
            <Title level={3} style={{ margin: 0, color: "#333" }}>
              Bài: {lesson.title}
            </Title>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-green-600 font-bold">
                Thời gian còn lại: {formatTime(timeLeft)}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">
                Thời lượng đã học:{" "}
                <span className="text-red-500 font-bold">
                  {formatTime(timeSpent)}
                </span>
              </span>
            </div>
          </div>

          {/* Logo hoặc Info user góc phải (nếu cần) */}
        </div>

        {/* Dòng 2: Thanh điều khiển & Nút Kết thúc */}
        <div className="px-6 py-2 bg-gray-50 border-t flex items-center justify-between gap-4">
          {/* Giả lập thanh Audio Player như ảnh */}
          <div className="flex-1 flex items-center gap-2 bg-white border rounded-full px-3 py-1 shadow-sm max-w-2xl">
            <audio controls className="w-full h-8" src={lesson.video_url || ""}>
              Trình duyệt không hỗ trợ.
            </audio>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="primary"
              danger
              size="large"
              icon={<LogoutOutlined />}
              onClick={handleEndSession}
              className="font-bold px-6"
            >
              KẾT THÚC PHIÊN HỌC
            </Button>

            <div className="bg-gray-600 text-white px-4 py-2 rounded font-bold">
              {formatTime(timeLeft)} {/* Đồng hồ đếm ngược to ở góc phải */}
            </div>
          </div>
        </div>
      </div>

      {/* --- NỘI DUNG PDF --- */}
      <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
        <div className="h-full w-full bg-white shadow-lg border mx-auto max-w-6xl">
          {lesson.pdf_url ? (
            <iframe
              src={`${SERVER_URL}${lesson.pdf_url}#toolbar=0`}
              className="w-full h-full border-none"
              title="Nội dung bài học"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Không có tài liệu hiển thị
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Learning;
