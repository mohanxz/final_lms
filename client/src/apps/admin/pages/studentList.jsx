import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { toast } from "react-toastify";
import AdminLeaderboard from "./AdminLeaderboard";
import {
  FaSearch,
  FaUsers,
  FaGraduationCap,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaChartLine,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaUserGraduate,
  FaBookOpen,
  FaCalendarAlt,
  FaTrophy,
  FaSpinner,
  FaArrowLeft,
  FaFire,
  FaLayerGroup,
  FaCheckCircle,
  FaRocket,
} from "react-icons/fa";
import { MdOutlineMenuBook, MdOutlineQuiz } from "react-icons/md";
import { useNavigate } from "react-router-dom";

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 lg:p-8">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-32 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [batchDetails, setBatchDetails] = useState({});

  const [availableModules, setAvailableModules] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardModule, setLeaderboardModule] = useState("");
  const [leaderboardBatchId, setLeaderboardBatchId] = useState("");

  const token = localStorage.getItem("token");

  const getCourseName = (batchName) => {
    if (!batchName) return "N/A";
    const courseMap = {
      FS: "Full Stack Development",
      DS: "Data Science",
      DA: "Data Analytics",
      TT: "Tech Trio",
    };
    const parts = batchName.split("-");
    const courseCode = parts[0];
    return courseMap[courseCode] || courseCode;
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedBatch, selectedCourse, selectedYear]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/students/my-students", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          name: search,
          batchId: selectedBatch,
          course: selectedCourse,
          year: selectedYear,
        },
        withCredentials: true,
      });

      const studentsData = res.data.students || [];
      const batches = res.data.batchOptions || [];

      setStudents(studentsData);
      setTotalStudents(studentsData.length);
      setBatchOptions(batches);

      const uniqueBatches = new Set(studentsData.map((s) => s.batchName));
      setBatchDetails({
        totalBatches: uniqueBatches.size,
        uniqueCourses: new Set(
          studentsData.map((s) => getCourseName(s.batchName)),
        ).size,
      });

      const courseSet = new Set();
      const yearSet = new Set();

      batches.forEach((batch) => {
        const parts = batch.batchName.split("-");
        if (parts.length >= 2) {
          courseSet.add(parts[0]);
          yearSet.add(parts[1].slice(3));
        }
      });

      setCourseOptions(["All Courses", ...Array.from(courseSet)]);
      setYearOptions(["All Years", ...Array.from(yearSet)]);

      if (res.data.modules) {
        setAvailableModules(res.data.modules);
        setLeaderboardModule(res.data.modules[0] || "");
      }

      if (batches.length > 0) {
        setLeaderboardBatchId(batches[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leaderboardModule && leaderboardBatchId) {
      API.get("/statistics/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
        params: { module: leaderboardModule, batchId: leaderboardBatchId },
        withCredentials: true,
      })
        .then((res) => {
          setLeaderboard(res.data);
        })
        .catch((err) => {
          console.error("Leaderboard fetch error:", err);
        });
    }
  }, [leaderboardModule, leaderboardBatchId]);

  const clearFilters = () => {
    setSearch("");
    setSelectedBatch("");
    setSelectedCourse("");
    setSelectedYear("");
  };

  const hasActiveFilters =
    search || selectedBatch || selectedCourse || selectedYear;

  if (loading) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header Section - Blue to Cyan Gradient */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl"></div>

            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/30">
                      <FaUsers className="text-xs" />
                      Student Management
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                      <FaChartLine className="text-xs" />
                      Enrollment Overview
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    My Students
                  </h1>
                  <div className="flex items-center gap-4 text-blue-50 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <FaUserGraduate className="text-xs" />
                      Total Students: {totalStudents}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaGraduationCap className="text-xs" />
                      Batches: {batchDetails.totalBatches || 0}
                    </span>
                  </div>
                </div>

                {/* Stats Badge */}
                <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/30 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaTrophy className="text-yellow-300 text-xl" />
                    <span className="text-white text-sm font-medium">
                      Active Students
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {totalStudents}
                  </p>
                  <p className="text-blue-100 text-xs">Currently Enrolled</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row - 4 cards with gradient icons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-cyan-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaUsers className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Students
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {totalStudents}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaGraduationCap className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Batches
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {batchDetails.totalBatches || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaBookOpen className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Courses
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {batchDetails.uniqueCourses || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaRocket className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Active Filters
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {hasActiveFilters ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AdminLeaderboard Component */}
        <div className="mb-8">
          <AdminLeaderboard />
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 mb-4 group"
          >
            <FaFilter className="text-sm text-blue-500 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            <FaChevronDown
              className={`text-xs transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {showFilters && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 dark:text-cyan-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                  value={selectedCourse}
                  onChange={(e) =>
                    setSelectedCourse(
                      e.target.value === "All Courses" ? "" : e.target.value,
                    )
                  }
                >
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="">All Batches</option>
                  {batchOptions.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.batchName}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(
                      e.target.value === "All Years" ? "" : e.target.value,
                    )
                  }
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <FaTimes className="text-sm" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Students List */}
        {students.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mb-4">
              <FaUsers className="text-3xl text-blue-500 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Students Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "No students are currently enrolled in your batches."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Roll No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Student Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Batch
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students.map((student, index) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                            {index + 1}
                          </div>
                          {student.rollNo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                            {student.name?.charAt(0) || "S"}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FaEnvelope className="text-blue-400 dark:text-cyan-400 text-xs" />
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FaPhone className="text-blue-400 dark:text-cyan-400 text-xs" />
                          {student.phone || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-cyan-400 text-xs rounded-lg border border-blue-200 dark:border-cyan-800 shadow-sm">
                          <FaGraduationCap size={10} />
                          {getCourseName(student.batchName)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded-lg border border-cyan-200 dark:border-cyan-800 shadow-sm">
                          <FaLayerGroup size={10} />
                          {student.batchName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
              {students.map((student) => (
                <div
                  key={student._id}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                        {student.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Roll No: {student.rollNo}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-cyan-400 text-xs rounded-lg border border-blue-200 dark:border-cyan-800 shadow-sm">
                      <FaGraduationCap size={10} />
                      {getCourseName(student.batchName)}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <FaEnvelope className="text-blue-400 dark:text-cyan-400 text-xs w-4" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {student.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FaPhone className="text-blue-400 dark:text-cyan-400 text-xs w-4" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {student.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FaLayerGroup className="text-blue-400 dark:text-cyan-400 text-xs w-4" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Batch: {student.batchName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Student Count Footer */}
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {students.length} of {totalStudents} students
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Live Data
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}