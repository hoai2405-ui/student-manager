import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spin, Result, Alert } from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import axios from "../../Common/axios";

const Learning = () => {
  const { lessonId } = useParams(); // Lấy ID bài học từ URL
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0); // Bộ đếm giờ

  // 1. Gọi API lấy chi tiết bài học
  useEffect(() => {
    setLoading(true);
    // Gọi API chi tiết (nếu chưa có API detail thì lọc từ danh sách như code cũ cũng được)
    // Ở đây mình dùng API detail cho chuẩn
    axios
      .get(`/api/lessons/${lessonId}`)
      .then((res) => {
        setLesson(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi:", err);
        setLoading(false);
      });
  }, [lessonId]);

  // 2. Chạy đồng hồ đếm giờ học
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format giây thành 00:00:00
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

  if (loading)
    return (
      <div className="h-screen flex flex-col justify-center items-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Đang tải bài học...</p>
      </div>
    );

  if (!lesson)
    return (
      <Result
        status="404"
        title="Không tìm thấy bài học"
        subTitle="Có thể bài học này đã bị xóa hoặc đường dẫn sai."
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        }
      />
    );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* --- HEADER --- */}
      <div className="bg-white px-6 py-3 border-b shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại danh sách
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-800 m-0 leading-tight">
              Bài: {lesson.title}
            </h1>
            {lesson.lesson_code && (
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 rounded">
                {lesson.lesson_code}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-red-600 font-bold shadow-sm">
            <ClockCircleOutlined className="animate-pulse" />
            <span>Thời gian học: {formatTime(timer)}</span>
          </div>
        </div>
      </div>

      {/* --- BODY (NỘI DUNG) --- */}
      <div className="flex-1 p-4 overflow-hidden relative">
        <div className="w-full h-full bg-white shadow-lg rounded-lg border overflow-hidden relative">
          {/* TRƯỜNG HỢP 1: CÓ PDF */}
          {lesson.pdf_url ? (
            <iframe
              src={`http://localhost:3001${lesson.pdf_url}#toolbar=0&navpanes=0`}
              className="w-full h-full border-none"
              title="PDF Viewer"
            />
          ) : /* TRƯỜNG HỢP 2: CÓ VIDEO */
          lesson.video_url ? (
            <iframe
              src={lesson.video_url}
              className="w-full h-full border-none"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Video Player"
            />
          ) : (
            /* TRƯỜNG HỢP 3: KHÔNG CÓ GÌ */
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FilePdfOutlined
                style={{ fontSize: 60, marginBottom: 16, opacity: 0.5 }}
              />
              <p className="text-lg">
                Bài học này chưa cập nhật nội dung tài liệu.
              </p>
              <Button onClick={() => navigate(-1)}>Chọn bài khác</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Learning;
