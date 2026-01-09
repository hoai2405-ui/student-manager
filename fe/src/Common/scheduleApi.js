import axiosClient from "./axios";

// trả về axios response (dùng bởi code hiện tại)
export function getSchedules(courseId) {
  return axiosClient.get("/api/schedules", { params: courseId ? { course_id: courseId } : {} });
}

// trả về data trực tiếp (tùy chỗ dùng)
export function fetchSchedules(courseId) {
  return getSchedules(courseId).then((r) => r.data);
}

export function registerSchedule(scheduleId, studentId, slotId, token) {
  return axiosClient.post(
    `/api/schedules/${scheduleId}/register`,
    { student_id: studentId, slot_id: slotId || null },
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
}

// alias (các component có thể dùng tên này)
export const registerToSchedule = registerSchedule;

export function createSchedule(data, token) {
  return axiosClient.post(
    "/api/schedules",
    data,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
}

export function updateSchedule(scheduleId, data, token) {
  return axiosClient.put(
    `/api/schedules/${scheduleId}`,
    data,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
}

export function getRegistrations(scheduleId, token) {
  return axiosClient.get(
    `/api/schedules/${scheduleId}/registrations`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
}

export const scheduleApi = {
  getSchedules,
  fetchSchedules,
  registerSchedule,
  registerToSchedule,
  createSchedule,
  updateSchedule,
  getRegistrations,
};

export default scheduleApi;
