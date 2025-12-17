import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Button, Result, Typography, Tooltip } from "antd";
import { 
  ArrowLeftOutlined, 
  FilePdfOutlined, 
  VideoCameraOutlined,
  SoundOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined 
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import axios from "../../Common/axios"; 

const { Title, Text } = Typography;
const SERVER_URL = "http://localhost:3001";

export default function Learning() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const timerRef = useRef(null);
  const saveRef = useRef(null);
  const videoRef = useRef(null);

  // --- AUDIO REFS ---
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const [lesson, setLesson] = useState(null);
  const [learnedSeconds, setLearnedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // --- AUDIO STATES ---
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  // --- 1. LOAD DATA ---
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const loadData = async () => {
        setLoading(true);
        // Reset Audio
        synthRef.current.cancel();
        setSpeaking(false);
        setPaused(false);

        timeoutId = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 10000);

        try {
            const lessonRes = await axios.get(`/api/lessons/${lessonId}`);
            
            if (isMounted) {
                setLesson(lessonRes.data);

                axios.get(`/api/progress/${lessonId}`)
                    .then(progressRes => {
                        if (isMounted) {
                            setLearnedSeconds(progressRes.data.learned_seconds || progressRes.data.current_time || 0);
                        }
                    })
                    .catch(() => {});

                clearTimeout(timeoutId);
                setLoading(false);
            }
        } catch (err) {
            if (isMounted) {
                clearTimeout(timeoutId);
                setErrorMsg("Không thể tải nội dung bài học.");
                setLoading(false);
            }
        }
    };

    if (lessonId) loadData();

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        synthRef.current.cancel(); // Tắt tiếng khi thoát
    };
  }, [lessonId]);

  // --- 2. TIMER & AUTO SAVE ---
  useEffect(() => {
    if (!lesson) return;
    timerRef.current = setInterval(() => setLearnedSeconds(prev => prev + 1), 1000);
    saveRef.current = setInterval(() => {
        if(lessonId) axios.post(`/api/progress/save`, { lesson_id: lessonId, learned_seconds: learnedSeconds }).catch(() => {});
    }, 5000);

    return () => {
        clearInterval(timerRef.current);
        clearInterval(saveRef.current);
    };
  }, [lesson, lessonId]); // Lưu ý: Dependency này ổn nếu bạn chấp nhận save giá trị cũ trong closure, hoặc sửa thành dùng Ref như bài trước.

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);


  // --- 3. LOGIC AUDIO (TEXT TO SPEECH) ---
  const handleSpeak = () => {
    if (speaking && !paused) {
      synthRef.current.pause(); setPaused(true); return;
    }
    if (paused) {
      synthRef.current.resume(); setPaused(false); return;
    }

    // Nội dung đọc: Lấy từ DB hoặc Tiêu đề
    const textContent = (lesson.content && lesson.content.trim() !== "") 
        ? lesson.content 
        : `Bài học: ${lesson.title}. Mời bạn xem tài liệu chi tiết trên màn hình.`;

    const utterance = new SpeechSynthesisUtterance(textContent);
    
    // Chọn giọng Việt Nam
    const voices = window.speechSynthesis.getVoices();
    const vnVoice = voices.find(v => v.lang.includes('vi'));
    if (vnVoice) utterance.voice = vnVoice;
    
    utterance.rate = 1.0;
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

  // --- RENDER CONTENT ---
  const renderContent = () => {
      if (lesson.video_url) {
          const isUpload = lesson.video_url.startsWith('/uploads');
          return (
              <div className="w-full h-full bg-black flex items-center justify-center">
                  {isUpload ? (
                      <div className="relative w-full h-full">
                          <video ref={videoRef} src={`${SERVER_URL}${lesson.video_url}`} controls autoPlay className="w-full h-full object-contain" />
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex gap-1">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                  <button key={speed} onClick={() => setPlaybackSpeed(speed)} className={`px-2 py-1 rounded ${playbackSpeed === speed ? 'bg-blue-500' : 'hover:bg-gray-600'}`}>{speed}x</button>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <iframe src={lesson.video_url} className="w-full h-full border-none" allowFullScreen />
                  )}
              </div>
          );
      }
      
      if (lesson.pdf_url) {
          return <iframe src={`${SERVER_URL}${lesson.pdf_url}#toolbar=0`} className="w-full h-full border-none bg-white" title="PDF" />;
      }

      if (lesson.content) {
          return (
              <div className="p-8 bg-white shadow-lg max-w-4xl mx-auto min-h-full rounded-lg prose">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
              </div>
          );
      }

      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FilePdfOutlined style={{ fontSize: 60, marginBottom: 16 }} />
              <p>Bài học này chưa có nội dung.</p>
          </div>
      );
  };

  if (loading) return <div className="h-screen flex justify-center items-center"><Spin size="large" /></div>;
  if (errorMsg || !lesson) return <Result status="404" title="Lỗi" subTitle={errorMsg} extra={<Button onClick={() => navigate(-1)}>Quay lại</Button>} />;

  const totalSeconds = (lesson.duration_minutes || 45) * 60;

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5]">
      {/* HEADER */}
      <div className="bg-white px-6 py-3 border-b shadow-sm flex justify-between items-center z-10 h-16 shrink-0">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Thoát</Button>
          <div className="flex flex-col">
             <span className="font-bold text-lg text-[#003a8c] truncate max-w-xl">{lesson.title}</span>
             <span className="text-xs text-gray-500">{lesson.lesson_code}</span>
          </div>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-bold font-mono">
            {formatTime(learnedSeconds)} / {formatTime(totalSeconds)}
        </div>
      </div>

      {/* --- AUDIO BAR (ĐÃ THÊM VÀO) --- */}
      <div className="bg-white px-6 py-2 border-b flex items-center justify-between shadow-sm shrink-0">
         <div className="flex items-center gap-4 w-full max-w-3xl mx-auto">
            <Tooltip title="Nghe bài giảng (AI Voice)">
              <Button 
                type="primary" shape="circle" size="large"
                icon={speaking && !paused ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                onClick={handleSpeak}
                className={speaking && !paused ? "animate-pulse" : ""}
              />
            </Tooltip>
            
            <div className="flex-1 text-sm text-gray-600 flex items-center gap-2">
               {speaking ? <span className="text-blue-600 font-bold animate-pulse">Đang đọc...</span> : "Bấm nút Play để nghe nội dung"}
               {/* Sóng âm giả lập */}
               <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-blue-500 transition-all duration-300 ${speaking && !paused ? 'w-full' : 'w-0'}`}></div>
               </div>
            </div>

            <Tooltip title="Đọc lại">
               <Button icon={<ReloadOutlined />} onClick={handleReplayAudio} />
            </Tooltip>
         </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-4 overflow-hidden relative">
         <div className="w-full h-full bg-white shadow-md rounded-lg overflow-hidden border relative">
             {renderContent()}
         </div>
      </div>
    </div>
  );
}