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
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";

const ManageLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null); // Lưu bài đang sửa (nếu có)

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [uploadedFile, setUploadedFile] = useState({ url: "", type: "" });

  const [form] = Form.useForm();

  // 1. Load danh sách môn học
  useEffect(() => {
    fetchSubjects();
  }, []);

  // 2. Load bài giảng khi chọn môn
  useEffect(() => {
    if (selectedSubject) {
      fetchLessons(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/subjects");
      setSubjects(res.data);
      if (res.data.length > 0 && !selectedSubject)
        setSelectedSubject(res.data[0].id);
    } catch (error) {
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
    } catch (error) {
      message.error("Lỗi tải bài giảng");
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM UPLOAD FILE ---
  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:3001/api/upload/file",
        formData
      );
      setUploadedFile({
        url: res.data.url,
        type: res.data.type,
      });
      message.success("Upload thành công!");
      onSuccess("Ok");
    } catch (err) {
      message.error("Lỗi upload file");
      onError(err);
    }
  };

  // --- HÀM MỞ MODAL ĐỂ THÊM MỚI ---
  const openAddModal = () => {
    setEditingLesson(null); // Xóa trạng thái sửa
    setUploadedFile({ url: "", type: "" }); // Reset file
    form.resetFields(); // Xóa form

    // Gợi ý số thứ tự tiếp theo
    const nextOrder =
      lessons.length > 0
        ? Math.max(...lessons.map((l) => l.lesson_order)) + 1
        : 1;
    form.setFieldsValue({ lesson_order: nextOrder });

    setIsModalOpen(true);
  };

  // --- HÀM MỞ MODAL ĐỂ SỬA (QUAN TRỌNG) ---
  const openEditModal = (record) => {
    setEditingLesson(record); // Lưu bài đang sửa

    // Nếu bài cũ có file, set lại state để code biết
    let fileType = "";
    let fileUrl = "";
    if (record.pdf_url) {
      fileType = "pdf";
      fileUrl = record.pdf_url;
    } else if (record.video_url && record.video_url.startsWith("/uploads")) {
      fileType = "video";
      fileUrl = record.video_url;
    }

    setUploadedFile({ url: fileUrl, type: fileType });

    // Điền dữ liệu cũ vào Form
    form.setFieldsValue({
      lesson_code: record.lesson_code,
      title: record.title,
      lesson_order: record.lesson_order,
      duration_minutes: record.duration_minutes || 45,
      content: record.content, // Điền nội dung cũ (nếu có)
      video_url: !fileType && record.video_url ? record.video_url : "", // Nếu là link youtube thì điền vào ô input
    });

    setIsModalOpen(true);
  };

  // --- HÀM LƯU (XỬ LÝ CẢ THÊM VÀ SỬA) ---
  const handleSave = async (values) => {
    try {
      let pdfUrl = editingLesson?.pdf_url || ""; // Giữ lại link cũ nếu không upload mới
      let videoUrl = values.video_url || editingLesson?.video_url || "";

      // Nếu có upload file mới thì lấy link mới
      if (uploadedFile.url) {
        if (uploadedFile.type === "pdf") {
          pdfUrl = uploadedFile.url;
          // Nếu up PDF mới, có thể muốn xóa video cũ đi (tuỳ logic)
        } else if (uploadedFile.type === "video") {
          videoUrl = uploadedFile.url;
          pdfUrl = ""; // Nếu up Video thì xóa PDF
        }
      }
      // 2. Xử lý ID Môn học (QUAN TRỌNG: Sửa lỗi mất bài)
      // Nếu đang Sửa (editingLesson có) -> Lấy subject_id của chính nó.
      // Nếu Thêm mới -> Lấy selectedSubject từ dropdown.
      const finalSubjectId = editingLesson?.subject_id || selectedSubject;

      if (!finalSubjectId) {
        message.error(
          "Lỗi: Không xác định được môn học! Vui lòng chọn môn trước."
        );
        return;
      }
      const payload = {
        subject_id: selectedSubject, // Quan trọng: Phải gửi lại ID môn học
        title: values.title,
        lesson_code: values.lesson_code,
        lesson_order: values.lesson_order,
        duration_minutes: values.duration_minutes,
        content: values.content,
        video_url: videoUrl,
        pdf_url: pdfUrl,
      };
      console.log("Frontend gửi đi:", payload); // Bật F12 Console để check xem có subject_id không
      if (editingLesson) {
        // --- LOGIC SỬA (PUT) ---
        await axios.put(
          `http://localhost:3001/api/lessons/${editingLesson.id}`,
          payload
        );
        message.success("Cập nhật thành công!");
      } else {
        // --- LOGIC THÊM (POST) ---
        await axios.post("http://localhost:3001/api/lessons", payload);
        message.success("Thêm mới thành công!");
      }

      setIsModalOpen(false);
      setUploadedFile({ url: "", type: "" }); // Reset file upload
      form.resetFields(); // Xóa form

      // Load lại danh sách (quan trọng)
      fetchLessons(selectedSubject || finalSubjectId);
    } catch (error) {
      console.error(error);
      message.error(
        "Lỗi lưu dữ liệu: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/lessons/${id}`);
      message.success("Đã xóa");
      fetchLessons(selectedSubject);
    } catch (error) {
      message.error("Lỗi xóa");
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "lesson_order",
      width: 60,
      align: "center",
      sorter: (a, b) => a.lesson_order - b.lesson_order,
    },
    {
      title: "Mã bài",
      dataIndex: "lesson_code",
      width: 120,
      render: (t) => <Tag color="blue">{t}</Tag>,
    },
    { title: "Tên bài giảng", dataIndex: "title", render: (t) => <b>{t}</b> },
    {
      title: "Tài liệu",
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          {record.pdf_url && (
            <Tag color="red" icon={<FilePdfOutlined />}>
              PDF
            </Tag>
          )}
          {record.video_url && (
            <Tag color="geekblue" icon={<VideoCameraOutlined />}>
              Video
            </Tag>
          )}
          {!record.pdf_url && !record.video_url && (
            <span className="text-gray-400">Trống</span>
          )}
        </div>
      ),
    },
    {
      title: "Hành động",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center gap-2">
          {/* Nút Sửa */}
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />

          {/* Nút Xóa */}
          <Popconfirm
            title="Xóa bài này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold text-blue-800 uppercase mb-4">
        Quản lý bài giảng
      </h2>

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
            />
          </Col>
          <Col>
            {/* Gọi hàm openAddModal khi bấm Thêm */}
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={openAddModal}
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

      <Modal
        title={editingLesson ? "Cập nhật bài giảng" : "Thêm bài giảng mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose={true}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã bài (VD: PL-C1)" name="lesson_code">
                <Input placeholder="Nhập mã..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thứ tự" name="lesson_order">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Tên bài giảng"
            name="title"
            rules={[{ required: true, message: "Bắt buộc nhập" }]}
          >
            <Input placeholder="Nhập tên bài..." />
          </Form.Item>

          <Form.Item
            label="Thời lượng (phút)"
            name="duration_minutes"
            initialValue={45}
          >
            <Input type="number" suffix="phút" />
          </Form.Item>

          <Form.Item label="Tài liệu (PDF hoặc Video MP4)">
            <Upload
              customRequest={handleUpload}
              maxCount={1}
              accept=".pdf,video/*"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Bấm để chọn file mới</Button>
            </Upload>

            {/* Hiển thị file đã chọn hoặc file cũ */}
            {(uploadedFile.url || editingLesson) && (
              <div className="mt-2 text-xs bg-gray-50 p-2 rounded border">
                {uploadedFile.url ? (
                  <span className="text-green-600">
                    ✅ Sẽ lưu file mới: {uploadedFile.type}
                  </span>
                ) : (
                  // Nếu đang sửa và chưa chọn file mới thì hiện thông tin file cũ
                  <span className="text-gray-500">
                    ℹ️ Đang dùng:{" "}
                    {editingLesson?.pdf_url
                      ? "PDF cũ"
                      : editingLesson?.video_url
                      ? "Video cũ"
                      : "Chưa có file"}
                  </span>
                )}
              </div>
            )}
          </Form.Item>

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
            label="Nội dung bài giảng (Để máy tự động đọc)"
            name="content"
          >
            <Input.TextArea
              rows={4}
              placeholder="Để trống nếu muốn tự động lấy từ PDF..."
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            className="mt-4"
          >
            {editingLesson ? "CẬP NHẬT" : "LƯU MỚI"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageLessons;
