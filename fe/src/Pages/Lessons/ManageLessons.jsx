import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Upload, Card, Row, Col, Tag, Popconfirm, Space } from "antd";
import { PlusOutlined, DeleteOutlined, FilePdfOutlined, UploadOutlined, VideoCameraOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";

const ManageLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
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
      if (res.data.length > 0 && !selectedSubject) setSelectedSubject(res.data[0].id);
    } catch {
      message.error("Lỗi tải môn học");
    }
  };

  const fetchLessons = async (subjectId) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/lessons?subject_id=${subjectId}`);
      setLessons(res.data);
    } catch {
      message.error("Lỗi tải bài giảng");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:3001/api/upload/file", formData);
      setUploadedFile({ url: res.data.url, type: res.data.type });
      message.success("Upload thành công!");
      onSuccess("Ok");
    } catch (err) {
      message.error("Lỗi upload file");
      onError(err);
    }
  };

  const openAddModal = () => {
    setEditingLesson(null);
    setUploadedFile({ url: "", type: "" });
    form.resetFields();
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.lesson_order)) + 1 : 1;
    form.setFieldsValue({ lesson_order: nextOrder });
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingLesson(record);
    
    let fileType = "";
    let fileUrl = "";
    if (record.pdf_url) { fileType = "pdf"; fileUrl = record.pdf_url; }
    else if (record.video_url && record.video_url.startsWith("/uploads")) { fileType = "video"; fileUrl = record.video_url; }
    
    setUploadedFile({ url: fileUrl, type: fileType });

    // 👇 XỬ LÝ HẠNG BẰNG TỪ JSON DB RA MẢNG
    let licenseTypes = [];
    try {
        licenseTypes = JSON.parse(record.license_types || "[]");
    } catch {
      // ignore
    }

    // duration_overrides từ DB hiện chưa được load theo API, giữ trống khi edit
    form.setFieldsValue({
      lesson_code: record.lesson_code,
      title: record.title,
      lesson_order: record.lesson_order,
      duration_minutes: record.duration_minutes || 45,
      content: record.content,
      video_url: (!fileType && record.video_url) ? record.video_url : "",
      license_types: licenseTypes,
      duration_overrides: [],
    });

    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      let pdfUrl = editingLesson?.pdf_url || "";
      let videoUrl = values.video_url || editingLesson?.video_url || "";

      if (uploadedFile.url) {
        if (uploadedFile.type === "pdf") { pdfUrl = uploadedFile.url; } 
        else if (uploadedFile.type === "video") { videoUrl = uploadedFile.url; pdfUrl = ""; }
      }

      const finalSubjectId = editingLesson?.subject_id || selectedSubject;
      if (!finalSubjectId) { message.error("Lỗi: Không xác định được môn học!"); return; }

      const duration_overrides = (values.duration_overrides || [])
        .filter((o) => o && o.license_class && o.duration_minutes !== undefined && o.duration_minutes !== null)
        .map((o) => ({
          license_class: o.license_class,
          duration_minutes: Number(o.duration_minutes),
        }));

      const payload = {
        subject_id: finalSubjectId,
        title: values.title,
        lesson_code: values.lesson_code,
        lesson_order: values.lesson_order,
        duration_minutes: values.duration_minutes,
        content: values.content,
        video_url: videoUrl,
        pdf_url: pdfUrl,
        license_types: values.license_types,
        duration_overrides,
      };

      if (editingLesson) {
        await axios.put(`http://localhost:3001/api/lessons/${editingLesson.id}`, payload);
        message.success("Cập nhật thành công!");
      } else {
        await axios.post("http://localhost:3001/api/lessons", payload);
        message.success("Thêm mới thành công!");
      }

      setIsModalOpen(false);
      setUploadedFile({ url: "", type: "" });
      form.resetFields();
      fetchLessons(selectedSubject || finalSubjectId);
    } catch {
      message.error("Lỗi lưu dữ liệu");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/lessons/${id}`);
      message.success("Đã xóa");
      fetchLessons(selectedSubject);
    } catch {
      message.error("Lỗi xóa");
    }
  };

  const columns = [
    { title: "STT", dataIndex: "lesson_order", width: 60, align: 'center', sorter: (a, b) => a.lesson_order - b.lesson_order },
    { title: "Mã bài", dataIndex: "lesson_code", width: 100, render: t => <Tag color="blue">{t}</Tag> },
    { title: "Tên bài giảng", dataIndex: "title", render: t => <b>{t}</b> },
    // 👇 CỘT HIỂN THỊ HẠNG BẰNG
    { 
        title: "Áp dụng", 
        dataIndex: "license_types", 
        width: 150,
        render: (text) => {
            try {
                const types = JSON.parse(text || "[]");
                if(!types || types.length === 0) return <Tag>Tất cả</Tag>;
                return types.map(t => <Tag color="cyan" key={t}>{t}</Tag>);
            } catch { return <Tag>Tất cả</Tag> }
        }
    },
    { 
      title: "Tài liệu", width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          {record.pdf_url && <Tag color="red" icon={<FilePdfOutlined />}>PDF</Tag>}
          {record.video_url && <Tag color="geekblue" icon={<VideoCameraOutlined />}>Video</Tag>}
        </div>
      )
    },
    {
      title: "Hành động", width: 100, align: 'center',
      render: (_, record) => (
        <div className="flex justify-center gap-2">
            <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold text-blue-800 uppercase mb-4">Quản lý bài giảng</h2>

      <Card className="mb-4 shadow-sm" styles={{ body: { padding: "15px" } }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <span className="mr-2 font-bold">Đang xem môn:</span>
            <Select 
              className="w-full md:w-96" size="large"
              value={selectedSubject} onChange={setSelectedSubject}
              options={subjects.map(s => ({ label: s.name, value: s.id }))}
            />
          </Col>
          <Col>
             <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openAddModal}>Thêm bài giảng</Button>
          </Col>
        </Row>
      </Card>

      <Table 
        rowKey="id" columns={columns} dataSource={lessons} 
        loading={loading} bordered pagination={{ pageSize: 10 }} 
      />

      <Modal 
        title={editingLesson ? "Cập nhật bài giảng" : "Thêm bài giảng mới"} 
        open={isModalOpen} onCancel={() => setIsModalOpen(false)} 
        footer={null} destroyOnClose={true} width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
             <Col span={8}>
                <Form.Item label="Mã bài" name="lesson_code">
                    <Input placeholder="PL-C1" />
                </Form.Item>
             </Col>
             <Col span={8}>
                <Form.Item label="Thứ tự" name="lesson_order">
                    <Input type="number" />
                </Form.Item>
             </Col>
             <Col span={8}>
                <Form.Item label="Thời lượng (phút)" name="duration_minutes" initialValue={45}>
                   <Input type="number" />
                </Form.Item>
             </Col>
          </Row>
          
          <Form.Item label="Tên bài giảng" name="title" rules={[{ required: true, message: 'Bắt buộc nhập' }]}>
            <Input placeholder="Nhập tên bài..." />
          </Form.Item>

          {/* 👇 Ô CHỌN HẠNG BẰNG */}
          <Form.Item label="Áp dụng cho hạng (Để trống = Tất cả)" name="license_types">
             <Select 
                mode="multiple" 
                placeholder="Chọn các hạng..." 
                options={[
                    { label: 'B.01', value: 'B.01' },
                    { label: 'B', value: 'B' },
                    { label: 'C1', value: 'C1' },
                    { label: 'B-C1', value: 'B-C1' },
                    { label: 'C1-Cm', value: 'C1-Cm' },
                ]}
             />
          </Form.Item>

          <Form.Item label="Thời lượng theo hạng (tuỳ chọn)">
            <Form.List name="duration_overrides">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'license_class']}
                        rules={[{ required: true, message: 'Chọn hạng' }]}
                      >
                        <Select
                          placeholder="Hạng"
                          style={{ width: 160 }}
                          options={[
                            { label: 'B.01', value: 'B.01' },
                            { label: 'B', value: 'B' },
                            { label: 'C1', value: 'C1' },
                            { label: 'B-C1', value: 'B-C1' },
                            { label: 'C1-Cm', value: 'C1-Cm' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'duration_minutes']}
                        rules={[{ required: true, message: 'Nhập phút' }]}
                      >
                        <Input type="number" placeholder="Phút" style={{ width: 120 }} />
                      </Form.Item>
                      <Button danger onClick={() => remove(name)}>Xóa</Button>
                    </Space>
                  ))}
                  <Button onClick={() => add()} block>+ Thêm thời lượng theo hạng</Button>
                </div>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="Tài liệu (PDF/Video)">
            <Upload customRequest={handleUpload} maxCount={1} accept=".pdf,video/*" showUploadList={false}>
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
            {(uploadedFile.url || editingLesson) && (
               <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                  {uploadedFile.url ? <span className="text-green-600">✅ File mới: {uploadedFile.type}</span> : <span className="text-gray-500">ℹ️ Đang dùng file cũ</span>}
               </div>
            )}
          </Form.Item>

          <Form.Item label="Nội dung tóm tắt (Để máy đọc)" name="content">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            {editingLesson ? "CẬP NHẬT" : "LƯU MỚI"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageLessons;