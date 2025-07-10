import React, { useState, useEffect } from "react";

const STATUS_COLORS = {
  LEAD: "#f1c40f",
  FOLLOWUP: "#3498db",
  PAYMENT: "#8e44ad",
  ADMITTED: "#27ae60",
  REJECTED: "#e74c3c"
};

export default function StudentDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("available");
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);

  // Fetch all courses
  useEffect(() => {
    fetch("http://localhost:3001/api/admin/courses")
      .then(res => res.json())
      .then(setCourses);
  }, []);

  // Fetch my enrollments
  useEffect(() => {
    fetch(`http://localhost:3001/api/enroll?studentId=${user.id}`)
      .then(res => res.json())
      .then(setEnrolled);
  }, [user.id]);

  // Enroll in a course
  const enroll = async (courseId) => {
    await fetch("http://localhost:3001/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: user.id, courseId }),
    });
    // Refresh enrollments
    fetch(`http://localhost:3001/api/enroll?studentId=${user.id}`)
      .then(res => res.json())
      .then(setEnrolled);
  };

  // Helper: check if already enrolled
  const isEnrolled = (courseId) =>
    enrolled.some(e => e.courseId === courseId);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", background: "#222", color: "#fff" }}>
        <h2>Student Dashboard</h2>
        <div>
          <span style={{ marginRight: 16 }}>{user.name} ({user.email})</span>
          <button onClick={onLogout} style={{ background: "#e74c3c", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: 4, cursor: "pointer" }}>Logout</button>
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: "2rem auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", padding: "2rem" }}>
        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          <button
            onClick={() => setTab("available")}
            style={{
              padding: "0.75rem 2rem",
              border: "none",
              borderBottom: tab === "available" ? "3px solid #3498db" : "3px solid transparent",
              background: "none",
              fontWeight: tab === "available" ? "bold" : "normal",
              fontSize: 18,
              cursor: "pointer"
            }}
          >
            Available Courses
          </button>
          <button
            onClick={() => setTab("my")}
            style={{
              padding: "0.75rem 2rem",
              border: "none",
              borderBottom: tab === "my" ? "3px solid #3498db" : "3px solid transparent",
              background: "none",
              fontWeight: tab === "my" ? "bold" : "normal",
              fontSize: 18,
              cursor: "pointer"
            }}
          >
            My Courses
          </button>
        </div>

        {/* Available Courses Tab */}
        {tab === "available" && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Courses Open for Enrollment</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafbfc" }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Name</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Description</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: 8, border: "1px solid #eee" }}>{c.name}</td>
                    <td style={{ padding: 8, border: "1px solid #eee" }}>{c.description}</td>
                    <td style={{ padding: 8, border: "1px solid #eee" }}>
                      {isEnrolled(c.id) ? (
                        <span style={{ color: "#27ae60", fontWeight: "bold" }}>Enrolled</span>
                      ) : (
                        <button onClick={() => enroll(c.id)} style={{ padding: "6px 16px" }}>Enroll</button>
                      )}
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 16, color: "#888" }}>No courses available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* My Courses Tab */}
        {tab === "my" && (
          <div>
            <h3 style={{ marginBottom: 16 }}>My Enrollments & Status</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafbfc" }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Course</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {enrolled.map(e => (
                  <tr key={e.id}>
                    <td style={{ padding: 8, border: "1px solid #eee" }}>{e.course.name}</td>
                    <td style={{ padding: 8, border: "1px solid #eee" }}>
                      <span style={{
                        background: STATUS_COLORS[e.status] || "#bbb",
                        color: "#fff",
                        padding: "4px 12px",
                        borderRadius: 12,
                        fontWeight: "bold"
                      }}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {enrolled.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: "center", padding: 16, color: "#888" }}>No enrollments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <p style={{ marginTop: 24, color: "#888" }}>
              <b>Note:</b> Your course status (LEAD, FOLLOWUP, PAYMENT, etc.) is managed by staff. Contact staff for updates.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}