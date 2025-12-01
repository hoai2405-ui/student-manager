import { Layout, Menu, Dropdown, theme, Avatar } from "antd";
import { useEffect, useState } from "react";
import {
  HomeOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  RobotOutlined,
} from "@ant-design/icons";
// import "../assets/main.css"; // Bỏ comment nếu bạn có file css chung

import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import { ROUTES_PATH } from "../Common/constants"; // Nếu chưa có file này thì bỏ qua
import AdminFooter from "../Components/Footer"; // Đảm bảo đường dẫn đúng
// Giả sử bạn dùng context này, nếu chưa có thì dùng localStorage như mình hướng dẫn bên dưới
import { useAuth } from "../contexts/AuthContext";

const { Content, Sider, Header } = Layout;

const StudentLayout = () => {
  // Lấy thông tin user.
  // Nếu bạn chưa hoàn thiện AuthContext cho Student, ta có thể lấy tạm từ localStorage
  const { user, logout } = useAuth();

  // Ưu tiên lấy từ Context, nếu không có thì lấy từ localStorage (fallback)
  const localStudent = JSON.parse(localStorage.getItem("studentInfo"));
  const userInfo = user?.student || user || localStudent;

  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // Cập nhật active menu khi đổi trang
  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  // MENU CỦA HỌC VIÊN
  const items = [
    { key: "/student", icon: <HomeOutlined />, label: "Trang chủ" }, // Dashboard
    {
      key: "/student/learning",
      icon: <PlayCircleOutlined />,
      label: "Vào học",
    },
    {
      key: "/student/history",
      icon: <HistoryOutlined />,
      label: "Lịch sử thi",
    },
  ];

  // MENU PROFILE (Góc phải trên)
  const profileMenu = [
    {
      key: "profile",
      label: (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>
            {userInfo?.ho_va_ten || "Học viên"}
          </span>
          <span style={{ fontSize: "12px", color: "#888" }}>
            SBD: {userInfo?.so_cmt || "---"}
          </span>
        </div>
      ),
      icon: <UserOutlined />,
    },
    { type: "divider" },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: () => {
        // Clear student-specific localStorage
        localStorage.removeItem("studentToken");
        localStorage.removeItem("studentInfo");
        // Also clear any auth data if it exists
        localStorage.removeItem("auth");
        // Reset user state if using AuthContext
        if (logout) logout();
        // Navigate to student login
        navigate("/student/login");
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* --- SIDEBAR TRÁI --- */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={240}
        breakpoint="lg"
        style={{
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
          background: "linear-gradient(180deg, #001529 0%, #002140 100%)",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* LOGO AREA */}
        <div
          style={{
            height: 64,
            margin: "16px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: borderRadiusLG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: collapsed ? "14px" : "20px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "all 0.3s",
            cursor: "pointer",
          }}
          onClick={() => navigate("/student")}
        >
          {collapsed ? "LX" : "HỌC LÁI XE"}
        </div>

        {/* MENU ITEMS */}
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          items={items}
          mode="inline"
          style={{ background: "transparent", border: "none" }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      {/* --- MAIN LAYOUT --- */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 240,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          background: "#f0f2f5",
        }}
      >
        {/* HEADER TRÊN CÙNG */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 99,
            boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
          }}
        >
          {/* Tiêu đề trang hoặc Breadcrumb */}
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#001529" }}>
            Hệ thống E-Learning
          </div>

          {/* User Info Dropdown */}
          <Dropdown
            menu={{ items: profileMenu }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* Hiển thị Avatar thật hoặc mặc định */}
              <Avatar
                size={40}
                src={userInfo?.anh_chan_dung}
                icon={<UserOutlined />}
                style={{ border: "2px solid #1890ff" }}
                onError={() => true} // Nếu ảnh lỗi thì hiện icon
              />

              <div
                style={{
                  lineHeight: "1.2",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span style={{ fontWeight: 600, color: "#333" }}>
                  {userInfo?.ho_va_ten || "Khách"}
                </span>
                <span style={{ fontSize: 12, color: "#888" }}>
                  {userInfo?.hang_gplx
                    ? `Hạng ${userInfo.hang_gplx}`
                    : "Học viên"}
                </span>
              </div>
            </div>
          </Dropdown>
        </Header>

        {/* NỘI DUNG CHÍNH (Outlet) */}
        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          <div
            style={{
              padding: 24,
              background: "#fff",
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 150px)", // Trừ hao Header và Footer
            }}
          >
            <Outlet />
          </div>
        </Content>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          <AdminFooter />
        </div>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
