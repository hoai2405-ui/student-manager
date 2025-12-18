import React, { useState, useRef, useEffect } from "react";
import { Button, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import {
  FlagFilled,
  ReloadOutlined,
  StepForwardOutlined,
  PauseCircleOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
  FullscreenOutlined,
  SaveOutlined
} from "@ant-design/icons";
import axios from "../../Common/axios";
import { useAuth } from "../../contexts/AuthContext";

const SimulationPlayer = ({ data, onNext }) => {
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const learningTimeRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [flagTime, setFlagTime] = useState(null);
  const [score, setScore] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [learningTime, setLearningTime] = useState(0);

  const SCORE_ZONE = 0.5;
  const navigate = useNavigate();

  const { user } = useAuth();

  // Hàm lưu và thoát
  const handleSaveAndExit = async () => {
    await saveLearningTime();
    navigate(-1); // Quay lại trang danh sách simulation
  };

  // Hàm lưu learning time
  const saveLearningTime = async () => {
    console.log(`🔍 saveLearningTime called: time=${learningTimeRef.current}, user=${user?.id}`);
    if (learningTimeRef.current >= 30 && user?.id) { // Yêu cầu tối thiểu 30 giây
      try {
        console.log("📡 Fetching subjects...");
        // Tìm subject_id cho simulations (code "MP")
        const subjectResponse = await axios.get("/api/subjects");
        console.log("📋 Subjects received:", subjectResponse.data);
        const simulationSubject = subjectResponse.data.find(s => s.code === "MP");
        console.log("🎯 Simulation subject found:", simulationSubject);

        if (simulationSubject) {
          // Tạo một lesson_id giả cho simulation (dùng negative ID để phân biệt)
          const fakeLessonId = -data.id; // Dùng negative simulation ID

          console.log("💾 Saving progress...");
          await axios.post("/api/student/lesson-progress", {
            student_id: user.id,
            lesson_id: fakeLessonId, // Dùng fake lesson ID
            watched_seconds: learningTimeRef.current,
            duration_minutes: Math.ceil(learningTimeRef.current / 60),
            subject_id: simulationSubject.id, // Truyền trực tiếp subject_id
          });
          console.log(`✅ Đã lưu ${Math.round(learningTimeRef.current / 60)} phút học simulation`);
        } else {
          console.error("❌ Không tìm thấy subject MP");
        }
      } catch (err) {
        console.error("❌ Lỗi lưu learning time:", err);
      }
    } else {
      console.log(`⚠️ Không đủ điều kiện lưu: time=${learningTimeRef.current}, user=${user?.id}`);
    }
  };

  // Timer cho learning time
  useEffect(() => {
    console.log(`🎬 Video playing state changed: ${isPlaying}, current time: ${learningTimeRef.current}`);
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        learningTimeRef.current += 1;
        setLearningTime(learningTimeRef.current);
        console.log(`⏰ Timer tick: ${learningTimeRef.current} seconds`);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      // Lưu learning time khi thoát
      saveLearningTime();
    };
  }, []);

  useEffect(() => {
    handleReplay();
  }, [data]);

  // Hàm xử lý Cắm cờ (Dùng chung cho cả Phím Space và Nút bấm Mobile)
  const handleFlag = () => {
    if (isPlaying && flagTime === null) {
        // Lấy thời gian hiện tại
        setFlagTime(videoRef.current.currentTime);
    }
  };

  // Bắt sự kiện phím Space
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // Chặn cuộn trang
        if (!isPlaying && !flagTime) {
            // Nếu chưa chạy thì Space có tác dụng Play
            togglePlay();
        } else {
            // Nếu đang chạy thì Space có tác dụng Cắm cờ
            handleFlag();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, flagTime]);

  const handleReplay = () => {
    setFlagTime(null);
    setScore(null);
    setShowResult(false);
    setIsPlaying(true);
    setCurrentTime(0);
    if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value) => {
      if (videoRef.current) {
          videoRef.current.currentTime = value;
          setCurrentTime(value);
      }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
      if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowResult(true);
    calculateScore(flagTime);
  };

  const calculateScore = (userTime) => {
    if (userTime === null) { setScore(0); return; }
    const start = data.point_5; 
    
    if (userTime < start) setScore(0);
    else if (userTime <= start + SCORE_ZONE) setScore(5);
    else if (userTime <= start + SCORE_ZONE * 2) setScore(4);
    else if (userTime <= start + SCORE_ZONE * 3) setScore(3);
    else if (userTime <= start + SCORE_ZONE * 4) setScore(2);
    else if (userTime <= start + SCORE_ZONE * 5) setScore(1);
    else setScore(0); 
  };

  const getPct = (time) => ((time / duration) * 100) + "%";
  const getWidthPct = (seconds) => ((seconds / duration) * 100) + "%";
  const formatTime = (time) => {
      if (!time && time !== 0) return "00:00";
      try { return new Date(time * 1000).toISOString().substr(14, 5); }
      catch { return "00:00"; }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] border border-gray-600 rounded-lg overflow-hidden select-none w-full shadow-2xl">
      
     {/* 1. KHUNG VIDEO – GIỮ TỶ LỆ 16:9 */}
