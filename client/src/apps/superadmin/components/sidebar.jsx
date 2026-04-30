import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaHome, FaBook, FaUser, FaUsers, FaChartBar, FaFolderPlus,
  FaMoneyBill, FaCog, FaEnvelope, FaSignOutAlt, FaChartPie,
  FaMoon, FaSun
} from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { toast } from "react-toastify";

const menuItems = [
  { id: "dashboard", icon: <FaHome />, label: "Dashboard", path: "/superadmin" },
  { id: "admins", icon: <FaUser />, label: "Admin Management", path: "/superadmin/admins" },
  { id: "courses", icon: <FaBook />, label: "Course Management", path: "/superadmin/courses" },
  { id: "batches", icon: <FaFolderPlus />, label: "Batch Management", path: "/superadmin/batches" },
  { id: "students", icon: <FaUsers />, label: "Student Management", path: "/superadmin/students" },
  { id: "salary", icon: <FaMoneyBill />, label: "Salary Management", path: "/superadmin/salary" },
  { id: "Chat", icon: <FaEnvelope />, label: "Chat", path: "/superadmin/communication" },
  // { id: "analytics", icon: <FaChartPie />, label: "Analytics", path: "/superadmin/analytics" },
  { id: "settings", icon: <FaCog />, label: "Profile", path: "/superadmin/settings" },
];

export default function Sidebar({ onHover, darkMode, setDarkMode, isSidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const currentPath = location.pathname;
    const current = menuItems.find(item => currentPath.endsWith(item.path));
    setActive(current?.id || "");
  }, [location]);

  useEffect(() => {
    const fetchSuperAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/superadmin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const superAdmin = res.data?.[0];
        if (superAdmin) {
          setUserEmail(superAdmin.email || "admin@lms.com");
        }
      } catch (error) {
        console.error("Error fetching super admin:", error);
      }
    };
    fetchSuperAdmin();
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${import.meta.env.VITE_LOGIN_API}/auth/logout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      toast.success("Logged out successfully");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Custom cyan color: #08cafc
  const cyanColor = "#08cafc";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 border-r border-gray-300/50 dark:border-gray-800 shadow-xl flex-col
          ${isSidebarOpen ? "flex" : "hidden"} md:flex`}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 text-gray-600 dark:text-gray-300 text-2xl z-50 p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800 focus:outline-none"
        >
          &times;
        </button>

        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo/Brand Section */}
          <div className="border-b border-gray-300/50 dark:border-gray-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ background: `linear-gradient(135deg, #3b82f6, ${cyanColor})` }}
              >
                <FaBook className="text-lg" />
              </div>
              <div>
                <h1 
                  className="text-xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, #2563eb, ${cyanColor})` }}
                >
                  LMS Portal
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Super Admin</p>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50 dark:border-gray-700 shadow-sm">
              <div className="relative">
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, #3b82f6, ${cyanColor})` }}
                >
                  <FaUser className="text-lg" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">Super Admin</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 flex flex-col px-4 py-2 space-y-1 overflow-y-auto">
            {menuItems.map(({ id, icon, label, path }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? "text-white shadow-md shadow-cyan-300/30 dark:shadow-none"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm"
                  }`}
                  style={isActive ? { background: `linear-gradient(135deg, #3b82f6, ${cyanColor})` } : {}}
                >
                  <span className={`text-lg transition-colors ${
                    isActive 
                      ? "text-white" 
                      : "text-gray-500 dark:text-gray-400 group-hover:text-[#08cafc]"
                  }`}>
                    {icon}
                  </span>
                  <span className="text-sm font-medium tracking-wide">{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-8 bg-white rounded-full shadow-sm"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section - Dark Mode Toggle & Logout */}
        <div className="p-4 border-t border-gray-300/50 dark:border-gray-800 space-y-3">
         
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 group"
            style={{ 
              color: '#dc2626',
              border: '2px solid rgba(220, 38, 38, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#dc2626';
            }}
          >
            <FaSignOutAlt className="text-lg group-hover:scale-110 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}