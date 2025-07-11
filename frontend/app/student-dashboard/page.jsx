'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS = {
  LEAD: "bg-gradient-to-r from-yellow-400 to-orange-500",
  FOLLOWUP: "bg-gradient-to-r from-blue-400 to-blue-600",
  PAYMENT: "bg-gradient-to-r from-purple-500 to-purple-700",
  ADMITTED: "bg-gradient-to-r from-green-400 to-green-600",
  REJECTED: "bg-gradient-to-r from-red-400 to-red-600"
};

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("available");
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user from memory (using state instead of localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("studentUser");
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


  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/admin/courses");
        const data = await res.json();
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        // Mock data for demo
        setCourses([
          { id: 1, name: "React Development", description: "Learn modern React with hooks and context" },
          { id: 2, name: "Node.js Backend", description: "Build scalable backend applications" },
          { id: 3, name: "Database Design", description: "Master SQL and NoSQL database concepts" }
        ]);
      }
    };
    fetchCourses();
  }, []);

  // Fetch my enrollments
  useEffect(() => {
    if (!user?.id) return;
    const fetchEnrollments = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/enroll?studentId=${user.id}`);
        const data = await res.json();
        setEnrolled(data);
      } catch (error) {
        console.error("Failed to fetch enrollments:", error);
        // Mock data for demo
        setEnrolled([
          { id: 1, courseId: 1, course: { name: "React Development" }, status: "ADMITTED" },
          { id: 2, courseId: 2, course: { name: "Node.js Backend" }, status: "PAYMENT" }
        ]);
      }
    };
    fetchEnrollments();
  }, [user?.id]);

  // Enroll in a course
  const enroll = async (courseId) => {
    setLoading(true);
    try {
      await fetch("http://localhost:3001/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, courseId })
      });

      const res = await fetch(`http://localhost:3001/api/enroll?studentId=${user.id}`);
      const data = await res.json();
      setEnrolled(data);
    } catch (error) {
      console.error("Failed to enroll:", error);
      // Mock enrollment for demo
      const newEnrollment = {
        id: enrolled.length + 1,
        courseId,
        course: courses.find(c => c.id === courseId),
        status: "LEAD"
      };
      setEnrolled([...enrolled, newEnrollment]);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (courseId) =>
    enrolled.some(e => e.courseId === courseId);

  const handleLogout = () => {
    setUser(null);
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with gradient background */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">📚</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
                <p className="text-purple-100 text-sm">Manage your learning journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-purple-200 text-sm">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setTab("available")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  tab === "available"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Available Courses</span>
                </span>
              </button>
              <button
                onClick={() => setTab("my")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  tab === "my"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>📖</span>
                  <span>My Courses</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Available Courses Tab */}
          {tab === "available" && (
            <div className="pt-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Courses Open for Enrollment
                </h2>
                <p className="text-gray-600 mt-2">Discover and enroll in courses that match your interests</p>
              </div>
              
              <div className="grid gap-6">
                {courses.map(course => (
                  <div
                    key={course.id}
                    className="bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.name}</h3>
                        <p className="text-gray-600 mb-4">{course.description}</p>
                      </div>
                      <div className="ml-6">
                        {isEnrolled(course.id) ? (
                          <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                            <span>✅</span>
                            <span className="font-medium">Enrolled</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => enroll(course.id)}
                            disabled={loading}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                          >
                            {loading ? "Enrolling..." : "Enroll Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No courses available</h3>
                    <p className="text-gray-600">Check back later for new course offerings</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Courses Tab */}
          {tab === "my" && (
            <div className="pt-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  My Enrollments & Status
                </h2>
                <p className="text-gray-600 mt-2">Track your learning progress and enrollment status</p>
              </div>

              <div className="grid gap-4">
                {enrolled.map(enrollment => (
                  <div
                    key={enrollment.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{enrollment.course.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">Course enrollment</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-4 py-2 rounded-full text-white font-medium text-sm ${STATUS_COLORS[enrollment.status] || "bg-gray-500"}`}>
                          {enrollment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {enrolled.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎓</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No enrollments yet</h3>
                    <p className="text-gray-600 mb-4">Start your learning journey by enrolling in a course</p>
                    <button
                      onClick={() => setTab("available")}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      Browse Courses
                    </button>
                  </div>
                )}
              </div>

              {enrolled.length > 0 && (
                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 text-xl">💡</span>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Status Information</h4>
                      <p className="text-blue-700 text-sm">
                        Your course status is managed by our staff team. Contact support if you have questions about your enrollment status or need assistance with the next steps.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}