import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  WomanOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
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
  Row,
  Col,
  Typography,
  Dropdown,
  Descriptions,
  Alert,
} from "antd";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import { ROUTES_PATH } from "../../Common/constants";
import axios from "../../Common/axios";
import moment from "moment";
import * as XLSX from "xlsx";
import { TableSkeleton } from "../../Components/Loading";
import { useAuth } from "../../contexts/AuthContext";

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

// --- HÀM XỬ LÝ ẢNH AN TOÀN ---
const getAvatarSrc = (imgData) => {
  if (!imgData) return null;
  if (imgData.includes("http") || imgData.includes("/uploads")) {
    if (imgData.startsWith("/uploads"))
      return `http://localhost:3001${imgData}`;
    return imgData;
  }
  const cleanData = imgData.replace(/[\r\n\s]+/g, "");
  if (cleanData.startsWith("data:image")) return cleanData;
  if (cleanData.length > 100) return `data:image/jpeg;base64,${cleanData}`;
  return null;
};

const Students = () => {
  useBreakpoint();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user?.user ?? user;
  const isAdmin = !!(
    currentUser?.is_admin ||
    currentUser?.isAdmin ||
    currentUser?.role === "admin"
  );

  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
  });

  // Filter State
  const [name, setName] = useState("");
  const [cccd] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseList, setCoursesList] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [makeupModalOpen, setMakeupModalOpen] = useState(false);
  const [makeupStudent, setMakeupStudent] = useState(null);
  const [makeupRange, setMakeupRange] = useState([]);
  const [makeupSaving, setMakeupSaving] = useState(false);

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsStudent, setStatsStudent] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsRows, setStatsRows] = useState([]);
const [sessionRows, setSessionRows] = useState([]);
const [sessionsLoading, setSessionsLoading] = useState(false);

  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceStudent, setFaceStudent] = useState(null);
  const [faceCompareLoading, setFaceCompareLoading] = useState(false);
  const [faceCompareResult, setFaceCompareResult] = useState(null);

  // 1. Load danh sách khóa học
  useEffect(() => {
    axios
      .get("/api/courses")
      .then((res) => {
        setCoursesList(res.data);
      })
      .catch(() => {});
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
    } finally {
      setLoading(false);
    }
  }, [name, cccd, selectedCourse]);

  const debouncedFetch = useMemo(
    () => debounce(() => fetchData(), 500),
    [fetchData]
  );

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  // Effect triggers
  useEffect(() => {
    if (selectedCourse && !name.trim() && !cccd.trim()) {
      // Chỉ hiển thị học viên khi đã chọn khóa và không có từ khóa tìm kiếm
      fetchData();
    } else if (!selectedCourse && !name.trim() && !cccd.trim()) {
      // Reset data khi không chọn khóa học và không tìm kiếm
      fetchData();
    }
  }, [selectedCourse, tableParams.pagination.current, name, cccd, fetchData]);

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
  }, [name, cccd, selectedCourse, debouncedFetch, fetchData]);

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
    } catch {
      message.error("Lỗi cập nhật");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`);
      message.success("Đã xoá học viên");
      fetchData();
    } catch {
      message.error("Lỗi xóa");
    }
  };

  const openMakeupModal = (student) => {
    setMakeupStudent(student);
    setMakeupRange([]);
    setMakeupModalOpen(true);
  };

  const saveMakeupTime = async () => {
    if (!makeupStudent?.id) return;
    if (!Array.isArray(makeupRange) || makeupRange.length !== 2) {
      message.error("Chọn khoảng ngày mở học bù");
      return;
    }

    const [from, to] = makeupRange;
    if (!from || !to) {
      message.error("Chọn khoảng ngày mở học bù");
      return;
    }

    setMakeupSaving(true);
    try {
      await axios.post("/api/students/makeup-window", {
        student_id: makeupStudent.id,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      message.success("Đã mở thời gian học bù");
      setMakeupModalOpen(false);
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Chưa có API học bù, cần backend hỗ trợ"
      );
    } finally {
      setMakeupSaving(false);
    }
  };

  const openStatsModal = async (student) => {
    setStatsStudent(student);
    setStatsRows([]);
    setSessionRows([]);
    setStatsModalOpen(true);

    if (!student?.id) return;

    setStatsLoading(true);
    setSessionsLoading(true);
    try {
      const [dashboardRes, sessionsRes] = await Promise.all([
        axios.get(`/api/student/dashboard/${student.id}`),
        axios.get(`/api/admin/student/${student.id}/sessions`),
      ]);
      setStatsRows(dashboardRes.data || []);
      setSessionRows(sessionsRes.data || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Không lấy được dữ liệu học");
      setStatsRows([]);
      setSessionRows([]);
    } finally {
      setStatsLoading(false);
      setSessionsLoading(false);
    }
  };

  const exportLearningExcel = async (student) => {
    if (!student?.id) return;

    try {
      const [dashboardRes, summaryRes, sessionsRes] = await Promise.all([
        axios.get(`/api/student/dashboard/${student.id}`),
        axios.get(`/api/student/summary/${student.id}`),
        axios.get(`/api/admin/student/${student.id}/sessions`),
      ]);

      const rows = dashboardRes.data || [];
      const summary = summaryRes.data || {};
      const sessions = sessionsRes.data || [];

      const exportRows = rows.map((r, idx) => {
        const required = Number(r.required_hours || 0);
        const learned = Number(r.learned_hours || 0);
        const percent =
          required > 0 ? Math.min((learned / required) * 100, 100) : 0;
        return {
          STT: idx + 1,
          "Môn học": r.subject_name,
          Mã: r.code,
          "Giờ yêu cầu": required,
          "Giờ đã học": Number(learned.toFixed(1)),
          "Tiến độ (%)": Number(percent.toFixed(1)),
          "Trạng thái": r.status,
        };
      });

      const exportSessions = sessions.map((s, idx) => {
        const dur = Number(s.duration_seconds || 0);
        const minutes = dur > 0 ? Math.round(dur / 60) : 0;
        return {
          STT: idx + 1,
          "Bắt đầu": s.started_at ? moment(s.started_at).format("DD/MM/YYYY HH:mm") : "",
          "Kết thúc": s.ended_at ? moment(s.ended_at).format("DD/MM/YYYY HH:mm") : "",
          "Thời lượng (phút)": minutes,
          "Môn": s.subject_name || "",
          "Bài": s.lesson_title || "",
          "Verified in": Number(s.face_verified_in) === 1 ? "YES" : "NO",
          "Verified out": Number(s.face_verified_out) === 1 ? "YES" : "NO",
          "Ảnh vào": s.login_photo_url || "",
          "Ảnh ra": s.logout_photo_url || "",
          "Trạng thái": s.status || "",
        };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(exportRows),
        "ThongKe"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(exportSessions),
        "Sessions"
      );

      const infoSheet = XLSX.utils.json_to_sheet([
        {
          "Học viên": student.ho_va_ten,
          CCCD: student.so_cmt,
          "Hạng GPLX": student.hang_gplx,
          "Tổng giờ đã học": summary.total_learned ?? "",
          "Tổng giờ yêu cầu": summary.total_required ?? "",
          "Tiến độ chung (%)": summary.progress ?? "",
        },
      ]);
      XLSX.utils.book_append_sheet(wb, infoSheet, "ThongTin");

      XLSX.writeFile(
        wb,
        `THONG_KE_HOC_${student.so_cmt || student.id}_${moment().format(
          "DDMMYYYY_HHmm"
        )}.xlsx`
      );
    } catch {
      message.error("Xuất Excel thất bại");
    }
  };

  const openFaceModal = (student) => {
    setFaceStudent(student);
    setFaceCompareResult(null);
    setFaceModalOpen(true);
  };

  const compareFaceSample = async () => {
    if (!faceStudent?.id) return;

    setFaceCompareLoading(true);
    setFaceCompareResult(null);
    try {
      const res = await axios.post("/api/admin/face-verify", {
        student_id: faceStudent.id,
      });
      setFaceCompareResult(res.data);
    } catch (err) {
      message.error(err?.response?.data?.message || "Chưa có API kiểm tra ảnh mẫu");
    } finally {
      setFaceCompareLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (data.length === 0) return message.warning("Không có dữ liệu!");
    const exportData = data.map((st, idx) => ({
      STT: idx + 1,
      "Họ tên": st.ho_va_ten,
      "Ngày sinh": st.ngay_sinh
        ? moment(st.ngay_sinh).format("DD/MM/YYYY")
        : "",
      CCCD: st.so_cmt,
      Khóa: st.ten_khoa_hoc,
      Hạng: st.hang_gplx,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(exportData),
      "HocVien"
    );
    XLSX.writeFile(wb, `DS_HocVien_${moment().format("DDMMYYYY")}.xlsx`);
  };

  // --- COLUMNS (TỐI ƯU HIỂN THỊ) ---
  const columns = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_, __, i) => (
        <span className="text-gray-500 font-medium">{i + 1}</span>
      ),
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
            <span className="font-bold text-gray-800 text-base leading-tight">
              {record.ho_va_ten}
            </span>
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
            <Tag
              color="blue"
              className="font-bold border-none bg-blue-100 text-blue-700"
            >
              Hạng {record.hang_gplx}
            </Tag>
          </div>
        </div>
      ),
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
      ),
    },
    ...(isAdmin
      ? [
          {
            title: "Hành động",
            width: 120,
            fixed: "right",
            align: "center",
            render: (_, record) => {
              const items = [
                {
                  key: "makeup",
                  icon: <ClockCircleOutlined />,
                  label: "Mở thời gian học bù",
                  onClick: () => openMakeupModal(record),
                },
                {
                  key: "stats",
                  icon: <BarChartOutlined />,
                  label: "Thống kê dữ liệu học",
                  onClick: () => openStatsModal(record),
                },
                {
                  key: "export-learning",
                  icon: <FileExcelOutlined />,
                  label: "Xuất dữ liệu học (Excel)",
                  onClick: () => exportLearningExcel(record),
                },
                {
                  key: "face",
                  icon: <CameraOutlined />,
                  label: "Kiểm tra ảnh",
                  onClick: () => openFaceModal(record),
                },
                { type: "divider" },
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Cập nhật",
                  onClick: () => handleEdit(record),
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Xóa",
                  danger: true,
                  onClick: () => handleDelete(record.id),
                },
              ];

              return (
                <Dropdown
                  menu={{ items }}
                  trigger={["click"]}
                  placement="bottomLeft"
                >
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="p-4 md:p-6 bg-[#f0f2f5] min-h-screen">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <Title level={3} style={{ margin: 0, color: "#003a8c" }}>
            QUẢN LÝ HỌC VIÊN
          </Title>
          <Text type="secondary">Danh sách học viên và hồ sơ đào tạo</Text>
        </div>
        <Space wrap>
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                console.log("Button clicked!");
                console.log(
                  "ROUTES_PATH.ADMIN_STUDENTS_NEW:",
                  ROUTES_PATH.ADMIN_STUDENTS_NEW
                );
                console.log("navigate function:", typeof navigate);
                try {
                  navigate(ROUTES_PATH.ADMIN_STUDENTS_NEW);
                  console.log("Navigation called successfully");
                } catch (error) {
                  console.error("Navigation error:", error);
                }
              }}
              size="large"
              className="shadow-sm"
            >
              Thêm mới
            </Button>
          )}
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            size="large"
          >
            Xuất Excel
          </Button>
        </Space>
      </div>

      {/* 2. FILTER CARD */}
      <Card
        className="mb-6 shadow-sm border-0 rounded-lg"
        styles={{ body: { padding: "20px" } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              Lọc theo Khóa học
            </label>
            <Select
              placeholder="Tất cả khóa học"
              style={{ width: "100%" }}
              size="large"
              value={selectedCourse}
              onChange={setSelectedCourse}
              allowClear
              options={courseList.map((c) => ({
                label: c.ten_khoa_hoc,
                value: c.ma_khoa_hoc,
              }))}
            />
          </Col>
          <Col xs={24} md={10}>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              Tìm kiếm
            </label>
            <Input
              placeholder="Nhập tên hoặc số CCCD..."
              prefix={<SearchOutlined className="text-gray-400" />}
              size="large"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              Thống kê
            </label>
            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-center border border-blue-200">
              Tổng số: {data.length} học viên
            </div>
          </Col>
        </Row>
      </Card>

      {/* 3. TABLE DATA */}
      <Card
        className="shadow-md border-0 rounded-lg overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        {!selectedCourse && !name.trim() && !cccd.trim() ? (
          <div className="py-16 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-gray-500">
                  <div className="text-lg font-medium mb-2">
                    Vui lòng chọn khóa học hoặc tìm kiếm
                  </div>
                  <div className="text-sm">
                    Chọn khóa học từ dropdown hoặc nhập từ khóa để xem danh sách
                    học viên
                  </div>
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
              showSizeChanger: true,
            }}
            scroll={{ x: 800 }}
            locale={{
              emptyText: <Empty description="Không tìm thấy dữ liệu" />,
            }}
          />
        )}
      </Card>

      {/* 4. MODAL EDIT */}
      <Modal
        title={
          <span className="text-blue-700 font-bold uppercase">
            Cập nhật thông tin
          </span>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleUpdateStudent}
        destroyOnHidden
        width={600}
        okText="Lưu thay đổi"
        cancelText="Hủy bỏ"
      >
        {editingStudent && (
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Họ và tên
              </label>
              <Input
                size="large"
                value={editingStudent.ho_va_ten}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    ho_va_ten: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Ngày sinh
              </label>
              <DatePicker
                size="large"
                className="w-full"
                format="DD/MM/YYYY"
                value={
                  editingStudent.ngay_sinh
                    ? moment(editingStudent.ngay_sinh)
                    : null
                }
                onChange={(d) =>
                  setEditingStudent({ ...editingStudent, ngay_sinh: d })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                CCCD / CMT
              </label>
              <Input
                size="large"
                value={editingStudent.so_cmt}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    so_cmt: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Khóa học
              </label>
              <Select
                size="large"
                className="w-full"
                value={editingStudent.ma_khoa_hoc}
                options={courseList.map((c) => ({
                  label: c.ten_khoa_hoc,
                  value: c.ma_khoa_hoc,
                }))}
                onChange={(v) =>
                  setEditingStudent({ ...editingStudent, ma_khoa_hoc: v })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Hạng bằng
              </label>
              <Input
                size="large"
                value={editingStudent.hang_gplx}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    hang_gplx: e.target.value,
                  })
                }
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Mở thời gian học bù */}
      <Modal
        title={
          <span className="text-blue-700 font-bold uppercase">
            Mở thời gian học bù
          </span>
        }
        open={makeupModalOpen}
        onCancel={() => setMakeupModalOpen(false)}
        onOk={saveMakeupTime}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={makeupSaving}
        destroyOnHidden
      >
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Học viên">
            {makeupStudent?.ho_va_ten || "---"}
          </Descriptions.Item>
          <Descriptions.Item label="CCCD">
            {makeupStudent?.so_cmt || "---"}
          </Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: 16 }}>
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">
            Khoảng thời gian
          </div>
          <DatePicker.RangePicker
            className="w-full"
            showTime
            value={makeupRange}
            onChange={(v) => setMakeupRange(v || [])}
          />
          <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
            Cần backend lưu lại cửa sổ thời gian học bù cho học viên.
          </div>
        </div>
      </Modal>

      {/* MODAL: Thống kê dữ liệu học */}
      <Modal
        title={
          <span className="text-blue-700 font-bold uppercase">
            Thống kê dữ liệu học
          </span>
        }
        open={statsModalOpen}
        onCancel={() => setStatsModalOpen(false)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Học viên">
            {statsStudent?.ho_va_ten || "---"}
          </Descriptions.Item>
          <Descriptions.Item label="CCCD">
            {statsStudent?.so_cmt || "---"}
          </Descriptions.Item>
          <Descriptions.Item label="Hạng GPLX">
            {statsStudent?.hang_gplx || "---"}
          </Descriptions.Item>
          <Descriptions.Item label="Khóa">
            {statsStudent?.ten_khoa_hoc || "---"}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <Table
            size="small"
            loading={statsLoading}
            dataSource={statsRows}
            rowKey={(r) => r.subject_id}
            pagination={false}
            columns={[
              { title: "Môn", dataIndex: "subject_name", key: "subject_name" },
              { title: "Mã", dataIndex: "code", key: "code", width: 80 },
              {
                title: "Giờ yêu cầu",
                dataIndex: "required_hours",
                key: "required_hours",
                width: 110,
                align: "right",
              },
              {
                title: "Giờ đã học",
                dataIndex: "learned_hours",
                key: "learned_hours",
                width: 110,
                align: "right",
                render: (v) => Number(v || 0).toFixed(1),
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                width: 140,
                render: (v) => (
                  <Tag color={String(v).includes("Hoàn") ? "green" : "orange"}>
                    {v}
                  </Tag>
                ),
              },
            ]}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Table
            size="small"
            loading={sessionsLoading}
            dataSource={sessionRows}
            rowKey={(r) => r.id}
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: "Bắt đầu",
                dataIndex: "started_at",
                key: "started_at",
                width: 160,
                render: (v) => (v ? moment(v).format("DD/MM/YYYY HH:mm") : ""),
              },
              {
                title: "Kết thúc",
                dataIndex: "ended_at",
                key: "ended_at",
                width: 160,
                render: (v) => (v ? moment(v).format("DD/MM/YYYY HH:mm") : ""),
              },
              {
                title: "Thời lượng",
                dataIndex: "duration_seconds",
                key: "duration_seconds",
                width: 100,
                align: "right",
                render: (v) => {
                  const sec = Number(v || 0);
                  if (!sec) return "";
                  return `${Math.round(sec / 60)}p`;
                },
              },
              { title: "Môn", dataIndex: "subject_name", key: "subject_name" },
              { title: "Bài", dataIndex: "lesson_title", key: "lesson_title" },
              {
                title: "Ảnh vào",
                dataIndex: "login_photo_url",
                key: "login_photo_url",
                width: 120,
                render: (u) =>
                  u ? (
                    <a
                      href={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}${u}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                       src={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}${u}`}
                       alt="login"
                       style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                       onError={(e) => {
                         e.currentTarget.style.display = "none";
                       }}
                      />
                    </a>
                  ) : (
                    ""
                  ),
              },
              {
                title: "Ảnh ra",
                dataIndex: "logout_photo_url",
                key: "logout_photo_url",
                width: 120,
                render: (u) =>
                  u ? (
                    <a
                      href={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}${u}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                       src={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}${u}`}
                       alt="logout"
                       style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                       onError={(e) => {
                         e.currentTarget.style.display = "none";
                       }}
                      />
                    </a>
                  ) : (
                    ""
                  ),
              },
              {
                title: "Verified",
                key: "verified",
                width: 120,
                render: (_, r) => (
                  <Space size={4}>
                    <Tag color={Number(r.face_verified_in) === 1 ? "green" : "red"}>IN</Tag>
                    <Tag color={Number(r.face_verified_out) === 1 ? "green" : "red"}>OUT</Tag>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </Modal>

      {/* MODAL: Kiểm tra ảnh */}
      <Modal
        title={
          <span className="text-blue-700 font-bold uppercase">
            Kiểm tra ảnh
          </span>
        }
        open={faceModalOpen}
        onCancel={() => setFaceModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setFaceModalOpen(false)}>Đóng</Button>
            <Button
              type="primary"
              icon={<CameraOutlined />}
              loading={faceCompareLoading}
              onClick={compareFaceSample}
            >
              So sánh ảnh mẫu
            </Button>
          </Space>
        }
        width={720}
        destroyOnHidden
      >
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Học viên">
            {faceStudent?.ho_va_ten || "---"}
          </Descriptions.Item>
          <Descriptions.Item label="CCCD">
            {faceStudent?.so_cmt || "---"}
          </Descriptions.Item>
          <Descriptions.Item label="Có ảnh mẫu">
            {faceStudent?.face_enrolled_at ? (
              <Tag color="green">Đã lưu</Tag>
            ) : (
              <Tag color="red">Chưa có</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Ảnh chân dung">
            {faceStudent?.anh_chan_dung ? (
              <Tag color="green">Có</Tag>
            ) : (
              <Tag color="red">Không có</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        {faceCompareResult ? (
          <div style={{ marginTop: 16 }}>
            <Alert
              type={faceCompareResult.success ? "success" : "error"}
              showIcon
              message={
                faceCompareResult.success
                  ? "Khớp ảnh mẫu"
                  : "Không khớp ảnh mẫu"
              }
              description={`distance=${Number(
                faceCompareResult.distance || 0
              ).toFixed(3)} threshold=${Number(
                faceCompareResult.threshold || 0
              ).toFixed(3)}`}
            />
          </div>
        ) : null}

        <div style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Cần backend endpoint `/api/admin/face-verify` để admin kiểm tra ảnh
          mẫu của học viên.
        </div>
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
