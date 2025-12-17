import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../Common/axios"; // Dùng axios đã cấu hình Interceptor
import { Spin, message, Button, Result, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const API_URL = "http://localhost:3001";

export default function Learning() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const timerRef = useRef(null);
  const saveRef = useRef(null);
  
  // Ref để lưu giá trị thời gian thực (Giúp lưu đúng giờ)
  const secondsValueRef = useRef(0);

  const [lesson, setLesson] = useState(null);
  const [learnedSeconds, setLearnedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- HÀM XỬ LÝ VĂN BẢN (GIỮ NGUYÊN) ---
  const processContent = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    let html = "";
    lines.forEach((line) => {
      const content = line.trim();
      if (!content) return;
      if (/^(PHẦN|CHƯƠNG)\s+\w+/i.test(content)) {
        html += `<h3 class="doc-header">${content}</h3>`;
      } else if (/^Điều\s+\d+/i.test(content)) {
        html += `<p class="doc-item"><strong>${content}</strong></p>`;
      } else if (/^\d+\./.test(content)) {
        html += `<p class="doc-list">${content}</p>`;
      } else {
        html += `<p class="doc-text">${content}</p>`;
      }
    });
    return html;
  };

  // ===============================
  // 1. LOAD DATA (LOGIC CHỐNG TREO)
  // ===============================
  useEffect(() => {
    let isMounted = true;
    
    // Safety Timeout: Tự ngắt sau 8s nếu mạng lag
    const timeoutId = setTimeout(() => {
        if (loading && isMounted) {
            setLoading(false);
            if (!lesson) setErrorMsg("Server phản hồi chậm. Vui lòng thử lại.");
        }
    }, 8000);

    const loadData = async () => {
        console.log("🚀 Bắt đầu tải bài:", lessonId);
        setLoading(true);

        try {
            // Lấy token thủ công
            const token = localStorage.getItem("studentToken");
            
            // Gọi API Song song (Bài học + Tiến độ)
            // Lưu ý: Bài học không cần token cũng xem được nội dung
            const lessonReq = axios.get(`${API_URL}/api/lessons/${lessonId}`);
            
            // Tiến độ cần token
            const progressReq = token 
                ? axios.get(`${API_URL}/api/progress/${lessonId}`)
                : Promise.resolve({ data: { learned_seconds: 0 } });

            const [lessonRes, progressRes] = await Promise.all([lessonReq, progressReq]);

            if (isMounted) {
                setLesson(lessonRes.data);
                
                const savedTime = progressRes.data.learned_seconds || progressRes.data.current_time || 0;
                
                // Cập nhật UI và Ref
                setLearnedSeconds(savedTime);
                secondsValueRef.current = savedTime; 
            }
        } catch (err) {
            console.error("Lỗi tải:", err);
            if (isMounted) {
                setErrorMsg("Không thể tải bài học. Vui lòng kiểm tra kết nối.");
            }
        } finally {
            if (isMounted) {
                setLoading(false); // Chắc chắn tắt xoay
                clearTimeout(timeoutId);
            }
        }
    };

    loadData();

    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [lessonId]);

  // ===============================
  // 2. TIMER (DÙNG REF ĐỂ ĐẾM ĐÚNG)
  // ===============================
  useEffect(() => {
    if (!lesson) return;

    timerRef.current = setInterval(() => {
      setLearnedSeconds((prev) => {
        const newValue = prev + 1;
        // 👇 ĐỒNG BỘ GIÁ TRỊ VÀO REF NGAY LẬP TỨC
        secondsValueRef.current = newValue; 
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [lesson]);

  // ===============================
  // 3. AUTO SAVE (DÙNG REF ĐỂ LƯU)
  // ===============================
  useEffect(() => {
    if (!lesson) return;

    saveRef.current = setInterval(() => {
        // Lấy giá trị từ Ref (Luôn đúng, không bị 0)
        const timeToSave = secondsValueRef.current;
        if (timeToSave > 0) {
            saveProgress(timeToSave);
        }
    }, 5000);

    return () => clearInterval(saveRef.current);
  }, [lesson]); // Chỉ phụ thuộc lesson, không phụ thuộc learnedSeconds (tránh re-create interval)

  // Hàm gọi API Lưu
  const saveProgress = async (currentTime) => {
    try {
      // Lấy token trực tiếp lúc gọi
      const token = localStorage.getItem("studentToken");
      if (!token) return;

      await axios.post(`${API_URL}/api/progress/save`, {
        lesson_id: lessonId,
        learned_seconds: currentTime, 
      });
    } catch (err) {
      console.error("Save error", err);
    }
  };

  // Nút Quay lại
  const handleBack = async () => {
    await saveProgress(secondsValueRef.current); // Lưu lần cuối
    navigate(-1);
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f0f2f5]">
        <Spin size="large" />
      </div>
    );
  }

  if (errorMsg || !lesson) {
      return <Result status="404" title="Lỗi" subTitle={errorMsg || "Bài học không tồn tại"} extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>} />;
  }

  const totalSeconds = (lesson.duration_minutes || 45) * 60;
  const remaining = Math.max(totalSeconds - learnedSeconds, 0);

  return (
    <div className="learning-page flex flex-col h-screen bg-[#f0f2f5]">
      {/* HEADER */}
      <div className="bg-white px-6 py-3 border-b shadow-sm flex justify-between items-center z-10 h-16 shrink-0">
        <div className="flex items-center gap-4">
            <button
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
            onClick={handleBack}
            >
            <ArrowLeftOutlined /> Quay lại
            </button>
            <h2 className="text-lg font-bold text-[#003a8c] m-0 truncate max-w-xl">{lesson.title}</h2>
        </div>

        <div className="text-right">
            <div className="text-xs text-gray-500 font-bold uppercase">Thời gian học</div>
            <div className="time-info font-mono text-lg text-blue-600 font-bold">
            <span className={remaining === 0 ? "text-green-600" : ""}>
                {formatTime(learnedSeconds)}
            </span>{" "}
            <span className="text-gray-400 text-sm">/ {formatTime(totalSeconds)}</span>
            </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#eef1f5]">
        <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-full rounded-none md:rounded-lg p-8 md:p-12 border border-gray-200">
          <div
            className="lesson-content"
            dangerouslySetInnerHTML={{ __html: processContent(lesson.content) }}
          />
           {!lesson.content && <p className="text-center text-gray-400">Chưa có nội dung văn bản.</p>}
        </div>
      </div>

      <style>{`
        .lesson-content { font-family: "Times New Roman", serif; font-size: 16px; line-height: 1.8; color: #000; }
        .doc-header { text-align: center; font-weight: bold; font-size: 22px; margin: 40px 0 20px; text-transform: uppercase; }
        .doc-item { font-weight: bold; margin-top: 20px; }
        .doc-text { text-align: justify; margin-bottom: 12px; text-indent: 30px; }
        .doc-list { padding-left: 20px; }
      `}</style>
    </div>
  );
}