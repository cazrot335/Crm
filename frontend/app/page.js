'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const STAFF_EMAIL = 'staff@crm.com';
const STAFF_PASSWORD = 'staff123';

export default function AuthPage() {
  const router = useRouter();

  const [role, setRole] = useState('student');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookie-based sessions
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      const user = await res.json();
      if (user.role.toLowerCase() !== role) {
        setError('Invalid credentials for selected role');
        return;
      }

      if (user.role.toLowerCase() === 'student') {
        // Save student info locally
        localStorage.setItem('studentUser', JSON.stringify({
  id: user.id, 
  name: user.name,
  email: user.email
}));

        
        router.push('/student-dashboard');
      } else if (user.role.toLowerCase() === 'staff') {
        // Save staff info locally
        localStorage.setItem('staffUser', JSON.stringify({
           id: user.id,
          name: user.name,
          email: user.email
        }));

        router.push('/staff-dashboard');
      } else if (user.role.toLowerCase() === 'admin') {
        router.push('/admin-dashboard');
      }

    } catch {
      setError('Network error');
    }
  };

  // Handle student registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !phone || !email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password }),
      });

      if (res.status === 409) {
        setError('Student already registered');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Registration failed');
        return;
      }

      setRegistered(true);
      setError('');
    } catch {
      setError('Network error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        padding: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Welcome Back
          </h2>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: '#6b7280',
            fontSize: '0.95rem'
          }}>
            Please sign in to your account
          </p>
        </div>

        {/* Role Selection */}
        <div style={{
          display: 'flex',
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <label style={{
            flex: 1,
            textAlign: 'center',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: role === 'staff' ? '#667eea' : 'transparent',
            color: role === 'staff' ? 'white' : '#64748b',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            <input
              type="radio"
              checked={role === 'staff'}
              onChange={() => setRole('staff')}
              style={{ display: 'none' }}
            />
            Staff
          </label>
          <label style={{
            flex: 1,
            textAlign: 'center',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: role === 'student' ? '#667eea' : 'transparent',
            color: role === 'student' ? 'white' : '#64748b',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            <input
              type="radio"
              checked={role === 'student'}
              onChange={() => setRole('student')}
              style={{ display: 'none' }}
            />
            Student
          </label>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                background: 'white',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                background: 'white',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Sign In
          </button>
        </form>

        {/* Student Registration Form */}
        {role === 'student' && (
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <h4 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#374151',
              textAlign: 'center'
            }}>
              New Student Registration
            </h4>
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="password"
                  placeholder="Create Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Create Account
              </button>
            </form>
            
            {registered && (
              <div style={{
                marginTop: '1rem',
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                border: '1px solid #86efac',
                borderRadius: '12px',
                color: '#166534',
                fontSize: '0.9rem',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                ✓ Registration successful! Please sign in above.
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.875rem',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
            border: '1px solid #f87171',
            borderRadius: '12px',
            color: '#dc2626',
            fontSize: '0.9rem',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

      </div>
    </div>
  );}