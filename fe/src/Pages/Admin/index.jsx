import React, { useEffect, useState, useCallback } from "react";
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ReadOutlined,
  ManOutlined,
  WomanOutlined
} from "@ant-design/icons";
import {
  Button,
  Input,
  Popconfirm,
  Table,
  Space,
  Select,
  message,
  Empty,
  Modal,
  DatePicker,
  Grid,
  Avatar,
  Card,
  Tag,
  Tooltip,
  Row,
  Col,
  Typography
} from "antd";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import { ROUTES_PATH } from "../../Common/constants";
import axios from "../../Common/axios";
import moment from "moment";
import * as XLSX from 'xlsx';
import { TableSkeleton } from '../../Components/Loading';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

// --- HÀM XỬ LÝ ẢNH AN TOÀN ---
const getAvatarSrc = (imgData) => {
  if (!imgData) return null;
  if (imgData.includes("http") || imgData.includes("/uploads")) {
     if(imgData.startsWith("/uploads")) return `http://localhost:3001${imgData}`;
     return imgData; 
  }
  const cleanData = imgData.replace(/[\r\n\s]+/g, "");
  if (cleanData.startsWith("data:image")) return cleanData;
  if (cleanData.length > 100) return `data:image/jpeg;base64,${cleanData}`;
  return null;
};

