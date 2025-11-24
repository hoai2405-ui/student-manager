import React, { useState, useEffect, useContext } from "react";
import { Card, Table, Button, message, Grid, Tag, Space, Avatar } from "antd";
import { ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "../../Common/axios";
import moment from "moment";

const { useBreakpoint } = Grid;

export default function RegisteredSchedules() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const screens = useBreakpoint();

  const [registeredSchedules, setRegisteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegisteredSchedules();
  }, []);

  const fetchRegisteredSchedules = async () => {
    setLoading(true);
    try {
      // Fetch real registered schedules from API
      const response = await axios.get("/api/schedule-registrations");
      setRegisteredSchedules(response.data || []);
    } catch (error) {
      console.error("Error fetching registered schedules:", error);
      message.error("Không thể tải danh sách lịch học đã đăng ký");
      setRegisteredSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getSlotLabel = (slot) => {
    const periodText = slot.period === 'morning' ? 'Sáng' : 'Chiều';
    const timeText = slot.period === 'morning' ? '08:00-12:00' : '13:00-17:00';
    return `${moment(slot.date).format('DD/MM/YYYY')} - ${periodText} (${timeText})`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang học';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const columns = [
    {
      title: "Học viên",
      dataIndex: "student_name",
      key: "student",
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
            icon={<UserOutlined />}
          >
            {record.student_name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>
              {record.student_name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b8c5d6' }}>
              @{record.student_username}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Khóa học",
      dataIndex: "course_name",
      key: "course",
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#ffffff' }}>
            {text}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#b8c5d6' }}>
            {record.course_code}
          </div>
        </div>
      ),
    },
    {
      title: "Buổi học đã chọn",
      dataIndex: "selected_slots",
      key: "slots",
      width: 300,
      render: (slots) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {slots.map((slot, index) => (
            <Tag
              key={index}
              color="blue"
              style={{
                margin: 0,
                fontSize: '0.75rem',
                padding: '2px 6px'
              }}
            >
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {getSlotLabel(slot)}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registered_at",
      key: "registered_at",
      width: 120,
      render: (date) => (
        <div style={{ fontSize: '0.85rem', color: '#b8c5d6' }}>
          {moment(date).format('DD/MM/YYYY')}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              // Navigate to student detail or edit registration
              message.info(`Xem chi tiết học viên ${record.student_name}`);
            }}
          >
            Chi tiết
          </Button>
          {record.status === 'active' && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => {
                // Handle cancel registration
                message.warning('Chức năng hủy đăng ký sẽ được thêm sau');
              }}
            >
              Hủy
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="app-container" style={{ padding: '32px', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: screens.xs ? '1.2rem' : '1.5rem',
            fontWeight: 700
          }}>
            <span style={{ color: '#00ff88', fontSize: '1.2em' }}>📋</span>
            Lịch học đã đăng ký
          </div>
        }
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderRadius: '24px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
          background: '#ffffff'
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
        <div style={{ padding: screens.xs ? '16px' : '32px' }}>
          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#00d4ff',
                marginBottom: '4px'
              }}>
                {registeredSchedules.length}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#b8c5d6',
                fontWeight: 500
              }}>
                Tổng đăng ký
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#00ff88',
                marginBottom: '4px'
              }}>
                {registeredSchedules.filter(r => r.status === 'active').length}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#b8c5d6',
                fontWeight: 500
              }}>
                Đang học
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffaa00',
                marginBottom: '4px'
              }}>
                {registeredSchedules.reduce((total, r) => total + r.selected_slots.length, 0)}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#b8c5d6',
                fontWeight: 500
              }}>
                Buổi học
              </div>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={registeredSchedules}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              size: screens.xs ? "small" : "default",
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} đăng ký`
            }}
            scroll={{ x: 800 }}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: screens.xs ? "0 1px 6px #0001" : "0 3px 12px #0001",
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  margin: '16px 0'
                }}>
                  <h4 style={{
                    marginBottom: '16px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CalendarOutlined />
                    Chi tiết buổi học
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px'
                  }}>
                    {record.selected_slots.map((slot, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: slot.period === 'morning' ? '#ffaa00' : '#00d4ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 600
                        }}>
                          {slot.period === 'morning' ? '🌅' : '🌇'}
                        </div>
                        <div>
                          <div style={{
                            fontWeight: 600,
                            color: '#ffffff',
                            marginBottom: 2
                          }}>
                            {moment(slot.date).format('dddd, DD/MM/YYYY')}
                          </div>
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#b8c5d6'
                          }}>
                            {slot.period === 'morning' ? '08:00 - 12:00' : '13:00 - 17:00'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
              rowExpandable: (record) => record.selected_slots.length > 0,
            }}
          />
        </div>
      </Card>
    </div>
  );
}
