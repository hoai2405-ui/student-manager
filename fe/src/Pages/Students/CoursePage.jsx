import React, { useState, useEffect, useContext } from "react";
import { Badge, Spin, Empty, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "../../Common/axios";
import { AuthContext } from "../../contexts/AuthContext";
import {
  Card,
  Table,
  Button,
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
  BookOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  TableOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { useBreakpoint } = Grid;

export default function CoursePage() {
  const screens = useBreakpoint();
  const { isAdmin } = useContext(AuthContext);

  // Lấy filter trạng thái từ localStorage ngay khi khởi tạo
  const [statusFilter, setStatusFilter] = useState('');
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [studentsByCourse, setStudentsByCourse] = useState({});
  const [loadingStudents, setLoadingStudents] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Lấy danh sách học viên theo mã khoá học
  const fetchStudents = async (ma_khoa_hoc) => {
    setLoadingStudents((prev) => ({ ...prev, [ma_khoa_hoc]: true }));
    try {
      const res = await axios.get(`/api/students?ma_khoa_hoc=${ma_khoa_hoc}`);
      setStudentsByCourse((prev) => ({ ...prev, [ma_khoa_hoc]: res.data }));
    } catch {
      setStudentsByCourse((prev) => ({ ...prev, [ma_khoa_hoc]: [] }));
    }
    setLoadingStudents((prev) => ({ ...prev, [ma_khoa_hoc]: false }));
  };

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

  useEffect(() => {
    // Filter courses based on search term
    if (!searchTerm.trim()) {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course =>
        (course.ten_khoa_hoc || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.ma_khoa_hoc || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.hang_gplx || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [courses, searchTerm]);

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
      trang_thai: course.trang_thai || "chua thi",
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
          {isAdmin && (
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
          )}
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
            minWidth: screens.xs ? '100%' : '300px'
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
              accept=".xml,.xlsx"
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
                whiteSpace: 'nowrap'
              }}
              size={screens.xs ? "small" : "middle"}
            >
              {!screens.xs && "Upload"} File
            </Button>
          </div>
        </form>

        {/* Thanh tìm kiếm và view toggle */}
        <div style={{
          flex: screens.xs ? '1' : '0 0 calc(320px + 120px)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexDirection: screens.xs ? 'column' : 'row'
        }}>
          <div style={{
            flex: 1,
            position: 'relative',
            maxWidth: screens.xs ? '100%' : '320px'
          }}>
            <Input
              placeholder="🔍 Tìm khóa học..."
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
              {filteredCourses.length}
            </div>
          </div>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<TableOutlined />}
              onClick={() => setViewMode('table')}
              size={screens.xs ? 'small' : 'middle'}
              style={{ borderRadius: 8 }}
            >
              {!screens.xs && 'Bảng'}
            </Button>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
              size={screens.xs ? 'small' : 'middle'}
              style={{ borderRadius: 8 }}
            >
              {!screens.xs && 'Thẻ'}
            </Button>
          </div>
        </div>
      </div>

      {/* Thông báo kết quả tìm kiếm */}
      {searchTerm && filteredCourses.length === 0 && (
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
          ⚠️ Không tìm thấy khóa học nào phù hợp với "{searchTerm}"
        </div>
      )}

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          dataSource={statusFilter ? filteredCourses.filter(c => c.trang_thai === statusFilter) : filteredCourses}
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
          expandable={{
            expandedRowRender: (record) => {
              const students = studentsByCourse[record.ma_khoa_hoc] || [];
              const isLoading = loadingStudents[record.ma_khoa_hoc];

              return (
                <div style={{
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  margin: '16px 0'
                }}>
                  <h4 style={{
                    marginBottom: '16px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    👥 Danh sách học viên - {record.ten_khoa_hoc}
                    <span style={{
                      fontSize: '0.8rem',
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}>
                      {students.length} học viên
                    </span>
                  </h4>

                  {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div>Đang tải danh sách học viên...</div>
                    </div>
                  ) : students.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#b8c5d6',
                      fontStyle: 'italic'
                    }}>
                      📝 Chưa có học viên nào trong khóa học này
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px'
                    }}>
                      {students.map((student, index) => (
                        <div key={student.id || index} style={{
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.98)',
                          borderRadius: '12px',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            {student.ho_ten?.charAt(0)?.toUpperCase() || 'H'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: 600,
                              color: '#ffffff',
                              marginBottom: 2
                            }}>
                              {student.ho_ten || 'Chưa cập nhật'}
                            </div>
                            <Button style={{
                              fontSize: '0.85rem',
                              color: '#b8c5d6'
                            }}>
            {!screens.xs && 'Bảng'}
          </Button>
          <Button
            type={viewMode === 'card' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => setViewMode('card')}
            size={screens.xs ? 'small' : 'middle'}
            style={{ borderRadius: 8 }}
          >
            {!screens.xs && 'Thẻ'}
          </Button>
        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            },
            onExpand: (expanded, record) => {
              if (expanded && !studentsByCourse[record.ma_khoa_hoc] && !loadingStudents[record.ma_khoa_hoc]) {
                fetchStudents(record.ma_khoa_hoc);
              }
            },
            rowExpandable: (record) => true,
          }}
        />
      ) : (
        // Card View
        <Row gutter={[20, 20]}>
          {filteredCourses.map((course) => (
            <Col xs={24} sm={12} lg={8} key={course.id}>
              <Card
                style={{
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: 'none',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  minHeight: 220
                }}
                bodyStyle={{
                  padding: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  padding: '20px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      marginBottom: 8,
                      lineHeight: 1.3
                    }}>
                      {course.ten_khoa_hoc}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      marginBottom: 12
                    }}>
                      <BookOutlined style={{ marginRight: 6 }} />
                      Mã: {course.ma_khoa_hoc} • Hạng: {course.hang_gplx || 'N/A'}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                        <CalendarOutlined style={{ marginRight: 6 }} />
                        Bắt đầu: {course.ngay_khai_giang ? moment(course.ngay_khai_giang).format("DD/MM/YYYY") : "Chưa có"}
                      </div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                        <CalendarOutlined style={{ marginRight: 6 }} />
                        Kết thúc: {course.ngay_be_giang ? moment(course.ngay_be_giang).format("DD/MM/YYYY") : "Chưa có"}
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <UserOutlined />
                      <span style={{ fontWeight: 600 }}>
                        {course.so_hoc_sinh || 0} học viên
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 16
                  }}>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(course)}
                      size="small"
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: 6
                      }}
                    >
                      Sửa
                    </Button>
                    {isAdmin && (
                      <Popconfirm
                        title="Muốn xoá thật à?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => handleDelete(course.id)}
                      >
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          style={{
                            flex: 1,
                            borderRadius: 6
                          }}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

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
        styles={{ body: { padding: screens.xs ? 8 : 24 } }}
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
