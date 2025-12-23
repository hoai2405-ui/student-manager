import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";

export const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const normalizeUser = (u) => {
    if (!u) return null;
    const role =
      u.role ||
      (u.is_admin || u.isAdmin ? "admin" : "employee");
    return { ...u, role };
  };

  useEffect(() => {
    console.log("AuthContext: Loading from localStorage...");
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const obj = JSON.parse(raw);
        setUser(normalizeUser(obj.user ?? null));
        setToken(obj.token ?? null);
        console.log("AuthContext: Loaded user and token", {
          user: normalizeUser(obj.user),
          hasToken: !!obj.token,
          isAdmin: !!(obj.user && (obj.user.is_admin || obj.user.isAdmin || obj.user.role === 'admin'))
        });
      } else {
        console.log("AuthContext: No auth data in localStorage");
      }
    } catch (e) {
      console.error("AuthContext: Load failed", e);
      localStorage.removeItem("auth");
    } finally {
      setInitialized(true);
    }
  }, []);

  const login = useCallback((userData, authToken) => {
    console.log("AuthContext: Logging in", { user: userData, hasToken: !!authToken });
    const normalized = normalizeUser(userData);
    setUser(normalized);
    setToken(authToken);
    localStorage.setItem("auth", JSON.stringify({ user: normalized, token: authToken }));
  }, []);

  const logout = useCallback(() => {
    console.log("AuthContext: Logging out");
    const isAdmin = Boolean(
      user?.is_admin ?? user?.isAdmin ?? user?.user?.is_admin ?? user?.user?.isAdmin ?? false
    );
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
    // Return the appropriate login path for client-side navigation
    const loginPath = isAdmin ? "/admin/login" : "/student/login";
    return loginPath;
  }, [user]);

  const value = useMemo(() => ({
    user,
    token,
    initialized,
    isAdmin: !!(user && (user.is_admin || user.isAdmin || user.role === 'admin')),
    login,
    logout,
  }), [user, token, initialized, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
