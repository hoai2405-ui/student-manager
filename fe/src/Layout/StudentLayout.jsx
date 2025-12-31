import { Layout, Menu, Dropdown, theme, Avatar, Drawer, Button, Grid } from "antd";
import { useEffect, useState, useMemo } from "react";
import {
  HomeOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  BarChartOutlined,
  FormOutlined,
  MenuOutlined, // Icon 3 gạch cho mobile
  CloseOutlined
} from "@ant-design/icons";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminFooter from "../Components/Footer";
import { useAuth } from "../contexts/AuthContext";

const { Content, Sider, Header } = Layout;
const { useBreakpoint } = Grid;

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const screens = useBreakpoint(); // Hook để kiểm tra kích thước màn hình (xs, sm, md, lg...)
  
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
  
  // State
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State cho Drawer Mobile
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const {
    token: { borderRadiusLG, colorBgContainer },
  } = theme.useToken();

  // Update selected key active
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

  // Tự động đóng Menu mobile khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // --- HÀM XỬ LÝ ẢNH (GIỮ NGUYÊN) ---
  const getAvatarSrc = (imgData) => {
    if (!imgData) return null;
    if (imgData.includes("/") && !imgData.includes("base64")) {
      if (imgData.startsWith("/uploads")) return `${import.meta.env.VITE_API_URL || "http://localhost:3001"}${imgData}`;
      return imgData;
    }
    const cleanData = imgData.replace(/[\r\n\s]+/g, "");
    if (cleanData.startsWith("data:image")) return cleanData;
    if (/^[A-Za-z0-9+/=]+$/.test(cleanData) && cleanData.length > 100) {
      return `data:image/jpeg;base64,${cleanData}`;
    }
    return null;
  };

  const menuItems = [
    { key: "/student", icon: <HomeOutlined />, label: "Trang chủ" },
    { key: "/student/learning", icon: <PlayCircleOutlined />, label: "Môn học của tôi" },
    { key: "/student/history", icon: <HistoryOutlined />, label: "Lịch sử học" },
    { key: "/student/progress", icon: <BarChartOutlined />, label: "Tiến độ học tập" },
    { key: "/student/practice", icon: <ReadOutlined />, label: "Ôn tập" },
    { key: "/student/exams", icon: <FormOutlined />, label: "Thi thử" },
  ];

  const profileMenu = [
    {
      key: "profile",
      label: (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 120 }}>
          <span style={{ fontWeight: "bold" }}>{userInfo?.ho_va_ten || "Học viên"}</span>
          <span style={{ fontSize: "12px", color: "#888" }}>SBD: {userInfo?.so_cmt || "---"}</span>
        </div>
      ),
      icon: <UserOutlined />,
    },
    { type: "divider" },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        localStorage.removeItem("studentToken");
        localStorage.removeItem("studentInfo");
        localStorage.removeItem("auth");
        if (logout) logout();
        navigate("/student/login");
      },
    },
  ];

  // Component Logo dùng chung
  const Logo = ({ collapsed }) => (
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
        fontSize: collapsed ? "14px" : "18px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: "all 0.3s",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.1)"
      }}
      onClick={() => navigate("/student")}
    >
      {collapsed ? "LX" : "HỌC LÁI XE"}
    </div>
  );

  // Kiểm tra xem có phải mobile không (dưới 992px là coi như mobile/tablet dọc)
  const isMobile = !screens.lg;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 1. SIDER CHO DESKTOP (Ẩn khi màn hình nhỏ) */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={250}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 101,
            background: "#001529",
            boxShadow: "2px 0 8px rgba(0,0,0,0.15)"
          }}
        >
          <Logo collapsed={collapsed} />
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ border: "none" }}
          />
        </Sider>
      )}

      {/* 2. DRAWER CHO MOBILE (Menu trượt) */}
      <Drawer
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={260}
        styles={{ body: { padding: 0, background: '#001529' }, header: { display: 'none' } }}
        closeIcon={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 0 0 0' }}>
               <Logo collapsed={false} />
            </div>
            <div style={{ padding: '0 16px 20px 16px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12 }}>
                Hệ thống đào tạo lái xe
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{ border: "none", flex: 1 }}
            />
            <div style={{ padding: 20, textAlign: 'center' }}>
                <Button 
                    ghost 
                    icon={<CloseOutlined />} 
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                    Đóng Menu
                </Button>
            </div>
        </div>
      </Drawer>

      <Layout
        style={{
          // Nếu là mobile thì margin = 0, nếu desktop thì margin = width của sider
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 250),
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          background: "#f0f2f5",
        }}
      >
        <Header
          style={{
            padding: isMobile ? "0 16px" : "0 24px",
            background: colorBgContainer,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
            height: 64
          }}
        >
            {/* Header Left: Button Menu Mobile hoặc Title Desktop */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                {isMobile && (
                    <Button 
                        type="text" 
                        icon={<MenuOutlined style={{ fontSize: 20 }} />} 
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ marginLeft: -8 }}
                    />
                )}
                <div style={{ 
                    fontSize: isMobile ? "16px" : "18px", 
                    fontWeight: 600, 
                    color: "#001529",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: isMobile ? '200px' : 'auto'
                }}>
                    {isMobile ? "E-Learning" : "Hệ thống E-Learning"}
                </div>
            </div>

            {/* Header Right: User Info */}
            <Dropdown menu={{ items: profileMenu }} trigger={["click"]} placement="bottomRight">
                <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    {!isMobile && (
                        <div style={{ lineHeight: "1.2", display: "flex", flexDirection: "column", textAlign: 'right' }}>
                            <span style={{ fontWeight: 600, color: "#333" }}>{userInfo?.ho_va_ten?.split(' ').pop()}</span>
                            <span style={{ fontSize: 11, color: "#888" }}>
                                {userInfo?.hang_gplx ? `Hạng ${userInfo.hang_gplx}` : "Học viên"}
                            </span>
                        </div>
                    )}
                    <Avatar
                        size={isMobile ? 36 : 40}
                        src={getAvatarSrc(userInfo?.anh_chan_dung)}
                        icon={<UserOutlined />}
                        style={{
                            border: "2px solid #e6f7ff",
                            backgroundColor: userInfo?.anh_chan_dung ? 'transparent' : '#1890ff',
                            cursor: 'pointer'
                        }}
                    />
                </div>
            </Dropdown>
        </Header>

        <Content
          style={{
            margin: isMobile ? "16px 12px 0" : "24px 24px 0",
            overflow: "initial",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: isMobile ? 16 : 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 150px)",
              flex: 1,
              boxShadow: isMobile ? "none" : "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <Outlet />
          </div>
        </Content>

        <div style={{ textAlign: "center", padding: "20px", color: "#888", fontSize: '0.85rem' }}>
          <AdminFooter />
        </div>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;