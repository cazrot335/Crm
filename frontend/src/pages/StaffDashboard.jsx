import React, { useEffect, useState } from "react";

const STATUS_OPTIONS = ["LEAD", "FOLLOWUP", "PAYMENT", "ADMITTED", "REJECTED"];
const STATUS_COLORS = {
  LEAD: "#f1c40f",
  FOLLOWUP: "#3498db",
  PAYMENT: "#8e44ad",
  ADMITTED: "#27ae60",
  REJECTED: "#e74c3c"
};
const FOLLOWUP_TYPES = ["Call", "Email", "Visit", "Message"];

// Define the allowed next status for each stage
const NEXT_STATUS = {
  LEAD: ["FOLLOWUP"],
  FOLLOWUP: ["PAYMENT"],
  PAYMENT: ["ADMITTED", "REJECTED"],
  ADMITTED: [],
  REJECTED: []
};

export default function StaffDashboard({ user, onLogout }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowUp, setShowFollowUp] = useState(null); // enrollmentId
  const [followUpForm, setFollowUpForm] = useState({ type: "", dateTime: "", remarks: "" });
  const [followUps, setFollowUps] = useState({});
  const [showHistory, setShowHistory] = useState(null); // enrollmentId

  // Fetch all enrollments with student and course info
  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = () => {
    setLoading(true);
    fetch("http://localhost:3001/api/enroll?all=1")
      .then(res => res.json())
      .then(data => {
        setEnrollments(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  // Fetch follow-ups for an enrollment
  const fetchFollowUps = (enrollmentId) => {
    fetch(`http://localhost:3001/api/enroll?enrollmentId=${enrollmentId}`)
      .then(res => res.json())
      .then(data => {
        setFollowUps(fu => ({ ...fu, [enrollmentId]: data }));
      });
  };

  // Helper to get allowed status options
  const getAllowedStatusOptions = (current) => {
    return [current, ...(NEXT_STATUS[current] || [])];
  };

  // Handle status change
  const handleStatusChange = async (enrollmentId, status) => {
    await fetch("http://localhost:3001/api/enroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, status }),
    });
    fetchEnrollments();
  };

  // Handle follow-up form submit
  const handleFollowUpSubmit = async (e, enrollmentId) => {
    e.preventDefault();
    await fetch("http://localhost:3001/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followUp: {
          enrollmentId,
          ...followUpForm,
        }
      }),
    });
    setShowFollowUp(null);
    setFollowUpForm({ type: "", dateTime: "", remarks: "" });
    fetchFollowUps(enrollmentId);
  };

  return (
    <main style={{
      background: "#fff",
      color: "#222",
      minHeight: "100vh",
      padding: "2rem",
      borderRadius: 8,
      maxWidth: 1100,
      margin: "2rem auto",
      border: "1px solid #eee"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Staff Dashboard</h1>
        <button onClick={onLogout} style={{ background: "#e74c3c", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: 4, cursor: "pointer" }}>Logout</button>
      </div>
      <p>Welcome, {user?.name} ({user?.email})</p>
      <h2 style={{ marginTop: 32 }}>All Student Enrollments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafbfc" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Student</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Email</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Course</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Change Status</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Follow Up</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>History</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => (
                <tr key={e.id}>
                  <td style={{ padding: 8, border: "1px solid #eee" }}>{e.student?.name}</td>
                  <td style={{ padding: 8, border: "1px solid #eee" }}>{e.student?.email}</td>
                  <td style={{ padding: 8, border: "1px solid #eee" }}>{e.course?.name}</td>
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
                  <td style={{ padding: 8, border: "1px solid #eee" }}>
                    <select
                      value={e.status}
                      onChange={ev => handleStatusChange(e.id, ev.target.value)}
                      style={{ padding: 6, borderRadius: 6 }}
                      disabled={NEXT_STATUS[e.status].length === 0}
                    >
                      {getAllowedStatusOptions(e.status).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 8, border: "1px solid #eee" }}>
                    {e.status === "FOLLOWUP" && (
                      <>
                        <button onClick={() => { setShowFollowUp(e.id); setShowHistory(null); fetchFollowUps(e.id); }} style={{ marginBottom: 4 }}>Add</button>
                        {showFollowUp === e.id && (
                          <form onSubmit={ev => handleFollowUpSubmit(ev, e.id)} style={{ marginTop: 8 }}>
                            <select
                              required
                              value={followUpForm.type}
                              onChange={ev => setFollowUpForm(f => ({ ...f, type: ev.target.value }))}
                              style={{ marginRight: 8 }}
                            >
                              <option value="">Type</option>
                              {FOLLOWUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input
                              type="datetime-local"
                              required
                              value={followUpForm.dateTime}
                              onChange={ev => setFollowUpForm(f => ({ ...f, dateTime: ev.target.value }))}
                              style={{ marginRight: 8 }}
                            />
                            <input
                              type="text"
                              placeholder="Remarks"
                              value={followUpForm.remarks}
                              onChange={ev => setFollowUpForm(f => ({ ...f, remarks: ev.target.value }))}
                              style={{ marginRight: 8 }}
                            />
                            <button type="submit">Save</button>
                            <button type="button" onClick={() => setShowFollowUp(null)} style={{ marginLeft: 8 }}>Cancel</button>
                          </form>
                        )}
                      </>
                    )}
                  </td>
                  <td style={{ padding: 8, border: "1px solid #eee" }}>
                    <button onClick={() => {
                      setShowHistory(showHistory === e.id ? null : e.id);
                      fetchFollowUps(e.id);
                    }}>
                      {showHistory === e.id ? "Hide" : "View"}
                    </button>
                    {showHistory === e.id && (
                      <div style={{ marginTop: 8, maxHeight: 120, overflowY: "auto" }}>
                        <ul style={{ paddingLeft: 16 }}>
                          {(followUps[e.id] || []).length === 0 && <li style={{ color: "#888" }}>No follow-ups yet.</li>}
                          {(followUps[e.id] || []).map(f => (
                            <li key={f.id}>
                              <b>{f.type}</b> on {new Date(f.dateTime).toLocaleString()}<br />
                              <span style={{ color: "#555" }}>{f.remarks}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 16, color: "#888" }}>No enrollments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}