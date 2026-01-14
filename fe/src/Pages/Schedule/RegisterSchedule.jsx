import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Card, Button, message, Grid, Avatar, Input, Tag,
  Row, Col, Tabs, Empty, Typography, Badge, Drawer
} from "antd";
import {
  ArrowLeftOutlined, SaveOutlined,
  UserOutlined, SearchOutlined, CheckCircleFilled,
  ClockCircleOutlined, CloseOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext"; // Đường dẫn context của bạn
import axios from "../../Common/axios"; // Đường dẫn axios của bạn
import moment from "moment";

const { useBreakpoint } = Grid;

export default function RegisterSchedule() {
  const { scheduleId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  
  // --- State Management ---
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentTimeSelections, setStudentTimeSelections] = useState({});
  const [studentSearch, setStudentSearch] = useState("");
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [activeDate, setActiveDate] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // --- API Calls ---
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
      const response = await axios.get(`/api/schedules/${scheduleId}/registrations`);
      setExistingRegistrations(response.data || []);
    } catch {
      setExistingRegistrations([]);
    }
  };

  useEffect(() => {
    if (scheduleId) {
      fetchSchedule();
      fetchExistingRegistrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const fetchCourseStudents = async () => {
    if (!schedule?.course_id) return;
    try {
      const courseResponse = await axios.get("/api/courses");
      const courses = courseResponse.data || [];
      const course = courses.find((item) => Number(item.id) === Number(schedule.course_id));
      if (course?.ma_khoa_hoc) {
        const response = await axios.get(`/api/students?ma_khoa_hoc=${course.ma_khoa_hoc}`);
        setCourseStudents(response.data || []);
      }
    } catch {
      setCourseStudents([]);
    }
  };

  useEffect(() => {
    if (schedule?.course_id) fetchCourseStudents();
  }, [schedule]);

  // --- Logic Thời gian ---
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
        slots.push({
          id: slotId,
          date: currentDate.format('YYYY-MM-DD'),
          startTime: currentTime.format('HH:mm'),
          endTime: slotEndTime.format('HH:mm')
        });
        currentTime = slotEndTime;
      }
      currentDate.add(1, 'day');
    }
    return slots;
  };

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return courseStudents;
    return courseStudents.filter((student) => {
      const name = (student.ho_va_ten || student.name || student.ten || "").toLowerCase();
      const username = (student.username || "").toLowerCase();
      const phone = (student.so_dien_thoai || "").toLowerCase();
      return name.includes(term) || username.includes(term) || phone.includes(term);
    });
  }, [courseStudents, studentSearch]);

  const timeSlots = useMemo(() => generateTimeSlotsForStudent(), [schedule?.start_time, schedule?.end_time]);

  const daySlotsMap = useMemo(() => {
    return timeSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {});
  }, [timeSlots]);

  const availableDates = useMemo(() => Object.keys(daySlotsMap).sort(), [daySlotsMap]);

  useEffect(() => {
    if (availableDates.length > 0 && !activeDate) {
      setActiveDate(availableDates[0]);
    }
  }, [availableDates]);

  // --- Event Handlers ---
  const handleStudentSelect = (studentId) => {
    const isRegistered = existingRegistrations.some(reg => String(reg.id) === String(studentId));
    if (isRegistered) return;

    setActiveStudentId(studentId);
    if (!screens.md) {
      setMobileDrawerOpen(true);
    }
  };

  const toggleSlot = (slotId) => {
    if (!activeStudentId) return;
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
    if (!user?.id) return message.error("Bạn cần đăng nhập để đăng ký");
    
    const hasSelections = Object.values(studentTimeSelections).some(selections => selections && selections.length > 0);
    if (!hasSelections) return message.error("Vui lòng chọn thời gian học cho ít nhất một học viên");

    setSubmitting(true);
    try {
      let successCount = 0;
      for (const [studentId, timeSlots] of Object.entries(studentTimeSelections)) {
        if (timeSlots && timeSlots.length > 0) {
          try {
            const slotId = Array.isArray(timeSlots) && timeSlots.length ? String(timeSlots[0]) : null;
            await axios.post(`/api/schedules/${scheduleId}/register`, { student_id: studentId, slot_id: slotId });
            successCount++;
          } catch (e) {
            console.error(e);
          }
        }
      }
      if (successCount > 0) {
        message.success(`Đăng ký thành công ${successCount} học viên!`);
        navigate(window.location.pathname.startsWith("/student") ? "/student/schedules" : "/admin/schedules");
      } else {
        message.error("Không thể đăng ký. Có thể học viên chưa đủ điều kiện.");
      }
    } catch {
      message.error("Có lỗi xảy ra khi lưu dữ liệu.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Components ---
  const renderScheduleContent = () => {
    if (!activeStudentId) return (
      <div className="empty-state-container">
        <UserOutlined className="empty-state-icon" />
        <div>Chọn học viên để bắt đầu</div>
      </div>
    );

    const activeStudent = courseStudents.find(s => s.id === activeStudentId);
    
    const dateItems = availableDates.map((date) => {
      const slots = daySlotsMap[date] || [];
      const count = slots.length;
      return {
        key: date,
        label: (
          <div className="tab-label">
            <div className="tab-day">{moment(date).format('dddd')}</div>
            <div className="tab-date">{moment(date).format('DD/MM')}</div>
            <div className="tab-count">{count} ca</div>
          </div>
        ),
      };
    });

    return (
      <div className="schedule-content-wrapper">
         {/* Info Strip */}
         <div className="info-strip">
             <div className="info-strip-content">
                <Avatar 
                    size={42} 
                    src={activeStudent?.anh}
                    className="info-avatar"
                >
                    {activeStudent?.ho_va_ten?.charAt(0)}
                </Avatar>
                <div>
                    <div className="info-name">
                        {activeStudent?.ho_va_ten}
                    </div>
                    <div className="info-sub">
                        Đã chọn: <span className="info-highlight">{studentTimeSelections[activeStudentId]?.length || 0}</span> khung giờ
                    </div>
                </div>
             </div>
         </div>

         {/* Tabs */}
         <div className="tabs-container">
            <Tabs 
                activeKey={activeDate} 
                onChange={setActiveDate}
                items={dateItems}
                tabBarStyle={{ marginBottom: 0 }}
            />
         </div>

         {/* Grid */}
         <div className="grid-scroll-area">
            {activeDate ? (
                <div className="time-grid">
                    {(daySlotsMap[activeDate] || []).map((slot) => {
                        const selectedSlots = studentTimeSelections[activeStudentId] || [];
                        const isSelected = selectedSlots.includes(slot.id);
                        return (
                            <div
                                key={slot.id}
                                onClick={() => toggleSlot(slot.id)}
                                className={`time-slot ${isSelected ? 'selected' : ''}`}
                            >
                                <div className="slot-time">
                                    {slot.startTime} - {slot.endTime}
                                </div>
                                {isSelected && <div className="slot-badge">Đã chọn</div>}
                            </div>
                        );
                    })}
                </div>
            ) : <Empty description="Chọn ngày để xem" />}
         </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!schedule) return <Empty description="Không tìm thấy lịch học" style={{ marginTop: 50 }} />;

  // --- Main Render ---
  return (
    <div className="register-schedule-page">
      {/* --- Embedded CSS --- */}
      <style>{`
        /* Global & Layout */
        .register-schedule-page {
          background-color: #f5f7fa;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          background: white;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .header-title { font-weight: 700; font-size: 1rem; color: #262626; }
        .header-course { font-size: 0.8rem; color: #888; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Main Content Row */
        .main-row {
          flex: 1;
          height: calc(100vh - 110px); /* Desktop fixed height */
        }

        /* Cards */
        .custom-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Student List Column */
        .student-search { margin: 12px; margin-bottom: 8px; border-radius: 8px; }
        .student-list-container { flex: 1; overflow-y: auto; padding: 0 12px 12px 12px; }
        .list-title { margin-bottom: 8px; font-size: 0.75rem; color: #999; fontWeight: 600; text-transform: uppercase; }
        
        .student-item {
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 10px;
          background: white;
          border: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .student-item:hover { background-color: #fafafa; transform: translateY(-1px); }
        .student-item.active { background-color: #e6f7ff; border-color: #1890ff; }
        .student-item.disabled { opacity: 0.6; cursor: default; background: #f9f9f9; }
        .student-item.disabled:hover { transform: none; }
        
        .student-info { flex: 1; overflow: hidden; }
        .student-name { font-weight: 600; font-size: 0.95rem; color: #262626; }
        .student-phone { font-size: 0.8rem; color: #888; }

        /* Schedule Content (Right Col & Drawer) */
        .schedule-content-wrapper { display: flex; flex-direction: column; height: 100%; }
        
        .info-strip { padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
        .info-strip-content { display: flex; align-items: center; gap: 12px; }
        .info-avatar { background-color: #1890ff; }
        .info-name { font-weight: 700; font-size: 1rem; }
        .info-sub { font-size: 0.8rem; color: #666; }
        .info-highlight { color: #1890ff; font-weight: 700; }

        .tabs-container { padding: 0 10px; background: white; border-bottom: 1px solid #f0f0f0; }
        .tab-label { text-align: center; padding: 0 4px; }
        .tab-day { font-size: 0.8rem; color: #888; }
        .tab-date { font-weight: 600; font-size: 1rem; color: #262626; }
        .tab-count { font-size: 0.7rem; color: #1890ff; }

        .grid-scroll-area { flex: 1; overflow-y: auto; padding: 16px; background: white; }
        .time-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); 
          gap: 12px; 
          padding-bottom: 20px; 
        }

        .time-slot {
          padding: 12px 8px;
          border-radius: 8px;
          border: 1px solid #e8e8e8;
          background: white;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }
        .time-slot:hover { border-color: #40a9ff; }
        .time-slot:active { transform: scale(0.98); }
        .time-slot.selected {
          border-color: #1890ff;
          background: #e6f7ff;
          box-shadow: 0 2px 6px rgba(24,144,255,0.2);
        }
        
        .slot-time { font-weight: 600; color: #333; }
        .time-slot.selected .slot-time { color: #1890ff; }
        .slot-badge { font-size: 0.7rem; color: #1890ff; margin-top: 2px; }

        .empty-state-container { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #999; }
        .empty-state-icon { font-size: 48px; margin-bottom: 15px; color: #e0e0e0; }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }

        /* --- MOBILE & RESPONSIVE --- */
        @media (max-width: 768px) {
          .register-schedule-page {
            padding: 10px;
            padding-bottom: 100px; /* Space for fixed footer */
            height: auto;
            min-height: 100vh;
          }
          
          .main-row { height: auto; display: block; }
          .custom-card { height: auto; min-height: 400px; border-radius: 12px; }
          .student-list-container { max-height: 600px; } /* Limit height on mobile so page doesn't get too long */
          
          .time-grid { grid-template-columns: repeat(2, 1fr); } /* 2 columns on mobile */

          .mobile-footer {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            padding: 12px 16px;
            padding-bottom: calc(12px + env(safe-area-inset-bottom)); /* iPhone Home Bar fix */
            background: white;
            border-top: 1px solid #eee;
            z-index: 1000;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} shape="circle" />
            <div>
                <div className="header-title">Đăng ký lịch học</div>
                <div className="header-course">{schedule.course_name}</div>
            </div>
        </div>
        {!screens.xs && (
             <Button type="primary" icon={<SaveOutlined />} size="large"
             loading={submitting} onClick={handleSubmit} disabled={courseStudents.length === 0}>
             Lưu thay đổi
           </Button>
        )}
      </div>

      <Row gutter={[20, 20]} className="main-row">
        {/* Left Column: Student List */}
        <Col xs={24} md={8} lg={6} style={{ height: screens.xs ? 'auto' : '100%' }}>
          <div className="custom-card">
            <div className="student-search">
                <Input 
                  prefix={<SearchOutlined style={{ color: '#ccc' }} />} 
                  placeholder="Tìm học viên..." 
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
            </div>
            
            <div className="student-list-container">
                <div className="list-title">DANH SÁCH HỌC VIÊN</div>
                {filteredStudents.map(student => {
                     const isSelected = activeStudentId === student.id;
                     const isRegistered = existingRegistrations.some(reg => String(reg.id) === String(student.id));
                     const hasSelection = (studentTimeSelections[student.id] || []).length > 0;
                     
                     let itemClass = "student-item";
                     if (isSelected && screens.md) itemClass += " active";
                     if (isRegistered) itemClass += " disabled";

                     return (
                        <div
                            key={student.id}
                            onClick={() => handleStudentSelect(student.id)}
                            className={itemClass}
                        >
                            <Badge count={hasSelection && !isRegistered ? <CheckCircleFilled style={{ color: '#52c41a' }} /> : 0}>
                                <Avatar size={40} src={student.anh_chan_dung || student.anh} style={{ backgroundColor: isSelected && !screens.xs ? '#1890ff' : '#ddd' }}>
                                    {student.ho_va_ten?.charAt(0) || 'U'}
                                </Avatar>
                            </Badge>
                            <div className="student-info">
                                <div className="student-name">{student.ho_va_ten || student.name}</div>
                                <div className="student-phone">{student.so_dien_thoai}</div>
                            </div>
                            
                            {/* Mobile visual cues */}
                            {screens.xs && !isRegistered && (
                                <Button size="small" type="link" icon={<ClockCircleOutlined />}>Chọn giờ</Button>
                            )}
                            {isRegistered && <Tag color="green">Đã xong</Tag>}
                        </div>
                     )
                })}
                {filteredStudents.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy học viên" />}
            </div>
          </div>
        </Col>

        {/* Right Column: Time Selection (Desktop Only) */}
        {!screens.xs && (
            <Col md={16} lg={18} style={{ height: '100%' }}>
                <div className="custom-card">
                    {renderScheduleContent()}
                </div>
            </Col>
        )}
      </Row>

      {/* --- MOBILE DRAWER --- */}
      <Drawer
        title="Chọn lịch học"
        placement="bottom"
        height="85vh"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }} 
        bodyStyle={{ padding: 0 }}
        extra={
            <Button type="text" onClick={() => setMobileDrawerOpen(false)} icon={<CloseOutlined />} />
        }
        footer={
            <div style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={() => setMobileDrawerOpen(false)}>
                    Xong
                </Button>
            </div>
        }
      >
        {renderScheduleContent()}
      </Drawer>

      {/* Floating Save Button for Mobile */}
      {screens.xs && (
        <div className="mobile-footer">
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
        </div>
        )}
    </div>
  );
}