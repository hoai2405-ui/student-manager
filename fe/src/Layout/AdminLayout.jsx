import {
  Layout,
  Menu,
  Dropdown,
  theme,
  Drawer,
  Button,
  Grid,
  Avatar,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import {
  HomeOutlined,
  UsergroupDeleteOutlined,
  BarChartOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  CalendarOutlined,
  FormOutlined,
  MenuOutlined, // Icon menu mobile
  CloseOutlined, // Icon đóng menu
} from "@ant-design/icons";
import "../assets/main.css";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ROUTES_PATH } from "../Common/constants";
import AdminFooter from "../Components/Footer";
import { useAuth } from "../contexts/AuthContext";

const { Content, Sider, Header } = Layout;
const { useBreakpoint } = Grid;

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const screens = useBreakpoint(); // Hook check kích thước màn hình

  // Logic lấy thông tin user
  const userInfo = useMemo(() => user?.user ?? user, [user]);
  const role = userInfo?.role;
  const isAdmin = !!(
    userInfo?.is_admin ||
    userInfo?.isAdmin ||
    role === "admin"
  );

  const navigate = useNavigate();
  const location = useLocation();

  // State layout
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // State menu mobile
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // Tự động đóng menu mobile khi chuyển trang
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Logic set Active Key
  useEffect(() => {
    const path = location.pathname;
    // Map path to key logic (Giữ nguyên logic của bạn)
    if (path === ROUTES_PATH.ADMIN_DASHBOARD)
      setSelectedKey(ROUTES_PATH.ADMIN_DASHBOARD);
    else if (path === ROUTES_PATH.ADMIN_STUDENTS)
      setSelectedKey(ROUTES_PATH.ADMIN_STUDENTS);
    else if (path.startsWith(ROUTES_PATH.ADMIN_LESSONS))
      setSelectedKey(ROUTES_PATH.ADMIN_LESSONS);
    else if (path.startsWith(ROUTES_PATH.ADMIN_COURSES))
      setSelectedKey(ROUTES_PATH.ADMIN_COURSES);
    else if (path.startsWith(ROUTES_PATH.ADMIN_STATS))
      setSelectedKey(ROUTES_PATH.ADMIN_STATS);
    else if (path === ROUTES_PATH.ADMIN_REGISTERED_SCHEDULES)
      setSelectedKey(ROUTES_PATH.ADMIN_REGISTERED_SCHEDULES);
    else if (path.startsWith(ROUTES_PATH.ADMIN_SCHEDULES))
      setSelectedKey(ROUTES_PATH.ADMIN_SCHEDULES);
    else if (path.startsWith(ROUTES_PATH.ADMIN_USERS))
      setSelectedKey(ROUTES_PATH.ADMIN_USERS);
    else if (path.startsWith(ROUTES_PATH.ADMIN_ASSESSMENT))
      setSelectedKey(ROUTES_PATH.ADMIN_ASSESSMENT);
    else if (path.startsWith(ROUTES_PATH.ADMIN_SUBJECTS))
      setSelectedKey(ROUTES_PATH.ADMIN_SUBJECTS);
  }, [location.pathname]);

  const menuItems = [
    {
      key: ROUTES_PATH.ADMIN_DASHBOARD,
      icon: <HomeOutlined />,
      label: "Trang chủ",
    },
    {
      key: ROUTES_PATH.ADMIN_COURSES,
      icon: <BookOutlined />,
      label: "Khoá học",
    },
    {
      key: ROUTES_PATH.ADMIN_LESSONS,
      icon: <BookOutlined />,
      label: "Quản lý bài giảng",
    },
    {
      key: ROUTES_PATH.ADMIN_STUDENTS,
      icon: <UsergroupDeleteOutlined />,
      label: "Học Viên",
    },
    {
      key: ROUTES_PATH.ADMIN_STATS,
      icon: <BarChartOutlined />,
      label: "Thống kê",
    },
    {
      key: ROUTES_PATH.ADMIN_SCHEDULES,
      icon: <CalendarOutlined />,
      label: "Lịch học",
    },
    ...(isAdmin
      ? [
          {
            key: ROUTES_PATH.ADMIN_REGISTERED_SCHEDULES,
            icon: <CalendarOutlined />,
            label: "Lịch đã đăng ký",
          },
          {
            key: ROUTES_PATH.ADMIN_USERS,
            icon: <UserSwitchOutlined />,
            label: "Users",
          },
          {
            key: ROUTES_PATH.ADMIN_SUBJECTS,
            icon: <BookOutlined />,
            label: "Môn học",
          },
          {
            key: ROUTES_PATH.ADMIN_ASSESSMENT,
            icon: <FormOutlined />,
            label: "Thi thử",
          },
        ]
      : []),
  ];

  const profileMenu = [
    {
      key: "profile",
      label: (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600 }}>
            {userInfo?.username || "Admin"}
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>
            {isAdmin ? "Quản trị viên" : "Nhân viên"}
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
      danger: true,
      onClick: () => {
        const path = logout();
        navigate(path);
      },
    },
  ];

  // Component Logo tái sử dụng
  const Logo = ({ collapsed }) => (
    <div
      style={{
        padding: collapsed ? "12px 8px" : "16px 12px",
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: collapsed ? 64 : 80,
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        cursor: "pointer",
      }}
      onClick={() => navigate(ROUTES_PATH.ADMIN_DASHBOARD)}
    >
      <img
        src="/logo-vuong200.png"
        alt="Logo"
        style={{
          width: collapsed ? 32 : 40,
          height: collapsed ? 32 : 40,
          borderRadius: "10px",
          border: "2px solid rgba(255,255,255,0.2)",
        }}
      />
      {!collapsed && (
        <div
          style={{
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          ADMIN PANEL
        </div>
      )}
    </div>
  );

  // Check mobile
  const isMobile = !screens.lg; // Dưới màn hình Large (Laptop) thì coi là mobile/tablet

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 1. SIDER DESKTOP */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={260}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            background: "linear-gradient(180deg, #001529 0%, #002140 100%)",
            zIndex: 100,
            boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
          }}
        >
          <Logo collapsed={collapsed} />
          <Menu
            theme="dark"
            selectedKeys={[selectedKey]}
            items={menuItems}
            mode="inline"
            onClick={({ key }) => navigate(key)}
            style={{ background: "transparent", border: "none" }}
          />
        </Sider>
      )}

      {/* 2. DRAWER MOBILE */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={260}
        styles={{
          body: {
            padding: 0,
            background: "linear-gradient(180deg, #001529 0%, #002140 100%)",
          },
          header: { display: "none" },
        }}
        bodyStyle={{
          padding: 0,
          background: "linear-gradient(180deg, #001529 0%, #002140 100%)",
        }} // Fallback
        closeIcon={null}
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Logo collapsed={false} />
          <Menu
            theme="dark"
            selectedKeys={[selectedKey]}
            items={menuItems}
            mode="inline"
            onClick={({ key }) => navigate(key)}
            style={{ background: "transparent", border: "none", flex: 1 }}
          />
          <div style={{ padding: 20, textAlign: "center" }}>
            <Button
              ghost
              icon={<CloseOutlined />}
              onClick={() => setMobileDrawerOpen(false)}
            >
              Đóng Menu
            </Button>
          </div>
        </div>
      </Drawer>

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
          transition: "all 0.2s",
          minHeight: "100vh",
          background: "#f0f2f5",
        }}
      >
        <Header
          style={{
            padding: isMobile ? "0 16px" : "0 24px",
            background: "linear-gradient(90deg, #001529 0%, #003a5c 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 99,
            height: 64,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ color: "white", fontSize: 20 }} />}
                onClick={() => setMobileDrawerOpen(true)}
                style={{ marginLeft: -8 }}
              />
            )}
            {!isMobile && (
              <div
                style={{
                  width: 4,
                  height: 24,
                  background: "#1890ff",
                  borderRadius: 2,
                }}
              />
            )}
            <div
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: isMobile ? 16 : 20,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: isMobile ? 200 : "unset",
              }}
            >
              {isMobile ? "Quản Lý Học Viên" : "Hệ Thống Quản Lý Học Viên"}
            </div>
          </div>

          {/* Header Right */}
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
                padding: "6px 10px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.1)",
                transition: "all 0.3s",
              }}
            >
              <Avatar
                size={32}
                style={{
                  backgroundColor: "#1890ff",
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                {userInfo?.username?.charAt(0).toUpperCase() || (
                  <UserOutlined />
                )}
              </Avatar>
              {!isMobile && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.2,
                    paddingRight: 4,
                    textAlign: "right",
                  }}
                >
                  <span
                    style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}
                  >
                   
                  </span>
                  <span
                    style={{ color: "white", fontWeight: 700, fontSize: 13 }}
                  >
                    {String(userInfo?.username || "")
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(-1)[0] || userInfo?.username}
                  </span>
                </div>
              )}
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: isMobile ? "16px 12px" : "24px 24px",
            minHeight: "calc(100vh - 64px - 100px)", // Trừ header và footer
          }}
        >
          <div
            style={{
              padding: isMobile ? 16 : 24,
              background: "#fff",
              borderRadius: borderRadiusLG,
              minHeight: "100%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Outlet />
          </div>
        </Content>

        <div
          style={{ textAlign: "center", padding: "0 20px 20px", color: "#888" }}
        >
          <AdminFooter />
        </div>
      </Layout>

      {/* CSS Override cho Menu đẹp hơn */}
      <style>{`
         .ant-menu-dark.ant-menu-inline .ant-menu-item-selected {
            background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%) !important;
            box-shadow: 0 4px 10px rgba(24,144,255,0.3);
         }
         .ant-menu-dark .ant-menu-item {
             margin: 4px 10px;
             width: calc(100% - 20px);
             border-radius: 8px;
         }
         .ant-menu-dark .ant-menu-sub .ant-menu-item {
            margin: 4px 10px !important; 
         }
      `}</style>
    </Layout>
  );
};

export default AdminLayout;
