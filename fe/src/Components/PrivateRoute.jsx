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
      <Spin tip="Loading..." fullscreen />
    );
  }

  // Only redirect if we're sure there's no auth
  if (!user && initialized) {
    console.log("Redirecting to login - No user after init");
    // Redirect to admin login if accessing admin routes, otherwise student login
    const isAdminRoute = location.pathname.startsWith('/admin');
    const loginPath = isAdminRoute ? '/admin/login' : '/student/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  const hasAdminAccess = Boolean(
    user?.is_admin ||
      user?.isAdmin ||
      user?.role === 'admin' ||
      user?.role === 'department' ||
      user?.role === 'sogtvt' ||
      user?.user?.is_admin ||
      user?.user?.isAdmin ||
      user?.user?.role === 'admin' ||
      user?.user?.role === 'department' ||
      user?.user?.role === 'sogtvt'
  );

  if (adminOnly && !hasAdminAccess) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
