import React, { useState, useEffect } from "react";

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/admin/students").then(res => res.json()).then(setStudents);
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const res = await fetch("http://localhost:3001/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...form }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudents(students.map(s => s.id === editId ? updated : s));
        setEditId(null);
        setForm({ name: "", email: "", password: "", phone: "" });
      }
    } else {
      const res = await fetch("http://localhost:3001/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStudents([...students, await res.json()]);
        setForm({ name: "", email: "", password: "", phone: "" });
      }
    }
  };

  const handleEdit = (student) => {
    setEditId(student.id);
    setForm({ name: student.name, email: student.email, password: student.password, phone: student.phone || "" });
  };

  const handleDelete = async (id) => {
    await fetch("http://localhost:3001/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setStudents(students.filter(s => s.id !== id));
  };

  return (
    <section>
      <h2 style={{ marginBottom: 16 }}>Manage Students</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required style={{ flex: "1 1 120px", padding: 8 }} />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required style={{ flex: "1 1 180px", padding: 8 }} />
        <input name="password" value={form.password} onChange={handleChange} placeholder="Password" required style={{ flex: "1 1 120px", padding: 8 }} />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" style={{ flex: "1 1 120px", padding: 8 }} />
        <button type="submit" style={{ padding: "8px 16px" }}>{editId ? "Update" : "Add"} Student</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", email: "", password: "", phone: "" }); }} style={{ padding: "8px 16px" }}>Cancel</button>}
      </form>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafbfc" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Phone</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Courses</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td style={{ padding: 8, border: "1px solid #eee" }}>{s.name}</td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>{s.email}</td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>{s.phone}</td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {s.courses && s.courses.map(e => (
                      <li key={e.id}>{e.course.name} - Status: {e.status}</li>
                    ))}
                  </ul>
                </td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  <button onClick={() => handleEdit(s)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(s.id)} style={{ color: "#e74c3c" }}>Delete</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 16, color: "#888" }}>No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}