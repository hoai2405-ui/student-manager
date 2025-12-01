import { PlusOutlined, SearchOutlined, DownloadOutlined, UserOutlined } from "@ant-design/icons";
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
} from "antd";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES_PATH } from "../../Common/constants";
import axios from "../../Common/axios";
import moment from "moment";
import * as XLSX from 'xlsx';
import { TableSkeleton } from '../../Components/Loading';

const { useBreakpoint } = Grid;

const StudentsXML = () => {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [cccd, setCccd] = useState("");
  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
  });
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, seteditingStudent] = useState(null);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [courseList, setCoursesList] = useState([]);

  useEffect(() => {
    if (selectedCourse) {
      fetchData();
    } else {
      // Clear data when no course is selected
      setData([]);
    }
    // eslint-disable-next-line
  }, [tableParams.pagination?.current, tableParams.pagination?.pageSize, selectedCourse]);

  const handleEdit = (student) => {
    seteditingStudent({
      ...student,
      ma_khoa_hoc: student.ma_khoa_hoc || undefined,
    });
    setShowModal(true);
  };

  const handleUpdateStudent = async () => {
    try {
      // Gửi đủ các trường backend yêu cầu
      const payload = {
        ho_va_ten: editingStudent.ho_va_ten,
        ngay_sinh: editingStudent.ngay_sinh,
        hang_gplx: editingStudent.hang_gplx,
        so_cmt: editingStudent.so_cmt,
        ma_khoa_hoc: editingStudent.ma_khoa_hoc,
        status: editingStudent.status || "chua thi",
        status_ly_thuyet: editingStudent.status_ly_thuyet || "chua thi",
        status_mo_phong: editingStudent.status_mo_phong || "chua thi",
        status_duong: editingStudent.status_duong || "chua thi",
        status_truong: editingStudent.status_truong || "chua thi",
      };
      await axios.put(`/api/students/${editingStudent.id}`, payload);
      message.success("Cập nhật học viên thành công");
      setShowModal(false);
      fetchData();
    } catch (err) {
      message.error("Lỗi khi cập nhật học viên: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`);
      message.success("Đã xoá học viên");
      fetchData();
    } catch (err) {
      message.error("Lỗi khi xoá học viên");
    }
  };

  const handleCccdChange = (e) => {
    setCccd(e.target.value);
    debouncedFetchData(e.target.value);
  };
  const debouncedFetchData = debounce((newCccd) => {
    fetchData(newCccd);
  }, 300);

  const fetchData = async (newCccd) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/students", {
        params: {
          name: name.trim(),
          cccd: newCccd ?? cccd.trim(),
          status: selectedStatus,
          ma_khoa_hoc: selectedCourse,
        },
      });
      setData(res.data);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios
      .get("/api/courses")
      .then((res) => {
        setCoursesList(res.data);
      })
      .catch(() => {});
  }, []);

  const handleTableChange = (pagination) => {
    setTableParams({ pagination });
    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
      setData([]);
    }
  };

  const handleSearch = () => {
    setTableParams({
      ...tableParams,
      pagination: { ...tableParams.pagination, current: 1 },
    });
    fetchData();
  };

  const STATUS_OPTIONS = [
    { value: "dat", text: "Đạt" },
    { value: "rot", text: "Rớt" },
    { value: "vang", text: "Vắng" },
    { value: "thi", text: "Đang thi" },
    { value: "chua thi", text: "Chưa thi" },
  ];

  // Responsive columns - REMOVED status columns (Lý thuyết, Mô phỏng, Đường, Hình)
  const columns = [
    {
      title: "STT",
      key: "index",
      width: screens.xs ? 44 : 60,
      responsive: ["xs", "sm", "md", "lg", "xl"],
      render: (text, record, index) =>
        (tableParams.pagination?.current - 1) *
          tableParams.pagination?.pageSize +
        index +
        1,
    },
    {
      title: "Họ và tên",
      dataIndex: "ho_va_ten",
      minWidth: 120,
      maxWidth: 200,
      width: screens.xs ? 140 : 200,
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg", "xl"],
      render: (text) => (
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: 600,
            color: "#222",
            display: "block",
            maxWidth: screens.xs ? 120 : 180,
          }}
          title={text}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Ảnh",
      dataIndex: "anh_chan_dung",
      key: "avatar",
      width: screens.xs ? 80 : 110,
      responsive: ["xs", "sm", "md", "lg", "xl"],
      render: (avatar, record) => {
        // Try multiple field names for photos
        let photoUrl = avatar || record.anh || record.anh_chan_dung;

        // Xử lý base64: nếu có dữ liệu nhưng không có prefix, thêm prefix
        if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim()) {
          // Nếu là base64 string nhưng không có prefix data:image
          if (!photoUrl.startsWith('data:') &&
              !photoUrl.startsWith('http') &&
              !photoUrl.startsWith('https') &&
              !photoUrl.startsWith('/')) {
            // Thử thêm prefix data:image/png;base64,
            // Nhưng chỉ nếu có vẻ như là base64 (có ký tự đặc biệt của base64)
            if (photoUrl.length > 100 && /^[A-Za-z0-9+/=]+$/.test(photoUrl.replace(/\s/g, ''))) {
              photoUrl = `data:image/png;base64,${photoUrl}`;
            }
          }
        } else {
          photoUrl = undefined; // Không có ảnh
        }

        return (
          <Avatar
            size={screens.xs ? 60 : 80}
            src={photoUrl}
            icon={<UserOutlined />}
            style={{
              border: "3px solid #e1e5e9",
              boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
              transition: "transform 0.2s ease",
            }}
          >
            {record.ho_va_ten?.charAt(0)?.toUpperCase()}
          </Avatar>
        );
      },
    },
    {
      title: "Ngày sinh",
      dataIndex: "ngay_sinh",
      width: 100,
      responsive: ["md", "lg", "xl"],
      render: (value) => {
        if (!value) return "Không rõ";
        const date = moment(
          value,
          ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ", "DD/MM/YYYY", "YYYYMMDD"],
          true
        );
        return date.isValid() ? date.format("DD/MM/YYYY") : "Không rõ";
      },
    },
    {
      title: "Hạng lái xe",
      dataIndex: "hang_gplx",
      width: 90,
      responsive: ["sm", "md", "lg", "xl"],
      render: (value, record) => {
        if (value) return value;
        const course = courseList.find(
          (c) => c.ma_khoa_hoc === record.ma_khoa_hoc
        );
        return course?.hang_gplx || "Không rõ";
      },
    },
    {
      title: "CCCD/CMT",
      dataIndex: "so_cmt",
      width: 110,
      responsive: ["md", "lg", "xl"],
    },
    // STATUS COLUMNS REMOVED:
    // {
    //   title: "Lý thuyết",
    //   dataIndex: "status_ly_thuyet",
    //   ...
    // },
    // {
    //   title: "Mô phỏng",
    //   dataIndex: "status_mo_phong",
    //   ...
    // },
    // {
    //   title: "Đường",
    //   dataIndex: "status_duong",
    //   ...
    // },
    // {
    //   title: "Hình",
    //   dataIndex: "status_truong",
    //   ...
    // },
    {
      title: "Hành động",
      key: "action",
      width: 78,
      fixed: screens.xs ? "right" : undefined,
      render: (_, record) => (
        <>
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            size={screens.xs ? "small" : "middle"}
            style={{
              padding: screens.xs ? "2px 6px" : "4px 12px",
              marginRight: 4,
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn chắc chắn muốn xóa học viên này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              size={screens.xs ? "small" : "middle"}
              style={{ padding: screens.xs ? "2px 6px" : "4px 12px" }}
            >
              Xóa
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <div
        className="admin-header-title"
        style={{
          display: "flex",
          flexDirection: screens.xs ? "column" : "row",
          alignItems: screens.xs ? "stretch" : "center",
          gap: screens.xs ? 8 : 16,
          marginBottom: 8,
        }}
      >
      <style>{`
        @media (max-width: 700px) {
          .ant-table-wrapper {
            overflow-x: auto;
          }
        }
      `}</style>
        <div
          className="title"
          style={{
            fontSize: screens.xs ? 19 : 28,
            fontWeight: 600,
            marginBottom: screens.xs ? 4 : 0,
            textAlign: screens.xs ? "center" : "left",
          }}
        >
          Danh sách Học viên (Đơn giản)
        </div>
        </div>

      <div className="mb-3" style={{ marginTop: 12 }}>
        {courseList.length === 0 && (
          <Empty description="Không có khóa học nào" style={{ marginTop: 8 }} />
        )}
        <Space
          direction={screens.xs ? "vertical" : "horizontal"}
          style={{ width: "100%" }}
        >
          <Input
            placeholder="Tìm tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleSearch}
            style={{ minWidth: screens.xs ? "100%" : 180 }}
            size={screens.xs ? "small" : "middle"}
          />
          <Input
            placeholder="Tìm CCCD"
            value={cccd}
            onChange={handleCccdChange}
            onPressEnter={handleSearch}
            style={{ minWidth: screens.xs ? "100%" : 150 }}
            size={screens.xs ? "small" : "middle"}
          />
          <Button
            icon={<SearchOutlined />}
            type="primary"
            onClick={handleSearch}
            size={screens.xs ? "small" : "middle"}
            style={{ width: screens.xs ? "100%" : undefined }}
          >
            Tìm kiếm
          </Button>
          <Select
            showSearch
            allowClear
            placeholder="Chọn khoá học"
            style={{ width: screens.xs ? "100%" : 220 }}
            value={selectedCourse || undefined}
            onChange={(value) => {
              setSelectedCourse(value || "");
              fetchData();
            }}
            options={courseList.map((course) => ({
              value: course.ma_khoa_hoc,
              label: course.ten_khoa_hoc,
            }))}
            size={screens.xs ? "small" : "middle"}
          />

        </Space>
      </div>
      <div className="admin-content">
        {loading && data.length === 0 ? (
          <TableSkeleton rows={8} columns={6} />
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey={(record) => record.id}
            pagination={tableParams.pagination}
            loading={false}
            onChange={handleTableChange}
            scroll={{ x: screens.xs ? 700 : 900 }}
            size={screens.xs ? "small" : "middle"}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div style={{ color: '#999', fontSize: 16 }}>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>Không có học viên nào</div>
                      <div style={{ fontSize: 14 }}>Chọn khóa học để xem học viên</div>
                    </div>
                  }
                >
                </Empty>
              )
            }}
          />
        )}
        <Modal
          open={showModal}
          title="Chỉnh sửa học viên"
          onCancel={() => setShowModal(false)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '8px 0 0 0' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  minWidth: 90,
                  padding: '7px 0',
                  borderRadius: 7,
                  border: '1px solid #d9d9d9',
                  background: '#fff',
                  color: '#333',
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStudent}
                style={{
                  minWidth: 90,
                  padding: '7px 0',
                  borderRadius: 7,
                  border: 'none',
                  background: 'linear-gradient(120deg,#1976d2 60%,#0ec8ee 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 1px 6px #1976d214',
                  transition: 'all 0.2s',
                }}
              >
                Lưu
              </button>
            </div>
          }
          width={screens.xs ? "98vw" : 600}
          styles={{ body: { padding: 16 } }}
        >
          {editingStudent && (
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <label>Họ và tên:</label>
                <Input
                  value={editingStudent.ho_va_ten}
                  onChange={(e) =>
                    seteditingStudent({
                      ...editingStudent,
                      ho_va_ten: e.target.value,
                    })
                  }
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
              <div>
                <label>Ngày sinh:</label>
                <br />
                <DatePicker
                  format={["DD/MM/YYYY", "YYYY-MM-DD"]}
                  value={
                    editingStudent?.ngay_sinh
                      ? moment(editingStudent.ngay_sinh)
                      : null
                  }
                  onChange={(date) =>
                    seteditingStudent({
                      ...editingStudent,
                      ngay_sinh: date ? date.format("YYYY-MM-DD") : "",
                    })
                  }
                  style={{ width: "100%" }}
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
              <div>
                <label>Hạng GPLX:</label>
                <Input
                  value={editingStudent.hang_gplx}
                  onChange={(e) =>
                    seteditingStudent({
                      ...editingStudent,
                      hang_gplx: e.target.value,
                    })
                  }
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
              <div>
                <label>Khoá học:</label>
                <Select
                  value={editingStudent?.ma_khoa_hoc}
                  style={{ width: "100%" }}
                  onChange={(value) =>
                    seteditingStudent({
                      ...editingStudent,
                      ma_khoa_hoc: value,
                    })
                  }
                  options={courseList.map((course) => ({
                    value: course.ma_khoa_hoc,
                    label: course.ten_khoa_hoc,
                  }))}
                  placeholder="Chọn khoá học"
                  showSearch
                  loading={courseList.length === 0}
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
              <div>
                <label>CCCD/CMT:</label>
                <Input
                  value={editingStudent.so_cmt}
                  onChange={(e) =>
                    seteditingStudent({
                      ...editingStudent,
                      so_cmt: e.target.value,
                    })
                  }
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
            </Space>
          )}
        </Modal>
      </div>
      <style>
        {`
          @media (max-width: 767px) {
            .admin-header-title {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .admin-content {
              padding: 0;
            }
          }
          @media (max-width: 600px) {
  .dashboard-title {
    font-size: 16px !important;
  }
  .admin-header-title .title {
    font-size: 17px !important;
  }
  .ant-btn-primary {
    font-size: 14px !important;
    height: 32px !important;
    border-radius: 8px !important;
  }
  .ant-input, .ant-select-selector {
    font-size: 14px !important;
    border-radius: 7px !important;
    min-height: 32px !important;
  }
  .admin-header-title .action {
    margin-top: 5px;
  }
}



/* Table row màu xen kẽ */
.ant-table-tbody > tr:nth-child(odd) > td {
  background: #f4faff !important;
}
.ant-table-tbody > tr:nth-child(even) > td {
  background: #ffffff !important;
}

/* Hover row nổi bật hơn */
.ant-table-tbody > tr:hover > td {
  background: #e3f2fd !important;
  transition: background 0.2s;
}

/* Nút sửa/xoá thêm hiệu ứng */
.ant-btn-link {
  color: #1565c0 !important;
  font-weight: 600;
}
.ant-btn-link[danger] {
  color: #e53935 !important;
}

/* Responsive table: co font trên mobile, ẩn vài cột phụ nếu nhỏ */
@media (max-width: 700px) {
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    font-size: 13px !important;
    padding: 4px !important;
  }
  .admin-header-title .title {
    font-size: 19px !important;
  }
}

/* Nút tạo mới lớn, đẹp trên PC, gọn trên mobile */
@media (max-width: 500px) {
  .admin-header-title .title {
    font-size: 16px !important;
    text-align: left;
  }
}
        `}
      </style>
      ;
    </>
  );
};

export default StudentsXML;
