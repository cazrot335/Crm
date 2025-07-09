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
      <h2>Manage Courses</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Course Name" required />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" />
        <button type="submit">{editId ? "Update" : "Add"} Course</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", description: "" }); }}>Cancel</button>}
      </form>
      <ul>
        {courses.map(c => (
          <li key={c.id}>
            <b>{c.name}</b> - {c.description}
            <button onClick={() => handleEdit(c)} style={{ marginLeft: 8 }}>Edit</button>
            <button onClick={() => handleDelete(c.id)} style={{ marginLeft: 4 }}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}