import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import axios from "../../Common/axios";

const { Title, Text } = Typography;

const LICENSE_OPTIONS = [
  { value: "B1", label: "B1" },
  { value: "B.01", label: "B.01" },
  { value: "B", label: "B" },
  { value: "C1", label: "C1" },
  { value: "B-C1", label: "B-C1" },
  { value: "C1-Cm", label: "C1-Cm" },
];

export default function AdminSubjects() {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [requirementsBySubject, setRequirementsBySubject] = useState({});

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm] = Form.useForm();

  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqSubject, setReqSubject] = useState(null);
  const [reqForm] = Form.useForm();

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/subjects");
      setSubjects(res.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi tải danh sách môn học");
    } finally {
      setLoading(false);
    }
  };

  const loadRequirements = async (subjectId) => {
    try {
      const res = await axios.get("/api/subject-requirements", { params: { subject_id: subjectId } });
      setRequirementsBySubject((prev) => ({ ...prev, [subjectId]: res.data || [] }));
    } catch {
      setRequirementsBySubject((prev) => ({ ...prev, [subjectId]: [] }));
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const openCreateSubject = () => {
    setEditingSubject(null);
    subjectForm.resetFields();
    subjectForm.setFieldsValue({ code: "", name: "", total_hours: 0, description: "" });
    setSubjectModalOpen(true);
  };

  const openEditSubject = (s) => {
    setEditingSubject(s);
    subjectForm.resetFields();
    subjectForm.setFieldsValue({
      code: s.code || "",
      name: s.name || "",
      total_hours: Number(s.total_hours || 0),
      description: s.description || "",
    });
    setSubjectModalOpen(true);
  };

  const saveSubject = async () => {
    const values = await subjectForm.validateFields();
    setLoading(true);
    try {
      if (editingSubject?.id) {
        await axios.put(`/api/admin/subjects/${editingSubject.id}`, values);
        message.success("Đã cập nhật môn học");
      } else {
        await axios.post("/api/admin/subjects", values);
        message.success("Đã tạo môn học");
      }
      setSubjectModalOpen(false);
      await loadSubjects();
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi lưu môn học");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (s) => {
    setLoading(true);
    try {
      await axios.delete(`/api/admin/subjects/${s.id}`);
      message.success("Đã xóa môn học");
      await loadSubjects();
    } catch (e) {
      message.error(e?.response?.data?.message || "Không thể xóa môn học");
    } finally {
      setLoading(false);
    }
  };

  const openRequirements = async (s) => {
    setReqSubject(s);
    setReqModalOpen(true);
    reqForm.resetFields();
    reqForm.setFieldsValue({ rows: [] });
    await loadRequirements(s.id);
  };

  useEffect(() => {
    if (!reqModalOpen || !reqSubject?.id) return;
    const rows = requirementsBySubject[reqSubject.id] || [];
    reqForm.setFieldsValue({
      rows: rows.map((r) => ({
        id: r.id,
        license_class: r.license_class || "",
        required_hours: Number(r.required_hours || 0),
      })),
    });
  }, [reqModalOpen, reqSubject?.id, requirementsBySubject, reqForm]);

  const saveRequirements = async () => {
    if (!reqSubject?.id) return;
    const values = await reqForm.validateFields();
    const rows = Array.isArray(values.rows) ? values.rows : [];
    setLoading(true);
    try {
      await axios.put(`/api/admin/subjects/${reqSubject.id}/requirements`, { rows });
      message.success("Đã lưu yêu cầu giờ theo hạng");
      await loadRequirements(reqSubject.id);
      setReqModalOpen(false);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi lưu yêu cầu môn học");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { title: "Mã", dataIndex: "code", key: "code", width: 90, render: (v) => <Tag color="blue">{v || "--"}</Tag> },
      { title: "Tên môn", dataIndex: "name", key: "name", render: (v) => <b>{v}</b> },
      {
        title: "Giờ mặc định",
        dataIndex: "total_hours",
        key: "total_hours",
        width: 120,
        align: "right",
        render: (v) => <span>{Number(v || 0)}h</span>,
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        render: (v) => <span style={{ color: "#666" }}>{v || ""}</span>,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 280,
        render: (_, s) => (
          <Space>
            <Button onClick={() => openEditSubject(s)}>Sửa</Button>
            <Button onClick={() => openRequirements(s)}>Yêu cầu theo hạng</Button>
            <Button danger onClick={() => deleteSubject(s)}>Xóa</Button>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý môn học
          </Title>
          <Button type="primary" onClick={openCreateSubject}>
            Thêm môn
          </Button>
        </div>

        <Card className="mt-4" loading={loading}>
          <Text type="secondary">Quản lý danh sách môn và yêu cầu giờ theo từng hạng GPLX.</Text>
          <div style={{ marginTop: 12 }}>
            <Table rowKey="id" dataSource={subjects} columns={columns} pagination={{ pageSize: 10 }} />
          </div>
        </Card>

        <Modal
          title={editingSubject ? "Sửa môn học" : "Thêm môn học"}
          open={subjectModalOpen}
          onCancel={() => setSubjectModalOpen(false)}
          onOk={saveSubject}
          okText="Lưu"
          cancelText="Hủy"
          destroyOnHidden
        >
          <Form layout="vertical" form={subjectForm}>
            <Form.Item name="code" label="Mã" rules={[{ required: true, message: "Nhập mã môn" }]}>
              <Input placeholder="VD: PL" />
            </Form.Item>
            <Form.Item name="name" label="Tên môn" rules={[{ required: true, message: "Nhập tên môn" }]}>
              <Input placeholder="VD: Pháp luật giao thông đường bộ" />
            </Form.Item>
            <Form.Item name="total_hours" label="Giờ mặc định">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={reqSubject ? `Yêu cầu giờ theo hạng: ${reqSubject.name}` : "Yêu cầu giờ theo hạng"}
          open={reqModalOpen}
          onCancel={() => setReqModalOpen(false)}
          onOk={saveRequirements}
          okText="Lưu"
          cancelText="Hủy"
          width={800}
          destroyOnHidden
        >
          <Form form={reqForm} layout="vertical">
            <Form.List name="rows">
              {(fields, { add, remove }) => (
                <div style={{ display: "grid", gap: 12 }}>
                  <Button onClick={() => add({ license_class: "", required_hours: 0 })}>Thêm dòng</Button>
                  {fields.map((field) => (
                    <Card key={field.key} size="small">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 80px", gap: 12 }}>
                        <Form.Item
                          {...field}
                          name={[field.name, "license_class"]}
                          label="Hạng GPLX"
                          rules={[{ required: true, message: "Chọn hạng" }]}
                        >
                          <Select
                            options={LICENSE_OPTIONS}
                            placeholder="Chọn hạng"
                            showSearch
                            optionFilterProp="label"
                          />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "required_hours"]}
                          label="Số giờ yêu cầu"
                          rules={[{ required: true, message: "Nhập số giờ" }]}
                        >
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <div style={{ display: "flex", alignItems: "end", paddingBottom: 6 }}>
                          <Button danger onClick={() => remove(field.name)}>
                            Xóa
                          </Button>
                        </div>
                        <Form.Item {...field} name={[field.name, "id"]} hidden>
                          <Input />
                        </Form.Item>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Form.List>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