<div className="relative w-full bg-black 
aspect-video sm:aspect-video 
min-h-[240px] 
sm:min-h-[400px]
   
   
 flex items-center justify-center">
  <video
    ref={videoRef}
    src={data.video_url}
    className="absolute inset-0 w-full h-full object-contain"
    onPlay={() => setIsPlaying(true)}
    onPause={() => setIsPlaying(false)}
    onEnded={handleVideoEnd}
    onTimeUpdate={handleTimeUpdate}
    onLoadedMetadata={handleLoadedMetadata}
    autoPlay
    playsInline
    controls={false}
    onClick={togglePlay}
  />

        {/* Nút Play to (Overlay) */}
        {!isPlaying && !showResult && (
            <div
      className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-40"
      onClick={togglePlay}
    >
                <PlayCircleOutlined className="text-6xl sm:text-8xl text-white/90 hover:scale-110 transition-transform" />
    </div>
        )}
      </div>

      {/* 2. THANH MEDIA CONTROL */}
      <div className="bg-[#2a2a2a] px-2 sm:px-3 py-2 flex items-center gap-2 sm:gap-3 text-white border-t border-gray-700">
          <div onClick={togglePlay} className="cursor-pointer hover:text-blue-400 transition text-xl sm:text-2xl">
              {isPlaying ? <PauseCircleOutlined /> : <PlayCircleFilled />}
          </div>
          <div className="flex-1 flex items-center">
             <input 
                type="range" min="0" max={duration || 100} step="0.01"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-blue-500"
             />
          </div>
          <div className="font-mono text-[10px] sm:text-xs text-gray-400 w-16 sm:w-20 text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
          </div>
      </div>

      {/* 3. THANH CÔNG CỤ (Nút SPACE to cho Mobile bấm) */}
      <div className="bg-white py-3 px-2 sm:px-3 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center border-b border-gray-300">
         
         {/* Nút Cắm Cờ (Mobile Clickable) */}
         <div 
            className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
            onClick={handleFlag} // 👇 CHO PHÉP BẤM CHUỘT/TAP ĐỂ CẮM CỜ
         >
             <span
  className={`inline-flex justify-center rounded-lg px-10 sm:px-6 py-3 sm:py-2 
  text-white font-extrabold text-base sm:text-sm shadow-lg 
  border-b-4 transition-all select-none
  ${
    flagTime !== null
      ? "bg-gray-400 border-gray-500 cursor-not-allowed"
      : "bg-red-600 border-red-800 hover:bg-red-500 active:border-b-0 active:translate-y-1"
  }`}
>
  SPACE {flagTime !== null ? "(Đã bấm)" : ""}
