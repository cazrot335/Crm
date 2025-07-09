import React from "react";
export default function StudentDashboard({ user, onLogout }) {
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
      <h1>Student Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={onLogout} style={{ float: "right" }}>Logout</button>
      <div>
        <p>This is the student dashboard. You can view your status and information here.</p>
      </div>
    </main>
  );
}