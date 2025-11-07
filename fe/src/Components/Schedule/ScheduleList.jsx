import React, { useEffect, useState } from "react";
import { scheduleApi } from "../../Common/scheduleApi";

export function ScheduleList({ courseId, studentId }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

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

  const handleRegister = async (scheduleId) => {
    if (!studentId) return alert("Bạn cần đăng nhập và chọn học viên trước");
    try {
      await scheduleApi.registerSchedule(scheduleId, studentId);
      alert("Đăng ký thành công");
      loadSchedules();
    } catch (e) {
      console.error("Register error:", e);
      alert(e?.response?.data?.error || e?.message || "Đăng ký thất bại");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-danger">Error: {error}</div>;
  if (!schedules || schedules.length === 0) return <div>Không có lịch</div>;

  return (
    <div>
      {schedules.map((s) => {
        const registered = s.registered ?? s.registered_count ?? 0;
        const capacity = s.capacity ?? 0;
        const isFull = capacity > 0 && registered >= capacity;
        return (
          <div
            key={s.id}
            style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}
          >
            <div>
              <strong>{s.ten_khoa_hoc || s.ma_khoa_hoc || s.course_name}</strong>
            </div>
            <div>
              {s.start_time ? new Date(s.start_time).toLocaleString() : "—"} -{" "}
              {s.end_time ? new Date(s.end_time).toLocaleString() : "—"}
            </div>
            <div>Sức chứa: {capacity || "Không giới hạn"}</div>
            <div>Đã đăng ký: {registered}</div>
            <button
              onClick={() => handleRegister(s.id)}
              disabled={!studentId || isFull}
            >
              {isFull ? "Đã đầy" : "Đăng ký"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ScheduleList;
