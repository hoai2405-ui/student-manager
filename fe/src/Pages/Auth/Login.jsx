import { useState, useEffect } from "react";
import { Card, Input, Button, Form, message, Tabs } from "antd";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState("login");

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const onLogin = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/login", values);
      login(res.data);
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
        background: "radial-gradient(circle at 30% 107%, #252B5C 0%, #171B3C 90%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Poppins', sans-serif",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 450,
          padding: "40px 30px",
          borderRadius: 25,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        bordered={false}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1 style={{ 
            fontSize: "23px", 
            background: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "10px"
          }}>
            Quản trị Học Viên Hoàng Thịnh
          </h1>
          <p style={{ color: "#666", fontSize: "16px" }}>Đăng nhập để tiếp tục</p>
        </div>
        
        <Tabs
          centered
          activeKey={activeKey}
          onChange={setActiveKey}
          tabBarGutter={50}
          tabBarStyle={{
            marginBottom: 30,
            fontWeight: 600,
            fontSize: 16,
          }}
          items={[
            {
              key: "login",
              label: "Đăng nhập",
              children: (
                <Form
                  layout="vertical"
                  onFinish={onLogin}
                  style={{ marginTop: 10 }}
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: "Username is required" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                      placeholder="Username"
                      size="large"
                      style={{
                        borderRadius: 12,
                        height: "50px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "Password is required" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                      placeholder="Password"
                      size="large"
                      style={{
                        borderRadius: 12,
                        height: "50px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Form.Item>
                  <Button
                    loading={loading}
                    htmlType="submit"
                    type="primary"
                    block
                    size="large"
                    style={{
                      borderRadius: 12,
                      height: "50px",
                      marginTop: 20,
                      background: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                      border: "none",
                      boxShadow: "0 10px 20px rgba(33, 147, 176, 0.2)",
                      fontWeight: 600,
                      fontSize: "16px",
                      transition: "all 0.3s ease",
                    }}
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
                <Form
                  layout="vertical"
                  onFinish={onRegister}
                  style={{ marginTop: 10 }}
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: "Username is required" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                      placeholder="Username"
                      size="large"
                      style={{
                        borderRadius: 12,
                        height: "50px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Invalid email format" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: '#1890ff' }} />}
                      placeholder="Email"
                      size="large"
                      style={{
                        borderRadius: 12,
                        height: "50px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: "Phone number is required" },
                      {
                        pattern: /^[0-9]{9,11}$/,
                        message: "Invalid phone number",
                      },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined style={{ color: '#1890ff' }} />}
                      placeholder="Phone number"
                      size="large"
                      style={{
                        borderRadius: 12,
                        height: "50px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "Password is required" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                      placeholder="Password"
                      size="large"
                      style={{
                        borderRadius: 12,
                        height: "50px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Form.Item>
                  <Button
                    loading={loading}
                    htmlType="submit"
                    type="primary"
                    block
                    size="large"
                    style={{
                      borderRadius: 12,
                      height: "50px",
                      marginTop: 20,
                      background: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
                      border: "none",
                      boxShadow: "0 10px 20px rgba(33, 147, 176, 0.2)",
                      fontWeight: 600,
                      fontSize: "16px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    Đăng Ký tài khoản
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
