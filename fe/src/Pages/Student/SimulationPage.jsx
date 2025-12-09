import React, { useState, useEffect, useRef } from "react";
import { Row, Col, List, Card, Button, Tag, Tabs, Typography, Spin } from "antd";
import { FlagFilled, ReloadOutlined, PlayCircleOutlined } from "@ant-design/icons";
import axios from "../../Common/axios";

const { Title, Text } = Typography;

const SimulationPage = () => {
  const [data, setData] = useState([]); // Toàn bộ 120 câu
  const [currentSim, setCurrentSim] = useState(null); // Câu đang chơi
  const [loading, setLoading] = useState(true);

  // State xử lý Video & Điểm
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flagTime, setFlagTime] = useState(null); // Thời gian bấm Space
  const [score, setScore] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState(0);


  // 1. Load dữ liệu 120 câu
  useEffect(() => {
    console.log("Đang gọi API lấy 120 câu...");
    axios
      .get("http://localhost:3001/api/simulations")
      .then((res) => {
        setData(res.data);
        if (res.data.length > 0) setCurrentSim(res.data[0]); // Mặc định chọn câu 1
      })
      .catch((err) => {
        console.error("Lỗi gọi API:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Xử lý phím SPACE
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && isPlaying && flagTime === null) {
        e.preventDefault(); // Chặn scroll trang
        const t = videoRef.current.currentTime;
        setFlagTime(t); // Cắm cờ
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, flagTime]);

  // 3. Xử lý khi chọn câu khác
  const handleSelectSim = (sim) => {
    setCurrentSim(sim);
    handleReplay(); // Reset lại từ đầu
  };

  // 4. Reset chơi lại
  const handleReplay = () => {
    setFlagTime(null);
    setScore(null);
    setShowResult(false);
    setIsPlaying(true);
    if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
    }
  };

  // 5. Tính điểm khi video kết thúc
  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowResult(true);

    if (flagTime === null) {
      setScore(0);
      return;
    }

    // Logic điểm chuẩn (Mỗi thang điểm cách nhau khoảng 0.5s - 0.7s)
    // Bạn có thể tinh chỉnh số này cho khớp với phần mềm gốc
    const p5 = currentSim.point_5;
    
    if (flagTime < p5) setScore(0); // Sớm quá
    else if (flagTime <= p5 + 0.5) setScore(5);
    else if (flagTime <= p5 + 1.0) setScore(4);
    else if (flagTime <= p5 + 1.5) setScore(3);
    else if (flagTime <= p5 + 2.0) setScore(2);
    else if (flagTime <= p5 + 2.5) setScore(1);
    else setScore(0); // Muộn quá
  };

  if (loading) return <div className="p-20 text-center"><Spin size="large"/></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-100 p-2">
      {/* HEADER */}
      <div className="bg-white p-3 mb-2 shadow-sm flex justify-between items-center rounded">
        <Title level={4} style={{margin: 0}}>ÔN TẬP MÔ PHỎNG 120 TÌNH HUỐNG</Title>
        <div>
            <span className="mr-2 text-gray-500">Bấm phím</span>
            <Tag color="blue" className="font-bold text-base px-4 py-1">SPACE</Tag>
            <span className="text-gray-500">để cắm cờ khi phát hiện nguy hiểm</span>
        </div>
      </div>

      <Row gutter={16} className="flex-1 overflow-hidden">
        {/* CỘT TRÁI: VIDEO PLAYER */}
        <Col span={17} className="h-full flex flex-col">
          <div className="bg-black rounded-lg overflow-hidden relative flex-1 flex items-center justify-center shadow-lg border border-gray-600">
            {currentSim && (
              <video
                ref={videoRef}
                src={currentSim.video_url}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleVideoEnd}
                // ⭐ BẮT BUỘC PHẢI CÓ — cập nhật % video
  onTimeUpdate={() => {
    if (videoRef.current?.duration) {
      const percent =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  }}
                controls={true} // Hiển thị thanh thời gian của video
                autoPlay
              />
            )}

            {/* Nút Play to giữa màn hình lúc mới vào */}
            {!isPlaying && !showResult && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={handleReplay}>
                  <PlayCircleOutlined className="text-6xl text-white opacity-80 hover:opacity-100 transition" />
               </div>
            )}

            {/* Hiển thị Cờ khi bấm */}
            {flagTime && (
                <div className="absolute top-5 right-5 animate-bounce">
                    <Tag color="red" icon={<FlagFilled />} className="text-lg py-1 px-3 border-2 border-white">
                        FLAG
                    </Tag>
                </div>
            )}
          </div>

          {/* THANH ĐIỂM (TIMELINE BAR) - GIỐNG ẢNH MẪU */}
          <div className="mt-4 bg-white p-4 rounded shadow-md relative select-none">
             <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-lg">
                    {currentSim ? `Tình huống ${currentSim.stt}: ${currentSim.name}` : "Chọn tình huống"}
                </div>
                {showResult && (
                    <div className={`text-2xl font-black ${score===0 ? 'text-red-500' : 'text-green-600'}`}>
                        {score}/5 ĐIỂM
                    </div>
                )}
             </div>

             {/* Thanh Timeline Mô phỏng */}
             {/* THANH TIẾN TRÌNH VIDEO + MỐC ĐIỂM 5 + CẮM CỜ */}
