import React, { useState, useRef, useEffect } from "react";
import { Button, Modal } from "antd";
import { 
  FlagFilled, 
  ReloadOutlined, 
  PlayCircleOutlined, 
  StepForwardOutlined, 
  PauseCircleOutlined,
  PlayCircleFilled
} from "@ant-design/icons";

const SimulationPlayer = ({ data, onNext }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flagTime, setFlagTime] = useState(null); 
  const [score, setScore] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0); 
  const [duration, setDuration] = useState(0);

  // Cấu hình vùng điểm (0.5 giây cho mỗi thang điểm)
  const SCORE_ZONE = 0.5; 

  useEffect(() => {
    handleReplay();
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && isPlaying && flagTime === null) {
        e.preventDefault();
        setFlagTime(videoRef.current.currentTime);
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
    
    // Logic điểm chuẩn
    if (userTime < start) setScore(0);
    else if (userTime <= start + SCORE_ZONE) setScore(5);
    else if (userTime <= start + SCORE_ZONE * 2) setScore(4);
    else if (userTime <= start + SCORE_ZONE * 3) setScore(3);
    else if (userTime <= start + SCORE_ZONE * 4) setScore(2);
    else if (userTime <= start + SCORE_ZONE * 5) setScore(1);
    else setScore(0); 
  };

  // Tính % vị trí CSS
  const getPct = (time) => ((time / duration) * 100) + "%";
  const getWidthPct = (seconds) => ((seconds / duration) * 100) + "%";
  const formatTime = (time) => new Date(time * 1000).toISOString().substr(14, 5);

  return (
    <div className="flex flex-col h-full bg-[#222] border border-gray-600 rounded-lg overflow-hidden select-none">
      
      {/* 1. KHUNG VIDEO (ĐÃ SỬA CHO TO HẾT CỠ) */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden group">
        <video
            ref={videoRef}
            src={data.video_url}
            // Thay max-h-[55vh] bằng h-full để video bung lụa
            className="w-full h-full object-contain" 
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnd}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            autoPlay
            muted={false}
            controls={false}
            onClick={togglePlay}
        />

        {/* --- ĐÃ XÓA DEBUG INFO GÓC TRÁI --- */}
        {/* --- ĐÃ XÓA CỜ GÓC PHẢI --- */}

        {/* Nút Play to giữa màn hình (Chỉ hiện khi Pause) */}
        {!isPlaying && !showResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-40" onClick={togglePlay}>
                <PlayCircleOutlined className="text-8xl text-white opacity-90 hover:scale-110 transition-transform" />
            </div>
        )}
      </div>

      {/* 2. THANH MEDIA CONTROL */}
      <div className="bg-[#333] px-4 py-2 flex items-center gap-4 text-white">
          <div onClick={togglePlay} className="cursor-pointer hover:text-blue-400 transition text-2xl">
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
          <div className="font-mono text-xs text-gray-300 w-24 text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
          </div>
      </div>

      {/* 3. THANH CÔNG CỤ */}
      <div className="bg-white py-2 px-4 flex justify-between items-center border-b border-gray-300">
         <div className="flex items-center gap-3">
             <span className="inline-flex rounded-md bg-blue-600 px-6 py-1 text-white font-bold text-sm shadow border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all cursor-pointer">
                SPACE
             </span>
             <span className="text-gray-600 text-sm hidden md:inline font-medium">
                 Bấm phím cách để cắm cờ
             </span>
         </div>
         <div className="flex gap-2">
             <Button onClick={handleReplay} icon={<ReloadOutlined />}>Làm lại</Button>
             <Button type="primary" onClick={onNext} icon={<StepForwardOutlined />}>Câu tiếp</Button>
         </div>
      </div>

      {/* 4. THANH THỜI GIAN (TIMELINE) */}
      <div className="bg-[#eef2f5] p-4 h-24 flex flex-col justify-center relative">
         
         <div className="relative h-10 w-full bg-gray-300 rounded border border-gray-400 overflow-hidden cursor-crosshair">
             
             {/* Con trỏ chạy */}
             <div 
                className="absolute top-0 bottom-0 w-[2px] bg-black z-30 transition-none"
                style={{ left: getPct(currentTime) }}
             ></div>

             {/* DẢI MÀU ĐIỂM (Xếp gạch liên tiếp) */}
             {duration > 0 && (
                <>
                    {/* 5 Điểm (Xanh đậm) */}
                    <div className="absolute h-full bg-[#00c292] z-10 border-r border-white/20" 
                         style={{ left: getPct(data.point_5), width: getWidthPct(SCORE_ZONE) }} title="5 Điểm">
                         <span className="absolute bottom-0 left-0.5 text-[8px] text-white font-bold">5</span>
                    </div>

                    {/* 4 Điểm */}
                    <div className="absolute h-full bg-[#75dc3e] z-10 border-r border-white/20" 
                         style={{ left: getPct(data.point_5 + SCORE_ZONE), width: getWidthPct(SCORE_ZONE) }} title="4 Điểm">
                    </div>

                    {/* 3 Điểm */}
                    <div className="absolute h-full bg-[#ffc107] z-10 border-r border-white/20" 
                         style={{ left: getPct(data.point_5 + SCORE_ZONE * 2), width: getWidthPct(SCORE_ZONE) }} title="3 Điểm">
                    </div>

                    {/* 2 Điểm */}
                    <div className="absolute h-full bg-[#fd7e14] z-10 border-r border-white/20" 
                         style={{ left: getPct(data.point_5 + SCORE_ZONE * 3), width: getWidthPct(SCORE_ZONE) }} title="2 Điểm">
                    </div>

                    {/* 1 Điểm */}
                    <div className="absolute h-full bg-[#dc3545] z-10" 
                         style={{ left: getPct(data.point_5 + SCORE_ZONE * 4), width: getWidthPct(SCORE_ZONE) }} title="1 Điểm">
                    </div>
                </>
             )}

             {/* === CỜ CỦA NGƯỜI DÙNG (CHỈ HIỆN Ở ĐÂY) === */}
             {flagTime && (
                <div 
                    className="absolute h-full w-[2px] bg-red-600 z-50 top-0 drop-shadow-md"
                    style={{ left: getPct(flagTime) }}
                >
                    {/* Icon cờ nằm ngay trên thanh màu */}
                    <FlagFilled className="text-red-600 absolute -top-4 -left-1.5 text-2xl animate-bounce" />
                </div>
             )}
         </div>

         {/* Kết quả */}
         {showResult && (
             <div className="mt-1 text-center font-bold text-lg animate-pulse">
                 KẾT QUẢ: <span className={`text-2xl ${score===5?'text-green-600':score===0?'text-red-600':'text-yellow-600'}`}>{score}/5 ĐIỂM</span>
             </div>
         )}
      </div>

      {/* Modal Kết quả */}
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