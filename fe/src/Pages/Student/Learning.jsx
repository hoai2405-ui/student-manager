import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Spin,
  Result,
  Typography,
  Tag,
  Empty,
  Tooltip,
  Modal,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  LogoutOutlined,
  VideoCameraOutlined,
  FilePdfOutlined,
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
  const [timer, setTimer] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); 

  // State Audio
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState([]); 

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // 1. Tải danh sách giọng đọc an toàn
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      console.log("Giọng khả dụng:", availableVoices.length);
    };
    
    loadVoices();
    // Một số trình duyệt cần sự kiện này mới load được giọng
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
       window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup khi thoát trang: Dừng đọc ngay lập tức
    return () => {
       if (synthRef.current) {
         synthRef.current.cancel();
       }
    };
  }, []);

  // 2. Load bài học
  useEffect(() => {
    setLoading(true);
    // Dừng đọc bài cũ
    if (synthRef.current) synthRef.current.cancel();
    setSpeaking(false);
    setPaused(false);

    axios.get(`/api/lessons/${lessonId}`)
      .then((res) => {
        const data = res.data;
        setLesson(data);
        const duration = (data.duration_minutes || 45) * 60;
        setTimeLeft(duration);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải bài:", err);
        setLoading(false);
      });
  }, [lessonId]);

  // 3. Đồng hồ
  useEffect(() => {
    if (!lesson || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          message.success("Hết thời gian làm bài!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lesson, timeLeft]);

  // --- HÀM XỬ LÝ ĐỌC ---
  const handleSpeak = () => {
    if (!synthRef.current) return;

    if (speaking && !paused) {
      synthRef.current.pause();
      setPaused(true);
      return;
    }

    if (paused) {
      synthRef.current.resume();
      setPaused(false);
      return;
    }

    // Nội dung cần đọc
    const textContent = lesson.content && lesson.content.trim() !== ""
        ? lesson.content
        : `Bài học: ${lesson.title}. Chưa có nội dung chi tiết.`;

    // Ngắt các đoạn đọc cũ đang chờ (nếu có)
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textContent);
    
    // Tìm giọng Việt (Ưu tiên giọng Google hoặc Microsoft)
    const vnVoice = voices.find(v => v.lang.includes("vi") || v.name.includes("Vietnamese"));
    if (vnVoice) utterance.voice = vnVoice;

    utterance.rate = 1.0;
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = (e) => {
      console.error("Lỗi giọng đọc:", e);
      setSpeaking(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setSpeaking(true);
  };

  const handleReplay = () => {
    if (synthRef.current) synthRef.current.cancel();
    setSpeaking(false);
    setPaused(false);
    setTimeout(handleSpeak, 300);
  };

  const handleEndSession = () => {
    // Dừng đọc khi kết thúc
    if (synthRef.current) synthRef.current.cancel();
    
    Modal.confirm({
      title: "Kết thúc phiên học?",
      content: "Thời gian học sẽ được lưu lại.",
      okText: "Kết thúc",
      cancelText: "Học tiếp",
      onOk: () => navigate(-1),
    });
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  if (loading) return <div className="h-screen flex justify-center items-center"><Spin size="large" /></div>;
  if (!lesson) return <Result status="404" title="Không tìm thấy bài học" extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>} />;

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5]">
      {/* HEADER */}
      <div className="bg-white px-6 py-3 border-b shadow-sm flex justify-between items-center z-10 h-16">
        <div className="flex items-center gap-4 overflow-hidden">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Text strong className="text-lg truncate max-w-md text-[#003a8c]">{lesson.title}</Text>
              {lesson.pdf_url && <Tag color="red">PDF</Tag>}
              {lesson.video_url && <Tag color="blue">VIDEO</Tag>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full font-mono font-bold border border-blue-200 flex items-center gap-2">
            <ClockCircleOutlined /> {formatTime(timer)}
          </div>
          <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleEndSession}>Kết thúc</Button>
        </div>
      </div>

      {/* THANH AUDIO */}
      <div className="bg-white px-6 py-2 border-b flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 w-full max-w-3xl mx-auto">
          <Tooltip title={speaking && !paused ? "Tạm dừng" : "Đọc bài giảng"}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={speaking && !paused ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handleSpeak}
              className={speaking && !paused ? "animate-pulse" : ""}
            />
          </Tooltip>

          <div className="flex-1">
            <Text strong style={{ fontSize: 13, color: "#555" }}>
              {speaking && !paused ? "Đang đọc nội dung..." : (paused ? "Đã tạm dừng" : "Bấm nút Play để nghe nội dung bài học")}
            </Text>
            <div className="h-1.5 w-full bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div className={`h-full bg-blue-500 transition-all duration-500 ${speaking && !paused ? "w-full" : "w-0"}`}></div>
            </div>
          </div>

          <Tooltip title="Đọc lại từ đầu">
            <Button icon={<ReloadOutlined />} onClick={handleReplay} />
          </Tooltip>
        </div>
      </div>

      {/* KHUNG HIỂN THỊ */}
      <div className="flex-1 p-4 overflow-hidden relative">
        <div className="w-full h-full bg-white shadow-lg rounded-xl overflow-hidden border relative">
          {lesson.pdf_url ? (
            <iframe
              src={`${SERVER_URL}${lesson.pdf_url}#toolbar=0`}
              className="w-full h-full border-none"
              title="PDF"
            />
          ) : lesson.video_url ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <iframe
                src={lesson.video_url}
                className="w-full h-full border-none"
                allowFullScreen
                title="Video"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FilePdfOutlined style={{ fontSize: 60, marginBottom: 16, opacity: 0.5 }} />
              <p>Chưa có tài liệu hiển thị.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Learning;