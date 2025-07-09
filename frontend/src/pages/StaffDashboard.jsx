import React from "react";
export default function StaffDashboard({ user, onLogout }) {
  return (
    <main style={{
      background: "#fff",
      color: "#222",
      minHeight: "100vh",
      padding: "2rem",
      borderRadius: 8,
      maxWidth: 600,
      margin: "2rem auto",
      border: "1px solid #eee"
    }}>
      <h1>Staff Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={onLogout} style={{ float: "right" }}>Logout</button>
      <div>
        <p>This is the staff dashboard. You can manage leads, admissions, and more here.</p>
      </div>
    </main>
  );
}