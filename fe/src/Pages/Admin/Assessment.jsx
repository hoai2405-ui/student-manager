import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import axios from "../../Common/axios";

const { Title } = Typography;

export default function AdminAssessment() {
  const [tab, setTab] = useState("questions");

  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  const [qModalOpen, setQModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qForm] = Form.useForm();

  const [eModalOpen, setEModalOpen] = useState(false);
  const [eForm] = Form.useForm();

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/questions");
      setQuestions(res.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi tải câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/exams");
      setExams(res.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi tải đề thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchExams();
  }, []);

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    qForm.resetFields();
    qForm.setFieldsValue({ type: "mcq", choices: [{ label: "A", content: "", is_correct: true }] });
    setQModalOpen(true);
  };

  const openEditQuestion = (q) => {
    setEditingQuestion(q);
    qForm.resetFields();
    qForm.setFieldsValue({
      subject_id: q.subject_id ?? null,
      type: q.type,
      content: q.content,
      explanation: q.explanation,
      difficulty: q.difficulty,
      choices: (q.choices || []).map((c) => ({
        label: c.label,
        content: c.content,
        is_correct: Boolean(c.is_correct),
      })),
    });
    setQModalOpen(true);
  };

  const saveQuestion = async () => {
    const values = await qForm.validateFields();
    try {
      if (editingQuestion) {
        await axios.put(`/api/admin/questions/${editingQuestion.id}`, values);
        message.success("Đã cập nhật câu hỏi");
      } else {
        await axios.post("/api/admin/questions", values);
        message.success("Đã tạo câu hỏi");
      }
      setQModalOpen(false);
      await fetchQuestions();
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi lưu câu hỏi");
    }
  };

  const deleteQuestion = async (q) => {
    try {
      await axios.delete(`/api/admin/questions/${q.id}`);
      message.success("Đã xóa");
      await fetchQuestions();
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi xóa");
    }
  };

  const openCreateExam = () => {
    eForm.resetFields();
    eForm.setFieldsValue({ randomized: true, duration_minutes: 15, total_questions: 20, passing_score: 80 });
    setEModalOpen(true);
  };

  const saveExam = async () => {
    const values = await eForm.validateFields();
    try {
      await axios.post("/api/admin/exams", {
        ...values,
        question_ids: values.question_ids || [],
      });
      message.success("Đã tạo đề thi");
      setEModalOpen(false);
      await fetchExams();
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi tạo đề thi");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Title level={3}>Quản lý thi thử</Title>

        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            {
              key: "questions",
              label: "Câu hỏi",
              children: (
                <Card
                  loading={loading}
                  extra={
                    <Button type="primary" onClick={openCreateQuestion}>
                      Thêm câu hỏi
                    </Button>
                  }
                >
                  <List
                    dataSource={questions}
                    renderItem={(q) => (
                      <List.Item
                        actions={[
                          <Button key="edit" onClick={() => openEditQuestion(q)}>
                            Sửa
                          </Button>,
                          <Button key="del" danger onClick={() => deleteQuestion(q)}>
                            Xóa
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <Tag color={q.type === "mcq" ? "blue" : "purple"}>{q.type}</Tag>
                              <span>{q.content}</span>
                            </Space>
                          }
                          description={<span>{(q.choices || []).length} lựa chọn</span>}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              ),
            },
            {
              key: "exams",
              label: "Đề thi",
              children: (
                <Card
                  loading={loading}
                  extra={
                    <Button type="primary" onClick={openCreateExam}>
                      Tạo đề thi
                    </Button>
                  }
                >
                  <List
                    dataSource={exams}
                    renderItem={(e) => (
                      <List.Item>
                        <List.Item.Meta
                          title={e.title}
                          description={
                            <Space>
                              <Tag color="blue">{e.total_questions} câu</Tag>
                              <Tag color="purple">{e.duration_minutes} phút</Tag>
                              <Tag color="gold">Đạt: {e.passing_score}%</Tag>
                              {e.randomized ? <Tag color="green">Random</Tag> : <Tag>Fixed</Tag>}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              ),
            },
          ]}
        />

        <Modal
          title={editingQuestion ? "Sửa câu hỏi" : "Thêm câu hỏi"}
          open={qModalOpen}
          onCancel={() => setQModalOpen(false)}
          onOk={saveQuestion}
          width={800}
        >
          <Form form={qForm} layout="vertical">
            <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
              <Select options={[{ value: "mcq", label: "Trắc nghiệm" }, { value: "essay", label: "Tự luận" }]} />
            </Form.Item>
            <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: "Nhập nội dung" }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="explanation" label="Giải thích (tuỳ chọn)">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="difficulty" label="Độ khó (1-5)">
              <InputNumber min={1} max={5} style={{ width: 120 }} />
            </Form.Item>

            <Form.List name="choices">
              {(fields, { add, remove }) => (
                <Card size="small" title="Đáp án (MCQ)" extra={<Button onClick={() => add({ label: "", content: "", is_correct: false })}>Thêm</Button>}>
                  {fields.map((field) => (
                    <Space key={field.key} align="start" style={{ display: "flex", marginBottom: 8 }}>
                      <Form.Item {...field} name={[field.name, "label"]} label="Label">
                        <Input style={{ width: 80 }} />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, "content"]} label="Nội dung" rules={[{ required: true }]}>
                        <Input style={{ width: 420 }} />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, "is_correct"]} label="Đúng" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                      <Button danger onClick={() => remove(field.name)}>
                        Xóa
                      </Button>
                    </Space>
                  ))}
                </Card>
              )}
            </Form.List>
          </Form>
        </Modal>

        <Modal title="Tạo đề thi" open={eModalOpen} onCancel={() => setEModalOpen(false)} onOk={saveExam} width={800}>
          <Form form={eForm} layout="vertical">
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="duration_minutes" label="Thời gian (phút)" rules={[{ required: true }]}>
              <InputNumber min={1} max={180} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="total_questions" label="Số câu" rules={[{ required: true }]}>
              <InputNumber min={1} max={200} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="passing_score" label="Điểm đạt (%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="randomized" label="Random" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="question_ids" label="Chọn câu hỏi cho đề">
              <Select
                mode="multiple"
                optionFilterProp="label"
                options={questions.map((q) => ({ value: q.id, label: `${q.id}: ${q.content}` }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
