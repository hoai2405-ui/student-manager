import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Divider, Select, Space, Spin, Tag, Typography, message } from "antd";
import axios from "../../Common/axios";

const { Title, Text } = Typography;

export default function StudentPractice() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);

  const current = useMemo(() => questions[index] || null, [questions, index]);

  const loadSubjects = async () => {
    try {
      const res = await axios.get("/api/subjects");
      setSubjects(res.data || []);
    } catch {
      // optional
    }
  };

  const loadQuestions = async (sid) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/student/questions", { params: { subject_id: sid || undefined, limit: 50 } });
      setQuestions(res.data || []);
      setIndex(0);
      setSelected(null);
      setChecked(false);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi tải câu hỏi ôn tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([loadSubjects(), loadQuestions(null)]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spin className="mt-20 block text-center" size="large" />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Title level={3}>Ôn tập theo chủ đề</Title>

        <Card className="mb-4">
          <Space wrap>
            <Text>Chọn môn:</Text>
            <Select
              allowClear
              placeholder="Tất cả"
              style={{ width: 320 }}
              value={subjectId}
              options={subjects.map((s) => ({ value: s.id, label: `${s.code || ""} ${s.name || s.subject_name}`.trim() }))}
              onChange={(v) => {
                setSubjectId(v ?? null);
                loadQuestions(v ?? null);
              }}
            />
            <Button onClick={() => loadQuestions(subjectId)}>Tải lại</Button>
            <Tag color="blue">{questions.length} câu</Tag>
          </Space>
        </Card>

        {!current ? (
          <Card>
            <Text>Chưa có câu hỏi.</Text>
          </Card>
        ) : (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>Câu {index + 1}/{questions.length}</div>
              <Space>
                <Button disabled={index === 0} onClick={() => { setIndex((i) => Math.max(0, i - 1)); setSelected(null); setChecked(false); }}>
                  Trước
                </Button>
                <Button disabled={index >= questions.length - 1} onClick={() => { setIndex((i) => Math.min(questions.length - 1, i + 1)); setSelected(null); setChecked(false); }}>
                  Sau
                </Button>
              </Space>
            </div>

            <Divider />

            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{current.content}</div>

            <div style={{ display: "grid", gap: 10 }}>
              {(current.choices || []).map((c) => {
                const isPicked = selected === c.id;
                const color = isPicked ? "primary" : "default";
                return (
                  <Button
                    key={c.id}
                    type={color}
                    onClick={() => setSelected(c.id)}
                    block
                    style={{ textAlign: "left" }}
                  >
                    {c.label ? `${c.label}. ` : ""}{c.content}
                  </Button>
                );
              })}
            </div>

            <Divider />

            <Space wrap>
              <Button type="primary" disabled={!selected} onClick={() => setChecked(true)}>
                Kiểm tra
              </Button>
              <Button onClick={() => { setSelected(null); setChecked(false); }}>
                Chọn lại
              </Button>
            </Space>

            {checked && (
              <div style={{ marginTop: 16 }}>
                <Tag color="gold">Gợi ý</Tag>
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary">Giải thích (nếu có): {current.explanation || "(chưa có)"}</Text>
                </div>
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary">
                    Lưu ý: bản ôn tập này chưa hiển thị đáp án đúng (để tránh lộ), muốn hiển thị mình sẽ làm thêm chế độ “giáo viên/admin xem đáp án”.
                  </Text>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
