import React from "react";
import { Result, Button } from "antd";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            padding: "24px",
          }}
        >
          <Result
            status="500"
            title="500"
            subTitle="Xin lỗi, đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."
            extra={[
              <Button
                type="primary"
                key="home"
                icon={<HomeOutlined />}
                onClick={() => (window.location.href = "/")}
              >
                Về trang chủ
              </Button>,
              <Button
                key="reload"
                icon={<ReloadOutlined />}
                onClick={this.handleReset}
              >
                Tải lại
              </Button>,
            ]}
          />
          {import.meta.env.DEV && this.state.error && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: "#fff",
                borderRadius: "8px",
                maxWidth: "800px",
                maxHeight: "400px",
                overflow: "auto",
              }}
            >
              <pre style={{ fontSize: "12px", color: "#ef4444" }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

