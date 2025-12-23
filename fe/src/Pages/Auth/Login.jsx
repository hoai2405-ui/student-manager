import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "../../Common/axios";
// Đảm bảo bạn đã chạy: npm install react-icons
import {
  FaUserShield,
  FaSpinner,
  FaPhoneAlt,
  FaUser,
  FaLock,
} from "react-icons/fa";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const isAdminLoginPage = window.location.pathname.includes("/admin/login");
  const [loading, setLoading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      const isBackOffice = Boolean(
        (user.is_admin ?? user.isAdmin) ||
        user.role === 'admin' ||
        user.role === 'department' ||
        user.role === 'sogtvt' ||
        user.role === 'employee' ||
        isAdminLoginPage // login từ /admin/login thì ưu tiên vào admin
      );
      const redirectPath = isBackOffice ? "/admin" : "/student";
      console.log("LoginPage redirect check:", {
        userRole: user.role,
        isAdmin: user.is_admin,
        isBackOffice,
        redirectPath,
        isAdminLoginPage
      });
      navigate(redirectPath);
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/login", loginForm);
      const { user: userData, token } = res.data;

      if (!userData || !token) {
        throw new Error("Response login không hợp lệ");
      }

      const normalizedUser = {
        ...userData,
        role: userData.role || (userData.is_admin ? "admin" : "employee"),
      };

      login(normalizedUser, token);

      const isBackOffice = Boolean(
        normalizedUser.is_admin ??
        normalizedUser.isAdmin ??
        (["admin", "employee", "department", "sogtvt"].includes(normalizedUser.role) ||
        isAdminLoginPage) // ưu tiên vào admin nếu login từ trang admin
      );

      navigate(isBackOffice ? "/admin" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
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
        "linear-gradient(135deg, #003366 0%, #004080 50%, #0059b3 100%)",
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
      maxWidth: "450px",
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
      background: error.includes("thành công") ? "#f6ffed" : "#fff1f0",
      border: error.includes("thành công") ? "1px solid #b7eb8f" : "1px solid #ffa39e",
      color: error.includes("thành công") ? "#52c41a" : "#cf1322",
      padding: "10px 15px",
      borderRadius: "6px",
      marginBottom: "20px",
      fontSize: "14px",
      textAlign: "center",
    },

    formGroup: {
      marginBottom: "15px",
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
      padding: "12px 12px 12px 40px",
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
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1,
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
            <FaUserShield />
          </div>
          <h2 style={styles.titleMain}>Quản trị hệ thống</h2>
          <p style={styles.titleSub}>QUẢN TRỊ HỌC VIÊN HOÀNG THỊNH</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <div style={{ fontWeight: "bold" }}>
              {error.includes("thành công") ? "Thành công" : "Lỗi"}
            </div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>TÊN ĐĂNG NHẬP</label>
            <div style={styles.inputWrapper}>
              <FaUser style={styles.iconInput} />
              <input
                type="text"
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
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

          <div style={styles.formGroup}>
            <label style={styles.label}>MẬT KHẨU</label>
            <div style={styles.inputWrapper}>
              <FaLock style={styles.iconInput} />
              <input
                type="password"
                style={styles.input}
                placeholder="Nhập mật khẩu"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
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
            disabled={loading}
            style={styles.button}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: "spin 1s linear infinite" }} />{" "}
                Đang xử lý...
              </>
            ) : (
              "ĐĂNG NHẬP"
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
}
