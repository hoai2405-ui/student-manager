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
} from "@ant-design/icons";
import "../assets/main.css";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ROUTES_PATH } from "../Common/constants";
import AdminFooter from "../Components/Footer";
import { useAuth } from "../contexts/AuthContext";

const { Content, Sider, Header } = Layout;

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const userInfo = user?.user;
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    console.log("Thông tin user hiện tại:", user);
  }, [user]);

  useEffect(() => {
    let key = ROUTES_PATH.DASHBOARD;
    if (location.pathname.startsWith(ROUTES_PATH.STUDENTS))
      key = ROUTES_PATH.STUDENTS;
    else if (location.pathname.startsWith(ROUTES_PATH.COURSES))
      key = ROUTES_PATH.COURSES;
    else if (location.pathname.startsWith(ROUTES_PATH.STATS))
      key = ROUTES_PATH.STATS;
    else if (location.pathname.startsWith(ROUTES_PATH.USERS))
      key = ROUTES_PATH.USERS;
    setSelectedKey(key);
  }, [location.pathname]);

  const items = [
    { key: ROUTES_PATH.DASHBOARD, icon: <HomeOutlined />, label: "Trang chủ" },
    { key: ROUTES_PATH.COURSES, icon: <BookOutlined />, label: "Khoá học" },
    {
      key: ROUTES_PATH.STUDENTS,
      icon: <UsergroupDeleteOutlined />,
      label: "Học Viên",
    },
    { key: ROUTES_PATH.STATS, icon: <BarChartOutlined />, label: "Thống kê" },
    ...(userInfo?.is_admin
      ? [
          {
            key: ROUTES_PATH.USERS,
            icon: <UserSwitchOutlined />,
            label: "Users",
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
      onClick: logout,
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
          boxShadow: "0 6px 32px #0001",
          borderRight: "1.5px solid #eaeaea44",
          background: "linear-gradient(160deg, #001529 60%, #1890ff 100%)",
        }}
      >
        <div
          className="demo-logo-vertical"
          style={{
            textAlign: "center",
            padding: collapsed ? 2 : 12,
            marginBottom: 20,
          }}
        >
          <img
            src="/logo-vuong200.png"
            alt="Logo"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#fff",
              objectFit: "cover",
              marginRight: 10,
              
              boxShadow: "0 2px 10px #00152922",
            }}
          />
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#001529",
            minHeight: 60,
            borderRadius: "0 0 18px 1px",
            boxShadow: "0 4px 16px #00152910",
            padding: "0 16px",
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
            <span
              className="dashboard-title"
              style={{
                fontWeight: 700,
                fontSize: 28,
                color: "#fff",
                lineHeight: "1.2",
                whiteSpace: "normal",
                wordBreak: "break-word",
                display: "block",
                padding: "4px 0",
                margin: "0 auto",
                textAlign: "center",
                width: "100%",
                letterSpacing: 0.5,
                textShadow: "0 2px 8px #0003",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Quản trị học viên
            </span>
          </div>
          <Dropdown menu={{ items: profileMenu }} trigger={["click"]}>
            <span
              style={{
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#1890ff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {userInfo?.username?.charAt(0).toUpperCase() || (
                  <UserOutlined />
                )}
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  maxWidth: 60,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userInfo?.username}
              </span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ padding: 16 }}>
          <div
            style={{
              overflow: "auto",
              background: "#fff",
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 124px)",
            }}
          >
            <Outlet />
          </div>
        </Content>
        <AdminFooter />

        {/* Responsive styles for header */}
        <style>
          {`
            @media (max-width: 800px) {
              .dashboard-title {
                font-size: 20px !important;
                padding: 0 4px !important;
              }
            }
            @media (max-width: 500px) {
              .dashboard-title {
                font-size: 15px !important;
                padding: 0 2px !important;
                line-height: 1.3 !important;
              }
            }
            @media (max-width: 400px) {
              .dashboard-title {
                font-size: 13px !important;
                padding: 0 1px !important;
                line-height: 1.3 !important;
              }
            }
            @media (max-width: 600px) {
    .dashboard-title {
      font-size: 16px !important;
    }
    .ant-layout-header img {
      width: 26px !important;
      height: 26px !important;
      margin-right: 6px !important;
    }
    .ant-layout-header [style*="width: 32px"] {
      width: 26px !important;
      height: 26px !important;
      font-size: 14px !important;
    }
  }
          `}
        </style>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
