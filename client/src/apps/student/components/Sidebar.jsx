import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaChalkboardTeacher,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaComments,
  FaChartBar,
  FaBars,
  FaTimes,
  FaFileAlt,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import Topbar from "./Topbar";

const Sidebar = ({ children, pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark",
  );

  // Brand color - slightly darker for better readability
  const brandColor = "#00a8d6";
  const brandGradient = "linear-gradient(135deg, #00a8d6, #0284c7)";

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/");

        const res = await axios.get(
          `${import.meta.env.VITE_LOGIN_API}/auth/student/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setStudent(res.data);
        setBatchId(res.data.batch);
      } catch (error) {
        console.error("Failed to load student data:", error);
        toast.error("Failed to load profile");
        navigate("/");
      }
    };

    fetchStudentData();
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${import.meta.env.VITE_LOGIN_API}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      localStorage.removeItem("token");
      toast.success("Logged out");
      window.location.href = import.meta.env.VITE_FRONTEND_URL;
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-black dark:text-white">
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <h1 className="text-lg font-bold bg-gradient-to-r from-[#00a8d6] to-[#0284c7] bg-clip-text text-transparent">
          Student Portal
        </h1>
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="text-gray-700 dark:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FaBars size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-800/50 shadow-xl flex-col transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex`}
      >
        {/* Close button for mobile */}
        {isSidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10 p-2"
          >
            <FaTimes className="text-xl" />
          </button>
        )}

        {/* Profile Section - Enhanced with darker brand gradient */}
        <div className="border-b border-gray-200/50 dark:border-gray-700/50 h-20 flex items-center px-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 px-4 py-3 rounded-xl border border-cyan-200/50 dark:border-cyan-700/50 w-full">
            <div className="relative">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ background: brandGradient }}
              >
                <FaUserCircle className="text-lg" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                {student?.user?.name || "Student"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {student?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <NavLink
            to="/student"
            end
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-white shadow-lg"
                  : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300"
              }`
            }
            style={({ isActive }) => 
              isActive ? { background: brandGradient } : {}
            }
          >
            <FaHome className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">
              Dashboard
            </span>
          </NavLink>

          {batchId && (
            <>
              <NavLink
                to={`/student/batch/${batchId}`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-white shadow-lg"
                      : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { background: brandGradient } : {}
                }
              >
                <FaChalkboardTeacher className="text-lg" />
                <span className="text-sm font-semibold tracking-wide">
                  My Course
                </span>
              </NavLink>

              <NavLink
                to={`/student/chat?type=forum&batch=${batchId}`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-white shadow-lg"
                      : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { background: brandGradient } : {}
                }
              >
                <FaComments className="text-lg" />
                <span className="text-sm font-semibold tracking-wide">
                  Chat
                </span>
              </NavLink>

              <NavLink
                to="/student/reports"
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-white shadow-lg"
                      : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { background: brandGradient } : {}
                }
              >
                <FaChartBar className="text-lg" />
                <span className="text-sm font-semibold tracking-wide">
                  Quiz Reports
                </span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/student/project"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-white shadow-lg"
                  : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300"
              }`
            }
            style={({ isActive }) => 
              isActive ? { background: brandGradient } : {}
            }
          >
            <FaFileAlt className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">Project</span>
          </NavLink>

          <NavLink
            to="/student/theory"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-white shadow-lg"
                  : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300"
              }`
            }
            style={({ isActive }) => 
              isActive ? { background: brandGradient } : {}
            }
          >
            <FaFileAlt className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">Theory</span>
          </NavLink>

          <NavLink
            to="/student/settings"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-white shadow-lg"
                  : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300"
              }`
            }
            style={({ isActive }) => 
              isActive ? { background: brandGradient } : {}
            }
          >
            <FaCog className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">Profile</span>
          </NavLink>
        </nav>

        {/* Footer with Logout and Dark Mode Toggle */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-500 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]"
          >
            <FaSignOutAlt />
            <span className="tracking-wide">Sign Out</span>
          </button>

          {/* Dark Mode Toggle - Enhanced */}
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {darkMode ? "Dark Mode" : "Light Mode"}
            </span>
            <div
              onClick={() => setDarkMode(!darkMode)}
              className="w-12 h-6 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-0.5 cursor-pointer transition-colors duration-300"
            >
              <div
                className={`w-5 h-5 rounded-full shadow-md transform duration-300 flex items-center justify-center ${
                  darkMode ? "translate-x-6 bg-white" : "translate-x-0"
                }`}
                style={!darkMode ? { background: brandColor } : {}}
              >
                {darkMode ? (
                  <svg className="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content with Topbar */}
      <div className="flex-1 flex flex-col h-full bg-transparent md:ml-64">
        {/* Hide default Topbar on mobile since we have a custom one */}
        <div className="hidden md:block">
          <Topbar
            pageTitle={pageTitle}
            userName={student?.user?.name || "Student"}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          />
        </div>
        {/* Mobile padding for content to account for custom topbar */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;