import React, { useState, useEffect } from "react";

export default function CoursesManager() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/admin/courses").then(res => res.json()).then(setCourses);
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const res = await fetch("http://localhost:3001/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...form }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCourses(courses.map(c => c.id === editId ? updated : c));
        setEditId(null);
        setForm({ name: "", description: "" });
      }
    } else {
      const res = await fetch("http://localhost:3001/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setCourses([...courses, await res.json()]);
        setForm({ name: "", description: "" });
      }
    }
  };

  const handleEdit = (course) => {
    setEditId(course.id);
    setForm({ name: course.name, description: course.description || "" });
  };

  const handleDelete = async (id) => {
    await fetch("http://localhost:3001/api/admin/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <section>
      <h2 style={{ marginBottom: 16 }}>Manage Courses</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Course Name" required style={{ flex: "1 1 180px", padding: 8 }} />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" style={{ flex: "1 1 240px", padding: 8 }} />
        <button type="submit" style={{ padding: "8px 16px" }}>{editId ? "Update" : "Add"} Course</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", description: "" }); }} style={{ padding: "8px 16px" }}>Cancel</button>}
      </form>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafbfc" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Description</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td style={{ padding: 8, border: "1px solid #eee" }}>{c.name}</td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>{c.description}</td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  <button onClick={() => handleEdit(c)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(c.id)} style={{ color: "#e74c3c" }}>Delete</button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 16, color: "#888" }}>No courses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}