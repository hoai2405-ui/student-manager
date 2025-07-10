import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Card,
  Popconfirm,
  Grid,
} from "antd";
import axios from "../../Common/axios";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { useBreakpoint } = Grid;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
    } catch (error) {
      message.error("Lỗi lấy danh sách người dùng!");
      console.error("Chi tiết lỗi lấy user:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`);
      message.success("Xóa thành công!");
      fetchUsers();
    } catch (error) {
      message.error("Xóa thất bại!");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingUser) {
          await axios.put(`/api/users/${editingUser.id}`, values);
          message.success("Cập nhật thành công!");
        } else {
          await axios.post("/api/users", values);
          message.success("Thêm người dùng thành công!");
        }
        fetchUsers();
        setIsModalVisible(false);
      } catch (error) {
        message.error("Có lỗi xảy ra!");
      }
    });
  };

  // Reponsive cột cho mobile
  const columns = [
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      key: "username",
      width: screens.xs ? 130 : 180,
      render: (text) => (
        <b style={{ color: "#1565c0", fontWeight: 600 }}>{text}</b>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      responsive: ["sm"],
      render: (val) => (
        <span style={{ color: "#009688", fontSize: screens.xs ? 12 : 15 }}>
          {val}
        </span>
      ),
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      responsive: ["md"],
      render: (val) => (
        <span style={{ color: "#606060", fontSize: screens.xs ? 12 : 15 }}>
          {val}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: screens.xs ? 120 : 160,
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size={screens.xs ? "small" : "middle"}
            style={{
              padding: screens.xs ? "0 6px" : "0 12px",
              height: screens.xs ? 26 : 32,
              background: "#e3f2fd",
              border: 0,
              borderRadius: 6,
              color: "#1976d2",
              fontWeight: 600,
              boxShadow: "0 1px 6px #1565c014",
            }}
          >
            {!screens.xs && "Sửa"}
          </Button>
          <Popconfirm
            title="Bạn chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size={screens.xs ? "small" : "middle"}
              style={{
                padding: screens.xs ? "0 6px" : "0 12px",
                height: screens.xs ? 26 : 32,
                background: "#fff0f0",
                border: 0,
                borderRadius: 6,
                color: "#d32f2f",
                fontWeight: 600,
                boxShadow: "0 1px 6px #e5393510",
              }}
            >
              {!screens.xs && "Xóa"}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={
        <span style={{ fontSize: screens.xs ? 20 : 24, fontWeight: 700 }}>
          👤 Quản lý người dùng
        </span>
      }
      style={{
        maxWidth: 900,
        margin: screens.xs ? "8px 2px" : "28px auto",
        borderRadius: 16,
        boxShadow: "0 2px 10px #1976d214, 0 1.5px 2px #1976d204",
        background: "linear-gradient(115deg,#f4faff 40%,#e3f2fd 100%)",
        padding: screens.xs ? 8 : 20,
      }}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size={screens.xs ? "small" : "middle"}
          style={{
            borderRadius: 7,
            fontWeight: 600,
            background: "linear-gradient(120deg,#1976d2 50%,#0ec8ee 100%)",
            border: 0,
            boxShadow: "0 1px 6px #1976d214",
          }}
        >
          Thêm
        </Button>
      }
    >
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 5,
          size: screens.xs ? "small" : "default",
          showTotal: (total) => `Tổng ${total} người dùng`,
        }}
        scroll={{ x: 400 }}
        size={screens.xs ? "small" : "middle"}
        variant="outlined"
        style={{
          borderRadius: 12,
          background: "#fff",
        }}
      />

      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: screens.xs ? 17 : 20 }}>
            {editingUser ? "Sửa người dùng" : "Thêm người dùng"}
          </span>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button
              onClick={() => setIsModalVisible(false)}
              style={{ minWidth: 80 }}
            >
              Huỷ
            </Button>
            <Button type="primary" onClick={handleOk} style={{ minWidth: 80 }}>
              Lưu
            </Button>
          </div>
        }
        width={screens.xs ? "98vw" : 420}
        styles={{
          body: {
            padding: screens.xs ? 10 : 24,
            borderRadius: 16,
            background: "#f4faff",
          },
        }}
        style={{ top: 40 }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: "Nhập tên đăng nhập!" }]}
          >
            <Input size={screens.xs ? "small" : "middle"} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Nhập mật khẩu!" }]}
            >
              <Input.Password size={screens.xs ? "small" : "middle"} />
            </Form.Item>
          )}
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input size={screens.xs ? "small" : "middle"} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Điện thoại"
            rules={[
              {
                required: true,
                pattern: /^[0-9]{9,11}$/,
                message: "Điện thoại không hợp lệ!",
              },
            ]}
          >
            <Input size={screens.xs ? "small" : "middle"} />
          </Form.Item>
        </Form>
      </Modal>

      {/* STYLE REPOSIVE & TABLE màu mè đẹp */}
      <style>
        {`
          /* Table row màu xen kẽ */
          .ant-table-tbody > tr:nth-child(odd) > td {
            background: #f4faff !important;
          }
          .ant-table-tbody > tr:nth-child(even) > td {
            background: #fff !important;
          }
          /* Hover row nổi bật hơn */
          .ant-table-tbody > tr:hover > td {
            background: #e3f2fd !important;
            transition: background 0.2s;
          }
          /* Responsive cho mobile/tablet */
          @media (max-width: 700px) {
            .ant-card { border-radius: 8px !important; padding: 2px !important;}
            .ant-table-thead > tr > th, .ant-table-tbody > tr > td {
              font-size: 13px !important;
              padding: 5px !important;
            }
          }
          @media (max-width: 480px) {
            .ant-card { padding: 2px !important;}
            .ant-modal .ant-modal-content { padding: 6px !important; }
            .ant-btn {
    font-size: 12px !important;
    padding: 0 6px !important;
    height: 28px !important;
    line-height: 28px !important;
    border-radius: 6px !important;
  }
          }
          
        `}
      </style>
    </Card>
  );
};

export default UsersPage;
