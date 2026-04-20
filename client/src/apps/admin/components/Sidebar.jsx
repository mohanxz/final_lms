import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaChalkboardTeacher,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaComments,
  FaChevronDown,
  FaBook,
  FaClipboardCheck,
  FaFileAlt,
  FaCode,
  FaBars,
} from "react-icons/fa";
import axios from "axios";
import API from "../api";
import { toast } from "react-toastify";
import Topbar from "./Topbar";

const Sidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState({ name: "", email: "" });
  const [showBatchSubmenu, setShowBatchSubmenu] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Brand color
  const brandColor = "#08CAFC";

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
    const token = localStorage.getItem("token");
    API
      .get("/api/dashboard/lecturer", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
      .then((res) => {
        const { name, email } = res.data.stats;
        setProfile({ name, email });
        navigate("/admin/");
      })
      .catch(() => {
        setProfile({ name: "Lecturer", email: "user@example.com" });
      });
  }, []);

  useEffect(() => {
    const match = location.pathname.match(/^\/admin\/batch\/([^/]+)/);
    if (match) {
      setSelectedBatchId(match[1]);
      setShowBatchSubmenu(true);
    } else if (location.pathname === "/admin/batches") {
      setShowBatchSubmenu(true);
      setSelectedBatchId(null);
    } else {
      setSelectedBatchId(null);
      if (!manuallyToggled) {
        setShowBatchSubmenu(false);
      }
    }
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "auto";
  }, [isMobileSidebarOpen]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${import.meta.env.VITE_LOGIN_API}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem("token");
      toast.success("Logged out");
      window.location.href = `${import.meta.env.VITE_FRONTEND_URL}`;
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin/" || path === "/admin") return "Dashboard";
    if (path === "/admin/batches") return "My Batches";
    if (path === "/admin/students") return "My Students";
    if (path === "/admin/settings") return "Profile";
    if (path === "/admin/superadmin-chat") return "SuperAdmin Chat";
    if (path.includes("/lesson-plan")) return "Lesson Plan";
    if (path.includes("/quiz")) return "Quiz";
    if (path.includes("/report")) return "Report";
    if (path.includes("/batch-evaluation")) return "Batch Evaluation";
    if (path.includes("/chat")) return "Batch Chat";
    if (path.includes("/code")) return "Coding";
    return "Admin Dashboard";
  };

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="text-black dark:text-white"
        >
          <FaBars size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Container */}
      <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white">
        {/* Sidebar */}
        <div
          className={`flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300
          ${isMobileSidebarOpen ? "w-64" : "w-0"} md:w-64
          fixed md:relative h-full z-50 top-0 left-0 overflow-hidden`}
        >
          {/* Profile Section - Enhanced with brand gradient */}
          <div className="border-b border-gray-200 dark:border-gray-700 h-20 flex items-center px-4">
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#08CAFC]/10 to-blue-50 dark:from-[#08CAFC]/5 dark:to-gray-800 px-4 py-3 rounded-xl border border-[#08CAFC]/20 dark:border-[#08CAFC]/10 w-full">
              <div className="relative">
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, #0284c7)` }}
                >
                  <FaUserCircle className="text-lg" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
              </div>
              <div className="flex-1 flex-col md:flex">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{profile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            <NavLink 
              to="/admin/" 
              end 
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-white shadow-lg" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              style={({ isActive }) => isActive ? { background: `linear-gradient(135deg, ${brandColor}, #0284c7)` } : {}}
            >
              <FaHome className="text-lg" />
              <span className="inline md:inline">Dashboard</span>
            </NavLink>

            <div>
              <div
                onClick={() => {
                  setManuallyToggled(true);
                  if (!showBatchSubmenu) setShowBatchSubmenu(true);
                  if (location.pathname !== "/admin/batches") {
                    navigate("/admin/batches");
                  }
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  location.pathname === "/admin/batches" || location.pathname.startsWith("/admin/batch/")
                    ? "text-white shadow-lg"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
                style={location.pathname === "/admin/batches" || location.pathname.startsWith("/admin/batch/") 
                  ? { background: `linear-gradient(135deg, ${brandColor}, #0284c7)` } 
                  : {}}
              >
                <FaChalkboardTeacher className="text-lg" />
                <span className="inline md:inline">My Batches</span>
                <FaChevronDown className={`ml-auto hidden md:block transition-transform duration-200 ${showBatchSubmenu ? "rotate-180" : ""}`} />
              </div>

              {showBatchSubmenu && selectedBatchId && (
                <div className="ml-8 mt-2 space-y-1">
                  {["lesson-plan", "report", "quiz", "code", "batch-evaluation", "chat"].map((item) => (
                    <NavLink
                      key={item}
                      to={`/admin/batch/${selectedBatchId}/${item}`}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "text-white shadow-md"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`
                      }
                      style={({ isActive }) => isActive ? { background: `linear-gradient(135deg, ${brandColor}, #0284c7)` } : {}}
                    >
                      {item === "lesson-plan" && <FaBook className="text-sm" />}
                      {item === "report" && <FaFileAlt className="text-sm" />}
                      {item === "quiz" && <FaClipboardCheck className="text-sm" />}
                      {item === "code" && <FaCode className="text-sm" />}
                      {item === "batch-evaluation" && <FaClipboardCheck className="text-sm" />}
                      {item === "chat" && <FaComments className="text-sm" />}
                      <span className="inline md:inline">{item.replace("-", " ")}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <NavLink 
              to="/admin/students" 
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-white shadow-lg" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              style={({ isActive }) => isActive ? { background: `linear-gradient(135deg, ${brandColor}, #0284c7)` } : {}}
            >
              <FaUsers className="text-lg" />
              <span className="inline md:inline">My Students</span>
            </NavLink>

            <NavLink 
              to="/admin/settings" 
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-white shadow-lg" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              style={({ isActive }) => isActive ? { background: `linear-gradient(135deg, ${brandColor}, #0284c7)` } : {}}
            >
              <FaCog className="text-lg" />
              <span className="inline md:inline">Profile</span>
            </NavLink>

            <NavLink 
              to="/admin/superadmin-chat" 
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-white shadow-lg" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              style={({ isActive }) => isActive ? { background: `linear-gradient(135deg, ${brandColor}, #0284c7)` } : {}}
            >
              <FaComments className="text-lg" />
              <span className="inline md:inline">Super Admin Chat</span>
            </NavLink>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
  onClick={handleLogout}
  className="w-full flex items-center justify-center gap-3 px-4 py-3 text-base font-semibold 
  text-red-600 dark:text-red-500 
  hover:!text-white hover:bg-red-600 
  border-2 border-red-600 rounded-xl 
  transition-all duration-300 hover:shadow-lg transform hover:scale-105"
>
              <FaSignOutAlt />
              <span className="inline md:inline">Sign Out</span>
            </button>

            {/* Dark Mode Toggle - Enhanced with brand color */}
            <div className="mt-4 flex justify-center">
              <div
                onClick={() => setDarkMode(!darkMode)}
                className="w-14 h-7 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-full shadow-md transform duration-300 ${
                    darkMode ? "translate-x-7" : "translate-x-0"
                  }`}
                  style={!darkMode ? { background: brandColor } : { background: "#ffffff" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-black">
          <Topbar pageTitle={getPageTitle()} adminName={profile.name} />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;