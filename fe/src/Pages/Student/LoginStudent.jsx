import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Đảm bảo bạn đã chạy: npm install react-icons
import {
  FaIdCard,
  FaCarSide,
  FaSpinner,
  FaPhoneAlt,
  FaUserShield,
} from "react-icons/fa";

const LoginStudent = () => {
  const [soCmt, setSoCmt] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHover, setIsHover] = useState(false); // State để làm hiệu ứng hover nút bấm
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ so_cmt: soCmt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi đăng nhập");

      localStorage.setItem("studentToken", data.token);
      localStorage.setItem("studentInfo", JSON.stringify(data.student));

      navigate("/student");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ĐỊNH NGHĨA STYLE (CSS) TẠI ĐÂY ---
  const styles = {
    container: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background:
        "linear-gradient(135deg, #003366 0%, #004080 50%, #0059b3 100%)", // Xanh đậm chuyên nghiệp
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      position: "relative",
      overflow: "hidden",
    },
    overlayCircle1: {
      position: "absolute",
      top: "-10%",
      left: "-5%",
      width: "400px",
      height: "400px",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.05)",
      pointerEvents: "none",
    },
    overlayCircle2: {
      position: "absolute",
      bottom: "-10%",
      right: "-5%",
      width: "300px",
      height: "300px",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.05)",
      pointerEvents: "none",
    },
    card: {
      background: "#ffffff",
      width: "100%",
      maxWidth: "420px",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
      zIndex: 10,
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    header: {
      textAlign: "center",
      marginBottom: "30px",
    },
    logoContainer: {
      width: "70px",
      height: "70px",
      background: "#e6f0ff",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 15px",
      color: "#004080",
      fontSize: "30px",
    },
    titleMain: {
      fontSize: "22px",
      fontWeight: "800",
      color: "#333",
      textTransform: "uppercase",
      margin: "0",
      letterSpacing: "1px",
    },
    titleSub: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#0059b3",
      marginTop: "5px",
    },
    errorBox: {
      background: "#fff1f0",
      border: "1px solid #ffa39e",
      color: "#cf1322",
      padding: "10px 15px",
      borderRadius: "6px",
      marginBottom: "20px",
      fontSize: "14px",
      textAlign: "center",
    },
    formGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontWeight: "600",
      marginBottom: "8px",
      color: "#555",
      fontSize: "14px",
    },
    inputWrapper: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    iconInput: {
      position: "absolute",
      left: "12px",
      color: "#888",
      fontSize: "18px",
      zIndex: 1,
    },
    input: {
      width: "100%",
      padding: "12px 12px 12px 40px", // Padding left để chừa chỗ cho icon
      border: "1px solid #d9d9d9",
      borderRadius: "8px",
      fontSize: "16px",
      outline: "none",
      transition: "border 0.3s",
      backgroundColor: "#f9f9f9",
    },
    button: {
      width: "100%",
      padding: "14px",
      border: "none",
      borderRadius: "8px",
      fontWeight: "bold",
      fontSize: "16px",
      color: "white",
      background: isHover
        ? "linear-gradient(to right, #003366, #004080)"
        : "linear-gradient(to right, #004080, #0059b3)",
      cursor: isLoading ? "not-allowed" : "pointer",
      opacity: isLoading ? 0.7 : 1,
      transition: "all 0.3s ease",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "10px",
      boxShadow: isHover ? "0 5px 15px rgba(0, 64, 128, 0.4)" : "none",
      marginTop: "10px",
    },
    footer: {
      marginTop: "25px",
      paddingTop: "20px",
      borderTop: "1px solid #eee",
      textAlign: "center",
      fontSize: "13px",
      color: "#666",
    },
    copyright: {
      position: "absolute",
      bottom: "20px",
      color: "rgba(255,255,255,0.6)",
      fontSize: "12px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Background trang trí */}
      <div style={styles.overlayCircle1}></div>
      <div style={styles.overlayCircle2}></div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <FaCarSide />
          </div>
          <h2 style={styles.titleMain}>Cổng thông tin</h2>
          <p style={styles.titleSub}>SÁT HẠCH LÝ THUYẾT ONLINE</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <div style={{ fontWeight: "bold" }}>Đăng nhập thất bại</div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>SỐ BÁO DANH / CCCD</label>
            <div style={styles.inputWrapper}>
              <FaIdCard style={styles.iconInput} />
              <input
                type="text"
                style={styles.input}
                placeholder="Nhập số CCCD của bạn"
                value={soCmt}
                onChange={(e) => setSoCmt(e.target.value)}
                required
                onFocus={(e) => {
                  e.target.style.borderColor = "#0059b3";
                  e.target.style.backgroundColor = "#fff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d9d9d9";
                  e.target.style.backgroundColor = "#f9f9f9";
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={styles.button}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
          >
            {isLoading ? (
              <>
                <FaSpinner style={{ animation: "spin 1s linear infinite" }} />{" "}
                Đang xử lý...
              </>
            ) : (
              "VÀO HỌC NGAY"
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={{ marginBottom: "5px" }}>Gặp sự cố đăng nhập?</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "#0059b3",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            <FaPhoneAlt /> <span>Hotline: 0973.605.093</span>
          </div>
        </div>
      </div>

      <div style={styles.copyright}>
        © 2025 Thiết kế bởi Hoài IT
      </div>

      {/* Style animation cho spinner quay */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginStudent;
