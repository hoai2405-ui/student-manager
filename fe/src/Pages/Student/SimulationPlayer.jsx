import React, { useState, useRef, useEffect } from "react";
import { Button, Tag, Modal } from "antd";
import { FlagFilled, ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";

const SimulationPlayer = ({ data, onNext }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flagTime, setFlagTime] = useState(null); 
  const [score, setScore] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // State thời gian
  const [currentTime, setCurrentTime] = useState(0); 
  const [duration, setDuration] = useState(0);

  // Reset khi đổi bài
  useEffect(() => {
    handleReplay();
  }, [data]);

  // Bắt phím Space
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

  // Cập nhật thời gian
  const handleTimeUpdate = () => {
    if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
      if (videoRef.current) {
          setDuration(videoRef.current.duration);
      }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowResult(true);
    calculateScore(flagTime);
  };

  // Logic điểm
  const calculateScore = (userTime) => {
    if (userTime === null) { setScore(0); return; }
    const start = data.point_5; 
    if (userTime < start) setScore(0);
    else if (userTime <= start + 0.55) setScore(5);
    else if (userTime <= start + 1.10) setScore(4);
    else if (userTime <= start + 1.65) setScore(3);
    else if (userTime <= start + 2.20) setScore(2);
    else if (userTime <= start + 2.75) setScore(1);
    else setScore(0);
  };

  const getPct = (time) => ((time / duration) * 100) + "%";
  const getWidthPct = (seconds) => ((seconds / duration) * 100) + "%";

  return (
    <div className="bg-black rounded-lg overflow-hidden relative shadow-lg border border-gray-600 flex flex-col select-none group">
      
      <div className="relative bg-black flex-1 flex items-center justify-center">
        <video
            ref={videoRef}
            src={data.video_url}
            className="w-full h-full max-h-[60vh] object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnd}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            autoPlay
            muted={false} // Đảm bảo có tiếng nếu video có tiếng
            controls={false}
        />

        {/* --- ĐỒNG HỒ THỜI GIAN (ĐÃ SỬA CSS ĐỂ LUÔN HIỆN) --- */}
        <div 
            className="absolute top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none"
            style={{ textShadow: '1px 1px 2px black' }}
        >
            {/* Đồng hồ chạy */}
            <div className="bg-black/80 text-white border border-gray-500 px-3 py-1 rounded shadow-md flex items-center gap-2">
                <ClockCircleOutlined className="text-green-400 animate-pulse" />
                <span className="font-mono text-xl font-bold text-green-400">
                    {currentTime.toFixed(3)}s
                </span>
                <span className="text-gray-400 text-xs"> / {duration.toFixed(1)}s</span>
            </div>

            {/* Mốc điểm chuẩn (Gợi ý) */}
            <div className="bg-yellow-600/90 text-white border border-yellow-400 px-3 py-1 rounded shadow-md font-bold text-sm">
                🎯 Điểm 5: {data.point_5.toFixed(3)}s
            </div>

            {/* Thời gian bấm của bạn */}
            {flagTime && (
                <div className={`px-3 py-1 rounded shadow-md font-bold text-sm border ${flagTime < data.point_5 ? 'bg-red-600/90 border-red-400' : 'bg-blue-600/90 border-blue-400'}`}>
                    🚩 Bạn bấm: {flagTime.toFixed(3)}s
                </div>
            )}
        </div>

        {/* Nút Play to */}
        {!isPlaying && !showResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-40" onClick={handleReplay}>
                <PlayCircleOutlined className="text-8xl text-white opacity-80 hover:opacity-100 transition-all hover:scale-110 drop-shadow-lg" />
            </div>
        )}

        {/* Cờ hiệu ứng */}
        {flagTime && (
            <div className="absolute top-4 right-4 animate-bounce z-50">
                <Tag color="red" className="text-xl px-4 py-1 border-2 border-white font-bold shadow-lg">
                    <FlagFilled /> ĐÃ CẮM CỜ
                </Tag>
            </div>
        )}
      </div>

      {/* Overlay thanh timeline trên video */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 z-50">
         <div className="relative h-6 w-full bg-gray-600 rounded border border-gray-400 overflow-hidden cursor-crosshair">

             {/* Con trỏ chạy */}
             <div
                className="absolute top-0 bottom-0 w-[1px] bg-white z-30"
                style={{ left: getPct(currentTime) }}
             ></div>

             {/* Thang điểm màu */}
             {duration > 0 && (
                <>
                    <div className="absolute h-full bg-green-500 z-10 opacity-70" style={{ left: getPct(data.point_5), width: getWidthPct(0.55) }}>
                         <span className="absolute bottom-[-18px] left-0 text-[8px] text-white font-bold">5</span>
                    </div>
                    <div className="absolute h-full bg-green-400 z-0 opacity-70" style={{ left: getPct(data.point_5), width: getWidthPct(1.10) }}></div>
                    <div className="absolute h-full bg-yellow-500 z-0 opacity-70" style={{ left: getPct(data.point_5), width: getWidthPct(1.65) }}></div>
                    <div className="absolute h-full bg-orange-500 z-0 opacity-70" style={{ left: getPct(data.point_5), width: getWidthPct(2.20) }}></div>
                    <div className="absolute h-full bg-red-500 z-0 opacity-70" style={{ left: getPct(data.point_5), width: getWidthPct(2.75) }}></div>
                </>
             )}

             {/* Cờ đã cắm */}
             {flagTime && (
                <div
                    className="absolute h-full w-[2px] bg-red-500 z-40 top-0 flex items-start justify-center"
                    style={{ left: getPct(flagTime) }}
                >
                    <FlagFilled className="text-red-500 text-xs mt-[-8px]" />
                </div>
             )}
         </div>

         {showResult && (
             <div className="mt-1 text-center text-white font-bold text-sm">
                 <span className={`${score===5?'text-green-400':score===0?'text-red-500':'text-yellow-400'}`}>{score}/5</span>
             </div>
         )}
      </div>

      {/* Modal Kết quả */}
      <Modal open={showResult} footer={null} closable={false} centered width={300} onCancel={() => setShowResult(false)}>
        <div className="text-center">
            <h2 className="text-2xl font-bold">KẾT QUẢ</h2>
            <div className={`text-7xl font-black my-2 ${score===5?'text-green-600':score===0?'text-red-500':'text-yellow-500'}`}>{score}</div>
            <p className="text-gray-500 mb-4">
                {score === 5 ? "Tuyệt vời!" : score === 0 ? (flagTime < data.point_5 ? "Quá sớm!" : "Quá muộn!") : "Cần cố gắng hơn."}
            </p>
            <Button type="primary" onClick={handleReplay} icon={<ReloadOutlined />}>Làm lại (Space)</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SimulationPlayer;
