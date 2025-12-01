import React, { useState, useEffect } from "react";
import { Layout, Menu, Empty, Button, Typography } from "antd";
import {
  PlayCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";

const { Sider, Content } = Layout;
const { Title } = Typography;

const Learning = () => {
  const [subjects, setSubjects] = useState([]);
  const [currentSubjectId, setCurrentSubjectId] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null); // Bài đang học
  const [collapsed, setCollapsed] = useState(false);

  // 1. Load danh sách môn học
  useEffect(() => {
    fetch("http://localhost:3001/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) setCurrentSubjectId(data[0].id);
      });
  }, []);

  // 2. Load bài giảng khi chọn môn
  useEffect(() => {
    if (currentSubjectId) {
      fetch(`http://localhost:3001/api/lessons?subject_id=${currentSubjectId}`)
        .then((res) => res.json())
        .then((data) => {
          setLessons(data);
          if (data.length > 0) setCurrentLesson(data[0]); // Mặc định mở bài 1
          else setCurrentLesson(null);
        });
    }
  }, [currentSubjectId]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-lg shadow overflow-hidden">
      {/* Thanh chọn môn học ngang ở trên */}
      <div className="flex overflow-x-auto gap-2 p-2 border-b bg-gray-50">
        {subjects.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setCurrentSubjectId(sub.id)}
            className={`px-4 py-2 rounded whitespace-nowrap text-sm font-bold transition
              ${
                currentSubjectId === sub.id
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-100"
              }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      <Layout className="flex-1">
        {/* VIDEO PLAYER (Bên trái) */}
        <Content className="bg-black flex flex-col items-center justify-center relative">
          {currentLesson ? (
            <div className="w-full h-full">
              {/* Nếu là link YouTube Embed */}
              {currentLesson.video_url?.includes("youtube") ||
              currentLesson.video_url?.includes("embed") ? (
                <iframe
                  src={currentLesson.video_url}
                  title={currentLesson.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                // Nếu là file MP4 trực tiếp
                <video
                  controls
                  className="w-full h-full max-h-[600px]"
                  src={currentLesson.video_url}
                >
                  Trình duyệt không hỗ trợ video.
                </video>
              )}
            </div>
          ) : (
            <div className="text-white">Chưa có bài giảng nào</div>
          )}
        </Content>

        {/* DANH SÁCH BÀI HỌC (Bên phải) */}
        <Sider
          width={320}
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          className="border-l overflow-y-auto"
        >
          <div className="p-3 bg-gray-100 border-b flex justify-between items-center sticky top-0 z-10">
            {!collapsed && (
              <span className="font-bold text-gray-700">NỘI DUNG KHÓA HỌC</span>
            )}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>

          <Menu
            mode="inline"
            selectedKeys={[currentLesson?.id?.toString()]}
            items={lessons.map((lesson, index) => ({
              key: lesson.id.toString(),
              icon: <PlayCircleOutlined />,
              label: (
                <div className="whitespace-normal py-2 leading-tight">
                  <div className="font-semibold text-xs text-gray-500">
                    Bài {index + 1}
                  </div>
                  <div>{lesson.title}</div>
                  <div className="text-xs text-gray-400 mt-1">10:00</div>
                </div>
              ),
              onClick: () => setCurrentLesson(lesson),
            }))}
          />
        </Sider>
      </Layout>

      {/* Tiêu đề bài đang học */}
      <div className="p-4 border-t bg-white">
        <Title level={4} style={{ margin: 0 }}>
          {currentLesson ? currentLesson.title : "Chọn bài học để bắt đầu"}
        </Title>
      </div>
    </div>
  );
};

export default Learning;
