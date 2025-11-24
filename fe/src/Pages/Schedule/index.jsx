import React, { useContext } from "react";
import { Button, Space } from "antd";
import { PlusOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import ScheduleList from "../../Components/Schedule/ScheduleList";
import { scheduleApi } from "../../Common/scheduleApi";

export default function SchedulePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (scheduleId) => {
    try {
      await scheduleApi.registerSchedule(scheduleId, user.id);
      alert("Đăng ký thành công!");
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="app-container" style={{ padding: 'var(--space-lg)', minHeight: '100vh' }}>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xl)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Quản lý lịch học cabin
          </h1>

          <Space>
            <Button
              type="default"
              icon={<FileTextOutlined />}
              size="large"
              onClick={() => navigate("/registered-schedules")}
              style={{
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 600,
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              📋 Xem lịch đã đăng ký
            </Button>

            {(user?.is_admin || user?.isAdmin) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate("/schedules/create")}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                Tạo lịch học mới
              </Button>
            )}
          </Space>
        </div>

        <div style={{
          background: 'var(--surface-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <span style={{ color: 'var(--success-color)', fontSize: '1.2em' }}>📅</span>
            Danh sách lịch học
          </h2>
          <ScheduleList studentId={user?.id} onRegister={handleRegister} isAdmin={user?.is_admin} />
        </div>
      </div>
    </div>
  );
}