const Students = () => {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({ pagination: { current: 1, pageSize: 10 } });
  
  // Filter State
  const [name, setName] = useState("");
  const [cccd, setCccd] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseList, setCoursesList] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // 1. Load danh sách khóa học
  useEffect(() => {
    axios.get("/api/courses").then((res) => {
        setCoursesList(res.data);
    }).catch(() => {});
  }, []);

  // 2. Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCourse) params.ma_khoa_hoc = selectedCourse;
      if (name) params.name = name.trim();
      if (cccd) params.cccd = cccd.trim();

      console.log("Fetching students with params:", params);
      const res = await axios.get("/api/students", { params });
      console.log("API response data:", res.data);
      setData(res.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [name, cccd, selectedCourse]);

  const debouncedFetch = useCallback(debounce(() => fetchData(), 500), [fetchData]);

  // Effect triggers
  useEffect(() => {
    if (selectedCourse && !name.trim() && !cccd.trim()) {
      // Chỉ hiển thị học viên khi đã chọn khóa và không có từ khóa tìm kiếm
      fetchData();
    } else if (!selectedCourse && !name.trim() && !cccd.trim()) {
      // Reset data khi không chọn khóa học và không tìm kiếm
      setData([]);
    }
  }, [selectedCourse, tableParams.pagination.current]);

  // Tìm kiếm hoạt động bất kể có chọn khóa hay không
  useEffect(() => {
    if (name.trim() || cccd.trim()) {
      // Có từ khóa tìm kiếm - tìm kiếm tất cả học viên
      debouncedFetch();
    } else if (selectedCourse) {
      // Không có từ khóa nhưng đã chọn khóa - hiển thị tất cả học viên của khóa
      fetchData();
    } else {
      // Không có từ khóa và không chọn khóa - reset data
      setData([]);
    }
  }, [name, cccd, selectedCourse]);


  // --- ACTIONS ---
  const handleEdit = (student) => {
    setEditingStudent({ ...student });
    setShowModal(true);
  };

  const handleUpdateStudent = async () => {
    try {
      await axios.put(`/api/students/${editingStudent.id}`, editingStudent);
      message.success("Cập nhật thành công");
      setShowModal(false);
      fetchData();
    } catch (err) { message.error("Lỗi cập nhật"); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`);
      message.success("Đã xoá học viên");
      fetchData();
    } catch (err) { message.error("Lỗi xóa"); }
  };

  const handleExportExcel = () => {
    if (data.length === 0) return message.warning('Không có dữ liệu!');
    const exportData = data.map((st, idx) => ({
      'STT': idx + 1,
      'Họ tên': st.ho_va_ten,
      'Ngày sinh': st.ngay_sinh ? moment(st.ngay_sinh).format('DD/MM/YYYY') : '',
      'CCCD': st.so_cmt,
      'Khóa': st.ten_khoa_hoc,
      'Hạng': st.hang_gplx
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), "HocVien");
    XLSX.writeFile(wb, `DS_HocVien_${moment().format('DDMMYYYY')}.xlsx`);
  };

  // --- COLUMNS (TỐI ƯU HIỂN THỊ) ---
  const columns = [
    { 
      title: "STT", 
      width: 60, 
      align: 'center', 
      render: (_, __, i) => <span className="text-gray-500 font-medium">{i + 1}</span> 
    },
    {
      title: "Thông tin Học viên",
      width: 300,
      render: (_, record) => (
        <div className="flex items-center gap-4 py-1">
           <Avatar 
              size={52} 
              src={getAvatarSrc(record.anh_chan_dung)} 
              icon={<UserOutlined />} 
              className="border-2 border-white shadow-md flex-shrink-0 bg-gray-200"
           />
           <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-base leading-tight">{record.ho_va_ten}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                 <IdcardOutlined /> {record.so_cmt || "---"}
              </span>
           </div>
        </div>
      ),
    },
    {
        title: "Khóa học & Hạng",
        width: 200,
        responsive: ["sm"],
        render: (_, record) => (
            <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-blue-800 flex items-center gap-1">
                    <ReadOutlined /> {record.ten_khoa_hoc || "---"}
                </div>
                <div>
                   <Tag color="blue" className="font-bold border-none bg-blue-100 text-blue-700">
                      Hạng {record.hang_gplx}
                   </Tag>
                </div>
            </div>
        )
    },
    {
        title: "Ngày sinh",
        dataIndex: "ngay_sinh",
        width: 150,
        responsive: ["md"],
        render: (d) => (
            <div className="text-gray-600 flex items-center gap-2">
                <CalendarOutlined /> 
                {d ? moment(d).format("DD/MM/YYYY") : "--"}
            </div>
        )
    },
    {
      title: "Hành động",
      width: 100,
      fixed: "right",
      align: 'center',
      render: (_, record) => (
        <Space size="small">
            <Tooltip title="Chỉnh sửa">
                <Button 
                    type="text" 
                    className="text-blue-600 hover:bg-blue-50" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit(record)} 
                />
            </Tooltip>
            <Popconfirm title="Xóa học viên này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                <Button 
                    type="text" 
                    className="text-red-500 hover:bg-red-50" 
                    icon={<DeleteOutlined />} 
                />
            </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-[#f0f2f5] min-h-screen">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
         <div>
            <Title level={3} style={{ margin: 0, color: '#003a8c' }}>QUẢN LÝ HỌC VIÊN</Title>
            <Text type="secondary">Danh sách học viên và hồ sơ đào tạo</Text>
         </div>
         <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                console.log("Button clicked!");
                console.log("ROUTES_PATH.ADMIN_STUDENTS_NEW:", ROUTES_PATH.ADMIN_STUDENTS_NEW);
                console.log("navigate function:", typeof navigate);
                try {
                    navigate(ROUTES_PATH.ADMIN_STUDENTS_NEW);
                    console.log("Navigation called successfully");
                } catch (error) {
                    console.error("Navigation error:", error);
                }
            }} size="large" className="shadow-sm">
                Thêm mới
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel} size="large">Xuất Excel</Button>
         </Space>
      </div>

      {/* 2. FILTER CARD */}
      <Card className="mb-6 shadow-sm border-0 rounded-lg" styles={{ body: { padding: '20px' } }}>
         <Row gutter={[16, 16]} align="middle">
             <Col xs={24} md={8}>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Lọc theo Khóa học</label>
                 <Select
                    placeholder="Tất cả khóa học"
                    style={{ width: '100%' }} size="large"
                    value={selectedCourse} onChange={setSelectedCourse} allowClear
                    options={courseList.map(c => ({ label: c.ten_khoa_hoc, value: c.ma_khoa_hoc }))}
                 />
             </Col>
             <Col xs={24} md={10}>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tìm kiếm</label>
                 <Input
                    placeholder="Nhập tên hoặc số CCCD..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    size="large"
                    value={name} onChange={(e) => setName(e.target.value)}
                 />
             </Col>
             <Col xs={24} md={6}>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Thống kê</label>
                 <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-center border border-blue-200">
                     Tổng số: {data.length} học viên
                 </div>
             </Col>
         </Row>
      </Card>

      {/* 3. TABLE DATA */}
      <Card className="shadow-md border-0 rounded-lg overflow-hidden" styles={{ body: { padding: 0 } }}>
         {(!selectedCourse && !name.trim() && !cccd.trim()) ? (
            <div className="py-16 text-center">
               <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                     <div className="text-gray-500">
                        <div className="text-lg font-medium mb-2">Vui lòng chọn khóa học hoặc tìm kiếm</div>
                        <div className="text-sm">Chọn khóa học từ dropdown hoặc nhập từ khóa để xem danh sách học viên</div>
                     </div>
                  }
               />
            </div>
         ) : loading ? (
            <TableSkeleton />
         ) : (
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Tổng ${total}`,
                    showSizeChanger: true
                }}
                scroll={{ x: 800 }}
                locale={{ emptyText: <Empty description="Không tìm thấy dữ liệu" /> }}
            />
         )}
      </Card>

      {/* 4. MODAL EDIT */}
      <Modal
         title={<span className="text-blue-700 font-bold uppercase">Cập nhật thông tin</span>}
         open={showModal} onCancel={() => setShowModal(false)}
         onOk={handleUpdateStudent} destroyOnHidden width={600}
         okText="Lưu thay đổi" cancelText="Hủy bỏ"
      >
         {editingStudent && (
             <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
                    <Input size="large" value={editingStudent.ho_va_ten} onChange={(e) => setEditingStudent({...editingStudent, ho_va_ten: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày sinh</label>
                    <DatePicker size="large" className="w-full" format="DD/MM/YYYY" 
                        value={editingStudent.ngay_sinh ? moment(editingStudent.ngay_sinh) : null} 
                        onChange={(d) => setEditingStudent({...editingStudent, ngay_sinh: d})} 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CCCD / CMT</label>
                    <Input size="large" value={editingStudent.so_cmt} onChange={(e) => setEditingStudent({...editingStudent, so_cmt: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Khóa học</label>
                    <Select size="large" className="w-full" value={editingStudent.ma_khoa_hoc} 
                        options={courseList.map(c => ({label: c.ten_khoa_hoc, value: c.ma_khoa_hoc}))} 
                        onChange={(v) => setEditingStudent({...editingStudent, ma_khoa_hoc: v})} 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hạng bằng</label>
                    <Input size="large" value={editingStudent.hang_gplx} onChange={(e) => setEditingStudent({...editingStudent, hang_gplx: e.target.value})} />
                 </div>
             </div>
         )}
      </Modal>

      {/* GLOBAL CSS */}
      <style>{`
        .ant-table-thead > tr > th { 
            background: #fafafa !important; 
            color: #555; 
            font-weight: 700;
            text-transform: uppercase;
            font-size: 12px;
        }
        .ant-table-row { transition: all 0.2s; }
        .ant-table-row:hover { background-color: #f0f7ff !important; }
        .ant-modal-header { border-bottom: 1px solid #f0f0f0; margin-bottom: 10px; }
      `}</style>
    </div>
  );
};

export default Students;
