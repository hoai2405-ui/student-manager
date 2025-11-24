import React, { useState, useEffect } from "react";
import { Select, message } from "antd";
import { createSchedule } from "../../Common/scheduleApi";
import axios from "../../Common/axios";

export default function ScheduleForm({ token, onCreated }) {
  const [form, setForm] = useState({
    course_id: "",
    start_time: "",
    end_time: "",
    capacity: 0,
    location: "",
  });
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await axios.get("/api/courses");
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
        message.error("Không thể tải danh sách khóa học");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const fetchCourseStudents = async (courseId) => {
    if (!courseId) {
      setCourseStudents([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const response = await axios.get(`/api/courses/${courseId}/students`);
      setCourseStudents(response.data || []);
    } catch (error) {
      console.error("Error fetching course students:", error);
      // Try alternative endpoint
      try {
        const response = await axios.get(`/api/students?course_id=${courseId}`);
        setCourseStudents(response.data || []);
      } catch (secondError) {
        console.error("Alternative API also failed:", secondError);
        setCourseStudents([]);
        message.error("Không thể tải danh sách học viên");
      }
    } finally {
      setLoadingStudents(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createSchedule(form, token);
      alert("Tạo lịch xong");
      onCreated && onCreated(data.id);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <form onSubmit={submit} style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 'var(--space-lg)',
      alignItems: 'end'
    }}>
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-sm)'
        }}>
          Khóa học *
        </label>
        <Select
          placeholder={loadingCourses ? "Đang tải khóa học..." : "Chọn khóa học"}
          value={form.course_id || undefined}
          onChange={(value) => {
            setForm({ ...form, course_id: value });
            fetchCourseStudents(value);
          }}
          loading={loadingCourses}
          style={{
            width: '100%',
            borderRadius: 'var(--radius-md)'
          }}
          size="large"
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {courses.map((course) => (
            <Select.Option key={course.id} value={course.id}>
              {course.ma_khoa_hoc} - {course.ten_khoa_hoc} ({course.hang_gplx})
            </Select.Option>
          ))}
        </Select>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-sm)'
        }}>
          Ngày bắt đầu *
        </label>
        <input
          type="date"
          value={form.start_time ? form.start_time.split('T')[0] : ''}
          onChange={(e) => {
            const dateValue = e.target.value;
            // Set default time to 07:00 if date is selected
            const startTime = dateValue ? `${dateValue}T07:00` : '';
            setForm({ ...form, start_time: startTime });
          }}
          required
          style={{
            width: '100%',
            padding: 'var(--space-md)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            background: 'var(--surface-bg)',
            transition: 'border-color var(--transition-normal)',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-sm)'
        }}>
          Ngày kết thúc *
        </label>
        <input
          type="date"
          value={form.end_time ? form.end_time.split('T')[0] : ''}
          onChange={(e) => {
            const dateValue = e.target.value;
            // Set default time to 22:00 if date is selected
            const endTime = dateValue ? `${dateValue}T22:00` : '';
            setForm({ ...form, end_time: endTime });
          }}
          required
          style={{
            width: '100%',
            padding: 'var(--space-md)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            background: 'var(--surface-bg)',
            transition: 'border-color var(--transition-normal)',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-sm)'
        }}>
          Sức chứa
        </label>
        <input
          type="number"
          placeholder="Nhập sức chứa (để trống nếu không giới hạn)"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          style={{
            width: '100%',
            padding: 'var(--space-md)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            background: 'var(--surface-bg)',
            transition: 'border-color var(--transition-normal)',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-sm)'
        }}>
          Địa điểm
        </label>
        <input
          placeholder="Nhập địa điểm tổ chức"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          style={{
            width: '100%',
            padding: 'var(--space-md)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            background: 'var(--surface-bg)',
            transition: 'border-color var(--transition-normal)',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
        <button
          type="submit"
          style={{
            padding: 'var(--space-lg) var(--space-2xl)',
            background: 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all var(--transition-normal)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '200px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          🚀 Tạo lịch học
        </button>
      </div>
    </form>
  );
}
