import { Layout, Menu, Dropdown, theme, Avatar } from "antd";
import { useEffect, useState, useMemo } from "react";
import {
  HomeOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  RobotOutlined,
  BarChartOutlined,
  FormOutlined,
} from "@ant-design/icons";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminFooter from "../Components/Footer";
import { useAuth } from "../contexts/AuthContext";

const { Content, Sider, Header } = Layout;

const StudentLayout = () => {
  const { user, logout } = useAuth();

  const userInfo = useMemo(() => {
    try {
      const localStudent = JSON.parse(localStorage.getItem("studentInfo"));
      return user?.student || user || localStudent || null;
    } catch {
      return user?.student || user || null;
    }
  }, [user]);

  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);


  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/student") {
      setSelectedKey("/student");
    } else if (
      path.startsWith("/student/learning") ||
      path.startsWith("/student/subjects")
    ) {
      setSelectedKey("/student/learning");
    } else {
      setSelectedKey(path);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);



  // --- HÀM XỬ LÝ ẢNH (QUAN TRỌNG) ---
  const getAvatarSrc = (imgData) => {
    if (!imgData) return null;

    // 1. Nếu là đường dẫn file (http... hoặc /uploads...) -> Trả về y nguyên
    if (imgData.includes("/") && !imgData.includes("base64")) {
      if (imgData.startsWith("/uploads")) return `${import.meta.env.VITE_API_URL || "http://localhost:3001"}${imgData}`;
      return imgData;
    }

    // 2. Xử lý ảnh Base64 (Từ XML hoặc database)
    // Xóa hết các ký tự xuống dòng, khoảng trắng thừa
    const cleanData = imgData.replace(/[\r\n\s]+/g, "");

    // Nếu đã có đầu tố chuẩn -> Trả về
    if (cleanData.startsWith("data:image")) {
      console.log("✅ Avatar: Already has data:image prefix");
      return cleanData;
    }

    // Nếu là chuỗi base64 thuần (không có prefix) -> Thêm prefix
    // Kiểm tra xem có phải base64 không (chỉ chứa A-Z, a-z, 0-9, +, /, =)
    if (/^[A-Za-z0-9+/=]+$/.test(cleanData) && cleanData.length > 100) {
      console.log("✅ Avatar: Adding base64 prefix");
      return `data:image/jpeg;base64,${cleanData}`;
    }

    // Nếu không phải base64 và không phải URL -> Trả về null
    console.log("❌ Avatar: Invalid format, returning null");
    return null;
  };

  const items = [
    {
      key: "/student",
      icon: <HomeOutlined />,
      label: "Trang chủ",
    },
    {
      key: "/student/learning",
      icon: <PlayCircleOutlined />,
      label: "Môn học của tôi",
    },
    {
      key: "/student/practice",
      icon: <ReadOutlined />,
      label: "Ôn tập",
    },
    {
      key: "/student/progress",
      icon: <BarChartOutlined />,
      label: "Tiến độ học tập",
    },
    {
      key: "/student/exams",
      icon: <FormOutlined />,
      label: "Thi thử",
    },
    {
      key: "/student/history",
      icon: <HistoryOutlined />,
      label: "Lịch sử học",
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
              {/* --- ĐÃ SỬA LẠI AVATAR --- */}
              <Avatar
                size={40}
                src={getAvatarSrc(userInfo?.anh_chan_dung)}
                icon={<UserOutlined />}
                style={{ 
                    border: "2px solid #1890ff",
                    backgroundColor: userInfo?.anh_chan_dung ? 'transparent' : '#1890ff' 
                }}
                // Bỏ hết các sự kiện onError, onLoad thủ công
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
