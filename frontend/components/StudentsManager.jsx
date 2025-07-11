"use client";

import React, { useState, useEffect } from "react";

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/admin/students");
      if (!response.ok) throw new Error("Failed to load students");
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError("Error loading students: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", phone: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (editId) {
        const response = await fetch("http://localhost:3001/api/admin/students", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...form }),
        });
        if (!response.ok) throw new Error("Failed to update student");
        
        const updated = await response.json();
        setStudents(students.map(s => s.id === editId ? updated : s));
        resetForm();
      } else {
        const response = await fetch("http://localhost:3001/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error("Failed to add student");
        
        const newStudent = await response.json();
        setStudents([...students, newStudent]);
        resetForm();
      }
    } catch (err) {
      setError("Error saving student: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditId(student.id);
    setForm({ 
      name: student.name, 
      email: student.email, 
      password: student.password || "", 
      phone: student.phone || "" 
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:3001/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete student");
      
      setStudents(students.filter(s => s.id !== id));
    } catch (err) {
      setError("Error deleting student: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      color: '#1e293b',
      marginBottom: '32px',
      textAlign: 'center',
      fontSize: '32px',
      fontWeight: '700',
      letterSpacing: '-0.025em'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    },
    formCard: {
      marginBottom: '32px'
    },
    formHeader: {
      padding: '24px 24px 0 24px',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '24px'
    },
    formTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px'
    },
    formSubtitle: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '16px'
    },
    form: {
      padding: '0 24px 24px 24px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      backgroundColor: 'white'
    },
    inputFocus: {
      borderColor: '#3b82f6',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    studentsList: {
      padding: '24px'
    },
    studentsTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    studentGrid: {
      display: 'grid',
      gap: '16px'
    },
    studentCard: {
      padding: '20px',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s ease'
    },
    studentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '12px'
    },
    studentInfo: {
      flex: '1',
      minWidth: '250px'
    },
    studentName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '4px'
    },
    studentDetails: {
      color: '#64748b',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    studentActions: {
      display: 'flex',
      gap: '8px',
      flexShrink: 0
    },
    actionButton: {
      padding: '8px 16px',
      fontSize: '12px',
      fontWeight: '500'
    },
    courseSection: {
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid #e2e8f0'
    },
    courseTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    courseList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    courseBadge: {
      padding: '4px 10px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      border: '1px solid #bfdbfe'
    },
    error: {
      color: '#ef4444',
      backgroundColor: '#fef2f2',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #fecaca',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    loading: {
      textAlign: 'center',
      padding: '40px 20px',
      fontSize: '16px',
      color: '#64748b'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Student Management System</h2>
      
      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          {error}
        </div>
      )}
      
      <div style={{...styles.card, ...styles.formCard}}>
        <div style={styles.formHeader}>
          <h3 style={styles.formTitle}>
            {editId ? "Edit Student" : "Add New Student"}
          </h3>
          <p style={styles.formSubtitle}>
            {editId ? "Update the student information below" : "Fill in the details to add a new student"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter student's full name"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={styles.buttonGroup}>
            <button 
              type="submit" 
              style={{
                ...styles.button, 
                ...(editId ? styles.successButton : styles.primaryButton)
              }}
              disabled={loading}
            >
              {loading ? "Processing..." : editId ? "Update Student" : "Add Student"}
            </button>
            {editId && (
              <button 
                type="button" 
                onClick={resetForm}
                style={{...styles.button, ...styles.secondaryButton}}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.studentsList}>
          <h3 style={styles.studentsTitle}>
            👥 Students ({students.length})
          </h3>
          
          {loading && !error && <div style={styles.loading}>Loading students...</div>}
          
          {students.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎓</div>
              <p>No students found. Add your first student above!</p>
            </div>
          ) : (
            <div style={styles.studentGrid}>
              {students.map(student => (
                <div key={student.id} style={styles.studentCard}>
                  <div style={styles.studentHeader}>
                    <div style={styles.studentInfo}>
                      <div style={styles.studentName}>{student.name}</div>
                      <div style={styles.studentDetails}>
                        {student.email}
                        {student.phone && <><br />📱 {student.phone}</>}
                      </div>
                    </div>
                    <div style={styles.studentActions}>
                      <button 
                        onClick={() => handleEdit(student)}
                        style={{
                          ...styles.button, 
                          ...styles.primaryButton,
                          ...styles.actionButton
                        }}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        style={{
                          ...styles.button, 
                          ...styles.dangerButton,
                          ...styles.actionButton
                        }}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {student.courses && student.courses.length > 0 && (
                    <div style={styles.courseSection}>
                      <div style={styles.courseTitle}>
                        Enrolled Courses
                      </div>
                      <div style={styles.courseList}>
                        {student.courses.map(enrollment => (
                          <span key={enrollment.id} style={styles.courseBadge}>
                            {enrollment.course.name} - {enrollment.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}