import React, { useEffect, useState } from "react";
import API from "../api";
import CourseCard from "./CourseCard";
import { useNavigate } from "react-router-dom";
import FullStack from "../assets/FullStack.webp";
import TechTrio from "../assets/TechTrio.webp";
import DataAnalytics from "../assets/DataAnalytics.webp";
import { 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaCalendarAlt, 
  FaUsers, 
  FaChartLine,
  FaFire,
  FaRocket,
  FaBookOpen,
  FaSpinner,
  FaArrowRight,
  FaStar,
  FaTrophy,
  FaUserGraduate
} from "react-icons/fa";
import { MdOutlineMenuBook, MdOutlineDashboard } from "react-icons/md";

const courseImages = {
  "FullStack.webp": FullStack,
  "TechTrio.webp": TechTrio,
  "DataAnalytics.webp": DataAnalytics
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
        <div className="p-5 space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mt-4"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function AdminHome() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeBatches: 0
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/admin-batches/my-batches", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(res.data);
      
      // Calculate stats
      const uniqueCourses = new Set(res.data.map(batch => batch.course?.courseName)).size;
      
      setStats({
        totalCourses: uniqueCourses,
        activeBatches: res.data.length
      });
    } catch (err) {
      console.error("Error fetching batches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (batchId) => {
    navigate(`/admin/batch/${batchId}/lesson-plan`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header Section */}
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
                      <FaChalkboardTeacher className="text-xs" />
                      Faculty Dashboard
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                      <FaChartLine className="text-xs" />
                      Teaching Overview
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    Your Teaching Batches
                  </h1>
                  <p className="text-blue-50 text-sm">
                    Manage your courses, track student progress, and access lesson plans
                  </p>
                </div>
                
                {/* Stats Badge */}
                <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/30 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaTrophy className="text-yellow-300 text-xl" />
                    <span className="text-white text-sm font-medium">Active Batches</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.activeBatches}</p>
                  <p className="text-blue-100 text-xs">Currently Teaching</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <MdOutlineMenuBook className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.totalCourses}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaFire className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Batches</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.activeBatches}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                <FaRocket className="text-white text-sm" />
              </div>
              Your Courses
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({batches.length} batch{batches.length !== 1 ? 'es' : ''})
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2 ml-4">
            Click on any course to access the lesson plan and manage student progress
          </p>
        </div>

        {/* Batches Grid */}
        {loading ? (
          <SkeletonLoader />
        ) : batches.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mb-4">
              <FaChalkboardTeacher className="text-3xl text-blue-500 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Courses Assigned</h3>
            <p className="text-gray-500 dark:text-gray-400">
              You haven't been assigned to any batches yet. Please contact your administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch, idx) => {
              const course = batch.course;
              return (
                <CourseCard 
                  key={batch._id || idx}
                  image={courseImages[batch.course?.image]}
                  name={course?.courseName}
                  startDate={batch?.startDate}
                  batch={batch?.batchName}
                  batchId={batch?._id}
                  onClick={() => handleCourseClick(batch?._id)}
                />
              );
            })}
          </div>
        )}

        {/* Quick Tips Section */}
        {batches.length > 0 && (
          <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-cyan-800 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <FaStar className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Quick Tips</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 dark:bg-cyan-500 rounded-full"></span>
                    Click on any course card to access the lesson plan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 dark:bg-cyan-500 rounded-full"></span>
                    Create and manage quizzes, coding challenges, and assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 dark:bg-cyan-500 rounded-full"></span>
                    Track student submissions and evaluate their performance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 dark:bg-cyan-500 rounded-full"></span>
                    Use the analytics dashboard to monitor class progress
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
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