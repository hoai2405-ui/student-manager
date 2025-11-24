import React from "react";
import { Card, Button, message, Grid } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ScheduleForm from "../../Components/Schedule/ScheduleForm";
import { useAuth } from "../../contexts/AuthContext";

const { useBreakpoint } = Grid;

export default function CreateSchedule() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const handleCreated = () => {
    message.success("Tạo lịch học thành công!");
    navigate("/schedules");
  };

  return (
    <div className="app-container" style={{ padding: 'var(--space-lg)', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            fontSize: screens.xs ? '1.2rem' : '1.5rem',
            fontWeight: 700
          }}>
            <span style={{ color: 'var(--accent-color)', fontSize: '1.2em' }}>📅</span>
            Tạo lịch học mới
          </div>
        }
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--surface-bg)'
        }}
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/schedules")}
            size={screens.xs ? "small" : "middle"}
          >
            {!screens.xs && "Quay lại"}
          </Button>
        }
      >
        <div style={{ padding: screens.xs ? 'var(--space-md)' : 'var(--space-xl)' }}>
          <ScheduleForm token={token} onCreated={handleCreated} />
        </div>
      </Card>
    </div>
  );
}
