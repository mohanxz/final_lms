import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import PrivateRoute from "./components/PrivateRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 🔥 Lazy Loaded Pages
const Home = lazy(() => import("./components/home"));
const Admins = lazy(() => import("./components/admin"));
const Batches = lazy(() => import("./components/batches"));
const Payment = lazy(() => import("./components/payment"));
const Courses = lazy(() => import("./components/courses"));
const Student = lazy(() => import("./components/student"));
const Certificate = lazy(() => import("./components/CertificatePage"));
const SuperAdminChat = lazy(() => import("./components/superadminchat"));
const Settings = lazy(() => import("./components/settings"));
const AnalystDashboard = lazy(() => import("./components/analytics"));

// Route Titles
const routeTitles = {
  "/superadmin": "Dashboard",
  "/superadmin/admins": "Admin Management",
  "/superadmin/salary": "Salary Management",
  "/superadmin/batches": "Batch Management",
  "/superadmin/courses": "Course Management",
  "/superadmin/students": "Student Management",
  "/superadmin/analytics": "Analytics",
  "/superadmin/communication": "Communication",
  "/superadmin/settings": "Settings",
  "/superadmin/certificates": "Certificate",
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = routeTitles[location.pathname] || "Dashboard";

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex flex-col flex-1 md:ml-64 min-h-screen">
        <Topbar
          pageTitle={pageTitle}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        />

        {/* Toast */}
        <ToastContainer position="top-right" autoClose={3000} />

        {/* 🔥 Suspense Wrapper */}
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading...
              </div>
            }
          >
            <Routes>
              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admins"
                element={
                  <PrivateRoute>
                    <Admins />
                  </PrivateRoute>
                }
              />

              {/* Batches */}
              <Route
                path="/batches"
                element={
                  <PrivateRoute>
                    <Batches />
                  </PrivateRoute>
                }
              />

              {/* Students */}
              <Route
                path="/students"
                element={
                  <PrivateRoute>
                    <Student />
                  </PrivateRoute>
                }
              />

              {/* Courses */}
              <Route
                path="/courses"
                element={
                  <PrivateRoute>
                    <Courses />
                  </PrivateRoute>
                }
              />

              {/* Salary */}
              <Route
                path="/salary"
                element={
                  <PrivateRoute>
                    <Payment />
                  </PrivateRoute>
                }
              />

              {/* Analytics */}
              <Route
                path="/analytics"
                element={
                  <PrivateRoute>
                    <AnalystDashboard />
                  </PrivateRoute>
                }
              />

              {/* Communication */}
              <Route
                path="/communication"
                element={
                  <PrivateRoute>
                    <SuperAdminChat />
                  </PrivateRoute>
                }
              />

              {/* Settings */}
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />

              {/* Certificates */}
              <Route
                path="/certificates"
                element={
                  <PrivateRoute>
                    <Certificate />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Main Export
const SuperAdminApp = () => <AppContent />;

export default SuperAdminApp;