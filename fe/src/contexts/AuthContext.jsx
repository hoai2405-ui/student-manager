import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";

export const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log("AuthContext: Loading from localStorage...");
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const obj = JSON.parse(raw);
        setUser(obj.user ?? null);
        setToken(obj.token ?? null);
        console.log("AuthContext: Loaded user and token", { user: obj.user, hasToken: !!obj.token });
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

  const value = useMemo(() => ({
    user,
    token,
    initialized,
    isAdmin: !!(user && (user.is_admin || user.isAdmin)),
  }), [user, token, initialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}