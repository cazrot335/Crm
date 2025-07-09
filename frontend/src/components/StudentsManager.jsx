import React, { useState, useEffect } from "react";

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch("/api/admin/students").then(res => res.json()).then(setStudents);
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const res = await fetch("/api/admin/students", {
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
      const res = await fetch("/api/admin/students", {
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
    await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setStudents(students.filter(s => s.id !== id));
  };

  return (
    <section>
      <h2>Manage Students</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <input name="password" value={form.password} onChange={handleChange} placeholder="Password" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
        <button type="submit">{editId ? "Update" : "Add"} Student</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", email: "", password: "", phone: "" }); }}>Cancel</button>}
      </form>
      <ul>
        {students.map(s => (
          <li key={s.id}>
            <b>{s.name}</b> ({s.email}) - {s.phone}
            <button onClick={() => handleEdit(s)} style={{ marginLeft: 8 }}>Edit</button>
            <button onClick={() => handleDelete(s.id)} style={{ marginLeft: 4 }}>Delete</button>
            <ul>
              {s.courses && s.courses.map(e => (
                <li key={e.id}>{e.course.name} - Status: {e.status}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}