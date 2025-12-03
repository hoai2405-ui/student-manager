import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Upload,
  Card,
  Row,
  Col,
  Tag,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";

const ManageLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null); // State for editing

  // State lưu file vừa upload (URL và Loại file)
  const [uploadedFile, setUploadedFile] = useState({ url: "", type: "" });

  const [form] = Form.useForm();

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchLessons(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/subjects");
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubject(res.data[0].id);
    } catch {
      message.error("Lỗi tải môn học");
    }
  };

  const fetchLessons = async (subjectId) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/lessons?subject_id=${subjectId}`
      );
      setLessons(res.data);
    } catch {
      message.error("Lỗi tải bài giảng");
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM UPLOAD FILE (Sửa lại cho đúng) ---
  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Gọi API upload mới (upload được cả PDF và Video)
      const res = await axios.post(
        "http://localhost:3001/api/upload/file",
        formData
      );

      // Lưu thông tin file trả về
      setUploadedFile({
        url: res.data.url,
        type: res.data.type, // 'video' hoặc 'pdf'
      });

      message.success("Upload thành công!");
      onSuccess("Ok");
    } catch (err) {
      message.error("Upload thất bại. File quá lớn hoặc sai định dạng.");
      onError(err);
    }
  };

  // --- HÀM MỞ MODAL SỬA ---
  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    form.setFieldsValue({
      lesson_code: lesson.lesson_code,
      title: lesson.title,
      video_url: lesson.video_url,
      lesson_order: lesson.lesson_order,
    });
    setIsModalOpen(true);
  };

  // --- HÀM LƯU/SỬA BÀI GIẢNG ---
  const handleSubmitLesson = async (values) => {
    try {
      let pdfUrl = "";
      let videoUrl = values.video_url || ""; // Giữ link youtube nếu có

      // Tự động gán vào đúng cột dựa trên loại file
      if (uploadedFile.type === "pdf") {
        pdfUrl = uploadedFile.url;
      } else if (uploadedFile.type === "video") {
        videoUrl = uploadedFile.url; // Ưu tiên file video upload lên
      }

      if (editingLesson) {
        // Sửa bài giảng
        await axios.put(`http://localhost:3001/api/lessons/${editingLesson.id}`, {
          title: values.title,
          video_url: videoUrl,
          lesson_order: values.lesson_order,
        });
        message.success("Cập nhật bài giảng thành công!");
      } else {
        // Thêm mới
        console.log("Dữ liệu gửi đi:", {
          title: values.title,
          code: values.lesson_code,
          pdf: pdfUrl,
          video: videoUrl,
        });
        await axios.post("http://localhost:3001/api/lessons", {
          subject_id: selectedSubject,
          title: values.title,
          lesson_code: values.lesson_code, // Lưu mã bài giảng
          lesson_order: values.lesson_order,
          video_url: videoUrl,
          pdf_url: pdfUrl,
          duration_minutes: values.duration_minutes,
        });
        message.success("Thêm bài giảng thành công!");
      }

      setIsModalOpen(false);
      setEditingLesson(null);
      form.resetFields();
      setUploadedFile({ url: "", type: "" }); // Reset upload
      fetchLessons(selectedSubject);
    } catch {
      message.error(editingLesson ? "Lỗi cập nhật bài giảng" : "Lỗi thêm bài giảng");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/lessons/${id}`);
      message.success("Đã xóa");
      fetchLessons(selectedSubject);
    } catch {
      message.error("Lỗi xóa");
    }
  };

  // --- CẤU HÌNH CỘT BẢNG (Hiển thị đầy đủ thông tin) ---
  const columns = [
    {
      title: "#",
      dataIndex: "lesson_order",
      width: 50,
      align: "center",
      sorter: (a, b) => a.lesson_order - b.lesson_order,
    },
    {
      title: "Mã bài",
      dataIndex: "lesson_code",
      width: 120,
      render: (text) => <Tag color="blue">{text || "---"}</Tag>, // Hiển thị mã bài đẹp hơn
    },
    {
      title: "Tên bài giảng",
      dataIndex: "title",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Tài liệu",
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          {/* Nếu có PDF */}
          {record.pdf_url && (
            <a
              href={`http://localhost:3001${record.pdf_url}`}
              target="_blank"
              rel="noreferrer"
            >
              <Tag color="red" icon={<FilePdfOutlined />}>
                PDF
              </Tag>
            </a>
          )}

          {/* Nếu có Video */}
          {record.video_url && (
            <Tag color="geekblue" icon={<VideoCameraOutlined />}>
              Video
            </Tag>
          )}

          {/* Nếu trống */}
          {!record.pdf_url && !record.video_url && (
            <span className="text-gray-400">Trống</span>
          )}
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-500"
          />
          <Popconfirm
            title="Xóa bài này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-800 uppercase">
          Quản lý bài giảng
        </h2>
      </div>

      <Card className="mb-4 shadow-sm" styles={{ body: { padding: "15px" } }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <span className="mr-2 font-bold">Đang xem môn:</span>
            <Select
              className="w-full md:w-96"
              size="large"
              value={selectedSubject}
              onChange={setSelectedSubject}
              options={subjects.map((s) => ({ label: s.name, value: s.id }))}
              placeholder="Chọn môn học..."
            />
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Thêm bài giảng
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={lessons}
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Chưa có bài giảng nào" }}
      />

      {/* MODAL */}
      <Modal
        title={editingLesson ? "Sửa bài giảng" : "Thêm bài giảng mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingLesson(null);
          form.resetFields();
          setUploadedFile({ url: "", type: "" });
        }}
        footer={null}
        destroyOnClose // Reset form khi đóng
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitLesson}>
          {!editingLesson && (
            <Form.Item label="Mã bài giảng (VD: PL-C1)" name="lesson_code">
              <Input placeholder="Nhập mã..." />
            </Form.Item>
          )}

          <Form.Item
            label="Tên bài giảng"
            name="title"
            rules={[{ required: true, message: "Nhập tên bài" }]}
          >
            <Input placeholder="Nhập tên..." />
          </Form.Item>
          <Form.Item
            label="Thời lượng (phút)"
            name="duration_minutes"
            initialValue={45}
            rules={[{ required: true, message: "Nhập thời lượng" }]}
          >
            <Input type="number" suffix="phút" />
          </Form.Item>

          {/* UPLOAD FILE - Chỉ hiện khi thêm mới */}
          {!editingLesson && (
            <Form.Item
              label="Tài liệu (PDF hoặc Video MP4)"
              extra="Hỗ trợ file PDF và Video (.mp4)"
            >
              <Upload
                customRequest={handleUpload}
                maxCount={1}
                accept=".pdf,video/*"
              >
                <Button icon={<UploadOutlined />}>Chọn file</Button>
              </Upload>

              {/* Hiển thị trạng thái upload */}
              {uploadedFile.url && (
                <div className="text-green-600 mt-1 text-xs">
                  ✅ Đã upload:{" "}
                  {uploadedFile.type === "video" ? "Video" : "PDF"}
                </div>
              )}
            </Form.Item>
          )}

          <Form.Item
            label="Link Youtube (Nếu không upload video)"
            name="video_url"
          >
            <Input
              prefix={<VideoCameraOutlined />}
              placeholder="https://youtube.com/embed/..."
            />
          </Form.Item>

          <Form.Item
            label="Thứ tự hiển thị"
            name="lesson_order"
            initialValue={
              editingLesson ? editingLesson.lesson_order : lessons.length + 1
            }
          >
            <Input type="number" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            className="mt-4"
          >
            {editingLesson ? "CẬP NHẬT BÀI GIẢNG" : "LƯU BÀI GIẢNG"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageLessons;
