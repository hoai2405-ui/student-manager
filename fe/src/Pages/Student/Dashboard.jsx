import React, { useEffect, useState } from "react";
import { Row, Col, Spin, Progress } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { useAuth } from "../../contexts/AuthContext";
import {
  ReadOutlined,
  CarOutlined,
  ToolOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

const API = "http://localhost:3001";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const local = JSON.parse(localStorage.getItem("studentInfo"));
  const [currentUser, setCurrentUser] = useState(local || user || null);

  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // sync AuthContext user into local student info
  useEffect(() => {
    if (user && (!currentUser || currentUser.id !== user.id)) {
      setCurrentUser(user);
      try { localStorage.setItem("studentInfo", JSON.stringify(user)); } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch fresh student info (including course name) then dashboard data
  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);

    axios.get(`${API}/api/student/${currentUser.id}`)
      .then((res) => {
        console.log("[DEBUG] refreshed student from API:", res.data);
        const stu = res.data;
        if (stu) {
          setCurrentUser(stu);
          try { localStorage.setItem("studentInfo", JSON.stringify(stu)); } catch (e) {}
        }
      })
      .catch((e) => console.warn("Could not refresh student info", e))
      .finally(() => {
        Promise.all([
          axios.get(`${API}/api/student/dashboard/${currentUser.id}`),
          axios.get(`${API}/api/student/summary/${currentUser.id}`)
        ]).then(([s, sum]) => {
          setSubjects(s.data || []);
          setSummary(sum.data);
        }).catch(console.error)
          .finally(() => setLoading(false));
      });
  }, [currentUser?.id]);

  const styleByCode = (code) => ({
    PL: "#10b981",
    DD: "#3b82f6",
    CT: "#f59e0b",
    KT: "#14b8a6",
    MP: "#64748b"
  }[code] || "#6b7280");

  if (loading) return <Spin className="mt-20 block text-center" />;

  return (
    <div className="p-5 bg-[#f5f7fb] min-h-screen">

  

      {/* SUBJECTS */}
      <Row gutter={[16, 16]}>
        {subjects.map((s) => (
          <Col md={12} lg={8} key={s.subject_id}>
            <div
              className="rounded-lg p-4 text-white shadow flex flex-col h-full"
              style={{ background: styleByCode(s.code) }}
            >
              <div className="text-sm font-semibold uppercase">
                {s.subject_name}
              </div>

              <div className="text-3xl font-bold mt-2">
                {Number(s.learned_hours).toFixed(2)}
                <span className="text-lg opacity-80">/{s.required_hours}h</span>
              </div>

              <div className="text-xs opacity-90 mt-1">
                {s.learned_hours >= s.required_hours
                  ? "Đã hoàn thành"
                  : "Chưa hoàn thành"}
              </div>

              <div
                onClick={() =>
                  s.code === "MP"
                    ? navigate("/student/simulation")
                    : navigate(`/student/subjects/${s.code}`)
                }
                className="mt-auto pt-3 text-sm font-semibold cursor-pointer flex justify-between border-t border-white/30"
              >
                <span>Chi tiết bài giảng</span>
                <ArrowRightOutlined />
              </div>
            </div>
          </Col>
        ))}

        {/* RESULT */}
        <Col md={12} lg={8}>
          <div className="rounded-lg bg-red-500 text-white p-4 shadow h-full">
            <div className="uppercase text-sm font-bold">Kết quả</div>
            <div className="text-2xl font-bold mt-3">
              {summary?.total_learned?.toFixed(2)} / {summary?.total_required}h
            </div>
            <Progress
              percent={summary?.progress || 0}
              strokeColor="#fff"
              trailColor="rgba(255,255,255,.3)"
            />
          </div>
        </Col>
      </Row>

      {/* LOWER SECTION */}
      <Row gutter={[16, 16]} className="mt-6">

        {/* UTILITIES */}
        <Col lg={14}>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-bold mb-3">🧩 Tiện ích</h4>
            <Row gutter={[12, 12]}>
              {[
                { icon: <ReadOutlined />, text: "Học theo giáo trình" },
                { icon: <FileDoneOutlined />, text: "Ôn tập" },
                { icon: <ClockCircleOutlined />, text: "Phiên học treo" }
              ].map((i, idx) => (
                <Col md={8} key={idx}>
                  <div className="border rounded-lg p-3 text-center hover:shadow cursor-pointer">
                    {i.icon}
                    <div className="text-sm mt-2 font-semibold">{i.text}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* INFO */}
        <Col lg={10}>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-bold mb-3">ℹ Thông tin của tôi</h4>
            <p><b>Họ tên:</b> {currentUser.ho_va_ten}</p>
            <p><b>Ngày sinh:</b> {moment(currentUser.ngay_sinh).format("DD/MM/YYYY")}</p>
            <p><b>CCCD:</b> {currentUser.so_cmt}</p>
            <p><b>Hạng đào tạo:</b> {summary?.hang_gplx}</p>
            
          </div>
        </Col>

      </Row>
    </div>
  );
}
