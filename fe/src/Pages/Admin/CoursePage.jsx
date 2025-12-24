import React, { useState, useEffect, useContext } from "react";
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
  Input,
  Tooltip,
  Tag,
  Badge,
  Empty,
  Spin,
  FloatButton
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  BookOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  TableOutlined,
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import moment from "moment";
import axios from "../../Common/axios";
import { useAuth } from "../../contexts/AuthContext";

const { useBreakpoint } = Grid;

export default function CoursePage() {
  const screens = useBreakpoint();
  const { user } = useAuth();
  const currentUser = user?.user ?? user;
  const isAdmin = !!(currentUser?.is_admin || currentUser?.isAdmin || currentUser?.role === "admin");

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [studentsByCourse, setStudentsByCourse] = useState({});
  const [loadingStudents, setLoadingStudents] = useState({});
  
  const [viewMode, setViewMode] = useState(screens.xs ? 'card' : 'table'); 

  useEffect(() => {
    if (screens.xs) setViewMode('card');
  }, [screens.xs]);

  // --- API CALLS ---
  const fetchCourses = () => {
    setLoading(true);
    axios.get("/api/courses")
      .then((res) => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

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

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCourses(courses);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = courses.filter(course =>
        (course.ten_khoa_hoc || "").toLowerCase().includes(lowerSearch) ||
        (course.ma_khoa_hoc || "").toLowerCase().includes(lowerSearch) ||
        (course.hang_gplx || "").toLowerCase().includes(lowerSearch)
      );
      setFilteredCourses(filtered);
    }
  }, [courses, searchTerm]);

  // --- HANDLERS ---
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/courses/${id}`);
      message.success("Đã xoá khoá học");
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      message.error("Lỗi khi xoá khoá học");
    }
  };

  const handleEdit = (course) => {
    setEditingCourse({
      ...course,
      ngay_khai_giang: course.ngay_khai_giang ? moment(course.ngay_khai_giang) : null,
      ngay_be_giang: course.ngay_be_giang ? moment(course.ngay_be_giang) : null,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCourse({}); 
    setShowModal(true);
  }

  const handleSave = async () => {
    if(!editingCourse?.ma_khoa_hoc || !editingCourse?.ten_khoa_hoc) {
        message.warning("Vui lòng nhập Mã và Tên khóa học");
        return;
    }

    setLoading(true);
    const payload = {
        ...editingCourse,
        ngay_khai_giang: editingCourse.ngay_khai_giang ? editingCourse.ngay_khai_giang.format("YYYY-MM-DD") : null,
        ngay_be_giang: editingCourse.ngay_be_giang ? editingCourse.ngay_be_giang.format("YYYY-MM-DD") : null,
        so_ngay_hoc: parseInt(editingCourse.so_ngay_hoc) || 0,
        so_hoc_sinh: parseInt(editingCourse.so_hoc_sinh) || 0,
    };

    try {
        if (editingCourse.id) {
             await axios.put(`/api/courses/${editingCourse.id}`, payload);
             message.success("Cập nhật thành công");
        } else {
             await axios.post(`/api/courses`, payload); 
             message.success("Thêm mới thành công");
        }
        setShowModal(false);
        fetchCourses();
    } catch (err) {
        message.error("Lỗi: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const customRequestUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("/api/courses/upload", formData);
      message.success("Import thành công");
      fetchCourses();
      onSuccess("ok");
    } catch (err) {
      message.error("Lỗi upload");
      onError(err);
    }
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "Mã KH", dataIndex: "ma_khoa_hoc", width: 100, fixed: screens.md ? 'left' : false,
      render: (text) => <Tag color="blue" className="font-bold">{text}</Tag>
    },
    {
      title: "Tên khóa học", dataIndex: "ten_khoa_hoc", width: 220,
      render: (text) => <span style={{fontWeight: 600}}>{text}</span>
    },
    {
      title: "Hạng", dataIndex: "hang_gplx", width: 80, align: 'center',
      render: (text) => <Tag color="orange">{text || '?'}</Tag>
    },
    {
      title: "Thời gian", width: 200, responsive: ["lg"],
      render: (_, record) => (
          <div style={{fontSize: '13px', color: '#666'}}>
              <div>Bắt đầu: {record.ngay_khai_giang ? moment(record.ngay_khai_giang).format("DD/MM/YYYY") : "--"}</div>
              <div>Kết thúc: {record.ngay_be_giang ? moment(record.ngay_be_giang).format("DD/MM/YYYY") : "--"}</div>
          </div>
      )
    },
    {
      title: "Thời lượng",
      dataIndex: "so_ngay_hoc",
      width: 100, align: 'center',
      render: (val) => val ? <span className="text-blue-600 font-bold">{val} ngày</span> : <span className="text-gray-400">---</span>
    },
    {
      title: "Học viên", dataIndex: "so_hoc_sinh", width: 90, align: 'center',
      render: (val) => <Badge count={val} showZero color={val > 0 ? "#52c41a" : "#d9d9d9"} />
    },
    ...(isAdmin ? [{
      title: "Thao tác", key: "actions", width: 120, fixed: screens.md ? 'right' : false, align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>

          <Popconfirm title="Xóa khóa học này?" onConfirm={() => handleDelete(record.id)} okText="Xoá" cancelText="Huỷ">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>

        </Space>
      ),
    }] : []),
  ];

  return (
    <div className="p-4 md:p-6 bg-[#f0f2f5] min-h-screen pb-20">
      
      {/* 1. HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#003a8c] m-0 flex items-center gap-2">
                <BookOutlined /> QUẢN LÝ KHÓA HỌC
            </h1>
            {!screens.xs && <p className="text-gray-500 text-sm mt-1">Danh sách các khóa đào tạo</p>}
         </div>
         
         <Space wrap className="w-full md:w-auto justify-start md:justify-end">
             {isAdmin && (
                <Upload customRequest={customRequestUpload} showUploadList={false} accept=".xml,.xlsx">
                   <Button icon={<UploadOutlined />} className="bg-white border-blue-500 text-blue-500">
                      {screens.xs ? "Import" : "Import XML"}
                   </Button>
                </Upload>
             )}
             {isAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} className="shadow-md">
                   {screens.xs ? "Tạo mới" : "Tạo khóa mới"}
                </Button>
             )}
         </Space>
      </div>

      {/* 2. FILTER & VIEW MODE */}
      <Card className="mb-6 shadow-sm border-0 rounded-lg" styles={{ body: { padding: '16px' } }}>
         <Row gutter={[16, 16]} align="middle" justify="space-between">
             <Col xs={24} md={12} lg={8}>
                 <Input 
                    placeholder="Tìm theo Mã, Tên khóa, Hạng..." 
                    prefix={<SearchOutlined className="text-gray-400" />} 
                    size="large"
                    allowClear
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-md w-full"
                 />
             </Col>
             
             <Col xs={24} md={12} lg={8} className="flex justify-end items-center gap-3">
                 <span className="text-gray-500 text-sm hidden md:inline">Chế độ xem:</span>
                 <Space>
                    <Button 
                        type={viewMode === 'table' ? 'primary' : 'default'} 
                        icon={<TableOutlined />} 
                        onClick={() => setViewMode('table')}
                    />
                    <Button 
                        type={viewMode === 'card' ? 'primary' : 'default'} 
                        icon={<AppstoreOutlined />} 
                        onClick={() => setViewMode('card')}
                    />
                 </Space>
             </Col>
         </Row>
      </Card>

      {/* 3. CONTENT DISPLAY */}
      <Spin spinning={loading}>
        {filteredCourses.length === 0 ? (
            <Empty description="Không tìm thấy khóa học" />
        ) : viewMode === 'table' ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <Table
                    columns={columns} dataSource={filteredCourses} rowKey="id"
                    pagination={{ pageSize: 10 }} scroll={{ x: 900 }}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div className="p-4 bg-gray-50 rounded-md">
                                <h4 className="font-bold text-gray-600 mb-3 flex items-center gap-2">
                                    <TeamOutlined /> Danh sách học viên ({studentsByCourse[record.ma_khoa_hoc]?.length || 0})
                                </h4>
                                {loadingStudents[record.ma_khoa_hoc] ? <Spin /> : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {studentsByCourse[record.ma_khoa_hoc]?.map((st, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded border border-gray-200 flex items-center gap-2 shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {st.ho_va_ten?.charAt(0)}
                                                </div>
                                                <div className="truncate text-sm">{st.ho_va_ten}</div>
                                            </div>
                                        )) || <span className="text-gray-400 italic">Chưa có học viên</span>}
                                    </div>
                                )}
                            </div>
                        ),
                        onExpand: (expanded, record) => { if (expanded && !studentsByCourse[record.ma_khoa_hoc]) fetchStudents(record.ma_khoa_hoc); }
                    }}
                />
            </div>
        ) : (
            <Row gutter={[20, 20]}>
                {filteredCourses.map(course => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={course.id}>
                        {/* MOBILE / CARD VIEW */}
                        <Card 
                            hoverable
                            className="h-full rounded-xl shadow-sm border-0 overflow-hidden"
                            styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
                        >
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <Tag color="blue" className="m-0 font-mono">{course.ma_khoa_hoc}</Tag>
                                    <Tag color="orange">{course.hang_gplx}</Tag>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{course.ten_khoa_hoc}</h3>
                                <div className="text-sm text-gray-500 space-y-1 mb-4 flex-1">
                                    <div><CalendarOutlined /> {course.ngay_khai_giang ? moment(course.ngay_khai_giang).format("DD/MM/YYYY") : "N/A"}</div>
                                    <div><TeamOutlined /> {course.so_hoc_sinh || 0} học viên</div>
                                    <div><FileTextOutlined /> {course.so_ngay_hoc ? `${course.so_ngay_hoc} ngày` : '---'}</div>
                                </div>
                                {isAdmin && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                                        <Button type="primary" block ghost icon={<EditOutlined />} onClick={() => handleEdit(course)}>Sửa</Button>

                                        <Popconfirm title="Xóa?" onConfirm={() => handleDelete(course.id)}>
                                            <Button danger block icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        )}
      </Spin>

      {/* MODAL EDIT/CREATE */}
      <Modal
        title={<span className="text-blue-700 font-bold uppercase">{editingCourse?.id ? "Cập nhật khóa học" : "Tạo khóa học mới"}</span>}
        open={showModal} onCancel={() => setShowModal(false)}
        onOk={handleSave} okText="Lưu lại" cancelText="Hủy"
        destroyOnClose width={600}
      >
        <Form layout="vertical" className="py-2">
            <Row gutter={16}>
                <Col span={16}>
                    <Form.Item label="Mã khóa học" required>
                        <Input value={editingCourse?.ma_khoa_hoc} onChange={(e) => setEditingCourse({...editingCourse, ma_khoa_hoc: e.target.value})} placeholder="VD: K35-B2" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="Hạng bằng">
                        <Input value={editingCourse?.hang_gplx} onChange={(e) => setEditingCourse({...editingCourse, hang_gplx: e.target.value})} placeholder="B1, B2..." />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item label="Tên khóa học" required>
                <Input value={editingCourse?.ten_khoa_hoc} onChange={(e) => setEditingCourse({...editingCourse, ten_khoa_hoc: e.target.value})} />
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Ngày khai giảng">
                        <DatePicker className="w-full" format="DD/MM/YYYY" 
                            value={editingCourse?.ngay_khai_giang} onChange={(d) => setEditingCourse({...editingCourse, ngay_khai_giang: d})} 
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Ngày bế giảng">
                        <DatePicker className="w-full" format="DD/MM/YYYY" 
                            value={editingCourse?.ngay_be_giang} onChange={(d) => setEditingCourse({...editingCourse, ngay_be_giang: d})} 
                        />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Số ngày học">
                        <Input type="number" value={editingCourse?.so_ngay_hoc} onChange={(e) => setEditingCourse({...editingCourse, so_ngay_hoc: e.target.value})} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Số học viên">
                        <Input type="number" value={editingCourse?.so_hoc_sinh} onChange={(e) => setEditingCourse({...editingCourse, so_hoc_sinh: e.target.value})} />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
      </Modal>
      
      {/* Nút nổi (Mobile) */}
      {screens.xs && isAdmin && (
         <FloatButton
            icon={<PlusOutlined />}
            type="primary"
            style={{ right: 24, bottom: 24, width: 50, height: 50 }}
            onClick={handleCreate}
         />
      )}

      <style>{`
        .ant-table-thead > tr > th { background: #f0f5ff !important; color: #003a8c; }
        .ant-modal-header { border-bottom: 1px solid #f0f0f0; margin-bottom: 16px; }
      `}</style>
    </div>
  );
}
