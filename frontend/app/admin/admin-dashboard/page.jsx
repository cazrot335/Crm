"use client"; // this is important because useState is client-side

import { useState } from "react";
import CoursesManager from "@/components/CoursesManager";
import StudentsManager from "@/components/StudentsManager";
import StaffManager from "@/components/StaffManager";

export default function AdminDashboard() {
  const [section, setSection] = useState("courses");

  const handleLogout = () => {
    // TODO: Add real logout logic (e.g., auth sign-out, redirect)
    alert("Logged out!");
  };

  const menuItems = [
    { id: "courses", label: "Courses" },
    { id: "students", label: "Students" },
    { id: "staff", label: "Staff" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl font-bold">A</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Panel</h2>
              <p className="text-purple-200 text-sm">Management Dashboard</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-left hover:bg-purple-700 ${
                  section === item.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg transform scale-105"
                    : "hover:translate-x-1"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {section === item.id && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6">
          <div className="border-t border-purple-700 pt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage your {section} efficiently
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome back</p>
                <p className="font-semibold text-gray-800">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[calc(100vh-200px)]">
            <div className="p-6">
              {/* Section Header */}
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">
                    {menuItems.find(item => item.id === section)?.icon}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 capitalize">
                  {section} Management
                </h2>
              </div>

              {/* Dynamic Content */}
              <div className="space-y-6">
                {section === "courses" && <CoursesManager />}
                {section === "students" && <StudentsManager />}
                {section === "staff" && <StaffManager />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}