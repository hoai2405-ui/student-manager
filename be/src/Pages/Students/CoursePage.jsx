import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Table,
  Button,
  Input,
  Popconfirm,
  Modal,
  message,
  DatePicker,
  Form,
  Row,
  Col,
  Grid,
  Space,
  Upload,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { useBreakpoint } = Grid;

export default function CoursePage() {
  const screens = useBreakpoint();

  const [courses, setCourses] = useState([]);
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách khoá học
  const fetchCourses = () => {
    axios
      .get("/api/courses")
      .then((res) => setCourses(res.data))
      .catch(() => {
        message.error("Lỗi khi tải danh sách khoá học");
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Xoá khoá học
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/courses/${id}`);
      message.success("Đã xoá khoá học");
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      message.error("Lỗi khi xoá khoá học");
    }
  };

  // Bật modal chỉnh sửa
  const handleEdit = (course) => {
    setEditingCourse({
      ...course,
      ngay_khai_giang: course.ngay_khai_giang
        ? moment(course.ngay_khai_giang)
        : null,
      ngay_be_giang: course.ngay_be_giang ? moment(course.ngay_be_giang) : null,
    });
    setShowModal(true);
  };

  // Lưu khoá học đã sửa
  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/courses/${editingCourse.id}`, {
        ...editingCourse,
        ngay_khai_giang: editingCourse.ngay_khai_giang
          ? editingCourse.ngay_khai_giang.format("YYYY-MM-DD")
          : null,
        ngay_be_giang: editingCourse.ngay_be_giang
          ? editingCourse.ngay_be_giang.format("YYYY-MM-DD")
          : null,
      });
      message.success("Cập nhật thành công");
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      message.error("Lỗi khi cập nhật khóa học");
    }
    setLoading(false);
  };

  // Upload file XML hoặc Excel
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      message.warning("Chưa chọn file!");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("/api/courses/upload", formData);
      message.success("Upload thành công");
      fetchCourses();
    } catch (err) {
      message.error(
        "Upload thất bại: " + (err.response?.data?.message || err.message)
      );
    }
  };

  // Cột cho bảng
  const columns = [
    {
      title: "Mã KH",
      dataIndex: "ma_khoa_hoc",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Tên khóa",
      dataIndex: "ten_khoa_hoc",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Hạng GPLX",
      dataIndex: "hang_gplx",
      width: 100,
      ellipsis: true,
      responsive: ["sm"],
    },
    {
      title: "Bắt đầu",
      dataIndex: "ngay_khai_giang",
      width: 120,
      render: (val) => (val ? moment(val).format("DD/MM/YYYY") : "Không rõ"),
      responsive: ["md"],
    },
    {
      title: "Kết thúc",
      dataIndex: "ngay_be_giang",
      width: 120,
      render: (val) => (val ? moment(val).format("DD/MM/YYYY") : "Không rõ"),
      responsive: ["md"],
    },
    {
      title: "Số học viên",
      dataIndex: "so_hoc_sinh",
      width: 110,
      align: "center",
      responsive: ["sm"],
    },
    {
      title: "Hành động",
      key: "actions",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size={screens.xs ? "small" : "middle"}
            style={{ color: "#1677ff" }}
          />
          <Popconfirm
            title="Muốn xoá thật à?"
            okText="Xoá"
            cancelText="Huỷ"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size={screens.xs ? "small" : "middle"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <span style={{ fontWeight: 700, fontSize: screens.xs ? 18 : 22 }}>
          <FileAddOutlined style={{ marginRight: 10, color: "#1677ff" }} />
          Danh sách khoá học
        </span>
      }
      style={{
        maxWidth: 1100,
        margin: screens.xs ? "8px 2px" : "32px auto",
        borderRadius: 18,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 1.5px 2px rgba(0,0,0,0.02)",
        padding: screens.xs ? 10 : 24,
        background: "#f8fafc",
      }}
    >
      <form
        style={{
          marginBottom: 24,
          display: "flex",
          gap: 12,
          flexDirection: screens.xs ? "column" : "row",
          alignItems: "center",
        }}
        onSubmit={handleUpload}
      >
        <input
          type="file"
          className="form-control"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".xml,.xlsx"
          style={{
            maxWidth: screens.xs ? "100%" : 260,
            flex: 1,
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 7,
            fontSize: 15,
          }}
        />
        <Button
          type="primary"
          icon={<UploadOutlined />}
          htmlType="submit"
          style={{
            borderRadius: 8,
            width: screens.xs ? "100%" : undefined,
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 0.3,
          }}
          size={screens.xs ? "small" : "large"}
        >
          Thêm mới từ file XML/Excel
        </Button>
      </form>

      <Table
        columns={columns}
        dataSource={courses}
        rowKey="id"
        pagination={{ pageSize: 10, size: screens.xs ? "small" : "default" }}
        variant="outlined"
        size={screens.xs ? "small" : "middle"}
        scroll={{ x: 700 }}
        style={{
          fontSize: screens.xs ? 13 : 15,
          background: "#fff",
          borderRadius: 12,
          boxShadow: screens.xs ? "0 1px 6px #0001" : "0 3px 12px #0001",
        }}
      />

      <Modal
        title={
          <span>
            <EditOutlined /> Chỉnh sửa khoá học
          </span>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleUpdate}
        confirmLoading={loading}
        okText="Lưu"
        cancelText="Huỷ"
        width={screens.xs ? "98vw" : 500}
        bodyStyle={{ padding: screens.xs ? 8 : 24 }}
      >
        {editingCourse && (
          <Form layout="vertical">
            <Form.Item label="Mã KH">
              <Input
                value={editingCourse.ma_khoa_hoc}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    ma_khoa_hoc: e.target.value,
                  })
                }
                size={screens.xs ? "small" : "middle"}
              />
            </Form.Item>
            <Form.Item label="Tên khoá học">
              <Input
                value={editingCourse.ten_khoa_hoc}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    ten_khoa_hoc: e.target.value,
                  })
                }
                size={screens.xs ? "small" : "middle"}
              />
            </Form.Item>
            <Form.Item label="Hạng GPLX">
              <Input
                value={editingCourse.hang_gplx}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    hang_gplx: e.target.value,
                  })
                }
                size={screens.xs ? "small" : "middle"}
              />
            </Form.Item>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="Ngày khai giảng">
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={editingCourse.ngay_khai_giang}
                    onChange={(date) =>
                      setEditingCourse({
                        ...editingCourse,
                        ngay_khai_giang: date,
                      })
                    }
                    style={{ width: "100%" }}
                    size={screens.xs ? "small" : "middle"}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Ngày bế giảng">
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={editingCourse.ngay_be_giang}
                    onChange={(date) =>
                      setEditingCourse({
                        ...editingCourse,
                        ngay_be_giang: date,
                      })
                    }
                    style={{ width: "100%" }}
                    size={screens.xs ? "small" : "middle"}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Số học viên">
              <Input
                type="number"
                value={editingCourse.so_hoc_sinh}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    so_hoc_sinh: e.target.value,
                  })
                }
                size={screens.xs ? "small" : "middle"}
                min={0}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
      {/* Custom style cho mobile/tablet */}
      <style>
        {`
          @media (max-width: 700px) {
            .ant-card {
              border-radius: 10px !important;
              box-shadow: 0 1px 6px #0001 !important;
              padding: 4px !important;
            }
            .ant-table {
              font-size: 13px !important;
            }
            .ant-modal {
              padding: 0 !important;
            }
            .ant-table-cell {
              word-break: break-word !important;
              padding: 7px !important;
            }
          }
          
        `}
      </style>
    </Card>
  );
}
