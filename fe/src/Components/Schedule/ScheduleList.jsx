import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { scheduleApi } from "../../Common/scheduleApi";

export function ScheduleList({ courseId, studentId, isAdmin }) {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    // Navigate to registration page
    navigate(`/schedules/register/${scheduleId}`);
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

              <button
                onClick={() => handleRegister(s.id)}
                disabled={!studentId || isFull}
                style={{
                  padding: 'var(--space-md) var(--space-xl)',
                  background: isFull ? 'var(--error-color)' : 'var(--success-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: (!studentId || isFull) ? 'not-allowed' : 'pointer',
                  opacity: (!studentId || isFull) ? 0.6 : 1,
                  transition: 'all var(--transition-normal)',
                  boxShadow: 'var(--shadow-sm)',
                  minWidth: '120px'
                }}
                onMouseEnter={(e) => {
                  if (!(!studentId || isFull)) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!studentId || isFull)) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }
                }}
              >
                {isFull ? "🏠 Đã đầy" : "✅ Đăng ký"}
              </button>
            </div>

            {!studentId && (
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--warning-color)',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 500,
                textAlign: 'center'
              }}>
                ⚠️ Vui lòng đăng nhập để đăng ký lịch học
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ScheduleList;
