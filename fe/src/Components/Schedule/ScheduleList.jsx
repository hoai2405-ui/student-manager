import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, InputNumber, Modal, message } from "antd";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
import { scheduleApi } from "../../Common/scheduleApi";

export function ScheduleList({ courseId, studentId, isAdmin }) {
  const navigate = useNavigate();
  const isStudentView = window.location.pathname.startsWith("/student");
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    start_date: "",
    end_date: "",
    location: "",
    capacity: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    // Filter schedules based on search term
    if (!searchTerm.trim()) {
      setFilteredSchedules(schedules);
    } else {
      const filtered = schedules.filter(schedule =>
        (schedule.ten_khoa_hoc || schedule.ma_khoa_hoc || schedule.course_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredSchedules(filtered);
    }
  }, [schedules, searchTerm]);

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await scheduleApi.getSchedules(courseId);
      setSchedules(res?.data ?? res ?? []);
    } catch (err) {
      console.error("Load schedules error:", err);
      setError(err?.response?.data?.error || err?.message || "Error loading schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (scheduleId) => {
    if (!studentId) {
      alert("Bạn cần đăng nhập để đăng ký lịch học");
      return;
    }
    const basePath = isStudentView ? "/student" : "/admin";
    navigate(`${basePath}/schedules/register/${scheduleId}`);
  };

  const toDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  const toIsoDate = (value) => {
    if (!value) return "";
    const match = /^\d{2}\/\d{2}\/\d{4}$/.test(value);
    if (!match) return "";
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  };

  const openEdit = (schedule) => {
    setEditingSchedule(schedule);
    setEditForm({
      start_date: toDateInput(schedule.start_time),
      end_date: toDateInput(schedule.end_time),
      location: schedule.location || "",
      capacity: Number(schedule.capacity || 0),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;

    const startIso = toIsoDate(editForm.start_date);
    const endIso = toIsoDate(editForm.end_date);
    if (!startIso || !endIso) {
      message.error("Ngày phải theo định dạng dd/mm/yyyy");
      return;
    }

    setSaving(true);
    try {
      await scheduleApi.updateSchedule(editingSchedule.id, {
        start_time: `${startIso}T07:00`,
        end_time: `${endIso}T22:00`,
        location: editForm.location,
        capacity: editForm.capacity,
      });
      message.success("Đã cập nhật lịch học");
      setEditOpen(false);
      setEditingSchedule(null);
      await loadSchedules();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Không thể cập nhật lịch học");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditingSchedule(null);
  };

  if (loading) return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-2xl)',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>⏳</div>
      <div>Đang tải danh sách lịch học...</div>
    </div>
  );

  if (error) return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-2xl)',
      color: 'var(--error-color)',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid var(--error-color)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>❌</div>
      <div style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Lỗi tải dữ liệu</div>
      <div>{error}</div>
    </div>
  );

  if (!filteredSchedules || filteredSchedules.length === 0) return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-2xl)',
      color: 'var(--text-secondary)',
      background: 'var(--surface-secondary)',
      border: '2px dashed var(--border-color)',
      borderRadius: 'var(--radius-xl)'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📅</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
        {searchTerm ? `Không tìm thấy khóa học nào phù hợp với "${searchTerm}"` : 'Chưa có lịch học nào'}
      </div>
      <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
        {searchTerm ? (
          <>
            Hãy thử tìm kiếm với từ khóa khác hoặc xóa thanh tìm kiếm để xem tất cả khóa học.
          </>
        ) : isAdmin ? (
          <>
            Bạn là quản trị viên. Hãy tạo lịch học đầu tiên để học viên có thể đăng ký!<br />
            Sử dụng form "Tạo lịch mới" ở phía trên.
          </>
        ) : (
          <>
            Hiện tại chưa có lịch học cabin nào được tạo.<br />
            {studentId ? 'Hãy quay lại sau hoặc liên hệ quản trị viên.' : 'Vui lòng đăng nhập để xem lịch học.'}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Thanh tìm kiếm */}
      <div style={{
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px'
        }}>
          <Input
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="large"
            style={{
              paddingLeft: 'var(--space-xl)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '1rem'
            }}
            className="input-modern"
          />
          <SearchOutlined style={{
            position: 'absolute',
            left: 'var(--space-md)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            zIndex: 1
          }} />
        </div>
      </div>

      <Modal
        title="Cập nhật lịch học"
        open={editOpen}
        onCancel={handleCloseEdit}
        onOk={handleSaveEdit}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        destroyOnHidden
      >
        <div
          style={{
            display: "grid",
            gap: "16px",
            padding: "12px",
            background: "var(--surface-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "12px",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Ngày bắt đầu
              </label>
              <Input
                placeholder="dd/mm/yyyy"
                value={editForm.start_date}
                size="large"
                style={{ width: "100%" }}
                onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
              />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                Ví dụ: 28/12/2025
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Ngày kết thúc
              </label>
              <Input
                placeholder="dd/mm/yyyy"
                value={editForm.end_date}
                size="large"
                style={{ width: "100%" }}
                onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
              />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                Ví dụ: 28/01/2026
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Địa điểm
              </label>
              <Input
                placeholder="Ví dụ: Sân B - Trung tâm"
                value={editForm.location}
                size="large"
                style={{ width: "100%" }}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Sức chứa
              </label>
              <InputNumber
                min={0}
                size="large"
                style={{ width: "100%" }}
                value={editForm.capacity}
                onChange={(value) => setEditForm({ ...editForm, capacity: Number(value || 0) })}
              />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                0 = không giới hạn
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Hiển thị kết quả tìm kiếm */}
      {searchTerm && (
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--space-md)',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          {filteredSchedules.length > 0 ? (
            <span>
              🔍 Tìm thấy {filteredSchedules.length} khóa học cho "{searchTerm}"
            </span>
          ) : (
            <span style={{ color: 'var(--warning-color)' }}>
              🔍 Không tìm thấy khóa học nào phù hợp với "{searchTerm}"
            </span>
          )}
        </div>
      )}

      {filteredSchedules.map((s) => {
        const registered = s.registered ?? s.registered_count ?? 0;
        const capacity = s.capacity ?? 0;
        const isFull = capacity > 0 && registered >= capacity;
        return (
          <div
            key={s.id}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-xl)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-normal)',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <span style={{ color: 'var(--accent-color)', fontSize: '1.1em' }}>🎓</span>
                {s.ten_khoa_hoc || s.ma_khoa_hoc || s.course_name}
              </h3>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                marginBottom: 'var(--space-md)'
              }}>
                <span style={{ color: 'var(--warning-color)' }}>🕒</span>
                {s.start_time ? new Date(s.start_time).toLocaleString('vi-VN') : "—"} -{" "}
                {s.end_time ? new Date(s.end_time).toLocaleString('vi-VN') : "—"}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: 'var(--space-lg)',
              alignItems: 'center',
              marginBottom: 'var(--space-lg)'
            }}>
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--accent-color)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  {capacity || "∞"}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Sức chứa
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: 'var(--space-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--success-color)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  {registered}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Đã đăng ký
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => openEdit(s)}
                  >
                    Sửa
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => handleRegister(s.id)}
                    disabled={isFull}
                  >
                    {isFull ? "Đã đầy" : "Đăng ký"}
                  </Button>
                </div>
              )}
            </div>

            {!isAdmin && (
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--warning-color)',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 500,
                textAlign: 'center'
              }}>
                ⚠️ Chức năng đăng ký chỉ dành cho quản trị viên
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ScheduleList;
