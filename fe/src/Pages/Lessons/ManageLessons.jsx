import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

const ManageLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Filter môn học đang chọn
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Load dữ liệu ban đầu
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Khi chọn môn học -> Load bài giảng môn đó
  useEffect(() => {
    if (selectedSubject) {
      fetchLessons(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    const res = await fetch("http://localhost:3001/api/subjects");
    const data = await res.json();
    setSubjects(data);
    if (data.length > 0) setSelectedSubject(data[0].id); // Mặc định chọn môn đầu
  };

  const fetchLessons = async (subjectId) => {
    setLoading(true);
    const res = await fetch(
      `http://localhost:3001/api/lessons?subject_id=${subjectId}`
    );
    const data = await res.json();
    setLessons(data);
    setLoading(false);
  };

  const handleAddLesson = async (values) => {
    try {
      await fetch("http://localhost:3001/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, subject_id: selectedSubject }),
      });
      message.success("Thêm bài giảng thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchLessons(selectedSubject); // Reload list
    } catch (error) {
      message.error("Lỗi thêm bài giảng");
    }
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:3001/api/lessons/${id}`, {
      method: "DELETE",
    });
    message.success("Đã xóa");
    fetchLessons(selectedSubject);
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "lesson_order",
      width: 80,
      sorter: (a, b) => a.lesson_order - b.lesson_order,
    },
    {
      title: "Tên bài giảng",
      dataIndex: "title",
      render: (text) => <span className="font-bold">{text}</span>,
    },
    {
      title: "Video URL",
      dataIndex: "video_url",
      render: (link) =>
        link ? (
          <a href={link} target="_blank" rel="noreferrer">
            <VideoCameraOutlined /> Xem link
          </a>
        ) : (
          "Chưa có"
        ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Xóa bài này?"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button danger icon={<DeleteOutlined />} size="small">
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-blue-800">
        QUẢN LÝ BÀI GIẢNG ĐIỆN TỬ
      </h2>

      <div className="flex gap-4 mb-4 items-center bg-gray-50 p-3 rounded border">
        <span className="font-bold">Chọn môn học:</span>
        <Select
          style={{ width: 300 }}
          value={selectedSubject}
          onChange={setSelectedSubject}
          options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Thêm bài giảng mới
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={lessons}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />

      {/* Modal Thêm bài */}
      <Modal
        title="Thêm bài giảng mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddLesson}>
          <Form.Item
            label="Tên bài giảng"
            name="title"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ví dụ: Chương 1: Khái niệm..." />
          </Form.Item>
          <Form.Item
            label="Link Video (YouTube Embed hoặc MP4)"
            name="video_url"
          >
            <Input placeholder="https://www.youtube.com/embed/..." />
          </Form.Item>
          <Form.Item label="Thứ tự bài" name="lesson_order">
            <Input type="number" />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="w-full">
            Lưu lại
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageLessons;
