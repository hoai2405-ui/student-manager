import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../Common/axios"; // Dùng axios đã cấu hình Interceptor
import { Spin, Button, Result, Typography, Empty, Tooltip, Modal } from "antd";
import { 
  ArrowLeftOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  ReloadOutlined, 
  SaveOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import VideoPlayer from "../../Components/Student/VideoPlayer";
import PdfViewer from "../../Components/Student/PdfViewer";

const API_URL = "http://localhost:3001";
const { Text } = Typography;

export default function Learning() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- REFS ---
  const timerRef = useRef(null);
  const saveRef = useRef(null);
  const secondsValueRef = useRef(0);

  const videoRefTime = useRef(0);

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // --- STATES ---
  const [lesson, setLesson] = useState(null);
  const [learnedSeconds, setLearnedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  // Kiểm tra khóa học hết hạn
  const [courseExpired, setCourseExpired] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);

  // --- 1. HÀM XỬ LÝ VĂN BẢN (ĐỂ RENDER ĐẸP) ---
  const processContent = (text) => {
    if (!text) return "";
    const lines = text.split('\n');
    let html = '';
    lines.forEach(line => {
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

  // --- 2. LOAD DATA (TÁCH RIÊNG ĐỂ KHÔNG BỊ TREO) ---
  useEffect(() => {
    // Timeout an toàn: Sau 8s bắt buộc tắt loading
    const safetyTimeout = setTimeout(() => {
        if (loading) {
            setLoading(false);
            if (!lesson) setErrorMsg("Mạng chậm hoặc lỗi server.");
        }
    }, 8000);

    const fetchData = async () => {
        setLoading(true);
        setErrorMsg(null);

        // Reset Audio
        synthRef.current.cancel();
        setSpeaking(false);

        try {
            // A. Lấy bài học (QUAN TRỌNG NHẤT)
            const studentInfoRaw = localStorage.getItem("studentInfo");
            let hangGplx = "";
            try {
              hangGplx = studentInfoRaw ? JSON.parse(studentInfoRaw)?.hang_gplx || "" : "";
            } catch {
              hangGplx = "";
            }
            const lessonRes = await axios.get(`${API_URL}/api/lessons/${lessonId}?hang_gplx=${encodeURIComponent(hangGplx)}`);
            setLesson(lessonRes.data);

            // B. Kiểm tra khóa học có hết hạn không
            if (user?.id) {
              try {
                const studentRes = await axios.get(`${API_URL}/api/student/${user.id}`);
                const courseCode = studentRes.data.ma_khoa_hoc;

                if (courseCode) {
                  const courseRes = await axios.get(`${API_URL}/api/courses?ma_khoa_hoc=${courseCode}`);
                  const course = courseRes.data.find(c => c.ma_khoa_hoc === courseCode);

                  if (course && course.ngay_hoc && course.so_ngay_hoc) {
                    const ngayBatDau = new Date(course.ngay_hoc);
                    const ngayHienTai = new Date();
                    const soNgayDaHoc = Math.floor((ngayHienTai - ngayBatDau) / (1000 * 60 * 60 * 24));

                    if (soNgayDaHoc > course.so_ngay_hoc) {
                      setCourseExpired(true);
                      setCourseInfo({
                        ten_khoa_hoc: course.ten_khoa_hoc,
                        hang_gplx: course.hang_gplx,
                        so_ngay_hoc: course.so_ngay_hoc,
                        so_ngay_da_hoc: soNgayDaHoc
                      });
                    }
                  }
                }
              } catch (courseErr) {
                console.warn("⚠️ Không kiểm tra được khóa học:", courseErr.message);
              }
            }

            // C. Lấy tiến độ (NẾU LỖI THÌ BỎ QUA, KHÔNG ĐỂ CHẾT TRANG WEB)
            try {
                const token = localStorage.getItem("studentToken");
                if (token) {
                    const progressRes = await axios.get(`/api/progress/${lessonId}`);
                    const savedTime = progressRes.data.learned_seconds || 0;

                    setLearnedSeconds(savedTime);
                    secondsValueRef.current = savedTime; // Sync Ref

                    if (savedTime > 0) {
                        console.log("📍 Resume tại giây:", savedTime);
                    }
                }
            } catch (pErr) {
                console.warn("⚠️ Không tải được tiến độ cũ:", pErr.message);
            }

        } catch (err) {
            console.error("❌ Lỗi tải bài:", err);
            setErrorMsg("Không thể tải bài học. ID không tồn tại.");
        } finally {
            // 👇 LUÔN LUÔN TẮT LOADING
            setLoading(false);
            clearTimeout(safetyTimeout);
        }
    };

    if (lessonId) fetchData();

    return () => {
        synthRef.current.cancel();
        clearTimeout(safetyTimeout);
    };
  }, [lessonId, user?.id]);

  // --- 3. HÀM LƯU TIẾN ĐỘ (ĐÃ THÊM VÀO ĐÂY) ---
  const saveProgress = async (currentTime) => {
    if (currentTime === undefined || currentTime === null) return;
    try {
        await axios.post(`/api/progress/save`, {
            lesson_id: lessonId,
            learned_seconds: currentTime, 
        });
        // console.log("Saved:", currentTime);
    } catch {
      // ignore
    }
  };

  // --- 4. LOGIC ĐẾM GIỜ & AUTO SAVE ---
  useEffect(() => {
    if (!lesson || courseExpired) return;

    const isVideo = Boolean(lesson.video_url);

    timerRef.current = setInterval(() => {
      // Chỉ tính giờ khi đang phát video thật sự (hoặc không phải video thì fallback như cũ)
      if (isVideo) {
        if (!isVideoReady || !isActuallyPlaying) return;
        // Nếu video không chạy (tab bị pause), không cộng
        const drift = Math.abs((videoRefTime.current || 0) - (secondsValueRef.current || 0));
        if (drift > 20) {
          // nếu user tua mạnh, đồng bộ theo video time
          secondsValueRef.current = Math.floor(videoRefTime.current || 0);
        } else {
          // đồng bộ nhẹ: lấy max giữa video time và timer
          secondsValueRef.current = Math.max(
            secondsValueRef.current + 1,
            Math.floor(videoRefTime.current || 0)
          );
        }
      } else {
        secondsValueRef.current += 1;
      }

      setLearnedSeconds(secondsValueRef.current);
    }, 1000);

    saveRef.current = setInterval(() => {
      saveProgress(secondsValueRef.current);
    }, 5000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(saveRef.current);
    };
  }, [lesson, courseExpired, isVideoReady, isActuallyPlaying]);

  const handleEndSession = async () => {
    // Lưu vị trí hiện tại để resume
    await saveProgress(secondsValueRef.current);

    // Lưu tiến độ học vào learning_history (tính giờ học
    try {
      const durationMinutes = lesson?.duration_minutes || 45;
      await axios.post("/api/student/lesson-progress", {
        student_id: user?.id,
        lesson_id: lessonId,
        watched_seconds: secondsValueRef.current,
        duration_minutes: durationMinutes,
      });
      console.log("✅ Đã lưu tiến độ học:", Math.round(secondsValueRef.current / 60), "phút");
    } catch (err) {
      console.error("❌ Lỗi lưu tiến độ học:", err);
    }

    navigate(-1);
  };

  // --- 5. LOGIC AUDIO & VIDEO ---
  const handleVideoTime = (t) => {
    videoRefTime.current = Number.isFinite(t) ? t : 0;
  };

  const handleVideoReady = () => {
    setIsVideoReady(true);
  };

  const handleVideoEnded = async () => {
    setIsActuallyPlaying(false);
    await handleEndSession();
  };

  const handleVideoPlayingState = (isPlaying) => {
    setIsActuallyPlaying(Boolean(isPlaying));
  };

  const handleSpeak = () => {
    if (speaking && !paused) { synthRef.current.pause(); setPaused(true); return; }
    if (paused) { synthRef.current.resume(); setPaused(false); return; }

    const textContent = (lesson.content && lesson.content.trim() !== "") 
        ? lesson.content 
        : `Bài học: ${lesson.title}.`;

    const utterance = new SpeechSynthesisUtterance(textContent);
    const voices = window.speechSynthesis.getVoices();
    const vnVoice = voices.find(v => v.lang.includes('vi'));
    if (vnVoice) utterance.voice = vnVoice;
    
    utterance.onend = () => { setSpeaking(false); setPaused(false); };
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setSpeaking(true);
  };

  const handleReplayAudio = () => {
    synthRef.current.cancel(); setSpeaking(false); setPaused(false);
    setTimeout(handleSpeak, 200);
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // --- 6. RENDER GIAO DIỆN ---
  if (loading) return <div className="h-screen flex justify-center items-center bg-[#f0f2f5]"><Spin size="large" /></div>;
  
  if (errorMsg || !lesson) return (
      <div className="h-screen flex justify-center items-center bg-[#f0f2f5]">
         <Result status="404" title="Lỗi" subTitle={errorMsg || "Bài học không tồn tại"} extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>} />
      </div>
  );

  const totalSeconds = (lesson.effective_duration_minutes || lesson.duration_minutes || 45) * 60;
  
  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5]">
      {/* HEADER */}
      <div className="bg-white px-6 py-3 border-b shadow-sm flex justify-between items-center z-10 h-16 shrink-0">
        <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition" onClick={handleEndSession}>
                <ArrowLeftOutlined /> Quay lại
            </button>
            <h2 className="text-lg font-bold text-[#003a8c] m-0 truncate max-w-xl">{lesson.title}</h2>
        </div>

        <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 flex items-center gap-3">
                <ClockCircleOutlined className="text-blue-600" />
                <div className="font-mono font-bold text-lg text-blue-700">
                    {formatTime(learnedSeconds)} <span className="text-gray-400 text-sm">/ {formatTime(totalSeconds)}</span>
                </div>
            </div>
            <Button type="primary" danger icon={<SaveOutlined />} onClick={handleEndSession}>Lưu & Thoát</Button>
        </div>
      </div>

      {/* AUDIO BAR */}
      <div className="bg-white px-6 py-2 border-b flex items-center justify-between shadow-sm shrink-0">
         <div className="flex items-center gap-4 w-full max-w-3xl mx-auto">
            <Tooltip title="Nghe bài giảng">
              <Button type="primary" shape="circle" size="large" icon={speaking && !paused ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={handleSpeak} />
            </Tooltip>
            <div className="flex-1 text-sm text-gray-600">
               {speaking ? "Đang đọc bài giảng..." : "Bấm nút Play để nghe nội dung"}
            </div>
            <Tooltip title="Đọc lại"><Button icon={<ReloadOutlined />} onClick={handleReplayAudio} /></Tooltip>
         </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-4 overflow-hidden relative">
        <div className="w-full h-full bg-white shadow rounded-lg overflow-hidden border relative flex justify-center items-center bg-gray-50">
           {lesson.video_url ? (
             lesson.video_url.startsWith('/uploads') ? (
               <VideoPlayer
                 src={`${API_URL}${lesson.video_url}`}
                 initialTime={secondsValueRef.current}
                 onReady={() => {
                   handleVideoReady();
                   handleVideoPlayingState(true);
                 }}
                 onTime={(t) => {
                   handleVideoTime(t);
                 }}
                 onEnded={handleVideoEnded}
                 className="w-full h-full"
               />
             ) : (
               <iframe src={lesson.video_url} className="w-full h-full border-none" allowFullScreen />
             )
           ) : lesson.pdf_url ? (
             <PdfViewer src={`${API_URL}${lesson.pdf_url}`} className="w-full h-full" />
           ) : lesson.content ? (
             <div className="p-8 w-full h-full overflow-y-auto prose">
               <div dangerouslySetInnerHTML={{ __html: processContent(lesson.content) }} />
             </div>
           ) : (
             <Empty description="Chưa có nội dung" />
           )}
        </div>
      </div>

      {/* MODAL THÔNG BÁO KHÓA HỌC HẾT HẠN */}
      <Modal
        title={
          <div style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: 600 }}>
            🚫 Khóa học đã kết thúc
          </div>
        }
        open={courseExpired}
        closable={false}
        footer={[
          <Button key="back" onClick={() => navigate(-1)}>
            Quay lại trang chủ
          </Button>
        ]}
        width={500}
      >
        {courseInfo && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '16px', marginBottom: '16px', color: '#666' }}>
              Khóa học của bạn đã vượt quá thời hạn quy định.
            </div>

            <div style={{
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                {courseInfo.ten_khoa_hoc}
              </div>
              <div style={{ color: '#666', marginBottom: '8px' }}>
                Hạng: {courseInfo.hang_gplx}
              </div>
              <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                Đã học: {courseInfo.so_ngay_da_hoc} ngày
              </div>
              <div style={{ color: '#666' }}>
                Thời hạn: {courseInfo.so_ngay_hoc} ngày
              </div>
            </div>

            <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
              Bạn không thể tiếp tục học tập trong khóa học này.
            </div>
          </div>
        )}
      </Modal>

      <style>{` .doc-header { font-weight:bold; margin:20px 0; text-align:center; } .doc-text { text-indent: 30px; margin-bottom: 10px; } `}</style>
    </div>
  );
}
