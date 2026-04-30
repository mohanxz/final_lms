import React, { useState, useEffect, useCallback } from "react";
import API from "../api";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  FaUsers, FaChalkboardTeacher, FaBook, FaFolderPlus, FaTrophy,
  FaChartLine, FaSync, FaMedal, FaAward, FaGraduationCap,
  FaStar, FaCheckCircle, FaDatabase
} from "react-icons/fa";
import { MdOutlineAnalytics } from "react-icons/md";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    totalBatches: 0,
    courses: {},
    adminSpecializations: {},
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState("");
  const profilePic = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const [statsRes, coursesRes] = await Promise.all([
        API.get("/api/stats", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/api/courses/names", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStats(statsRes.data);
      setCourses(coursesRes.data);
      if (coursesRes.data.length > 0 && !course) {
        setCourse(coursesRes.data[0]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.code === "ERR_NETWORK") {
        setConnectionError(true);
        toast.error("Network error - Unable to connect to server");
      }
    } finally {
      setLoading(false);
    }
  }, [course]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!course) return;
    const token = localStorage.getItem('token');
    API.get(`/api/tests/top/${course}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const formatted = res.data.map(item => ({
          studentName: item.studentName,
          quizAvg: item.quizAvg,
          assignmentAvg: item.assignAvg,
          codeAvg: item.codeAvg,
          totalAvg: item.totalAvg
        }));
        setLeaderboard(formatted);
      })
      .catch(err => console.error("Leaderboard fetch error:", err));
  }, [course]);

  const courseChartData = {
    labels: Object.keys(stats.courses || {}),
    datasets: [{
      data: Object.values(stats.courses || {}),
      backgroundColor: [
        '#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981',
        '#EC4899', '#6366F1', '#14B8A6', '#F43F5E', '#84CC16'
      ],
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  const adminChartData = {
    labels: Object.keys(stats.adminSpecializations || {}),
    datasets: [{
      data: Object.values(stats.adminSpecializations || {}),
      backgroundColor: [
        '#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
        '#06B6D4', '#EC4899', '#84CC16'
      ],
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 12,
          color: '#94a3b8',
          font: { size: 11, weight: 'normal' },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(148,163,184,0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true
      }
    }
  };

  const getTopPerformers = () => {
    const sorted = [...leaderboard].sort((a, b) => (b.totalAvg || 0) - (a.totalAvg || 0));
    return {
      first: sorted[0] || null,
      second: sorted[1] || null,
      third: sorted[2] || null,
      others: sorted.slice(3)
    };
  };

  const performers = getTopPerformers();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex justify-center items-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md border border-gray-200/50">
          <FaChartLine className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">Unable to connect to the server</p>
          <button
            onClick={fetchInitialData}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <Toaster position="top-right" />

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/30">
                      <MdOutlineAnalytics className="text-xs" />
                      Analytics Dashboard
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                      <FaChartLine className="text-xs" />
                      Performance Overview
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    Student Performance Analytics
                  </h1>
                  <p className="text-blue-50 text-sm">
                    Comprehensive insights into academic performance and statistics
                  </p>
                </div>
                
                <button
                  onClick={fetchInitialData}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30"
                >
                  <FaSync className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={<FaUsers />}
              color="blue"
              subtitle="Active learners"
            />
            <StatCard
              title="Faculty Members"
              value={stats.totalLecturers}
              icon={<FaChalkboardTeacher />}
              color="cyan"
              subtitle="Teaching staff"
            />
            <StatCard
              title="Active Courses"
              value={stats.totalCourses}
              icon={<FaBook />}
              color="green"
              subtitle="Available programs"
            />
            <StatCard
              title="Active Batches"
              value={stats.totalBatches}
              icon={<FaFolderPlus />}
              color="orange"
              subtitle="Active cohorts"
            />
          </div>
        </div>

        {/* Course Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 mb-6 border border-gray-200/50">
          <div className="flex flex-wrap justify-center gap-2">
            {courses.map(c => (
              <button
                key={c}
                onClick={() => setCourse(c)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  course === c
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* LEADERBOARD SECTION */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 mb-6">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500">
            <div className="flex items-center gap-2 text-white">
              <FaTrophy className="text-yellow-300" />
              <h2 className="font-semibold">Student Leaderboard</h2>
            </div>
          </div>

          <div className="p-6">
            {leaderboard.length > 0 ? (
              <>
                {/* Podium */}
                <div className="flex justify-center items-end gap-4 mb-8 pb-6 border-b border-gray-100">
                  {performers.second && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center w-28"
                    >
                      <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl p-4 h-36 flex flex-col items-center justify-end shadow-md">
                        <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mb-3 overflow-hidden">
                          <img src={profilePic} className="w-full h-full object-cover" alt="profile" />
                        </div>
                        <p className="font-semibold text-gray-800 truncate w-full text-sm">{performers.second.studentName}</p>
                        <p className="text-xl font-bold text-gray-700 mt-1">{performers.second.totalAvg?.toFixed(1)}%</p>
                      </div>
                      <p className="mt-2 text-xs font-medium text-gray-500">2nd Place</p>
                    </motion.div>
                  )}

                  {performers.first && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center w-32"
                    >
                      <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-xl p-5 h-44 flex flex-col items-center justify-end shadow-lg border border-yellow-200">
                        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center mb-3 border-2 border-yellow-300 overflow-hidden">
                          <img src={profilePic} className="w-full h-full object-cover" alt="profile" />
                        </div>
                        <p className="font-bold text-gray-900 truncate w-full">{performers.first.studentName}</p>
                        <p className="text-2xl font-bold text-yellow-600 mt-1">{performers.first.totalAvg?.toFixed(1)}%</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-yellow-600">1st Place</p>
                    </motion.div>
                  )}

                  {performers.third && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center w-28"
                    >
                      <div className="bg-gradient-to-b from-orange-50 to-orange-100 rounded-xl p-4 h-32 flex flex-col items-center justify-end shadow-md">
                        <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mb-3 overflow-hidden">
                          <img src={profilePic} className="w-full h-full object-cover" alt="profile" />
                        </div>
                        <p className="font-semibold text-gray-800 truncate w-full text-sm">{performers.third.studentName}</p>
                        <p className="text-xl font-bold text-orange-600 mt-1">{performers.third.totalAvg?.toFixed(1)}%</p>
                      </div>
                      <p className="mt-2 text-xs font-medium text-orange-500">3rd Place</p>
                    </motion.div>
                  )}
                </div>

                {/* Others */}
                {performers.others.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {performers.others.map((student, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                            {idx + 4}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">{student.studentName}</p>
                            <p className="text-xs text-gray-500">Student</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{student.totalAvg?.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">Avg Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FaTrophy className="text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-500">No data available for {course}</p>
              </div>
            )}
          </div>
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <FaGraduationCap className="text-white text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Course Enrollment Distribution</h3>
                <p className="text-xs text-gray-500">Student distribution across courses</p>
              </div>
            </div>
            <div className="h-72">
              {Object.keys(stats.courses || {}).length > 0 ? (
                <Pie data={courseChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No enrollment data available</div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <FaChalkboardTeacher className="text-white text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Faculty Specializations</h3>
                <p className="text-xs text-gray-500">Distribution by expertise</p>
              </div>
            </div>
            <div className="h-72">
              {Object.keys(stats.adminSpecializations || {}).length > 0 ? (
                <Pie data={adminChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No faculty data available</div>
              )}
            </div>
          </div>
        </div>

        {/* KEY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm opacity-90 font-medium">Course Completion Rate</p>
              <FaCheckCircle className="text-xl opacity-80" />
            </div>
            <p className="text-3xl font-bold">72%</p>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '72%' }}></div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm opacity-90 font-medium">Average Student Score</p>
              <FaStar className="text-xl opacity-80" />
            </div>
            <p className="text-3xl font-bold">68%</p>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '68%' }}></div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm opacity-90 font-medium">Student-Teacher Ratio</p>
              <FaDatabase className="text-xl opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-3">
              {stats.totalLecturers > 0 ? (stats.totalStudents / stats.totalLecturers).toFixed(1) : 0}:1
            </p>
            <p className="text-sm text-white/80">Students per faculty</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    cyan: "from-cyan-500 to-teal-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-amber-500 to-orange-500",
    red: "from-red-500 to-rose-500",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl shadow-lg p-5 text-white`}
    >
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm opacity-90 font-medium">{title}</p>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
      <p className="text-2xl lg:text-3xl font-bold">{value}</p>
      <p className="text-xs text-white/70 mt-1">{subtitle}</p>
    </motion.div>
  );
};