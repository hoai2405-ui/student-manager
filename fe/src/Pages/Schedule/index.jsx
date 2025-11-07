import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import ScheduleList from "../../Components/Schedule/ScheduleList";
import ScheduleForm from "../../Components/Schedule/ScheduleForm";
import { scheduleApi } from "../../Common/scheduleApi";

export default function SchedulePage() {
  const { user } = useContext(AuthContext);

  const handleRegister = async (scheduleId) => {
    try {
      await scheduleApi.registerSchedule(scheduleId, user.id);
      alert("Đăng ký thành công!");
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="schedule-page">
      <h1>Quản lý lịch học cabin</h1>

      {user?.is_admin && (
        <>
          <h2>Tạo lịch mới</h2>
          <ScheduleForm onCreated={() => window.location.reload()} />
        </>
      )}

      <h2>Danh sách lịch</h2>
      <ScheduleList studentId={user?.id} onRegister={handleRegister} />
    </div>
  );
}
