import { useState, useEffect } from "react";
import {
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Card,
  Form,
  Row,
  Col,
} from "antd";
import axios from "axios";
import moment from "moment";
import { UserAddOutlined } from "@ant-design/icons";

const { Option } = Select;

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

const CreateStudent = ({ onCreated }) => {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("/api/courses").then((res) => setCourses(res.data));
  }, []);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post("/api/students", {
        ...values,
        ngay_sinh: values.ngay_sinh
          ? values.ngay_sinh.format("YYYY-MM-DD")
          : "",
        status: "chua thi",
      });
      message.success("🎉 Thêm học viên thành công!");
      form.resetFields();
      onCreated?.();
    } catch (err) {
      message.error("Lỗi khi tạo học viên!");
    }
    setLoading(false);
  };

  return (
    <Row justify="center" style={{ marginTop: 32 }}>
      <Col xs={24} sm={18} md={12} lg={10}>
        <Card
          title={
            <>
              <UserAddOutlined /> Thêm học viên mới
            </>
          }
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 32px rgba(60,60,60,0.12)",
            background: "#fff",
          }}
        >
          <Form
            {...formItemLayout}
            form={form}
            onFinish={handleFinish}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="Họ và tên"
              name="ho_va_ten"
              rules={[{ required: true, message: "Nhập họ tên học viên!" }]}
            >
              <Input placeholder="Họ và tên..." size="large" />
            </Form.Item>
            <Form.Item label="Ngày sinh" name="ngay_sinh">
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                size="large"
                placeholder="Chọn ngày sinh"
              />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Hạng GPLX" name="hang_gplx">
                  <Input placeholder="B1, B2, C..." size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="CCCD/CMT" name="so_cmt">
                  <Input
                    placeholder="Nhập số CCCD/CMT"
                    size="large"
                    maxLength={15}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Khoá học"
              name="ma_khoa_hoc"
              rules={[{ required: true, message: "Chọn khoá học!" }]}
            >
              <Select
                showSearch
                placeholder="Chọn khoá học"
                size="large"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={courses.map((course) => ({
                  value: course.ma_khoa_hoc,
                  label: course.ten_khoa_hoc,
                }))}
              />
            </Form.Item>
            <Form.Item>
              <Button
                block
                size="large"
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ borderRadius: 8, fontWeight: 500, marginTop: 12 }}
              >
                <UserAddOutlined /> Thêm học viên
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default CreateStudent;
