import React, { useState } from "react";

const STAFF_EMAIL = "staff@crm.com";
const STAFF_PASSWORD = "staff123";

export default function AuthPage({ onLogin }) {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }
      const user = await res.json();
      // Only allow login if role matches selected role
      if (user.role.toLowerCase() !== role) {
        setError("Invalid credentials for selected role");
        return;
      }
      onLogin(user);
    } catch {
      setError("Network error");
    }
  };

  // Handle student registration via backend
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !phone || !email || !password) {
      setError("All fields are required");
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      });
      if (res.status === 409) {
        setError("Student already registered");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        return;
      }
      setRegistered(true);
      setError("");
    } catch {
      setError("Network error");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Login</h2>
      <div>
        <label>
          <input
            type="radio"
            checked={role === "staff"}
            onChange={() => setRole("staff")}
          />{" "}
          Staff
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="radio"
            checked={role === "student"}
            onChange={() => setRole("student")}
          />{" "}
          Student
        </label>
      </div>
      <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
        {role === "student" && (
          <></>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button type="submit" style={{ width: "100%" }}>Login</button>
      </form>
      {role === "student" && (
        <form onSubmit={handleRegister} style={{ marginTop: 16 }}>
          <h4>Student Registration</h4>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button type="submit" style={{ width: "100%" }}>Register</button>
          {registered && <div style={{ color: "green", marginTop: 8 }}>Registered! Now login.</div>}
        </form>
      )}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {role === "staff" && (
        <div style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          <b>Demo Staff Credentials:</b><br />
          Email: <code>{STAFF_EMAIL}</code><br />
          Password: <code>{STAFF_PASSWORD}</code>
        </div>
      )}
    </div>
  );
}