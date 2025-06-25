import React, { useState, useContext, createContext } from "react";

const AuthContext = createContext();



export function AuthProvider({ children }) {
  // Không dùng JSON.parse(localStorage.getItem("user")) nếu localStorage chưa set sẽ lỗi
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const login = (userObj) => {
    setUser(userObj);
    localStorage.setItem("user", JSON.stringify(userObj));
    console.log("LOGIN - set User:", userObj)
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    window.location.href="/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}