</span>
             <span className="text-gray-600 text-xs sm:text-sm hidden sm:inline">
                 Ấn Space để thực hiện
             </span>
         </div>

         <div className="flex gap-2">
             <Button onClick={handleSaveAndExit} danger icon={<SaveOutlined />}>Lưu & Thoát</Button>
             <Button onClick={handleReplay} icon={<ReloadOutlined />}>Làm lại</Button>
             <Button type="primary" onClick={onNext} icon={<StepForwardOutlined />}>Tiếp</Button>
         </div>
      </div>

      {/* 4. THANH THỜI GIAN (TIMELINE) */}
      <div className="bg-[#eef2f5] p-3 sm:p-4 h-24 sm:h-28 flex flex-col justify-center relative shrink-0">
         <div className="relative h-8 sm:h-10 w-full mt-1">
             <div className="absolute inset-0 bg-gray-300 rounded border border-gray-400 overflow-hidden">
                {/* Con trỏ chạy */}
                <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-black z-30 transition-none"
                    style={{ left: getPct(currentTime) }}
                ></div>

                {/* Dải màu điểm */}
                {duration > 0 && (
                    <>
                        <div className="absolute h-full bg-[#00c292] z-10 border-r border-white/20" 
                            style={{ left: getPct(data.point_5), width: getWidthPct(SCORE_ZONE) }}>
                            <span className="absolute bottom-0 left-0.5 text-[8px] text-white font-bold">5</span>
                        </div>
                        <div className="absolute h-full bg-[#75dc3e] z-0 border-r border-white/20" style={{ left: getPct(data.point_5 + SCORE_ZONE), width: getWidthPct(SCORE_ZONE) }}></div>
                        <div className="absolute h-full bg-[#ffc107] z-0 border-r border-white/20" style={{ left: getPct(data.point_5 + SCORE_ZONE * 2), width: getWidthPct(SCORE_ZONE) }}></div>
                        <div className="absolute h-full bg-[#fd7e14] z-0 border-r border-white/20" style={{ left: getPct(data.point_5 + SCORE_ZONE * 3), width: getWidthPct(SCORE_ZONE) }}></div>
                        <div className="absolute h-full bg-[#dc3545] z-0" style={{ left: getPct(data.point_5 + SCORE_ZONE * 4), width: getWidthPct(SCORE_ZONE) }}></div>
                    </>
                )}
             </div>

             {/* Cờ đã cắm */}
             {flagTime !== null && duration > 0 && (
  <div
    className="absolute top-0 h-full z-50 pointer-events-none"
    style={{
      left: `${(flagTime / duration) * 100}%`,
      transform: "translateX(-1px)"
    }}
  >
    {/* Cột đỏ */}
    <div className="h-full w-[2px] bg-red-600"></div>

    {/* Icon cờ */}
    <div className="absolute -top-7 -left-[9px] text-red-600 drop-shadow-md">
      <FlagFilled style={{ fontSize: 20 }} />
    </div>
  </div>
)}
         </div>

         {showResult && (
             <div className="mt-2 text-center font-bold text-base sm:text-lg">
                 KẾT QUẢ: <span className={`text-xl sm:text-2xl ${score===5?'text-green-600':score===0?'text-red-600':'text-yellow-600'}`}>{score}/5 ĐIỂM</span>
             </div>
         )}
      </div>

      <Modal open={showResult} footer={null} closable={false} centered width={300} onCancel={() => setShowResult(false)}>
        <div className="text-center py-2">
            <h2 className="text-xl font-bold text-gray-700">KẾT QUẢ</h2>
            <div className={`text-8xl font-black my-2 ${score===5?'text-[#00c292]':score===0?'text-red-500':'text-yellow-500'}`}>
                {score}
            </div>
            <div className="flex gap-2 justify-center mt-4">
                <Button onClick={handleReplay} icon={<ReloadOutlined />}>Làm lại</Button>
                <Button type="primary" onClick={onNext}>Câu tiếp</Button>
            </div>
        </div>
      </Modal>
    </div>
  ); 
};

export default SimulationPlayer;
