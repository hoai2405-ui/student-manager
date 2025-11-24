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
  Select,
  Tag,
} from "antd";
import axios from "../../Common/axios";
import { PlusOutlined, EditOutlined, DeleteOutlined, CrownOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const { useBreakpoint } = Grid;

const UsersPage = () => {
  const { token: ctxToken, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const getToken = () => {
    if (ctxToken) return ctxToken;
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const a = JSON.parse(raw);
        if (a?.token) return a.token;
      }
    } catch (e) {
      console.error("Parse auth failed", e);
    }
    return localStorage.getItem("token");
  };

  const getAuthHeaders = () => {
    const t = getToken();
    if (!t) return null;
    return { Authorization: `Bearer ${t}` };
  };

  const fetchUsers = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      message.warning("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/users", { headers });
      setUsers(res.data);
    } catch (error) {
      console.error("Chi tiết lỗi lấy user:", error);
      if (error?.response?.status === 401) {
        message.error("Phiên đăng nhập hết hạn, đăng nhập lại.");
        logout();
        navigate("/login");
        return;
      }
      message.error("Lỗi lấy danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) return message.error("Bạn chưa đăng nhập.");
    try {
      await axios.delete(`/api/users/${id}`, { headers });
      message.success("Xóa thành công!");
      fetchUsers();
    } catch (error) {
      console.error("Lỗi xóa người dùng:", error);
      if (error?.response?.status === 401) {
        message.error("Phiên đăng nhập hết hạn.");
        logout();
        navigate("/login");
        return;
      }
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
    const headers = getAuthHeaders();
    if (!headers) return message.error("Bạn chưa đăng nhập.");

    form.validateFields().then(async (values) => {
      try {
        const config = { headers };
        if (editingUser) {
          await axios.put(`/api/users/${editingUser.id}`, values, config);
          message.success("Cập nhật thành công!");
        } else {
          await axios.post("/api/users", values, config);
          message.success("Thêm người dùng thành công!");
        }
        fetchUsers();
        setIsModalVisible(false);
      } catch (error) {
        console.error("Lỗi PUT / POST /users:", error);
        if (error?.response?.status === 401) {
          message.error("Phiên đăng nhập hết hạn.");
          logout();
          navigate("/login");
          return;
        }
        message.error("Có lỗi xảy ra!");
      }
    });
  };

  const columns = [
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      key: "username",
      width: screens.xs ? 130 : 180,
      render: (text) => <b style={{ color: "#1565c0", fontWeight: 600 }}>{text}</b>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: screens.xs ? 100 : 120,
      render: (role) => {
        const isAdmin = role === 'admin' || role === 'administrator';
        return (
          <Tag
            color={isAdmin ? 'gold' : 'blue'}
            icon={isAdmin ? <CrownOutlined /> : <UserOutlined />}
            style={{ fontWeight: 600 }}
          >
            {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
          </Tag>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      responsive: ["sm"],
      render: (val) => <span style={{ color: "#009688", fontSize: screens.xs ? 12 : 15 }}>{val}</span>,
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      responsive: ["md"],
      render: (val) => <span style={{ color: "#606060", fontSize: screens.xs ? 12 : 15 }}>{val}</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: screens.xs ? 120 : 160,
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size={screens.xs ? "small" : "middle"}>
            {!screens.xs && "Sửa"}
          </Button>
          <Popconfirm title="Bạn chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id)} okText="Có" cancelText="Không">
            <Button danger icon={<DeleteOutlined />} size={screens.xs ? "small" : "middle"}>
              {!screens.xs && "Xóa"}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={<span style={{ fontSize: screens.xs ? 20 : 24, fontWeight: 700 }}> Danh sách người dùng</span>}
      style={{
        maxWidth: 900,
        margin: screens.xs ? "8px 2px" : "28px auto",
        borderRadius: 16,
        boxShadow: "0 2px 10px #1976d214, 0 1.5px 2px #1976d204",
        background: "linear-gradient(115deg,#f4faff 40%,#e3f2fd 100%)",
        padding: screens.xs ? 8 : 20,
      }}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size={screens.xs ? "small" : "middle"}>
          Thêm
        </Button>
      }
    >
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} scroll={{ x: 400 }} />
      <Modal title={editingUser ? "Sửa người dùng" : "Thêm người dùng"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button onClick={() => setIsModalVisible(false)}>Huỷ</Button>
          <Button type="primary" onClick={handleOk}>Lưu</Button>
        </div>
      }>
        <Form layout="vertical" form={form}>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: "Nhập tên đăng nhập!" }]}>
            <Input />
          </Form.Item>
          {!editingUser && <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Nhập mật khẩu!" }]}><Input.Password /></Form.Item>}
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Email không hợp lệ!" }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Điện thoại" rules={[{ required: true, pattern: /^[0-9]{9,11}$/, message: "Điện thoại không hợp lệ!" }]}><Input /></Form.Item>
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Chọn vai trò!" }]}
            initialValue="employee"
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="admin">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CrownOutlined style={{ color: '#faad14' }} />
                  <span>Quản trị viên</span>
                </div>
              </Select.Option>
              <Select.Option value="employee">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <span>Nhân viên</span>
                </div>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UsersPage;
