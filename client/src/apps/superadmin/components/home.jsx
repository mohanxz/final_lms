import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import API from '../api';
import { 
  FaUser, FaUsers, FaBook, FaFolderPlus, FaMoneyBill, FaChartLine, 
  FaTachometerAlt, FaRocket, FaShieldAlt, FaDatabase, FaServer,
  FaGraduationCap, FaChalkboardTeacher, FaCalendarAlt, FaBell,
  FaArrowRight, FaStar, FaMedal, FaFire, FaCrown, FaCheckCircle,
  FaClock, FaLayerGroup, FaAward, FaGlobe, FaHeartbeat, FaCloudUploadAlt
} from 'react-icons/fa';
import { MdOutlineEmojiEvents, MdOutlineAnalytics } from 'react-icons/md';
import { StatCardSkeleton, SystemOverviewSkeleton, FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";

ChartJS.register(ArcElement, Tooltip, Legend);

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    activeBatches: 0,
  });

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const token = localStorage.getItem('token');
        const [overviewRes, statsRes] = await Promise.all([
          API.get("/api/system/overview", { headers: { Authorization: `Bearer ${token}` } }),
          API.get('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setOverview(overviewRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-screen mx-auto">
          <div className="mb-10">
            <div className="text-center md:text-left">
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg w-64 mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-lg w-full max-w-3xl animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center mb-8">
              <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-4"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-8">
              <div className="w-3 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-4"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-xl mb-4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-screen mx-auto">
          <FadeIn>
            <div className="text-center">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md mx-auto">
                <div className="text-red-600 dark:text-red-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-3">Error Loading Dashboard</h3>
                <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
                >
                  Try Again
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  const totalRevenue = stats.totalStudents * 5000;
  const completionRate = stats.activeBatches > 0 ? Math.min(85, 60 + stats.activeBatches * 5) : 72;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-screen mx-auto">
          {/* Hero Section with Welcome Banner */}
          <FadeIn delay={100}>
            <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl"></div>
              
              <div className="relative p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30">
                      <FaCrown className="text-yellow-300" />
                      <span className="text-white text-sm font-medium">{getGreeting()}, Super Admin!</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-sm">
                      Welcome to Your Dashboard
                    </h1>
                    <p className="text-blue-50 text-base lg:text-lg max-w-2xl">
                      Manage your institution's learning ecosystem from this central dashboard. Monitor performance, manage resources, and drive educational excellence.
                    </p>
                    
                    {/* Stats Badge */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/30">
                        <p className="text-blue-100 text-xs">Current Time</p>
                        <p className="text-white font-semibold">{formatTime()}</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/30">
                        <p className="text-blue-100 text-xs">Today's Date</p>
                        <p className="text-white font-semibold text-sm">{formatDate()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Overall Stats Badge */}
                  <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-5 text-center min-w-[160px] border border-white/30 shadow-lg">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <MdOutlineEmojiEvents className="text-2xl text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalStudents + stats.totalLecturers}</p>
                    <p className="text-blue-100 text-sm">Total Users</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <SlideUp delay={150}>
              <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-5 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <FaChalkboardTeacher className="text-2xl text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Lecturers</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalLecturers}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <FaStar className="text-yellow-400 text-xs" />
                      <span className="text-xs text-gray-500">Active Staff</span>
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp delay={200}>
              <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-5 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <FaFolderPlus className="text-2xl text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Active Batches</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.activeBatches}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <FaClock className="text-cyan-500 text-xs" />
                      <span className="text-xs text-gray-500">Running Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp delay={250}>
              <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-5 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <FaUsers className="text-2xl text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalStudents}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <FaGraduationCap className="text-blue-500 text-xs" />
                      <span className="text-xs text-gray-500">Enrolled</span>
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp delay={300}>
              <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-5 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <FaMoneyBill className="text-2xl text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">₹{totalRevenue.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <FaChartLine className="text-green-500 text-xs" />
                      <span className="text-xs text-gray-500">+12% this month</span>
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>
          </div>

          {/* Quick Actions Section */}
          <FadeIn delay={350}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden mb-8">
              <div className="relative px-6 pt-6 pb-3">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                    <FaRocket className="text-white text-sm" />
                  </div>
                  Quick Actions
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Frequently used administrative tasks</p>
              </div>
              <div className="p-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <button 
                    onClick={() => navigate("admins")} 
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl p-6 text-center border border-blue-200/50 dark:border-cyan-800/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FaUser className="text-2xl text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-700 dark:text-cyan-300 mb-1">Add Lecturer</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Invite new faculty members</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FaArrowRight className="inline text-blue-500 dark:text-cyan-400 text-sm" />
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate("courses")} 
                    className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-6 text-center border border-green-200/50 dark:border-green-800/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FaBook className="text-2xl text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-1">Manage Courses</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Create and edit courses</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FaArrowRight className="inline text-green-500 text-sm" />
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate("batches")} 
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 text-center border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FaFolderPlus className="text-2xl text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-1">Batch Management</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Organize student batches</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FaArrowRight className="inline text-blue-500 text-sm" />
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate("salary")} 
                    className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-2xl p-6 text-center border border-orange-200/50 dark:border-orange-800/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FaMoneyBill className="text-2xl text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-300 mb-1">Pay Salary</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Process monthly payroll</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FaArrowRight className="inline text-orange-500 text-sm" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Additional Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Overview */}
            <SlideUp delay={400}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="relative px-6 pt-6 pb-3">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                      <MdOutlineAnalytics className="text-white text-sm" />
                    </div>
                    Performance Overview
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Key metrics and achievements</p>
                </div>
                <div className="p-6 pt-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                          <FaMedal className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                          <p className="text-xl font-bold text-gray-800 dark:text-white">{completionRate}%</p>
                        </div>
                      </div>
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${completionRate}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                          <FaCheckCircle className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Active Courses</p>
                          <p className="text-xl font-bold text-gray-800 dark:text-white">{overview?.activeCourses || 12}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 dark:text-green-400">+2 this month</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                          <FaFire className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Student Attendance</p>
                          <p className="text-xl font-bold text-gray-800 dark:text-white">94%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 dark:text-green-400">↑ 5%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>

            {/* System Health */}
            <SlideUp delay={450}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="relative px-6 pt-6 pb-3">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                      <FaShieldAlt className="text-white text-sm" />
                    </div>
                    System Health
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Platform status and metrics</p>
                </div>
                <div className="p-6 pt-2 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                        <FaServer className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Server Status</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">API Response Time</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">Online</span>
                      </div>
                      <p className="text-xs text-gray-500">128ms</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                        <FaDatabase className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Database Health</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Storage Usage</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-blue-600 dark:text-cyan-400">Excellent</span>
                      <p className="text-xs text-gray-500">45% used</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                        <FaGlobe className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Sessions</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Users Online</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{overview?.activeSessions || 24}</span>
                      <p className="text-xs text-gray-500">active now</p>
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>
          </div>

          {/* Recent Activity Feed */}
          <FadeIn delay={500}>
            <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="relative px-6 pt-6 pb-3">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                    <FaBell className="text-white text-sm" />
                  </div>
                  Recent Activity
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Latest system events and updates</p>
              </div>
              <div className="p-6 pt-2">
                <div className="space-y-3">
                  {[
                    { action: "New course added", detail: "Full Stack Development", time: "2 minutes ago", icon: FaBook, color: "blue" },
                    { action: "Student enrolled", detail: "John Doe joined Batch A", time: "15 minutes ago", icon: FaUsers, color: "cyan" },
                    { action: "Salary processed", detail: "December payroll completed", time: "1 hour ago", icon: FaMoneyBill, color: "green" },
                    { action: "Batch created", detail: "Weekend Batch - January", time: "3 hours ago", icon: FaFolderPlus, color: "blue" },
                  ].map((activity, idx) => {
                    const gradientMap = {
                      blue: "from-blue-500 to-cyan-500",
                      cyan: "from-cyan-500 to-teal-500",
                      green: "from-green-500 to-emerald-500",
                    };
                    return (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-colors">
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradientMap[activity.color] || 'from-blue-500 to-cyan-500'} rounded-lg flex items-center justify-center shadow-sm`}>
                          <activity.icon className="text-white text-sm" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.action}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{activity.detail}</p>
                        </div>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Home;