import React, { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import StaffDashboard from "./pages/StaffDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("crmUser");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("crmUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("crmUser");
    }
  }, [user]);

  const handleLogout = () => setUser(null);

  // Admin login flow
  if (showAdminLogin && !user) return <AdminLogin onLogin={setUser} />;
  if (user?.role?.toLowerCase() === "admin") return <AdminDashboard user={user} onLogout={handleLogout} />;

  // Normal login flow
  if (!user) return (
    <div>
      <button
        style={{ position: "absolute", top: 10, right: 10 }}
        onClick={() => setShowAdminLogin(true)}
      >
        Admin Login
      </button>
      <AuthPage onLogin={setUser} />
    </div>
  );
  if (user.role?.toLowerCase() === "staff") return <StaffDashboard user={user} onLogout={handleLogout} />;
  if (user.role?.toLowerCase() === "student") return <StudentDashboard user={user} onLogout={handleLogout} />;
  return null;
}

export default App;
