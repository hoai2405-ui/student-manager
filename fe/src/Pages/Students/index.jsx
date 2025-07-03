import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
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
} from "antd";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES_PATH } from "../../Common/constants";
import axios from "../../Common/axios";
import moment from "moment";

const { useBreakpoint } = Grid;

const Students = () => {
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
  const [selectedStatus] = useState("");
  const [courseList, setCoursesList] = useState([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [tableParams.pagination?.current, tableParams.pagination?.pageSize]);

  useEffect(() => {
    if (selectedCourse) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [selectedCourse]);

  const handleEdit = (student) => {
    seteditingStudent({
      ...student,
      ma_khoa_hoc: student.ma_khoa_hoc || undefined,
    });
    setShowModal(true);
  };

  const handleUpdateStudent = async () => {
    try {
      await axios.put(`/api/students/${editingStudent.id}`, editingStudent);
      message.success("Cập nhật học viên thành công");
      setShowModal(false);
      fetchData();
    } catch (err) {
      message.error("Lỗi khi cập nhật học viên");
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

  const updateStatus = async (id, field, value) => {
    try {
      await axios.post("/api/students/update-status", { id, field, value });
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
      message.success("Cập nhật trạng thái thành công");
    } catch (err) {
      message.error("Lỗi khi cập nhật trạng thái");
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

  // Responsive columns
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
    width: screens.xs ? 130 : 180,
    ellipsis: false,
    responsive: ["xs", "sm", "md", "lg", "xl"],
    render: text => (
      <span style={{
        whiteSpace: "normal",
        wordBreak: "break-word",
        fontWeight: 600,
        color: "#222"
      }}>{text}</span>
    )
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
    {
      title: "Khoá học",
      dataIndex: "ten_khoa_hoc",
      width: 120,
      responsive: ["md", "lg", "xl"],
    },
    {
      title: "Lý thuyết",
      dataIndex: "status_ly_thuyet",
      width: 84,
      responsive: ["xs", "sm", "md", "lg", "xl"],
      filters: STATUS_OPTIONS.map((opt) => ({
        text: opt.text,
        value: opt.value,
      })),
      onFilter: (value, record) => record.status_ly_thuyet === value,
      render: (value, record) => (
        <Select
          value={value}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.text,
          }))}
          onChange={(val) => updateStatus(record.id, "status_ly_thuyet", val)}
          style={{ width: "90px" }}
          size={screens.xs ? "small" : "middle"}
        />
      ),
    },
    {
      title: "Mô phỏng",
      dataIndex: "status_mo_phong",
      width: 84,
      responsive: ["xs", "sm", "md", "lg", "xl"],
      filters: STATUS_OPTIONS.map((opt) => ({
        text: opt.text,
        value: opt.value,
      })),
      onFilter: (value, record) => record.status_mo_phong === value,
      render: (value, record) => (
        <Select
          value={value}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.text,
          }))}
          onChange={(val) => updateStatus(record.id, "status_mo_phong", val)}
          style={{ width: "90px" }}
          size={screens.xs ? "small" : "middle"}
        />
      ),
    },
    {
      title: "Đường",
      dataIndex: "status_duong",
      width: 84,
      responsive: ["xs", "sm", "md", "lg", "xl"],

      filters: STATUS_OPTIONS.map((opt) => ({
        text: opt.text,
        value: opt.value,
      })),
      onFilter: (value, record) => record.status_duong === value,
      render: (value, record) => (
        <Select
          value={value}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.text,
          }))}
          onChange={(val) => updateStatus(record.id, "status_duong", val)}
          style={{ width: "90px" }}
          size={screens.xs ? "small" : "middle"}
        />
      ),
    },
    {
      title: "Hình",
      dataIndex: "status_truong",
      width: 84,
      responsive: ["xs", "sm", "md", "lg", "xl"],

      filters: STATUS_OPTIONS.map((opt) => ({
        text: opt.text,
        value: opt.value,
      })),
      onFilter: (value, record) => record.status_truong === value,
      render: (value, record) => (
        <Select
          value={value}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.text,
          }))}
          onChange={(val) => updateStatus(record.id, "status_truong", val)}
          style={{ width: "90px" }}
          size={screens.xs ? "small" : "middle"}
        />
      ),
    },
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
            style={{ paddingRight: 8 }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn chắc chắn muốn xóa học viên này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Hủy"
          >
            <Button type="link" danger size={screens.xs ? "small" : "middle"}>
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
        <div
          className="title"
          style={{
            fontSize: screens.xs ? 19 : 28,
            fontWeight: 600,
            marginBottom: screens.xs ? 4 : 0,
            textAlign: screens.xs ? "center" : "left",
          }}
        >
          Danh sách Học viên
        </div>
        </div>

         <div
    style={{
      marginBottom: 10,
      display: "flex",
      justifyContent: screens.xs ? "flex-end" : "flex-start",
      width: "100%",
    }}
  >
          <Button
      onClick={() => navigate(ROUTES_PATH.STUDENTS_NEW)}
      type="primary"
      size={screens.xs ? "small" : "middle"}
      icon={<PlusOutlined />}
      block={screens.xs}
      style={{
        width: screens.xs ? "100%" : "auto",
        fontWeight: 600,
        letterSpacing: 0.5,
      }}
    >
      {!screens.xs && "Tạo mới"}
    </Button>
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
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id}
          pagination={tableParams.pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: screens.xs ? 700 : 900 }} // Xoá scroll ngang trên mobile
          size={screens.xs ? "small" : "middle"}
        />
        <Modal
          open={showModal}
          title="Chỉnh sửa học viên"
          okText="Lưu"
          cancelText="Hủy"
          onCancel={() => setShowModal(false)}
          onOk={handleUpdateStudent}
          width={screens.xs ? "98vw" : 600}
          body={{ padding: 16 }}
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
                <label>Lý thuyết:</label>
                <Select
                  value={editingStudent?.status_ly_thuyet || "chua thi"}
                  options={STATUS_OPTIONS}
                  style={{ width: "100%" }}
                  onChange={(value) =>
                    seteditingStudent({
                      ...editingStudent,
                      status_ly_thuyet: value,
                    })
                  }
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
              <div>
                <label>Mô phỏng:</label>
                <Select
                  value={editingStudent?.status_mo_phong || "chua thi"}
                  options={STATUS_OPTIONS}
                  style={{ width: "100%" }}
                  onChange={(value) =>
                    seteditingStudent({
                      ...editingStudent,
                      status_mo_phong: value,
                    })
                  }
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
              <div>
                <label>Đường:</label>
                <Select
                  value={editingStudent?.status_duong || "chua thi"}
                  options={STATUS_OPTIONS}
                  style={{ width: "100%" }}
                  onChange={(value) =>
                    seteditingStudent({
                      ...editingStudent,
                      status_duong: value,
                    })
                  }
                  size={screens.xs ? "small" : "middle"}
                />
              </div>
              <div>
                <label>Hình:</label>
                <Select
                  value={editingStudent?.status_truong || "chua thi"}
                  options={STATUS_OPTIONS}
                  style={{ width: "100%" }}
                  onChange={(value) =>
                    seteditingStudent({
                      ...editingStudent,
                      status_truong: value,
                    })
                  }
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

export default Students;
