import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Card, Button, Form, message, Grid, Avatar, Input, Tag,
  Row, Col, Tabs, Empty, Typography, Badge, Drawer
} from "antd";
import {
  ArrowLeftOutlined, SaveOutlined,
  UserOutlined, SearchOutlined, CheckCircleFilled,
  ClockCircleOutlined, CloseOutlined
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

  // State riêng cho Mobile Drawer
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // --- API Calls (Giữ nguyên) ---
  useEffect(() => {
    if (scheduleId) {
      fetchSchedule();
      fetchExistingRegistrations();
    }
  }, [scheduleId, fetchExistingRegistrations, fetchSchedule]);

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
    // Nếu học viên đã đăng ký (có trong existingRegistrations), không cho click
    const isRegistered = existingRegistrations.some(reg => String(reg.id) === String(studentId));
    if (isRegistered) return;

    setActiveStudentId(studentId);
    // Nếu là màn hình nhỏ (Mobile/Tablet dọc), mở Drawer
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
    } catch {
      message.error("Có lỗi xảy ra khi lưu dữ liệu.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Components ---

  // Nội dung bảng chọn giờ (Dùng chung cho cả Drawer Mobile và Cột phải Desktop)
  const renderScheduleContent = () => {
    if (!activeStudentId) return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#999', padding: 20 }}>
        <UserOutlined style={{ fontSize: 48, marginBottom: 15, color: '#e0e0e0' }} />
        <div>Chọn học viên để bắt đầu</div>
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
      </div>
    );
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!schedule) return <Empty description="Không tìm thấy lịch học" />;

  return (
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
        </div>
        )}
      </div>
    );
  }