import React, { useState } from "react";
import CoursesManager from "../components/CoursesManager";
import StudentsManager from "../components/StudentsManager";
import StaffManager from "../components/StaffManager";

export default function AdminDashboard({ user, onLogout }) {
  const [section, setSection] = useState("courses");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fa" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: "#222",
        color: "#fff",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "100vh"
      }}>
        <h2 style={{ color: "#fff", fontSize: 22, marginBottom: 32, letterSpacing: 1 }}>Admin Panel</h2>
        <button
          style={{
            background: section === "courses" ? "#444" : "transparent",
            color: "#fff",
            border: "none",
            padding: "1rem",
            textAlign: "left",
            cursor: "pointer",
            borderRadius: 6,
            fontWeight: section === "courses" ? "bold" : "normal"
          }}
          onClick={() => setSection("courses")}
        >
          Courses
        </button>
        <button
          style={{
            background: section === "students" ? "#444" : "transparent",
            color: "#fff",
            border: "none",
            padding: "1rem",
            textAlign: "left",
            cursor: "pointer",
            borderRadius: 6,
            fontWeight: section === "students" ? "bold" : "normal"
          }}
          onClick={() => setSection("students")}
        >
          Students
        </button>
        <button
          style={{
            background: section === "staff" ? "#444" : "transparent",
            color: "#fff",
            border: "none",
            padding: "1rem",
            textAlign: "left",
            cursor: "pointer",
            borderRadius: 6,
            fontWeight: section === "staff" ? "bold" : "normal"
          }}
          onClick={() => setSection("staff")}
        >
          Staff
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={onLogout} style={{
          background: "#e74c3c",
          color: "#fff",
          border: "none",
          padding: "1rem",
          borderRadius: 6,
          cursor: "pointer",
          marginTop: "auto"
        }}>Logout</button>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "2rem 3vw",
        background: "#fff",
        minHeight: "100vh"
      }}>
        <h1 style={{ marginBottom: 24, fontSize: 28, color: "#222" }}>Admin Dashboard</h1>
        {section === "courses" && <CoursesManager />}
        {section === "students" && <StudentsManager />}
        {section === "staff" && <StaffManager />}
      </main>
    </div>
  );
}