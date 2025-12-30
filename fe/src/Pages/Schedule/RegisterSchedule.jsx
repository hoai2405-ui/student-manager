import React, { useState, useEffect, useContext, useMemo } from "react";
import {
<<<<<<< HEAD
  Card,
  Button,
  Form,
  message,
  Grid,
  Divider,
  Avatar,
  Input,
  Tag,
  Calendar,
  Drawer,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
=======
  Card, Button, Form, message, Grid, Avatar, Input, Tag,
  Row, Col, Tabs, Empty, Typography, Badge, Drawer
} from "antd";
import {
  ArrowLeftOutlined, SaveOutlined,
  UserOutlined, SearchOutlined, CheckCircleFilled,
  ClockCircleOutlined, CloseOutlined
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "../../Common/axios";
import moment from "moment";

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

export default function RegisterSchedule() {
  const { scheduleId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  
  // State Management
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentTimeSelections, setStudentTimeSelections] = useState({});
  const [studentSearch, setStudentSearch] = useState("");
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [activeDate, setActiveDate] = useState(null);

<<<<<<< HEAD
  const [calendarValue, setCalendarValue] = useState(moment());
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

=======
  // State riêng cho Mobile Drawer
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // --- API Calls (Giữ nguyên) ---
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
  useEffect(() => {
    if (scheduleId) {
      fetchSchedule();
      fetchExistingRegistrations();
    }
  }, [scheduleId]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/schedules/${scheduleId}`);
      setSchedule(response.data);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      message.error("Không thể tải thông tin lịch học");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRegistrations = async () => {
    try {
      const response = await axios.get(
        `/api/schedules/${scheduleId}/registrations`
      );
      setExistingRegistrations(response.data || []);
    } catch (error) {
      setExistingRegistrations([]);
    }
  };

  const fetchCourseStudents = async () => {
    if (!schedule?.course_id) return;
    try {
      const courseResponse = await axios.get("/api/courses");
      const courses = courseResponse.data || [];
<<<<<<< HEAD
      const course = courses.find(
        (item) => Number(item.id) === Number(schedule.course_id)
      );
      console.log("Course details:", course);
      console.log("Course ma_khoa_hoc:", course?.ma_khoa_hoc);

=======
      const course = courses.find((item) => Number(item.id) === Number(schedule.course_id));
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
      if (course?.ma_khoa_hoc) {
        const response = await axios.get(
          `/api/students?ma_khoa_hoc=${course.ma_khoa_hoc}`
        );
        setCourseStudents(response.data || []);
<<<<<<< HEAD
        console.log(
          "✅ Fetched students for course",
          course.ma_khoa_hoc,
          "-",
          response.data?.length || 0,
          "students"
        );
      } else {
        throw new Error("Course has no ma_khoa_hoc");
=======
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
      }
    } catch (error) {
      setCourseStudents([]);
    }
  };

  useEffect(() => {
    if (schedule?.course_id) fetchCourseStudents();
  }, [schedule]);

<<<<<<< HEAD
  const generateTimeSlotsForStudent = () => {
    if (!schedule?.start_time || !schedule?.end_time) return [];

    const startDate = moment(schedule.start_time).startOf("day");
    const endDate = moment(schedule.end_time).startOf("day");

    // Fixed slots like the screenshot
    const fixedTimes = [
      { start: "08:00", end: "10:15" },
      { start: "10:15", end: "12:30" },
      { start: "12:30", end: "14:45" },
      { start: "14:45", end: "17:00" },
      { start: "17:00", end: "19:15" },
    ];

    const slots = [];
    let currentDate = startDate.clone();

    while (currentDate.isSameOrBefore(endDate, "day")) {
      for (const t of fixedTimes) {
        const slotId = `${t.start.replace(":", "")}-${t.end.replace(
          ":",
          ""
        )}-${currentDate.format("YYYY-MM-DD")}`;
=======
  // --- Logic Thời gian (Giữ nguyên) ---
  const generateTimeSlotsForStudent = () => {
    if (!schedule?.start_time || !schedule?.end_time) return [];
    const startDate = moment(schedule.start_time);
    const endDate = moment(schedule.end_time);
    const slots = [];
    let currentDate = startDate.clone().startOf('day');

    while (currentDate.isSameOrBefore(endDate, 'day')) {
      let currentTime = moment(currentDate).set({ hour: 7, minute: 0, second: 0 });
      const endTime = moment(currentDate).set({ hour: 24, minute: 0, second: 0 });

      while (currentTime.isBefore(endTime)) {
        const slotEndTime = moment(currentTime).add(2, 'hours');
        const slotId = `${currentTime.format('HHmm')}-${slotEndTime.format('HHmm')}-${currentDate.format('YYYY-MM-DD')}`;
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
        slots.push({
          id: slotId,
          date: currentDate.format("YYYY-MM-DD"),
          startTime: t.start,
          endTime: t.end,
        });
<<<<<<< HEAD
      }
      currentDate.add(1, "day");
=======
        currentTime = slotEndTime;
      }
      currentDate.add(1, 'day');
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
    }
    return slots;
  };

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return courseStudents;
    return courseStudents.filter((student) => {
      const name = (
        student.ho_va_ten ||
        student.name ||
        student.ten ||
        ""
      ).toLowerCase();
      const username = (student.username || "").toLowerCase();
      const phone = (student.so_dien_thoai || "").toLowerCase();
      return (
        name.includes(term) || username.includes(term) || phone.includes(term)
      );
    });
  }, [courseStudents, studentSearch]);

  const timeSlots = useMemo(
    () => generateTimeSlotsForStudent(),
    [schedule?.start_time, schedule?.end_time]
  );

  // Slot availability (simple): if schedule has capacity=0 => always available.
  // If capacity>0 => treat each time slot as having that capacity; since backend registrations are per schedule only,
  // we approximate by disabling all slots when schedule is full.
  const scheduleCapacity = Number(schedule?.capacity || 0);
  const scheduleRegistered =
    Number(schedule?.registered_count || 0) ||
    Number(schedule?.registered || 0) ||
    existingRegistrations.length;
  const scheduleIsFull =
    scheduleCapacity > 0 && scheduleRegistered >= scheduleCapacity;

  const availableSlots = useMemo(() => {
    if (scheduleIsFull) return [];
    return timeSlots;
  }, [scheduleIsFull, timeSlots]);

  const daySlotsMap = useMemo(() => {
    return availableSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      // sort by startTime for stable rendering
      acc[slot.date].sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      );
      return acc;
    }, {});
  }, [availableSlots]);

<<<<<<< HEAD
  const dayHasSlots = useMemo(() => {
    return availableSlots.reduce((acc, slot) => {
      acc[slot.date] = true;
      return acc;
    }, {});
  }, [availableSlots]);
=======
  const availableDates = useMemo(() => Object.keys(daySlotsMap).sort(), [daySlotsMap]);

  useEffect(() => {
    if (availableDates.length > 0 && !activeDate) {
      setActiveDate(availableDates[0]);
    }
  }, [availableDates]);

  // --- Event Handlers ---
  
  const handleStudentSelect = (studentId) => {
    // Nếu học viên đã đăng ký (có trong existingRegistrations), không cho click
    const isRegistered = existingRegistrations.some(reg => String(reg.id) === String(studentId));
    if (isRegistered) return;

    setActiveStudentId(studentId);
    // Nếu là màn hình nhỏ (Mobile/Tablet dọc), mở Drawer
    if (!screens.md) {
      setMobileDrawerOpen(true);
    }
  };
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa

  const toggleSlot = (slotId) => {
    if (!activeStudentId) return;

    // Enforce per-slot capacity in UI (best-effort): if selected by other students in this form, consider it taken.
    const takenCount = Object.entries(studentTimeSelections)
      .filter(([sid]) => String(sid) !== String(activeStudentId))
      .reduce((acc, [, slots]) => acc + (Array.isArray(slots) && slots.includes(slotId) ? 1 : 0), 0);

    const cap = scheduleCapacity > 0 ? scheduleCapacity : 1;
    if (takenCount >= cap) {
      message.warning("Khung giờ này đã được chọn đủ chỗ");
      return;
    }

    const selectedSlots = studentTimeSelections[activeStudentId] || [];
    const next = selectedSlots.includes(slotId)
      ? selectedSlots.filter((v) => v !== slotId)
      : [...selectedSlots, slotId];
    setStudentTimeSelections((prev) => ({
      ...prev,
      [activeStudentId]: next,
    }));
  };

  const handleSubmit = async () => {
<<<<<<< HEAD
    if (!user?.id) {
      message.error("Bạn cần đăng nhập để đăng ký");
      return;
    }

    // Check if any students have selected time slots
    const hasSelections = Object.values(studentTimeSelections).some(
      (selections) => selections && selections.length > 0
    );
    if (!hasSelections) {
      message.error("Vui lòng chọn thời gian học cho ít nhất một học viên");
      return;
    }
=======
    if (!user?.id) return message.error("Bạn cần đăng nhập để đăng ký");
    
    const hasSelections = Object.values(studentTimeSelections).some(selections => selections && selections.length > 0);
    if (!hasSelections) return message.error("Vui lòng chọn thời gian học cho ít nhất một học viên");
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa

    setSubmitting(true);
    try {
      let successCount = 0;
<<<<<<< HEAD
      let errorCount = 0;

      // Register students individually (current backend only supports individual registration)
      for (const [studentId, timeSlots] of Object.entries(
        studentTimeSelections
      )) {
        if (timeSlots && timeSlots.length > 0) {
          try {
            const firstSlotId = Array.isArray(timeSlots) && timeSlots.length ? timeSlots[0] : null;
            await axios.post(`/api/schedules/${scheduleId}/register`, {
              student_id: studentId,
              slot_id: firstSlotId,
            });
=======
      for (const [studentId, timeSlots] of Object.entries(studentTimeSelections)) {
        if (timeSlots && timeSlots.length > 0) {
          try {
            await axios.post(`/api/schedules/${scheduleId}/register`, { student_id: studentId });
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
            successCount++;
          } catch (e) { console.error(e); }
        }
      }
      if (successCount > 0) {
        message.success(`Đăng ký thành công ${successCount} học viên!`);
        // Reset selections hoặc điều hướng
        navigate(window.location.pathname.startsWith("/student") ? "/student/schedules" : "/admin/schedules");
      } else {
        message.error("Không thể đăng ký. Có thể học viên chưa đủ điều kiện.");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu dữ liệu.");
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  if (loading) {
    return (
      <div
        className="app-container"
        style={{
          padding: "var(--space-lg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Đang tải thông tin lịch học...</div>
=======
  // --- Render Components ---

  // Nội dung bảng chọn giờ (Dùng chung cho cả Drawer Mobile và Cột phải Desktop)
  const renderScheduleContent = () => {
    if (!activeStudentId) return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#999', padding: 20 }}>
        <UserOutlined style={{ fontSize: 48, marginBottom: 15, color: '#e0e0e0' }} />
        <div>Chọn học viên để bắt đầu</div>
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
      </div>
    );

    const dateItems = availableDates.map((date) => {
      const slots = daySlotsMap[date] || [];
      const count = slots.length;
      return {
        key: date,
        label: (
          <div style={{ textAlign: 'center', padding: '0 4px' }}>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>{moment(date).format('dddd')}</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{moment(date).format('DD/MM')}</div>
            <div style={{ fontSize: '0.7rem', color: '#1890ff' }}>{count} ca</div>
          </div>
        ),
      };
    });

    return (
<<<<<<< HEAD
      <div
        className="app-container"
        style={{
          padding: "var(--space-lg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Không tìm thấy lịch học</div>
=======
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
         {/* Info Strip */}
         <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar 
                    size={40} 
                    src={courseStudents.find(s => s.id === activeStudentId)?.anh}
                    style={{ backgroundColor: '#1890ff' }}
                >
                    {courseStudents.find(s => s.id === activeStudentId)?.ho_va_ten?.charAt(0)}
                </Avatar>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {courseStudents.find(s => s.id === activeStudentId)?.ho_va_ten}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Đã chọn: <span style={{ color: '#1890ff', fontWeight: 700 }}>{studentTimeSelections[activeStudentId]?.length || 0}</span> khung giờ
                    </div>
                </div>
             </div>
         </div>

         {/* Tabs container */}
         <div style={{ padding: '0 10px', background: 'white', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <Tabs 
                activeKey={activeDate} 
                onChange={setActiveDate}
                items={dateItems}
                tabBarStyle={{ marginBottom: 0 }}
            />
         </div>

         {/* Scrollable Time Grid */}
         <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {activeDate ? (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', // Auto-responsive grid
                    gap: '12px',
                    paddingBottom: 20 
                }}>
                    {(daySlotsMap[activeDate] || []).map((slot) => {
                        const selectedSlots = studentTimeSelections[activeStudentId] || [];
                        const isSelected = selectedSlots.includes(slot.id);
                        return (
                            <div
                                key={slot.id}
                                onClick={() => toggleSlot(slot.id)}
                                style={{
                                    padding: '12px 8px',
                                    borderRadius: '8px',
                                    border: isSelected ? '1px solid #1890ff' : '1px solid #e8e8e8',
                                    background: isSelected ? '#e6f7ff' : 'white',
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    boxShadow: isSelected ? '0 2px 6px rgba(24,144,255,0.2)' : 'none',
                                    userSelect: 'none',
                                    WebkitTapHighlightColor: 'transparent' // Fix cho iOS
                                }}
                            >
                                <div style={{ fontWeight: 600, color: isSelected ? '#1890ff' : '#333' }}>
                                    {slot.startTime} - {slot.endTime}
                                </div>
                                {isSelected && <div style={{ fontSize: '0.7rem', color: '#1890ff', marginTop: 2 }}>Đã chọn</div>}
                            </div>
                        );
                    })}
                </div>
            ) : <Empty description="Chọn ngày để xem" />}
         </div>
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
      </div>
    );
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!schedule) return <Empty description="Không tìm thấy lịch học" />;

  return (
<<<<<<< HEAD
    <div
      className="app-container"
      style={{ padding: "var(--space-lg)", minHeight: "100vh" }}
    >
      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-md)",
              fontSize: screens.xs ? "1.2rem" : "1.5rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "var(--accent-color)", fontSize: "1.2em" }}>
              📝
            </span>
            Phân công học viên
          </div>
        }
        style={{
          maxWidth: screens.xs ? "100%" : "1200px",
          margin: "0 auto",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          background: "var(--surface-bg)",
        }}
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              navigate(
                isStudentView ? "/student/schedules" : "/admin/schedules"
              )
            }
            size={screens.xs ? "small" : "middle"}
=======
    <div style={{ 
      padding: screens.xs ? '10px' : '20px', 
      maxWidth: 1400, 
      margin: '0 auto', 
      background: '#f5f7fa', 
      minHeight: '100vh',
      paddingBottom: screens.xs ? 80 : 20 // Khoảng trống cho nút Fixed ở mobile
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: 16, background: 'white', padding: '12px 16px', 
        borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} shape="circle" />
            <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Đăng ký lịch học</div>
                <div style={{ fontSize: '0.8rem', color: '#888', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {schedule.course_name}
                </div>
            </div>
        </div>
        {!screens.xs && (
             <Button type="primary" icon={<SaveOutlined />} size="large"
             loading={submitting} onClick={handleSubmit} disabled={courseStudents.length === 0}>
             Lưu thay đổi
           </Button>
        )}
      </div>

      <Row gutter={[20, 20]} style={{ height: screens.xs ? 'auto' : 'calc(100vh - 120px)' }}>
        {/* Left Column: Student List (Full width on Mobile) */}
        <Col xs={24} md={8} lg={6} style={{ height: '100%' }}>
          <Card 
            bordered={false} 
            bodyStyle={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}
            style={{ height: '100%', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
          >
            <Input 
              prefix={<SearchOutlined style={{ color: '#ccc' }} />} 
              placeholder="Tìm học viên..." 
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: 8, fontSize: '0.75rem', color: '#999', fontWeight: 600 }}>
                    DANH SÁCH HỌC VIÊN
                </div>
                {filteredStudents.map(student => {
                     const isSelected = activeStudentId === student.id;
                     const isRegistered = existingRegistrations.some(reg => String(reg.id) === String(student.id));
                     const hasSelection = (studentTimeSelections[student.id] || []).length > 0;
                     
                     return (
                        <div
                            key={student.id}
                            onClick={() => handleStudentSelect(student.id)}
                            style={{
                                padding: '10px',
                                marginBottom: '8px',
                                borderRadius: '10px',
                                background: isSelected && screens.md ? '#e6f7ff' : 'white', // Chỉ highlight nền trên Desktop
                                border: isSelected && screens.md ? '1px solid #1890ff' : '1px solid #f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: isRegistered ? 'default' : 'pointer',
                                opacity: isRegistered ? 0.6 : 1,
                                transition: 'all 0.2s',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            <Badge count={hasSelection && !isRegistered ? <CheckCircleFilled style={{ color: '#52c41a' }} /> : 0}>
                                <Avatar size={40} src={student.anh_chan_dung || student.anh} style={{ backgroundColor: isSelected ? '#1890ff' : '#ddd' }}>
                                    {student.ho_va_ten?.charAt(0) || 'U'}
                                </Avatar>
                            </Badge>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.ho_va_ten || student.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{student.so_dien_thoai}</div>
                            </div>
                            {/* Nút chỉ dẫn cho Mobile */}
                            {screens.xs && !isRegistered && (
                                <Button size="small" type="link" icon={<ClockCircleOutlined />}>Chọn giờ</Button>
                            )}
                            {isRegistered && <Tag color="green">Đã xong</Tag>}
                        </div>
                     )
                })}
            </div>
          </Card>
        </Col>

        {/* Right Column: Time Selection (Desktop Only) */}
        {!screens.xs && (
            <Col md={16} lg={18} style={{ height: '100%' }}>
            <Card 
                bordered={false}
                bodyStyle={{ padding: 0, height: '100%' }}
                style={{ height: '100%', borderRadius: 16, overflow: 'hidden' }}
            >
                {renderScheduleContent()}
            </Card>
            </Col>
        )}
      </Row>

      {/* --- MOBILE DRAWER (Giải pháp cho iPhone) --- */}
      <Drawer
        title="Chọn lịch học"
        placement="bottom"
        height="85vh" // Chiếm 85% chiều cao màn hình
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }} // Antd v5
        bodyStyle={{ padding: 0 }} // Antd v4 support
        extra={
            <Button type="text" onClick={() => setMobileDrawerOpen(false)} icon={<CloseOutlined />} />
        }
        footer={
            <div style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={() => setMobileDrawerOpen(false)}>
                    Đã chọn xong
                </Button>
            </div>
        }
      >
<<<<<<< HEAD
        <div
          style={{
            padding: screens.xs ? "var(--space-md)" : "var(--space-xl)",
          }}
        >
          {/* Registered Students Card */}
          {existingRegistrations.length > 0 && (
            <div
              style={{
                background: "var(--surface-secondary)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-lg)",
                marginBottom: "var(--space-xl)",
                border: "1px solid var(--border-color)",
              }}
            >
              <h4
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "var(--space-lg)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                }}
              >
                <UserOutlined style={{ color: "var(--accent-color)" }} />
                Học viên đã đăng ký ({existingRegistrations.length})
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "var(--space-md)",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {existingRegistrations.map((registration, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                      padding: "var(--space-sm)",
                      background: "var(--surface-bg)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <Avatar
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                      }}
                    >
                      {registration.ho_va_ten?.charAt(0) || "U"}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {registration.ho_va_ten}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ID: {registration.id} • CCCD:{" "}
                        {registration.so_cmt || "Chưa có"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Đã đăng ký
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Assignment Form */}
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div style={{ marginBottom: "var(--space-xl)" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: screens.xs ? "column" : "row",
                  alignItems: screens.xs ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: "var(--space-md)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                    margin: 0,
                  }}
                >
                  <UserOutlined style={{ color: "var(--accent-color)" }} />
                  Phân công học viên
                </h4>
                <Input
                  placeholder="Tìm theo tên, SĐT, username..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ maxWidth: 320, width: screens.xs ? "100%" : "auto" }}
                />
              </div>

              {courseStudents.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: screens.xs ? "1fr" : "360px 1fr",
                    gap: "var(--space-xl)",
                  }}
                >
                  <div
                    style={{
                      background: "var(--surface-secondary)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      padding: "var(--space-md)",
                      maxHeight: screens.xs ? "unset" : 520,
                      overflowY: screens.xs ? "visible" : "auto",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        marginBottom: "var(--space-sm)",
                      }}
                    >
                      Danh sách học viên ({filteredStudents.length})
                    </div>
                    {filteredStudents.map((student) => {
                      const selected = activeStudentId === student.id;
                      return (
                        <div
                          key={student.id}
                          onClick={() => {
                            setActiveStudentId(student.id);
                            if (!activeDate && schedule?.start_time) {
                              setActiveDate(
                                moment(schedule.start_time).format("YYYY-MM-DD")
                              );
                            }
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "12px",
                            cursor: "pointer",
                            border: selected
                              ? "1px solid var(--accent-color)"
                              : "1px solid transparent",
                            background: selected
                              ? "rgba(24, 144, 255, 0.08)"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: 8,
                          }}
                        >
                          <Avatar
                            style={{
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "white",
                            }}
                            src={student.anh_chan_dung || student.anh}
                          >
                            {student.ho_va_ten?.charAt(0) ||
                              student.name?.charAt(0) ||
                              student.username?.charAt(0) ||
                              "U"}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{ fontWeight: 600, fontSize: "0.9rem" }}
                            >
                              {student.ho_va_ten ||
                                student.name ||
                                student.ten ||
                                "Học viên"}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {student.ngay_sinh
                                ? `🎂 ${moment(student.ngay_sinh).format(
                                    "DD/MM/YYYY"
                                  )}`
                                : "Chưa có ngày sinh"}
                            </div>
                          </div>
                          {selected && <Tag color="blue">Đang chọn</Tag>}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      background: "var(--surface-secondary)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      padding: "var(--space-lg)",
                    }}
                  >
                    {activeStudentId ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-sm)",
                            marginBottom: "var(--space-md)",
                          }}
                        >
                          <CalendarOutlined
                            style={{ color: "var(--accent-color)" }}
                          />
                          <span style={{ fontWeight: 600 }}>
                            Chọn thời gian cho học viên
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gap: "var(--space-md)",
                            gridTemplateColumns: screens.xs
                              ? "1fr"
                              : "minmax(300px, 420px) 1fr",
                          }}
                        >
                          <div
                            style={{
                              background: "var(--surface-bg)",
                              borderRadius: "12px",
                              border: "1px solid var(--border-color)",
                              padding: "12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                marginBottom: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              <Space>
                                <Button
                                  icon={<LeftOutlined />}
                                  onClick={() => {
                                    const next = calendarValue
                                      .clone()
                                      .subtract(1, "month")
                                      .startOf("month");
                                    setCalendarValue(next);
                                  }}
                                />
                                <Button
                                  icon={<RightOutlined />}
                                  onClick={() => {
                                    const next = calendarValue
                                      .clone()
                                      .add(1, "month")
                                      .startOf("month");
                                    setCalendarValue(next);
                                  }}
                                />
                                <Button
                                  onClick={() =>
                                    setCalendarValue(
                                      moment(schedule.start_time).startOf("month")
                                    )
                                  }
                                >
                                  Hôm nay
                                </Button>
                              </Space>
                              <div style={{ fontWeight: 800, fontSize: 16 }}>
                                {calendarValue.format("MMMM YYYY")}
                              </div>
                            </div>

                            <Calendar
                              fullscreen={false}
                              mode="month"
                              value={calendarValue}
                              validRange={[
                                moment(schedule.start_time).startOf("day"),
                                moment(schedule.end_time).endOf("day"),
                              ]}
                              onPanelChange={(value) => {
                                setCalendarValue(value);

                                const nextActive = value.format("YYYY-MM-DD");
                                if (dayHasSlots[nextActive]) {
                                  setActiveDate(nextActive);
                                } else {
                                  const inMonth = availableSlots
                                    .filter((s) => value.isSame(s.date, "month"))
                                    .map((s) => s.date)
                                    .sort();
                                  if (inMonth.length) setActiveDate(inMonth[0]);
                                }
                              }}
                              onSelect={(date) => {
                                const key = date.format("YYYY-MM-DD");
                                if (!dayHasSlots[key]) return;

                                setCalendarValue(date);
                                setActiveDate(key);
                                if (screens.xs) setMobileDrawerOpen(true);
                              }}
                              disabledDate={(date) => {
                                const key = date.format("YYYY-MM-DD");
                                return !dayHasSlots[key];
                              }}
                              dateCellRender={(date) => {
                                const key = date.format("YYYY-MM-DD");
                                if (!dayHasSlots[key]) return null;
                                const isActive = activeDate === key;
                                return (
                                  <div style={{ textAlign: "right", marginTop: 6 }}>
                                    <Tag
                                      color={isActive ? "blue" : "default"}
                                      style={{ margin: 0 }}
                                    >
                                      Có lịch
                                    </Tag>
                                  </div>
                                );
                              }}
                            />
                          </div>
                          {!screens.xs ? (
                            <div
                              style={{
                                background: "var(--surface-bg)",
                                borderRadius: "12px",
                                border: "1px solid var(--border-color)",
                                padding: "12px",
                                minHeight: 260,
                                display: "grid",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "12px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ fontWeight: 700 }}>
                                  {activeDate
                                    ? `Buổi học ngày ${moment(
                                        activeDate
                                      ).format("DD/MM/YYYY")}`
                                    : "Chọn ngày để xem giờ"}
                                </div>
                                {activeDate ? (
                                  <Space>
                                    <Tag color="blue" style={{ margin: 0 }}>
                                      {
                                        (
                                          studentTimeSelections[
                                            activeStudentId
                                          ] || []
                                        ).filter((id) =>
                                          String(id).includes(activeDate)
                                        ).length
                                      }{" "}
                                      đã chọn
                                    </Tag>
                                    <Button
                                      size="small"
                                      onClick={() =>
                                        setStudentTimeSelections((prev) => ({
                                          ...prev,
                                          [activeStudentId]: (
                                            prev[activeStudentId] || []
                                          ).filter(
                                            (id) =>
                                              !String(id).includes(activeDate)
                                          ),
                                        }))
                                      }
                                    >
                                      Bỏ chọn ngày
                                    </Button>
                                  </Space>
                                ) : null}
                              </div>
                              {activeDate ? (
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr",
                                    gap: "8px",
                                  }}
                                >
                                  {(daySlotsMap[activeDate] || []).map((slot) => {
                                      const selectedSlots =
                                        studentTimeSelections[activeStudentId] || [];
                                      const selected = selectedSlots.includes(slot.id);
                                      return (
                                        <Button
                                          key={slot.id}
                                          size={screens.xs ? "middle" : "small"}
                                          type={selected ? "primary" : "default"}
                                          onClick={() => toggleSlot(slot.id)}
                                          style={{
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "10px 12px",
                                            height: "auto",
                                          }}
                                        >
                                          <span>
                                            {slot.startTime}-{slot.endTime}
                                          </span>
                                          {selected && <Tag color="blue">Đã chọn</Tag>}
                                        </Button>
                                      );
                                    })}
                                    </div>
                              ) : (
                                <div style={{ color: "var(--text-muted)" }}>
                                  Chọn ngày để hiển thị khung giờ.
                                </div>
                              )}
                            </div>
                          ) : null}

                          <Drawer
                            title={
                              activeDate
                                ? `Chọn giờ (${moment(activeDate).format(
                                    "DD/MM/YYYY"
                                  )})`
                                : "Chọn giờ"
                            }
                            placement="bottom"
                            height="70%"
                            open={screens.xs && mobileDrawerOpen}
                            onClose={() => setMobileDrawerOpen(false)}
                          >
                            {activeDate ? (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr",
                                  gap: 8,
                                }}
                              >
                                {(daySlotsMap[activeDate] || []).map((slot) => {
                                  const selectedSlots =
                                    studentTimeSelections[activeStudentId] ||
                                    [];
                                  const selected = selectedSlots.includes(
                                    slot.id
                                  );
                                  return (
                                    <Button
                                      key={slot.id}
                                      size={"large"}
                                      type={selected ? "primary" : "default"}
                                      onClick={() => toggleSlot(slot.id)}
                                      style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "14px 14px",
                                        height: "auto",
                                      }}
                                    >
                                      <span>
                                        {slot.startTime}-{slot.endTime}
                                      </span>
                                      {selected && (
                                        <Tag color="blue">Đã chọn</Tag>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ color: "var(--text-muted)" }}>
                                Chọn ngày trên lịch để hiển thị khung giờ.
                              </div>
                            )}
                          </Drawer>
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "var(--space-xl)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Chọn học viên ở bên trái để phân công lịch học
                      </div>
                    )}
                  </div>
                </div>
              )}

              {courseStudents.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--space-xl)",
                    background: "var(--surface-secondary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Không có học viên trong khóa học này
                </div>
              )}
            </div>

            <Divider />

            <div style={{ textAlign: "center" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<SaveOutlined />}
                style={{
                  background:
                    "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  minWidth: "220px",
                  height: "50px",
                  boxShadow: "0 4px 15px rgba(255, 107, 107, 0.4)",
                  transition: "all var(--transition-normal)",
                }}
                disabled={courseStudents.length === 0}
              >
                {submitting ? "⏳ Đang lưu..." : "💾 Lưu phân công"}
              </Button>

              {courseStudents.length === 0 && (
                <div
                  style={{
                    marginTop: "var(--space-md)",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    fontStyle: "italic",
                  }}
                >
                  Không có học viên trong khóa học này
                </div>
              )}
            </div>
          </Form>
=======
        {renderScheduleContent()}
      </Drawer>

      {/* Floating Save Button for Mobile */}
      {screens.xs && (
        <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            padding: '12px 16px',
            // Quan trọng cho iPhone dòng X/11/12/13/14: Tránh thanh Home ảo
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', 
            background: 'white',
            borderTop: '1px solid #eee',
            zIndex: 1000,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
             <Button 
             type="primary" block size="large"
             icon={<SaveOutlined />} 
             loading={submitting}
             onClick={handleSubmit}
             style={{ borderRadius: 8, height: 48, fontSize: '1rem', fontWeight: 600 }}
             disabled={courseStudents.length === 0}
           >
             Lưu tất cả ({Object.values(studentTimeSelections).flat().length} giờ)
           </Button>
>>>>>>> 80e0b92518f9437db1be27a274b3d898c4c2dcaa
        </div>
      )}
    </div>
  );
}