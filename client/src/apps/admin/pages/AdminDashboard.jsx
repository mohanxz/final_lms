import React, { useEffect, useState } from "react";
import API from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { 
  FaBookOpen, 
  FaUsers, 
  FaLayerGroup, 
  FaChartLine, 
  FaCheckCircle,
  FaSpinner,
  FaGraduationCap,
  FaClipboardList,
  FaCode,
  FaQuestionCircle
} from "react-icons/fa";
import { MdOutlineMenuBook, MdOutlineEmojiEvents } from "react-icons/md";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [selectedType, setSelectedType] = useState("Assignment");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    API.get("/api/dashboard/lecturer", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setData(res.data);
        if (res.data?.batches?.length > 0) {
          setSelectedBatchId(res.data.batches[0]._id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data) return;

    const batch = data.batches.find((b) => b._id === selectedBatchId);
    const modules = batch?.modulesHandled || [];

    setAvailableModules(modules);

    if (!modules.includes(selectedModule)) {
      setSelectedModule(modules[0] || null);
    }
  }, [selectedBatchId, data]);

  useEffect(() => {
    if (selectedBatchId && selectedModule && selectedType) {
      API.get(
        `/statistics/marks?batchId=${selectedBatchId}&module=${selectedModule}&type=${selectedType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((res) => setAssignmentStats(res.data || []))
        .catch((err) =>
          console.error("Error fetching assignment stats:", err)
        );
    }
  }, [selectedBatchId, selectedModule, selectedType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const { stats, batches } = data;

  // Active Batches (based on status or fallback)
  const activeBatches = batches.filter(
    (b) => !b.endDate || new Date(b.endDate) >= new Date()
  );

  const getTypeIcon = () => {
    switch(selectedType) {
      case 'Assignment': return <FaClipboardList className="text-blue-500" />;
      case 'Coding': return <FaCode className="text-green-500" />;
      case 'Quiz': return <FaQuestionCircle className="text-purple-500" />;
      default: return <FaChartLine className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Enhanced Gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30">
                    <FaGraduationCap className="text-yellow-300" />
                    <span className="text-white text-sm font-medium">Admin Dashboard</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    Welcome back, Dr. {stats?.name || "Admin"}
                  </h1>
                  <p className="text-blue-50 text-sm">
                    Manage your courses, batches, and student submissions
                  </p>
                </div>
                
                {/* Stats Badge */}
                <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/30 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MdOutlineEmojiEvents className="text-yellow-300 text-xl" />
                    <span className="text-white text-sm font-medium">Overview</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{batches.length}</p>
                  <p className="text-blue-100 text-xs">Active Batches</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Cards - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-cyan-700 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                  <MdOutlineMenuBook className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">My Courses</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {stats?.courseCount || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                  <FaUsers className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {stats?.totalStudents || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                  <FaLayerGroup className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Batches</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {activeBatches.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart and Batches Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden lg:col-span-2">
              <div className="p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    {getTypeIcon()}
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {selectedType} Submission Stats
                    </h3>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition-all"
                    >
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.batchName} ({batch.courseName})
                        </option>
                      ))}
                    </select>

                    {availableModules.length > 0 && (
                      <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition-all"
                      >
                        {availableModules.map((mod, i) => (
                          <option key={i} value={mod}>
                            {mod}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition-all"
                    >
                      <option value="Assignment">Assignment</option>
                      <option value="Coding">Coding</option>
                      <option value="Quiz">Quiz</option>
                    </select>
                  </div>
                </div>

                {assignmentStats.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <FaChartLine className="text-4xl text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No data available for the selected filters</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={assignmentStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: '#6b7280' }}
                        label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fill: '#6b7280' }}
                        label={{ value: 'Submissions', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                          border: '1px solid #06b6d4',
                          borderRadius: '12px',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.15)'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="url(#barGradient)"
                        radius={[6, 6, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* My Batches Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                    <FaBookOpen className="text-white text-sm" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    My Batches
                  </h3>
                </div>

                {batches.length === 0 ? (
                  <div className="text-center py-8">
                    <FaGraduationCap className="text-4xl text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No batches assigned</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {batches.map((batch) => (
                      <div
                        key={batch._id}
                        className="rounded-xl border-l-4 bg-gradient-to-r from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 p-4 hover:shadow-md transition-all duration-200 group border-blue-500 dark:border-cyan-500"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-base font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                              {batch.courseName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {batch.batchName}
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <FaLayerGroup className="text-blue-400 dark:text-cyan-400 text-xs" />
                                <span>Modules: </span>
                                <span className="font-medium">
                                  {batch.modulesHandled?.length
                                    ? batch.modulesHandled.join(", ")
                                    : "None"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {batch.endDate && new Date(batch.endDate) >= new Date() && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-sm">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              <span className="text-xs text-white font-medium">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
      `}</style>
    </div>
  );
}