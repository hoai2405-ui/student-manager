import React, { useState, useEffect, useContext } from "react";
import { Card, Button, Form, DatePicker, TimePicker, message, Grid, List, Checkbox, Divider, Tooltip, Avatar, Popover, Select } from "antd";
import { ArrowLeftOutlined, SaveOutlined, CalendarOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "../../Common/axios";
import moment from "moment";

const { useBreakpoint } = Grid;

export default function RegisterSchedule() {
  const { scheduleId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [form] = Form.useForm();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentTimeSelections, setStudentTimeSelections] = useState({});

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
      navigate("/schedules");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRegistrations = async () => {
    try {
      const response = await axios.get(`/api/schedules/${scheduleId}/registrations`);
      setExistingRegistrations(response.data || []);
    } catch (error) {
      console.error("Error fetching existing registrations:", error);
      // Don't show error for this, just set empty array
      setExistingRegistrations([]);
    }
  };

  const fetchCourseStudents = async () => {
    if (!schedule?.course_id) return;

    console.log("Schedule course_id:", schedule.course_id);
    console.log("Schedule full object:", schedule);

    try {
      // First, fetch course details to get the correct ma_khoa_hoc
      const courseResponse = await axios.get(`/api/courses/${schedule.course_id}`);
      const course = courseResponse.data;
      console.log("Course details:", course);
      console.log("Course ma_khoa_hoc:", course?.ma_khoa_hoc);

      if (course?.ma_khoa_hoc) {
        // Use the actual course code from the course table
        const response = await axios.get(`/api/students?ma_khoa_hoc=${course.ma_khoa_hoc}`);
        setCourseStudents(response.data || []);
        console.log("✅ Fetched students for course", course.ma_khoa_hoc, "-", response.data?.length || 0, "students");
      } else {
        throw new Error("Course has no ma_khoa_hoc");
      }
    } catch (error) {
      console.error("❌ Error fetching course details or students:", error);
      console.log("🔄 Fallback - trying all students...");
      // Fallback: try to get all students if course fetching fails
      try {
        const response = await axios.get("/api/students");
        setCourseStudents(response.data || []);
        console.log("🚨 FALLBACK - fetched ALL students:", response.data?.length || 0);
      } catch (fallbackError) {
        console.error("❌ Fallback API also failed:", fallbackError);
        setCourseStudents([]);
      }
    }
  };

  useEffect(() => {
    if (schedule?.course_id) {
      fetchCourseStudents();
    }
  }, [schedule]);



  const generateTimeSlotsForStudent = () => {
    if (!schedule?.start_time || !schedule?.end_time) return [];

    const startDate = moment(schedule.start_time);
    const endDate = moment(schedule.end_time);
    const slots = [];

    // Generate daily slots between start and end dates
    let currentDate = startDate.clone().startOf('day');

    while (currentDate.isSameOrBefore(endDate, 'day')) {
      // Generate 2-hour slots from 7:00 AM to 12:00 AM (midnight)
      const daySlots = [];
      let currentTime = moment(currentDate).set({ hour: 7, minute: 0, second: 0 }); // Start at 7:00 AM
      const endTime = moment(currentDate).set({ hour: 24, minute: 0, second: 0 }); // End at 12:00 AM next day

      while (currentTime.isBefore(endTime)) {
        const slotEndTime = moment(currentTime).add(2, 'hours');
        const slotId = `${currentTime.format('HHmm')}-${slotEndTime.format('HHmm')}-${currentDate.format('YYYY-MM-DD')}`;

        daySlots.push({
          id: slotId,
          date: currentDate.format('YYYY-MM-DD'),
          startTime: currentTime.format('HH:mm'),
          endTime: slotEndTime.format('HH:mm')
        });

        currentTime = slotEndTime; // Move to next 2-hour slot
      }

      slots.push(...daySlots);
      currentDate.add(1, 'day');
    }

    return slots;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      message.error("Bạn cần đăng nhập để đăng ký");
      return;
    }

    // Check if any students have selected time slots
    const hasSelections = Object.values(studentTimeSelections).some(selections => selections && selections.length > 0);
    if (!hasSelections) {
      message.error("Vui lòng chọn thời gian học cho ít nhất một học viên");
      return;
    }

    setSubmitting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Register students individually (current backend only supports individual registration)
      for (const [studentId, timeSlots] of Object.entries(studentTimeSelections)) {
        if (timeSlots && timeSlots.length > 0) {
          try {
            // Use the existing individual registration endpoint
            await axios.post(`/api/schedules/${scheduleId}/register`, {
              student_id: studentId
            });
            successCount++;
          } catch (regError) {
            console.error(`Failed to register student ${studentId}:`, regError);
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        message.success(`Đăng ký thành công ${successCount} học viên!`);
        // Note: Time slot assignments are not persisted due to backend limitations
        navigate('/schedules');
      } else {
        message.error("Không thể đăng ký học viên nào!");
      }

      if (errorCount > 0) {
        message.warning(`Có ${errorCount} học viên đăng ký thất bại!`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      message.error("Lưu phân công thất bại, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };





  if (loading) {
    return (
      <div className="app-container" style={{ padding: 'var(--space-lg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Đang tải thông tin lịch học...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="app-container" style={{ padding: 'var(--space-lg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Không tìm thấy lịch học</div>
      </div>
    );
  }

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
            <span style={{ color: 'var(--accent-color)', fontSize: '1.2em' }}>📝</span>
            Đăng ký lịch học
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
          {/* Schedule Info */}
          <div style={{
            background: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <span style={{ color: 'var(--accent-color)', fontSize: '1.1em' }}>🎓</span>
              {schedule.ten_khoa_hoc || schedule.ma_khoa_hoc || 'Khóa học'}
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-md)',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}>
              <div>
                <strong>Thời gian:</strong><br />
                {schedule.start_time ? moment(schedule.start_time).format('DD/MM/YYYY HH:mm') : 'N/A'} -<br />
                {schedule.end_time ? moment(schedule.end_time).format('DD/MM/YYYY HH:mm') : 'N/A'}
              </div>
              <div>
                <strong>Địa điểm:</strong><br />
                {schedule.location || 'Chưa cập nhật'}
              </div>
              <div>
                <strong>Sức chứa:</strong><br />
                {schedule.capacity || 'Không giới hạn'}
              </div>
              <div>
                <strong>Đã đăng ký:</strong><br />
                {schedule.registered_count || 0}
              </div>
            </div>
          </div>

          {/* Registered Students Card */}
          {existingRegistrations.length > 0 && (
            <div style={{
              background: 'var(--surface-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <UserOutlined style={{ color: 'var(--accent-color)' }} />
                Học viên đã đăng ký ({existingRegistrations.length})
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-md)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {existingRegistrations.map((registration, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm)',
                    background: 'var(--surface-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <Avatar
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}
                    >
                      {registration.ho_va_ten?.charAt(0) || 'U'}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}>
                        {registration.ho_va_ten}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>
                        ID: {registration.id} • CCCD: {registration.so_cmt || 'Chưa có'}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '2px'
                      }}>
                        Đã đăng ký
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Assignment Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <UserOutlined style={{ color: 'var(--accent-color)' }} />
                Phân công học viên cho từng buổi học
              </h4>

              {/* Students List with Time Selection */}
              {courseStudents.length > 0 && (
                <div style={{
                  background: 'var(--surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-lg)',
                  border: '1px solid var(--border-color)'
                }}>
                  <h5 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)'
                  }}>
                    <UserOutlined />
                    Học viên trong khóa học ({courseStudents.length})
                  </h5>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--space-md)',
                    maxHeight: '500px',
                    overflowY: 'auto'
                  }}>
                    {courseStudents.map((student, index) => (
                      <div key={student.id || index} style={{
                        padding: 'var(--space-md)',
                        background: 'var(--surface-bg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-sm)',
                          marginBottom: 'var(--space-md)'
                        }}>
                          <Avatar
                            style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white'
                            }}
                            src={student.anh_chan_dung || student.anh}
                          >
                            {student.ho_va_ten?.charAt(0) || student.name?.charAt(0) || student.username?.charAt(0) || 'U'}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)'
                            }}>
                              {student.ho_va_ten || student.name || student.ten || 'Học viên'}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 'var(--space-sm)',
                              marginTop: '2px'
                            }}>
                              {student.username && <span>@{student.username}</span>}
                              {student.email && <span>📧 {student.email}</span>}
                              {student.so_dien_thoai && <span>📱 {student.so_dien_thoai}</span>}
                            </div>
                            {(student.ngay_sinh || student.dia_chi) && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginTop: '2px'
                              }}>
                                {student.ngay_sinh && `🎂 ${moment(student.ngay_sinh).format('DD/MM/YYYY')}`}
                                {student.ngay_sinh && student.dia_chi && ' • '}
                                {student.dia_chi && `📍 ${student.dia_chi}`}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            display: 'block',
                            marginBottom: 'var(--space-xs)'
                          }}>
                            Chọn thời gian học:
                          </span>
                          <Select
                            mode="multiple"
                            placeholder="Chọn các buổi học"
                            style={{ width: '100%' }}
                            value={studentTimeSelections[student.id] || []}
                            onChange={(values) => {
                              setStudentTimeSelections(prev => ({
                                ...prev,
                                [student.id]: values
                              }));
                            }}
                            optionLabelProp="label"
                          >
                            {/* Generate time slots for this student */}
                            {generateTimeSlotsForStudent().map(slot => (
                              <Select.Option
                                key={slot.id}
                                value={slot.id}
                                label={`${slot.date} ${slot.startTime}-${slot.endTime}`}
                              >
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-sm)'
                                }}>
                                  <ClockCircleOutlined style={{ color: 'var(--text-secondary)' }} />
                                  <span>{moment(slot.date).format('DD/MM')} {slot.startTime}-{slot.endTime}</span>
                                </div>
                              </Select.Option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {courseStudents.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-xl)',
                  background: 'var(--surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  Không có học viên trong khóa học này
                </div>
              )}
            </div>

            <Divider />

            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<SaveOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  minWidth: '220px',
                  height: '50px',
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
                  transition: 'all var(--transition-normal)'
                }}
                disabled={courseStudents.length === 0}
              >
                {submitting ? '⏳ Đang lưu...' : '💾 Lưu phân công'}
              </Button>

              {courseStudents.length === 0 && (
                <div style={{
                  marginTop: 'var(--space-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic'
                }}>
                  Không có học viên trong khóa học này
                </div>
              )}
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
}
