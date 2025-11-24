import React, { useState, useEffect } from "react";
import { Card, Table, Button, message, Grid, Avatar, Space, Upload, Modal, Input, Form, Select } from "antd";
import { UploadOutlined, UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "../../Common/axios";
import moment from "moment";

const { useBreakpoint } = Grid;

export default function StudentsXML() {
  const screens = useBreakpoint();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        (student.ho_ten || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.so_dien_thoai || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/students/xml");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching XML students:", error);
      message.error("Không thể tải danh sách học viên từ XML");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get("/api/courses");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      message.warning("Chưa chọn file!");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("/api/students/xml/upload", formData);
      message.success("Upload file XML thành công!");
      fetchStudents();
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Upload thất bại: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/api/students/xml/${editingStudent.id}`, editingStudent);
      message.success("Cập nhật thành công!");
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Update error:", error);
      message.error("Cập nhật thất bại!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/students/xml/${id}`);
      message.success("Đã xóa học viên!");
      fetchStudents();
    } catch (error) {
      console.error("Delete error:", error);
      message.error("Xóa thất bại!");
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "anh",
      key: "avatar",
      width: 80,
      render: (avatar, record) => (
        <Avatar
          size={screens.xs ? 40 : 50}
          src={avatar ? (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('https') ? avatar : `data:image/png;base64,${avatar}`) : undefined}
          icon={<UserOutlined />}
          style={{
            border: '2px solid #e1e5e9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {record.ho_ten?.charAt(0)?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: "Họ tên",
      dataIndex: "ho_ten",
      key: "name",
      width: 180,
      render: (text) => (
        <div style={{ fontWeight: 600, color: '#ffffff' }}>
          {text || 'Chưa cập nhật'}
        </div>
      ),
    },
    {
      title: "SĐT",
      dataIndex: "so_dien_thoai",
      key: "phone",
      width: 120,
      render: (text) => (
        <div style={{ color: '#b8c5d6' }}>
          {text || 'Chưa có'}
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (text) => (
        <div style={{ color: '#b8c5d6', fontSize: '0.9rem' }}>
          {text || 'Chưa có'}
        </div>
      ),
    },
    {
      title: "Ngày sinh",
      dataIndex: "ngay_sinh",
      key: "birthdate",
      width: 120,
      render: (date) => (
        <div style={{ color: '#b8c5d6' }}>
          {date ? moment(date).format('DD/MM/YYYY') : 'Chưa có'}
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "dia_chi",
      key: "address",
      width: 200,
      ellipsis: true,
      render: (text) => (
        <div style={{ color: '#b8c5d6', fontSize: '0.9rem' }}>
          {text || 'Chưa có'}
        </div>
      ),
    },
    {
      title: "Khóa học",
      dataIndex: "ma_khoa_hoc",
      key: "course",
      width: 150,
      render: (ma_khoa_hoc) => {
        const course = courses.find(c => c.ma_khoa_hoc === ma_khoa_hoc);
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>
              {course?.ten_khoa_hoc || 'Chưa có'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b8c5d6' }}>
              {ma_khoa_hoc}
            </div>
          </div>
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size={screens.xs ? "small" : "middle"}
            style={{ color: '#00d4ff' }}
          >
            {!screens.xs && "Sửa"}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size={screens.xs ? "small" : "middle"}
          >
            {!screens.xs && "Xóa"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="app-container" style={{ padding: 'var(--space-lg)', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            fontSize: screens.xs ? '1.2rem' : '1.5rem',
            fontWeight: 700
          }}>
            <span style={{ color: '#00ff88', fontSize: '1.2em' }}>👥</span>
            Danh sách học viên từ XML
          </div>
        }
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--surface-bg)'
        }}
      >
        <div style={{ padding: screens.xs ? '16px' : '32px' }}>
          {/* Hướng dẫn */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            color: 'white'
          }}>
            <h3 style={{
              marginBottom: 'var(--space-md)',
              fontSize: '1.1rem',
              fontWeight: 600
            }}>
              📋 Hướng dẫn sử dụng
            </h3>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
              <p><strong>Upload file XML:</strong> Chọn file XML chứa danh sách học viên để import vào hệ thống.</p>
              <p><strong>Format XML:</strong> File phải có cấu trúc với các trường: ho_ten, so_dien_thoai, email, ngay_sinh, dia_chi, ma_khoa_hoc, anh.</p>
              <p><strong>Ảnh đại diện:</strong> URL ảnh hoặc dữ liệu base64 sẽ được hiển thị trong cột Avatar. Nếu không có sẽ hiển thị chữ cái đầu.</p>
              <p><strong>Tìm kiếm:</strong> Có thể tìm theo tên, số điện thoại hoặc email.</p>
            </div>
          </div>

          {/* Header với Upload và Search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            flexDirection: screens.xs ? 'column' : 'row'
          }}>
            {/* Upload Form */}
            <form
              style={{
                flex: screens.xs ? '1' : '0 0 auto',
                minWidth: screens.xs ? '100%' : '350px'
              }}
              onSubmit={handleUpload}
            >
              <div style={{
                display: "flex",
                gap: 12,
                flexDirection: screens.xs ? "column" : "row",
                alignItems: "center",
              }}>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".xml"
                  style={{
                    flex: 1,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 14,
                    background: '#fff'
                  }}
                />
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  htmlType="submit"
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
                  }}
                  size={screens.xs ? "small" : "middle"}
                >
                  {!screens.xs && "Upload"} XML
                </Button>
              </div>
            </form>

            {/* Thanh tìm kiếm */}
            <div style={{
              flex: screens.xs ? '1' : '0 0 320px',
              position: 'relative'
            }}>
              <Input
                placeholder="🔍 Tìm học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="large"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--card-bg)',
                  border: '2px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-normal)'
                }}
                className="input-modern"
              />
              <div style={{
                position: 'absolute',
                right: 'var(--space-sm)',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.8rem',
                background: 'var(--gradient-primary)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600
              }}>
                {filteredStudents.length}
              </div>
            </div>
          </div>

          {/* Thông báo kết quả tìm kiếm */}
          {searchTerm && filteredStudents.length === 0 && (
            <div style={{
              textAlign: 'center',
              marginBottom: 'var(--space-lg)',
              padding: 'var(--space-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--warning-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--warning-color)',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              ⚠️ Không tìm thấy học viên nào phù hợp với "{searchTerm}"
            </div>
          )}

          {/* Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#00d4ff',
                marginBottom: '4px'
              }}>
                {filteredStudents.length}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#b8c5d6',
                fontWeight: 500
              }}>
                Tổng học viên
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#00ff88',
                marginBottom: '4px'
              }}>
                {courses.length}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#b8c5d6',
                fontWeight: 500
              }}>
                Khóa học
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffaa00',
                marginBottom: '4px'
              }}>
                {filteredStudents.filter(s => s.anh).length}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#b8c5d6',
                fontWeight: 500
              }}>
                Có ảnh
              </div>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={filteredStudents}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              size: screens.xs ? "small" : "default",
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} học viên`
            }}
            scroll={{ x: 1000 }}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: screens.xs ? "0 1px 6px #0001" : "0 3px 12px #0001",
            }}
          />
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.1rem',
            fontWeight: 600
          }}>
            <EditOutlined />
            Chỉnh sửa học viên
          </div>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleUpdate}
        okText="Lưu"
        cancelText="Hủy"
        width={screens.xs ? "98vw" : 600}
        styles={{ body: { padding: '24px' } }}
      >
        {editingStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Họ tên:
              </label>
              <Input
                value={editingStudent.ho_ten}
                onChange={(e) => setEditingStudent({...editingStudent, ho_ten: e.target.value})}
                size={screens.xs ? "small" : "middle"}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Số điện thoại:
              </label>
              <Input
                value={editingStudent.so_dien_thoai}
                onChange={(e) => setEditingStudent({...editingStudent, so_dien_thoai: e.target.value})}
                size={screens.xs ? "small" : "middle"}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Email:
              </label>
              <Input
                value={editingStudent.email}
                onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                size={screens.xs ? "small" : "middle"}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Ngày sinh:
              </label>
              <Input
                value={editingStudent.ngay_sinh}
                onChange={(e) => setEditingStudent({...editingStudent, ngay_sinh: e.target.value})}
                placeholder="YYYY-MM-DD"
                size={screens.xs ? "small" : "middle"}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Địa chỉ:
              </label>
              <Input
                value={editingStudent.dia_chi}
                onChange={(e) => setEditingStudent({...editingStudent, dia_chi: e.target.value})}
                size={screens.xs ? "small" : "middle"}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Khóa học:
              </label>
              <Select
                value={editingStudent.ma_khoa_hoc}
                onChange={(value) => setEditingStudent({...editingStudent, ma_khoa_hoc: value})}
                style={{ width: '100%' }}
                size={screens.xs ? "small" : "middle"}
              >
                {courses.map(course => (
                  <Select.Option key={course.ma_khoa_hoc} value={course.ma_khoa_hoc}>
                    {course.ten_khoa_hoc}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                URL Ảnh hoặc Base64:
              </label>
              <Input
                value={editingStudent.anh}
                onChange={(e) => setEditingStudent({...editingStudent, anh: e.target.value})}
                placeholder="https://example.com/avatar.jpg hoặc data:image/png;base64,..."
                size={screens.xs ? "small" : "middle"}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
