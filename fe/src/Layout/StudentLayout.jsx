import { Layout, Menu, Dropdown, theme, Avatar } from "antd";
import { useEffect, useState } from "react";
import {
  HomeOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  RobotOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminFooter from "../Components/Footer";
import { useAuth } from "../contexts/AuthContext";

const { Content, Sider, Header } = Layout;

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const localStudent = JSON.parse(localStorage.getItem("studentInfo"));
  const userInfo = user?.student || user || localStudent;

  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // --- SỬA LOGIC HIGHLIGHT MENU ---
  useEffect(() => {
    const path = location.pathname;

    if (path === "/student") {
      // Nếu đúng là trang chủ gốc
      setSelectedKey("/student");
    }
    // Nếu đường dẫn bắt đầu bằng /student/learning (Bao gồm cả learning và learning/:id)
    // Hoặc /student/subjects (Chi tiết môn)
    else if (
      path.startsWith("/student/learning") ||
      path.startsWith("/student/subjects")
    ) {
      setSelectedKey("/student/learning");
    } else {
      setSelectedKey(path);
    }
  }, [location.pathname]);

  // Auto-update window width for responsive layout
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- MENU ITEMS ---
  const items = [
    {
      key: "/student",
      icon: <HomeOutlined />,
      label: "Trang chủ",
    },
    {
      key: "/student/learning", // 👇 Dùng key này chuẩn theo ý bạn
      icon: <PlayCircleOutlined />,
      label: "Môn học của tôi",
    },
    {
      key: "/student/progress",
      icon: <BarChartOutlined />,
      label: "Tiến độ học tập",
    },
    {
      key: "/student/history",
      icon: <HistoryOutlined />,
      label: "Lịch sử thi",
    },
    {
      key: "/student/chat-ai",
      icon: <RobotOutlined />,
      label: "Trợ lý AI",
    },
  ];

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
        localStorage.removeItem("studentToken");
        localStorage.removeItem("studentInfo");
        localStorage.removeItem("auth");
        if (logout) logout();
        navigate("/student/login");
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={240}
        collapsedWidth={0}
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

        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          items={items}
          mode="inline"
          style={{ background: "transparent", border: "none" }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout
        style={{
          marginLeft: windowWidth < 992 ? 0 : collapsed ? 80 : 240,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          background: "#f0f2f5",
        }}
      >
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
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#001529" }}>
            Hệ thống E-Learning
          </div>

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
              <Avatar
                size={40}
                src={userInfo?.anh_chan_dung}
                icon={<UserOutlined />}
                style={{ border: "2px solid #1890ff" }}
                onError={() => true}
              />

              <div
                style={{
                  lineHeight: "1.2",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span style={{ fontWeight: 600, color: "#333" }}>
                  {userInfo?.ho_va_ten || "Học viên"}
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

        <Content
          style={{
            margin: "24px 16px 0",
            overflow: "initial",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 24,
              background: "#fff",
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 150px)",
              flex: 1,
            }}
          >
            <Outlet />
          </div>
        </Content>

        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          <AdminFooter />
        </div>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
