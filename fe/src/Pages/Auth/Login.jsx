import { useState, useEffect } from "react";
import { Card, Input, Button, Form, message, Tabs } from "antd";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Thêm state cho tab
  const [activeKey, setActiveKey] = useState("login");

  useEffect(() => {
    console.log("LoginPage - User:", user);
    if (user) navigate("/");
  }, [user, navigate]);

  const onLogin = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/login", values);
      login(res.data); // <-- data.user sẽ có cả is_admin
      localStorage.setItem("token", res.data.token);
      message.success("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      message.error("Sai tài khoản hoặc mật khẩu");
    }
    setLoading(false);
  };
   

  const onRegister = async (values) => {
    setLoading(true);
    try {
      await axios.post("/api/register", values);
      message.success("Đăng ký thành công, vui lòng đăng nhập!");
      setActiveKey("login");
    } catch (err) {
      message.error(
        "Đăng ký thất bại: " + (err.response?.data?.message || "Lỗi hệ thống")
      );
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#e0eafc 0,#cfdef3 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          minWidth: 370,
          borderRadius: 14,
          boxShadow: "0 8px 32px #0002",
        }}
      >
        <Tabs
          centered
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            {
              key: "login",
              label: "Đăng nhập",
              children: (
                <Form layout="vertical" onFinish={onLogin}>
                  <Form.Item
                    name="username"
                    label="Tài khoản"
                    rules={[{ required: true }]}
                  >
                    <Input autoFocus />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[{ required: true }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Button
                    loading={loading}
                    htmlType="submit"
                    type="primary"
                    block
                  >
                    Đăng nhập
                  </Button>
                </Form>
              ),
            },
            {
              key: "register",
              label: "Đăng ký",
              children: (
                <Form layout="vertical" onFinish={onRegister}>
                  <Form.Item
                    name="username"
                    label="Tài khoản"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại!",
                      },
                      {
                        pattern: /^[0-9]{9,11}$/,
                        message: "Số điện thoại không hợp lệ!",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[{ required: true }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Button
                    loading={loading}
                    htmlType="submit"
                    type="dashed"
                    block
                  >
                    Đăng ký
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
