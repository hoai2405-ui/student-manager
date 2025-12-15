import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Spin,
  Result,
  Typography,
  Tag,
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
  FilePdfOutlined,
} from "@ant-design/icons";
import axios from "../../Common/axios";

const { Text } = Typography;
const SERVER_URL = "http://localhost:3001";

const Learning = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectLessons, setSubjectLessons] = useState([]);
  const [lessonIndex, setLessonIndex] = useState(null);
  const [subjectTotalDuration, setSubjectTotalDuration] = useState(0);

  // ⏳ CHỈ DÙNG ĐẾM NGƯỢC
  const [timeLeft, setTimeLeft] = useState(0);

  // Audio
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState([]);

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  /* =============================
     LOAD VOICES
  ============================== */
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => synthRef.current?.cancel();
  }, []);

  /* =============================
     LOAD LESSON
  ============================== */
  useEffect(() => {
    setLoading(true);
    synthRef.current?.cancel();
    setSpeaking(false);
    setPaused(false);

    axios.get(`/api/lessons/${lessonId}`).then((res) => {
      const data = res.data;
      setLesson(data);

      // ⏱ Khởi tạo thời gian đếm ngược (phút → giây)
      const durationSeconds = (data.duration_minutes || 45) * 60;
      setTimeLeft(durationSeconds);

      // Fetch all lessons for the same subject to compute counts/durations
      if (data.subject_id) {
        axios
          .get(`/api/lessons?subject_id=${data.subject_id}`)
          .then((r) => {
            const lessons = r.data || [];
            setSubjectLessons(lessons);
            // find index of current lesson
            const idx = lessons.findIndex((l) => Number(l.id) === Number(data.id));
            setLessonIndex(idx >= 0 ? idx : null);
            // sum durations (minutes)
            const total = lessons.reduce((acc, l) => acc + (Number(l.duration_minutes) || 0), 0);
            setSubjectTotalDuration(total);
          })
          .catch((e) => {
            console.warn("Could not load subject lessons", e.message || e);
            setSubjectLessons([]);
            setLessonIndex(null);
            setSubjectTotalDuration(0);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [lessonId]);

  /* =============================
     COUNTDOWN TIMER
  ============================== */
  useEffect(() => {
    if (!lesson || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          message.success("✅ Đã hoàn thành thời gian bài học!");
          handleEndSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lesson, timeLeft]);

  /* =============================
     TEXT TO SPEECH
  ============================== */
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

    const content =
      lesson.content?.trim() ||
      `Bài học ${lesson.title}. Chưa có nội dung chi tiết.`;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(content);

    const vnVoice = voices.find(
      (v) => v.lang.includes("vi") || v.name.includes("Vietnamese")
    );
    if (vnVoice) utterance.voice = vnVoice;

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setSpeaking(true);
  };

  const handleReplay = () => {
    synthRef.current?.cancel();
    setSpeaking(false);
    setPaused(false);
    setTimeout(handleSpeak, 300);
  };

  const handleEndSession = (auto = false) => {
    synthRef.current?.cancel();

    if (auto) {
      navigate(-1);
      return;
    }

    Modal.confirm({
      title: "Kết thúc phiên học?",
      content: "Thời gian học sẽ được lưu lại.",
      okText: "Kết thúc",
      cancelText: "Học tiếp",
      onOk: () => navigate(-1),
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading)
    return (
      <div className="h-screen flex justify-center items-center">
        <Spin size="large" />
      </div>
    );

  if (!lesson)
    return (
      <Result
        status="404"
        title="Không tìm thấy bài học"
        extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      />
    );

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5]">
      {/* HEADER */}
      <div className="bg-white px-6 py-3 border-b flex justify-between items-center h-16">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <div>
            <Text strong className="text-lg text-[#003a8c]">
              {lesson.title}
            </Text>
            <div className="text-xs text-gray-500">
              {lessonIndex !== null && subjectLessons.length > 0 && (
                <span>
                  Bài {lessonIndex + 1} / {subjectLessons.length}
                </span>
              )}
              {subjectTotalDuration > 0 && (
                <span className="ml-3">• Tổng thời lượng môn: {subjectTotalDuration} phút</span>
              )}
            </div>
          </div>
          {lesson.pdf_url && <Tag color="red">PDF</Tag>}
          {lesson.video_url && <Tag color="blue">VIDEO</Tag>}
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-mono font-bold border flex items-center gap-2">
            <ClockCircleOutlined />
            {formatTime(timeLeft)}
          </div>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={() => handleEndSession()}
          >
            Kết thúc
          </Button>
        </div>
      </div>

      {/* AUDIO BAR */}
      <div className="bg-white px-6 py-2 border-b flex items-center justify-between">
        <Tooltip title={speaking && !paused ? "Tạm dừng" : "Nghe bài giảng"}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={
              speaking && !paused ? (
                <PauseCircleOutlined />
              ) : (
                <PlayCircleOutlined />
              )
            }
            onClick={handleSpeak}
          />
        </Tooltip>
        <Button icon={<ReloadOutlined />} onClick={handleReplay} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-white rounded-xl overflow-hidden border">
          {lesson.pdf_url ? (
            <iframe
              src={`${SERVER_URL}${lesson.pdf_url}#toolbar=0`}
              className="w-full h-full"
              title="PDF"
            />
          ) : lesson.video_url ? (
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allowFullScreen
              title="Video"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <FilePdfOutlined style={{ fontSize: 60 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Learning;
