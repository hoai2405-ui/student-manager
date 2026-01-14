import React, { useState, useEffect, useCallback } from "react";
import { Card, Table, Button, message, Grid, Tag, Space, Avatar } from "antd";

const getAvatarSrc = (imgData) => {
  if (!imgData) return null;
  if (typeof imgData !== "string") return null;
  if (imgData.includes("/") && !imgData.includes("base64")) {
    if (imgData.startsWith("/uploads"))
      return `${
        import.meta.env.VITE_API_URL || "http://localhost:3001"
      }${imgData}`;
    return imgData;
  }
  const cleanData = imgData.replace(/[\r\n\s]+/g, "");
  if (cleanData.startsWith("data:image")) return cleanData;
  if (/^[A-Za-z0-9+/=]+$/.test(cleanData) && cleanData.length > 100) {
    return `data:image/jpeg;base64,${cleanData}`;
  }
  return null;
};

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "../../Common/axios";
import moment from "moment";
import * as XLSX from "xlsx";

const { useBreakpoint } = Grid;

export default function RegisteredSchedules() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isStudentView = window.location.pathname.startsWith("/student");
  const hasAdminAccess = !isStudentView;

  const [registeredSchedules, setRegisteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegisteredSchedules = useCallback(async function fetchRegisteredSchedules() {
    setLoading(true);
    try {
      if (hasAdminAccess) {
        const response = await axios.get("/api/schedule-registrations");
        setRegisteredSchedules(response.data || []);
        return;
      }

      const response = await axios.get("/api/student/schedule-registrations");
      setRegisteredSchedules(response.data || []);
    } catch (error) {
      console.error("Error fetching registered schedules:", error);
      message.error("Không thể tải danh sách lịch học đã đăng ký");
      setRegisteredSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    fetchRegisteredSchedules();
  }, [fetchRegisteredSchedules]);

  const getSlotLabel = (slot) => {
    const periodText = slot.period === "morning" ? "Sáng" : "Chiều";
    const timeText = slot.period === "morning" ? "08:00-12:00" : "13:00-17:00";
    return `${moment(slot.date).format(
      "DD/MM/YYYY"
    )} - ${periodText} (${timeText})`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "completed":
        return "blue";
      case "cancelled":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Đang học";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const normalizeSlotDate = (slot) => {
    if (slot?.date) return moment(slot.date).format("DD/MM/YYYY");
    if (slot?.start_time) return moment(slot.start_time).format("DD/MM/YYYY");
    if (slot?.startTime) return moment(slot.startTime).format("DD/MM/YYYY");
    return "";
  };

  const normalizeSlotTime = (slot) => {
    if (slot?.start_time && slot?.end_time) {
      return `${moment(slot.start_time).format("HH:mm")}-${moment(
        slot.end_time
      ).format("HH:mm")}`;
    }
    if (slot?.startTime && slot?.endTime)
      return `${slot.startTime}-${slot.endTime}`;
    if (slot?.period)
      return slot.period === "morning" ? "08:00-12:00" : "13:00-17:00";
    return "";
  };

  const handleExportExcel = () => {
    if (!registeredSchedules.length) {
      message.warning("Không có dữ liệu!");
      return;
    }

    const rows = registeredSchedules
      .flatMap((reg, regIndex) => {
        const slots = Array.isArray(reg.selected_slots)
          ? reg.selected_slots
          : [];
        if (!slots.length) {
          return [
            {
              STT: regIndex + 1,
              "Học viên": reg.student_name || "",
              CCCD: reg.student_username || "",
              Khóa: reg.course_name || "",
              "Mã khóa": reg.course_code || "",
              "Ngày học": "",
              Giờ: "",
              "Địa điểm": "",
              "Trạng thái": getStatusText(reg.status),
              "Ngày đăng ký": reg.registered_at
                ? moment(reg.registered_at).format("DD/MM/YYYY")
                : "",
            },
          ];
        }

        return slots.map((slot) => ({
          STT: regIndex + 1,
          "Học viên": reg.student_name || "",
          CCCD: reg.student_username || "",
          Khóa: reg.course_name || "",
          "Mã khóa": reg.course_code || "",
          "Ngày học": normalizeSlotDate(slot),
          Giờ: normalizeSlotTime(slot),
          "Địa điểm": slot?.location || reg.location || "",
          "Trạng thái": getStatusText(reg.status),
          "Ngày đăng ký": reg.registered_at
            ? moment(reg.registered_at).format("DD/MM/YYYY")
            : "",
        }));
      })
      .map((row, index) => ({ ...row, STT_DONG: index + 1 }));

    const exportData = rows.map(({ STT_DONG, ...rest }) => ({
      "STT Dòng": STT_DONG,
      ...rest,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(exportData),
      "LichCabin"
    );
    XLSX.writeFile(wb, `LICH_CABIN_${moment().format("DDMMYYYY_HHmm")}.xlsx`);
  };

  const columns = [
    {
      title: "Học viên",
      dataIndex: "student_name",
      key: "student",
      width: 260,
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            src={getAvatarSrc(record.student_avatar)}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              flexShrink: 0,
            }}
            icon={<UserOutlined />}
          >
            {(record.student_name || "?").charAt(0)}
          </Avatar>
          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "#111827",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={record.student_name}
            >
              {record.student_name}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
              CCCD: {record.student_username || "---"}
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
          <div style={{ fontWeight: 600, color: "#ffffff" }}>{text}</div>
          <div style={{ fontSize: "0.8rem", color: "#b8c5d6" }}>
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {slots.map((slot, index) => (
            <Tag
              key={index}
              color="blue"
              style={{
                margin: 0,
                fontSize: "0.75rem",
                padding: "2px 6px",
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
        <div style={{ fontSize: "0.85rem", color: "#b8c5d6" }}>
          {moment(date).format("DD/MM/YYYY")}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
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
          {record.status === "active" && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => {
                // Handle cancel registration
                message.warning("Chức năng hủy đăng ký sẽ được thêm sau");
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
    <div
      className="app-container"
      style={{ padding: "32px", minHeight: "100vh" }}
    >
      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: screens.xs ? "1.2rem" : "1.5rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#00ff88", fontSize: "1.2em" }}>📋</span>
            Lịch học đã đăng ký
          </div>
        }
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          borderRadius: "24px",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
          background: "#ffffff",
        }}
        extra={
          <Space>
            {hasAdminAccess && (
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportExcel}
                size={screens.xs ? "small" : "middle"}
              >
                {!screens.xs && "Xuất Excel"}
              </Button>
            )}
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() =>
                navigate(
                  isStudentView ? "/student/schedules" : "/admin/schedules"
                )
              }
              size={screens.xs ? "small" : "middle"}
            >
              {!screens.xs && "Quay lại"}
            </Button>
          </Space>
        }
      >
        <div style={{ padding: screens.xs ? "16px" : "32px" }}>
          {/* Summary Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                background: "rgba(255, 255, 255, 0.98)",
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#00d4ff",
                  marginBottom: "4px",
                }}
              >
                {registeredSchedules.length}
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#b8c5d6",
                  fontWeight: 500,
                }}
              >
                Tổng đăng ký
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "24px",
                background: "rgba(255, 255, 255, 0.98)",
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#00ff88",
                  marginBottom: "4px",
                }}
              >
                {
                  registeredSchedules.filter((r) => r.status === "active")
                    .length
                }
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#b8c5d6",
                  fontWeight: 500,
                }}
              >
                Đang học
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "24px",
                background: "rgba(255, 255, 255, 0.98)",
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#ffaa00",
                  marginBottom: "4px",
                }}
              >
                {registeredSchedules.reduce(
                  (total, r) => total + r.selected_slots.length,
                  0
                )}
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#b8c5d6",
                  fontWeight: 500,
                }}
              >
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
                `${range[0]}-${range[1]} của ${total} đăng ký`,
            }}
            scroll={{ x: 800 }}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: screens.xs ? "0 1px 6px #0001" : "0 3px 12px #0001",
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div
                  style={{
                    padding: "24px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    margin: "16px 0",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: "16px",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CalendarOutlined />
                    Chi tiết buổi học
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {record.selected_slots.map((slot, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "16px",
                          background: "rgba(255, 255, 255, 0.98)",
                          borderRadius: "12px",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background:
                              slot.period === "morning" ? "#ffaa00" : "#00d4ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 600,
                          }}
                        >
                          {slot.period === "morning" ? "🌅" : "🌇"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#ffffff",
                              marginBottom: 2,
                            }}
                          >
                            {moment(slot.date).format("dddd, DD/MM/YYYY")}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "#b8c5d6",
                            }}
                          >
                            {slot.period === "morning"
                              ? "08:00 - 12:00"
                              : "13:00 - 17:00"}
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
