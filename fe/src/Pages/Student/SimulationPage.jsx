import React, { useState, useEffect } from "react";
import { Row, Col, List, Card, Tabs, Typography, Spin, message } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import SimulationPlayer from "../Student/SimulationPlayer"

const { Title } = Typography;

const SimulationPage = () => {
  const [data, setData] = useState([]);
  const [currentSim, setCurrentSim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:3001/api/simulations")
      .then((res) => {
        setData(res.data);
        if (res.data.length > 0) setCurrentSim(res.data[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        message.error("Lỗi tải dữ liệu");
        setLoading(false);
      });
  }, []);

  const handleSelectSim = (sim) => setCurrentSim(sim);

  const handleNext = () => {
      // Lưu learning time trước khi chuyển simulation
      if (currentSim) {
          // Trigger save in SimulationPlayer by calling onNext with save flag
          // The SimulationPlayer will handle saving when component unmounts
      }

      const currentIndex = data.findIndex(d => d.id === currentSim.id);
      if (currentIndex < data.length - 1) {
          setCurrentSim(data[currentIndex + 1]);
      } else {
          message.success("Đã hoàn thành tất cả câu hỏi!");
      }
  }

  if (loading) return <div className="p-20 text-center"><Spin size="large" /></div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-100 p-2">
      {/* HEADER: Đã xóa hướng dẫn Space ở đây cho gọn */}
      <div className="bg-white p-3 mb-2 shadow-sm flex justify-between items-center rounded border-l-4 border-blue-600">
        <Title level={4} style={{margin: 0, textTransform: 'uppercase'}}>Ôn tập 120 tình huống mô phỏng</Title>
      </div>

      <Row gutter={16} className="flex-1 overflow-hidden">
        {/* CỘT TRÁI: VIDEO PLAYER */}
        <Col xs={24} lg={17} className="h-full flex flex-col mb-4 lg:mb-0">
          <div className="bg-white p-1 rounded shadow h-full flex flex-col">
             <div className="p-2 border-b mb-1 flex justify-between items-center">
                <span className="font-bold text-lg text-blue-800">
                    {currentSim ? `Tình huống ${currentSim.stt}: ${currentSim.name}` : "..."}
                </span>
             </div>
             
             <div className="flex-1 bg-black rounded overflow-hidden relative flex flex-col">
                {currentSim ? (
                    <SimulationPlayer data={currentSim} onNext={handleNext} />
                ) : (
                    <div className="text-white text-center mt-20">Vui lòng chọn tình huống</div>
                )}
             </div>
          </div>
        </Col>

        {/* CỘT PHẢI: DANH SÁCH (Giữ nguyên) */}
        <Col xs={24} lg={7} className="h-full">
            <Card 
                className="h-full shadow-md border-0" 
                styles={{ body: { padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
                title={<span className="text-blue-600">DANH SÁCH CÂU HỎI</span>}
            >
                <Tabs 
                    defaultActiveKey="1" 
                    type="line"
                    items={[1,2,3,4,5,6].map(chap => ({
                        key: String(chap),
                        label: `Chương ${chap}`,
                        children: (
                            <div className="h-full overflow-y-auto p-2 scroll-smooth" style={{height: 'calc(100vh - 220px)'}}>
                                <List
                                    dataSource={data.filter(x => x.chapter == chap)}
                                    renderItem={(item) => (
                                        <div 
                                            onClick={() => handleSelectSim(item)}
                                            className={`p-2 mb-2 rounded cursor-pointer border text-xs flex justify-between items-center transition-all
                                                ${currentSim?.id === item.id 
                                                    ? 'bg-blue-600 text-white font-bold shadow-md' 
                                                    : 'bg-white hover:bg-blue-50 text-gray-700'
                                                }`}
                                        >
                                            <span className="mr-2 w-12">Câu {item.stt}</span>
                                            <span className="truncate flex-1">{item.name}</span>
                                            {currentSim?.id === item.id && <PlayCircleOutlined />}
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
