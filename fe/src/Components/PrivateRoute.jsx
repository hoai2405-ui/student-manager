import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spin } from "antd";

export default function PrivateRoute({ children, adminOnly = false }) {
  const { user, initialized } = useAuth();
  const location = useLocation();

  // Enhanced token check
  const getStoredAuth = () => {
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          token: parsed.token,
          user: parsed.user,
        };
      }
    } catch (e) {
      console.error("Parse auth failed:", e);
    }
    return null;
  };

  const storedAuth = getStoredAuth();

  console.log("PrivateRoute state:", {
    path: location.pathname,
    initialized,
    hasUser: !!user,
    hasStoredAuth: !!storedAuth,
    isLoading: !initialized && !!storedAuth,
  });

  // Wait for initialization if we have stored auth
  if (!initialized && storedAuth) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Only redirect if we're sure there's no auth
  if (!user && initialized) {
    console.log("Redirecting to login - No user after init");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = Boolean(
    user?.is_admin ?? user?.isAdmin ?? user?.user?.is_admin ?? user?.user?.isAdmin ?? false
  );

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
