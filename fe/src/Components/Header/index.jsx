import { Avatar, Dropdown, Space, Typography, Switch, ConfigProvider } from 'antd'
import { Header } from 'antd/es/layout/layout'
import { UserOutlined, LogoutOutlined, DashboardOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const { Text } = Typography

const AdminHeader = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDarkMode(initialDark)
    document.documentElement.setAttribute('data-theme', initialDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = (checked) => {
    setIsDarkMode(checked)
    const theme = checked ? 'dark' : 'light'
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ]

  return (
    <header className="card-glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: 'var(--space-md) var(--space-xl)',
      margin: 'var(--space-md)',
      marginBottom: 'var(--space-lg)',
      borderRadius: 'var(--radius-xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)'
      }}>
        <div className="animate-float" style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <img
            src="/logo-vuong200.png"
            alt="Logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6
            }}
          />
        </div>
        <div>
          <h2 style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: '1.25rem',
            fontWeight: 700,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Quản Lý Học Viên
          </h2>
          <p style={{
            margin: 0,
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            Hệ thống quản trị hiện đại
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)'
      }}>
        {/* Theme Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: 'var(--space-sm)',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <SunOutlined style={{
            color: isDarkMode ? 'var(--text-muted)' : 'var(--warning-color)',
            fontSize: 16,
            transition: 'color var(--transition-normal)'
          }} />
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            style={{
              background: isDarkMode ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
            }}
          />
          <MoonOutlined style={{
            color: isDarkMode ? 'var(--accent-color)' : 'var(--text-muted)',
            fontSize: 16,
            transition: 'color var(--transition-normal)'
          }} />
        </div>

        {/* User Menu */}
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <button className="btn-ghost" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.9rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all var(--transition-normal)'
          }}>
            <Avatar
              style={{
                background: 'var(--gradient-primary)',
                width: 32,
                height: 32,
                fontSize: 14,
                fontWeight: 600
              }}
              icon={<UserOutlined />}
            />
            <span>{user?.user?.username || 'Admin'}</span>
          </button>
        </Dropdown>
      </div>
    </header>
  )
}
export default AdminHeader
