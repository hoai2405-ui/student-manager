import React, { useState } from "react";
import { createSchedule } from "../../Common/scheduleApi";

export default function ScheduleForm({ token, onCreated }) {
  const [form, setForm] = useState({
    course_id: "",
    start_time: "",
    end_time: "",
    capacity: 0,
    location: "",
  });

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
    <form onSubmit={submit}>
      <input
        placeholder="course_id"
        value={form.course_id}
        onChange={(e) => setForm({ ...form, course_id: e.target.value })}
        required
      />
      <input
        type="datetime-local"
        value={form.start_time}
        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
        required
      />
      <input
        type="datetime-local"
        value={form.end_time}
        onChange={(e) => setForm({ ...form, end_time: e.target.value })}
        required
      />
      <input
        type="number"
        value={form.capacity}
        onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
      />
      <input
        placeholder="location"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />
      <button type="submit">Tạo lịch</button>
    </form>
  );
}