<div className="relative w-full h-5 bg-gray-300 rounded overflow-hidden border border-gray-400 mt-2">

  {/* Tiến trình video */}
  <div
    className="h-full bg-blue-500 transition-all duration-100"
    style={{ width: `${progress}%` }}
  ></div>

  {/* Mốc 5 điểm */}
  {currentSim && videoRef.current?.duration && (
    <div
      className="absolute top-0 bottom-0 w-1 bg-green-600"
      style={{
        left: `${
          (currentSim.point_5 / videoRef.current.duration) * 100
        }%`,
      }}
      title="Mốc 5 điểm"
    ></div>
  )}

  {/* Cờ của người dùng */}
  {flagTime !== null && videoRef.current?.duration && (
    <div
      className="absolute top-0 bottom-0 w-1 bg-red-600"
      style={{
        left: `${(flagTime / videoRef.current.duration) * 100}%`,
      }}
      title="Thời điểm cắm cờ"
    ></div>
  )}
</div>

             
             <div className="mt-3 flex justify-end">
                <Button type="primary" icon={<ReloadOutlined />} onClick={handleReplay} size="large">
                    Làm lại 
                </Button>
             </div>
          </div>
        </Col>

        {/* CỘT PHẢI: DANH SÁCH 120 CÂU */}
        <Col span={7} className="h-full">
            <Card
                className="h-full shadow-md flex flex-col"
                styles={{ body: { padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
                title="DANH SÁCH CÂU HỎI"
            >
                <Tabs 
                    defaultActiveKey="1" 
                    tabPosition="top"
                    className="flex-1 overflow-hidden"
                    type="card"
                    items={[1,2,3,4,5,6].map(chap => ({
                        key: String(chap),
                        label: `Chương ${chap}`,
                        children: (
                            <div className="h-full overflow-y-auto p-2" style={{maxHeight: 'calc(100vh - 200px)'}}>
                                <List
                                    dataSource={data.filter(x => x.chapter == chap)}
                                    renderItem={(item) => (
                                        <div 
                                            onClick={() => handleSelectSim(item)}
                                            className={`p-3 mb-2 rounded cursor-pointer border transition-colors flex justify-between items-center
                                                ${currentSim?.id === item.id 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                                    : 'bg-white hover:bg-blue-50 border-gray-200 text-gray-700'
                                                }`}
                                        >
                                            <span className="font-bold mr-2">Câu {item.stt}</span>
                                            <span className="truncate text-xs flex-1">{item.name}</span>
                                        </div>
                                    )}
                                />
                            </div>
                        )
                    }))}
                />
            </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SimulationPage;
