import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, List, Modal, Spin, Tag, Typography, message } from "antd";
import axios from "../../Common/axios";

const { Title, Text } = Typography;

export default function StudentExams() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);

  const [activeAttempt, setActiveAttempt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers] = useState({});
  const [startAt, setStartAt] = useState(null);

  const timeSpentSeconds = useMemo(() => {
    if (!startAt) return 0;
    return Math.max(0, Math.floor((Date.now() - startAt) / 1000));
  }, [startAt]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/student/exams");
      setExams(res.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const startExam = async (examId) => {
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/student/exams/${examId}/start`);
      setActiveAttempt(res.data);
      setAnswers({});
      setStartAt(Date.now());
    } catch (e) {
      message.error(e?.response?.data?.message || "Không bắt đầu được bài thi");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAttempt = async () => {
    if (!activeAttempt?.attempt_id) return;
    setSubmitting(true);

    try {
      const payloadAnswers = (activeAttempt.questions || []).map((q) => ({
        question_id: q.id,
        choice_id: answers[q.id] ?? null,
      }));

      const res = await axios.post(`/api/student/attempts/${activeAttempt.attempt_id}/submit`, {
        answers: payloadAnswers,
        time_spent_seconds: timeSpentSeconds,
      });

      Modal.success({
        title: "Kết quả",
        content: (
          <div>
            <div>Điểm: <b>{res.data?.score ?? 0}</b></div>
            <div>Trạng thái: {res.data?.passed ? <Tag color="green">ĐẠT</Tag> : <Tag color="red">CHƯA ĐẠT</Tag>}</div>
          </div>
        ),
      });

      setActiveAttempt(null);
      setAnswers({});
      setStartAt(null);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin className="mt-20 block text-center" size="large" />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Title level={3}>Thi thử</Title>

        <Card className="mb-4">
          <Text>Chọn đề thi để bắt đầu. Hệ thống chấm tự động câu trắc nghiệm.</Text>
        </Card>

        <List
          dataSource={exams}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="start" type="primary" onClick={() => startExam(item.id)} loading={submitting}>
                  Bắt đầu
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.title}
                description={
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Tag color="blue">{item.total_questions} câu</Tag>
                    <Tag color="purple">{item.duration_minutes} phút</Tag>
                    <Tag color="gold">Đạt: {item.passing_score}%</Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />

        <Modal
          title={activeAttempt?.exam?.title || "Bài thi"}
          open={Boolean(activeAttempt)}
          onCancel={() => {
            setActiveAttempt(null);
            setAnswers({});
            setStartAt(null);
          }}
          width={900}
          footer={[
            <Text key="time">Thời gian: {timeSpentSeconds}s</Text>,
            <Button
              key="submit"
              type="primary"
              danger
              loading={submitting}
              onClick={submitAttempt}
            >
              Nộp bài
            </Button>,
          ]}
        >
          {(activeAttempt?.questions || []).map((q, idx) => (
            <Card key={q.id} size="small" className="mb-3">
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Câu {idx + 1}: {q.content}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {(q.choices || []).map((c) => {
                  const selected = answers[q.id] === c.id;
                  return (
                    <Button
                      key={c.id}
                      type={selected ? "primary" : "default"}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
                      style={{ textAlign: "left" }}
                      block
                    >
                      {c.label ? `${c.label}. ` : ""}{c.content}
                    </Button>
                  );
                })}
              </div>
            </Card>
          ))}
        </Modal>
      </div>
    </div>
  );
}
