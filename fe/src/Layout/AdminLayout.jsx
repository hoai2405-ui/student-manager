import { Layout, Menu, Dropdown, theme } from "antd";
import { useEffect, useState } from "react";
import {
  HomeOutlined,
  UsergroupDeleteOutlined,
  BarChartOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  CalendarOutlined, // <-- thêm icon
  FormOutlined,
} from "@ant-design/icons";
import "../assets/main.css";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ROUTES_PATH } from "../Common/constants";
import AdminFooter from "../Components/Footer";
import { useAuth } from "../contexts/AuthContext";

const { Content, Sider, Header } = Layout;

const AdminLayout = () => {
  const { user, logout } = useAuth();
  // fallback: nếu AuthContext lưu trực tiếp user hoặc lưu trong user.user
  const userInfo = user?.user ?? user;
  const role = userInfo?.role;
  const isAdmin = !!(userInfo?.is_admin || userInfo?.isAdmin || role === "admin");
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    console.log("Thông tin user hiện tại:", user);
  }, [user]);

  useEffect(() => {
    const path = location.pathname;

    // 1. Nếu đúng là trang chủ Admin (/admin)
    if (path === ROUTES_PATH.ADMIN_DASHBOARD) {
      setSelectedKey(ROUTES_PATH.ADMIN_DASHBOARD);
    }
    // 2. Các trang con khác (check cụ thể trước)
    else if (path === ROUTES_PATH.ADMIN_STUDENTS) {
      setSelectedKey(ROUTES_PATH.ADMIN_STUDENTS);
    }
    else if (path.startsWith(ROUTES_PATH.ADMIN_LESSONS)) {
      setSelectedKey(ROUTES_PATH.ADMIN_LESSONS);
    }
    else if (path.startsWith(ROUTES_PATH.ADMIN_COURSES)) {
      setSelectedKey(ROUTES_PATH.ADMIN_COURSES);
    }
    else if (path.startsWith(ROUTES_PATH.ADMIN_STATS)) {
      setSelectedKey(ROUTES_PATH.ADMIN_STATS);
    }
    else if (path === ROUTES_PATH.ADMIN_REGISTERED_SCHEDULES) {
      setSelectedKey(ROUTES_PATH.ADMIN_REGISTERED_SCHEDULES);
    }
    else if (path.startsWith(ROUTES_PATH.ADMIN_SCHEDULES)) {
      setSelectedKey(ROUTES_PATH.ADMIN_SCHEDULES);
    }
    else if (path.startsWith(ROUTES_PATH.ADMIN_USERS)) {
      setSelectedKey(ROUTES_PATH.ADMIN_USERS);
    }
    else if (path.startsWith(ROUTES_PATH.ADMIN_ASSESSMENT)) {
      setSelectedKey(ROUTES_PATH.ADMIN_ASSESSMENT);
    }
    // Mặc định không set gì hoặc giữ nguyên
  }, [location.pathname]);

  const items = [
    { key: ROUTES_PATH.ADMIN_DASHBOARD, icon: <HomeOutlined />, label: "Trang chủ" },
    { key: ROUTES_PATH.ADMIN_COURSES, icon: <BookOutlined />, label: "Khoá học" },
    {key: ROUTES_PATH.ADMIN_LESSONS, icon: <BookOutlined />, label: "Quản lý bài giảng" },
    {
      key: ROUTES_PATH.ADMIN_STUDENTS,
      icon: <UsergroupDeleteOutlined />,
      label: "Học Viên",
    },
    { key: ROUTES_PATH.ADMIN_STATS, icon: <BarChartOutlined />, label: "Thống kê" },
    { key: ROUTES_PATH.ADMIN_SCHEDULES, icon: <CalendarOutlined />, label: "Lịch học" },
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
      label: `Xin chào, ${userInfo?.username}`,
      icon: <UserOutlined />,
    },
    { type: "divider" },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: () => {
        const path = logout();
        navigate(path);
      },
    },
  ];

  return (
    <Layout style={{ background: "#fff" }}>
      <Sider
        collapsed={collapsed}
        breakpoint="md"
        onBreakpoint={setCollapsed}
        style={{
          minHeight: "100vh",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          background: "linear-gradient(180deg, #001529 0%, #002140 50%, #003a5c 100%)",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          className="demo-logo-vertical"
          style={{
            textAlign: "center",
            padding: collapsed ? "12px 8px" : "16px 12px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
            height: collapsed ? 60 : 80,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            transition: "all 0.3s ease",
          }}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(ROUTES_PATH.ADMIN_DASHBOARD);
            }}
            style={{
              display: "inline-block",
              transition: "transform 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <img
              src="/logo-vuong200.png"
              alt="Logo"
              style={{
                width: collapsed ? 32 : 48,
                height: collapsed ? 32 : 48,
                aspectRatio: "1 / 1",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                objectFit: "cover",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                margin: 0,
                display: "block",
                transition: "all 0.3s ease",
              }}
            />
          </a>
          {!collapsed && (
            <div style={{
              color: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              opacity: 0.9,
              marginTop: 4,
            }}>
              ADMIN PANEL
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          items={items}
          mode="inline"
          style={{
            background: "transparent",
            border: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
          onClick={({ key }) => {
            if (key && key !== location.pathname) {
              navigate(key);
            }
          }}
        />
      </Sider>
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 200, 
        transition: "margin-left 0.2s",
        minHeight: "100vh",
      }}>
        <Header
          style={{
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #001529 0%, #002140 100%)",
            minHeight: 64,
            padding: "0 24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            position: "sticky",
            top: 0,
            zIndex: 99,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              gap: 10,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 4,
                  height: 32,
                  background: "linear-gradient(180deg, #1890ff 0%, #096dd9 100%)",
                  borderRadius: 2,
                }}
              />
              <span
                className="dashboard-title"
                style={{
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#fff",
                  lineHeight: "1.2",
                  letterSpacing: 0.5,
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              >
                Hệ Thống Quản Lý Học Viên
              </span>
            </div>
          </div>
          <Dropdown 
            menu={{ items: profileMenu }} 
            trigger={["click"]}
            placement="bottomRight"
          >
            <span
              style={{
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 12px",
                borderRadius: "8px",
                transition: "background 0.3s ease",
                background: "rgba(255, 255, 255, 0.1)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: "0 2px 8px rgba(24, 144, 255, 0.3)",
                }}
              >
                {userInfo?.username?.charAt(0).toUpperCase() || (
                  <UserOutlined />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {userInfo?.username || "User"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.8,
                    lineHeight: 1.2,
                  }}
                >
                  {isAdmin ? "Administrator" : "User"}
                </span>
              </div>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ 
          padding: "24px",
          background: "transparent",
          minHeight: "calc(100vh - 64px)",
        }}>
          <div
            style={{
              background: "#fff",
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 112px)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              overflow: "hidden",
            }}
          >
            <Outlet />
          </div>
        </Content>
        <AdminFooter />

        {/* Responsive styles for header and menu */}
        <style>
          {`
            /* Submenu styling rõ ràng trong sidebar */
            .ant-menu-submenu .ant-menu-submenu-title {
              position: relative !important;
              border-radius: 8px !important;
              margin: 4px 8px !important;
              transition: all 0.3s ease !important;
            }

            .ant-menu-submenu .ant-menu-submenu-title:hover {
              background: rgba(24, 144, 255, 0.15) !important;
            }

            .ant-menu-submenu .ant-menu-sub {
              position: static !important;
              background: rgba(0, 0, 0, 0.2) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              border-radius: 8px !important;
              margin: 4px 8px !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            }

            .ant-menu-submenu .ant-menu-item {
              margin: 2px 4px !important;
              border-radius: 6px !important;
              padding-left: 24px !important;
              color: rgba(255, 255, 255, 0.85) !important;
              transition: all 0.3s ease !important;
            }

            .ant-menu-submenu .ant-menu-item:hover {
              background: rgba(24, 144, 255, 0.3) !important;
              color: #fff !important;
              transform: translateX(4px);
            }

            .ant-menu-submenu .ant-menu-item-selected {
              background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%) !important;
              color: #fff !important;
              box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3) !important;
            }

            /* Đảm bảo submenu luôn hiển thị khi mở */
            .ant-menu-submenu-open .ant-menu-submenu-title {
              background: rgba(24, 144, 255, 0.2) !important;
            }

            /* Menu item styling */
            .ant-menu-item {
              border-radius: 8px !important;
              margin: 4px 8px !important;
              transition: all 0.3s ease !important;
            }

            .ant-menu-item:hover {
              background: rgba(24, 144, 255, 0.15) !important;
              transform: translateX(4px);
            }

            .ant-menu-item-selected {
              background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%) !important;
              box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3) !important;
            }

            .ant-menu-item-selected::after {
              display: none !important;
            }

            @media (max-width: 768px) {
              .dashboard-title {
                font-size: 16px !important;
              }
              .ant-layout {
                margin-left: 0 !important;
              }
              .ant-layout-sider {
                position: fixed !important;
                height: 100vh !important;
                z-index: 999 !important;
              }
            }
          `}
        </style>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
