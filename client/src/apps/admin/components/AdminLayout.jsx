import React, { useState, useEffect, useRef } from "react";
import { FaBook, FaClipboardCheck, FaFileAlt, FaComments, FaUser, FaHome, FaSignOutAlt, FaChevronDown, FaGraduationCap } from "react-icons/fa";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.JPG";
import API from "../api";
import axios from 'axios';

const AdminLayout = ({ children }) => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const logoutRef = useRef(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  const menuItems = [
    { id: "home", label: "Home", icon: <FaHome />, path: "/" },
    { id: "lesson-plan", label: "Lesson Plan", icon: <FaBook />, path: `/batch/${batchId}/lesson-plan` },
    { id: "evaluation", label: "Evaluation", icon: <FaClipboardCheck />, path: `/batch/${batchId}/evaluation` },
    { id: "report", label: "Report", icon: <FaFileAlt />, path: `/batch/${batchId}/report` },
    { id: "chat", label: "Chat", icon: <FaComments />, path: `/batch/${batchId}/chat` },
  ];

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/admin-batches/${batchId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBatchInfo(res.data);
      } catch (err) {
        console.error("Error fetching batch details:", err);
      }
    };
    if (batchId) fetchBatchDetails();
  }, [batchId]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_LOGIN_API}/auth/logout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderBatchTitle = () => {
    if (!batchInfo) return "Loading...";
    const courseName = batchInfo?.course?.courseName || "Course";
    const batchName = batchInfo?.batchName || "Batch";
    const startDate = new Date(batchInfo?.startDate);
    const monthYear = startDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    return `${courseName} - ${monthYear} - ${batchName}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl flex flex-col border-r border-gray-200/50 dark:border-gray-700/50">
        {/* Logo Section */}
        <div className="p-6 flex flex-col items-center border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <img src={logo} alt="Logo" className="h-10 w-auto rounded-lg" />
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Admin Portal
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {menuItems.map(({ id, label, icon, path }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20"
                }`
              }
            >
              <div className="text-lg">{icon}</div>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
            <FaGraduationCap className="text-blue-500 dark:text-cyan-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Batch ID</p>
              <p className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 truncate">
                {batchId?.slice(-8) || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 lg:px-10 py-4 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
              <FaGraduationCap className="text-white text-lg" />
            </div>
            <div>
              <h2 className="font-semibold text-xl lg:text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {renderBatchTitle()}
              </h2>
              {batchInfo && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {batchInfo.students?.length || 0} Students Enrolled
                </p>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => setShowLogout(prev => !prev)}
              className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl hover:shadow-md transition-all border border-gray-200/50 dark:border-gray-700/50 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-sm">
                <FaUser size={14} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">Admin</span>
              <FaChevronDown className={`text-xs text-gray-500 transition-transform ${showLogout ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showLogout && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">admin@example.com</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <FaSignOutAlt size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;