'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = ["LEAD", "FOLLOWUP", "PAYMENT", "ADMITTED", "REJECTED"];
const STATUS_COLORS = {
  LEAD: "#f39c12",
  FOLLOWUP: "#3498db",
  PAYMENT: "#9b59b6",
  ADMITTED: "#27ae60",
  REJECTED: "#e74c3c"
};
const FOLLOWUP_TYPES = ["Call", "Email", "Visit", "Message"];

const NEXT_STATUS = {
  LEAD: ["FOLLOWUP"],
  FOLLOWUP: ["PAYMENT"],
  PAYMENT: ["ADMITTED", "REJECTED"],
  ADMITTED: [],
  REJECTED: []
};

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowUp, setShowFollowUp] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({ type: '', dateTime: '', remarks: '' });
  const [followUps, setFollowUps] = useState({});
  const [showHistory, setShowHistory] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("staffUser");
    if (!storedUser) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser.id) {
      console.error("User object is missing 'id'.");
      router.push("/");
      return;
    }
    setUser(parsedUser);
  }, []);

  useEffect(() => {
    if (user) fetchEnrollments();
  }, [user]);

  const fetchEnrollments = () => {
    setLoading(true);
    fetch("http://localhost:3001/api/enroll?all=1")
      .then(res => res.json())
      .then(data => {
        setEnrollments(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  const fetchFollowUps = (enrollmentId) => {
    fetch(`http://localhost:3001/api/enroll?enrollmentId=${enrollmentId}`)
      .then(res => res.json())
      .then(data => {
        setFollowUps(fu => ({ ...fu, [enrollmentId]: data }));
      });
  };

  const getAllowedStatusOptions = (current) => [current, ...(NEXT_STATUS[current] || [])];

  const handleStatusChange = async (enrollmentId, status) => {
    await fetch("http://localhost:3001/api/enroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, status }),
    });
    fetchEnrollments();
  };

  const handleFollowUpSubmit = async (e, enrollmentId) => {
    e.preventDefault();
    await fetch("http://localhost:3001/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUp: { enrollmentId, ...followUpForm } }),
    });
    setShowFollowUp(null);
    setFollowUpForm({ type: '', dateTime: '', remarks: '' });
    fetchFollowUps(enrollmentId);
  };

  const handleLogout = () => {
    localStorage.removeItem("staffUser");
    router.push("/");
  };

  if (!user) return null;

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <main style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        color: '#2c3e50', 
        minHeight: 'calc(100vh - 4rem)',
        padding: '2rem', 
        borderRadius: '20px', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: '2rem',
          padding: '1.5rem 0',
          borderBottom: '2px solid #ecf0f1'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2.5rem', 
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Staff Dashboard
            </h1>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '1.1rem', 
              color: '#7f8c8d',
              fontWeight: '500'
            }}>
              Welcome, {user.name} ({user.email})
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', 
              color: '#fff', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '50px', 
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
            }}
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '15px', 
          padding: '2rem',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '1.5rem', 
            fontSize: '1.8rem', 
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            All Student Enrollments
          </h2>
          
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#7f8c8d',
              fontSize: '1.1rem'
            }}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid #ecf0f1',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}></div>
              <p>Loading enrollments...</p>
            </div>
          ) : (
            <div style={{ 
              overflowX: "auto",
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                background: "#fff",
                fontSize: '0.95rem'
              }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff'
                  }}>
                    <th style={{ 
                      padding: '1rem 0.75rem', 
                      fontWeight: '600',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}>Student</th>
                    <th style={{ 
                      padding: '1rem 0.75rem', 
                      fontWeight: '600',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}>Email</th>
                    <th style={{ 
                      padding: '1rem 0.75rem', 
                      fontWeight: '600',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}>Course</th>
                    <th style={{ 
                      padding: '1rem 0.75rem', 
                      fontWeight: '600',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}>Status</th>
                    <th style={{ 
                      padding: '1rem 0.75rem', 
                      fontWeight: '600',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}>Change Status</th>
                    <th style={{ 
                      padding: '1rem 0.75rem', 
                      fontWeight: '600',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}>Follow Up</th>
                    <th style={{ 
                      padding: '1rem 0.75rem', 
                      fontWeight: '600',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}>History</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e, index) => (
                    <tr key={e.id} style={{ 
                      background: index % 2 === 0 ? '#f8f9fa' : '#fff',
                      borderBottom: '1px solid #ecf0f1',
                      transition: 'all 0.2s ease'
                    }}>
                      <td style={{ 
                        padding: '1rem 0.75rem', 
                        fontWeight: '500',
                        color: '#2c3e50'
                      }}>
                        {e.student?.name}
                      </td>
                      <td style={{ 
                        padding: '1rem 0.75rem',
                        color: '#7f8c8d'
                      }}>
                        {e.student?.email}
                      </td>
                      <td style={{ 
                        padding: '1rem 0.75rem',
                        fontWeight: '500',
                        color: '#2c3e50'
                      }}>
                        {e.course?.name}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{ 
                          background: STATUS_COLORS[e.status] || "#bbb", 
                          color: "#fff", 
                          padding: "0.5rem 1rem", 
                          borderRadius: '20px', 
                          fontWeight: "600",
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <select
                          value={e.status}
                          onChange={ev => handleStatusChange(e.id, ev.target.value)}
                          style={{ 
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px',
                            border: '2px solid #ecf0f1',
                            background: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#2c3e50',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          disabled={NEXT_STATUS[e.status].length === 0}
                        >
                          {getAllowedStatusOptions(e.status).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {e.status === "FOLLOWUP" && (
                          <>
                            <button 
                              onClick={() => { 
                                setShowFollowUp(e.id); 
                                setShowHistory(null); 
                                fetchFollowUps(e.id); 
                              }} 
                              style={{ 
                                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Add Follow-up
                            </button>
                            {showFollowUp === e.id && (
                              <div style={{ 
                                marginTop: '1rem',
                                padding: '1rem',
                                background: '#f8f9fa',
                                borderRadius: '10px',
                                border: '1px solid #ecf0f1'
                              }}>
                                <form onSubmit={ev => handleFollowUpSubmit(ev, e.id)}>
                                  <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '0.75rem' 
                                  }}>
                                    <select
                                      required
                                      value={followUpForm.type}
                                      onChange={ev => setFollowUpForm(f => ({ ...f, type: ev.target.value }))}
                                      style={{ 
                                        padding: '0.5rem', 
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      <option value="">Select Type</option>
                                      {FOLLOWUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <input
                                      type="datetime-local"
                                      required
                                      value={followUpForm.dateTime}
                                      onChange={ev => setFollowUpForm(f => ({ ...f, dateTime: ev.target.value }))}
                                      style={{ 
                                        padding: '0.5rem', 
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '0.9rem'
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Remarks"
                                      value={followUpForm.remarks}
                                      onChange={ev => setFollowUpForm(f => ({ ...f, remarks: ev.target.value }))}
                                      style={{ 
                                        padding: '0.5rem', 
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '0.9rem'
                                      }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button 
                                        type="submit"
                                        style={{ 
                                          background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                                          color: '#fff',
                                          border: 'none',
                                          padding: '0.5rem 1rem',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => setShowFollowUp(null)}
                                        style={{ 
                                          background: '#95a5a6',
                                          color: '#fff',
                                          border: 'none',
                                          padding: '0.5rem 1rem',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <button 
                          onClick={() => {
                            setShowHistory(showHistory === e.id ? null : e.id);
                            fetchFollowUps(e.id);
                          }}
                          style={{ 
                            background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {showHistory === e.id ? "Hide" : "View"}
                        </button>
                        {showHistory === e.id && (
                          <div style={{ 
                            marginTop: '1rem', 
                            maxHeight: '200px', 
                            overflowY: 'auto',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            padding: '1rem',
                            border: '1px solid #ecf0f1'
                          }}>
                            <div style={{ fontSize: '0.9rem' }}>
                              {(followUps[e.id] || []).length === 0 ? (
                                <p style={{ 
                                  color: '#7f8c8d', 
                                  fontStyle: 'italic',
                                  margin: 0
                                }}>
                                  No follow-ups yet.
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {(followUps[e.id] || []).map(f => (
                                    <div key={f.id} style={{ 
                                      background: '#fff',
                                      padding: '0.75rem',
                                      borderRadius: '6px',
                                      border: '1px solid #ecf0f1'
                                    }}>
                                      <div style={{ 
                                        fontWeight: '600',
                                        color: '#2c3e50',
                                        marginBottom: '0.25rem'
                                      }}>
                                        {f.type}
                                      </div>
                                      <div style={{ 
                                        color: '#7f8c8d',
                                        fontSize: '0.85rem',
                                        marginBottom: '0.25rem'
                                      }}>
                                        {new Date(f.dateTime).toLocaleString()}
                                      </div>
                                      <div style={{ 
                                        color: '#555',
                                        fontSize: '0.9rem'
                                      }}>
                                        {f.remarks}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {enrollments.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ 
                        textAlign: "center", 
                        padding: '3rem', 
                        color: "#7f8c8d",
                        fontSize: '1.1rem',
                        fontStyle: 'italic'
                      }}>
                        No enrollments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        tr:hover {
          background: #f1f3f5 !important;
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        select:focus, input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      `}</style>
    </div>
  );
}