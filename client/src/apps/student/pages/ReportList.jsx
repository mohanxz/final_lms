import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { 
  FaClipboardList, FaCheckCircle, FaTimesCircle, FaChartLine, 
  FaCalendarAlt, FaBookOpen, FaFilter, FaTimes,
  FaEye, FaTrophy, FaMedal, FaStar, FaAward, FaPercentage,
  FaArrowRight, FaBrain, FaClock, FaUserGraduate, FaChevronRight,
  FaLightbulb, FaList, FaLayerGroup, FaGraduationCap, FaExpand,
  FaCompress, FaSpinner, FaExclamationTriangle, FaRedo
} from "react-icons/fa";
import { MdOutlineQuiz, MdOutlineSpeed, MdOutlineDateRange } from "react-icons/md";
import { FadeIn, SlideUp } from "../../../shared/LoadingComponents";

// ============================================
// SKELETON LOADER
// ============================================
const ReportListSkeleton = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-40 bg-white dark:bg-gray-800 rounded-2xl animate-pulse shadow-sm border border-gray-200 dark:border-gray-700"></div>
      </div>
      {/* Filter Skeleton */}
      <div className="mb-8">
        <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse shadow-sm border border-gray-200 dark:border-gray-700"></div>
      </div>
      {/* List Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// ERROR STATE
// ============================================
const ErrorState = ({ message, onRetry }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto">
      <FadeIn>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <FaExclamationTriangle className="text-2xl text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Reports
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
          <button 
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm"
          >
            <FaRedo size={14} />
            Try Again
          </button>
        </div>
      </FadeIn>
    </div>
  </div>
);

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      <MdOutlineQuiz className="text-3xl text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      No Quiz Reports Found
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
      Complete some quizzes to see your performance reports here.
    </p>
  </div>
);

// ============================================
// CONSTANTS
// ============================================
const SCORE_GRADES = [
  { min: 90, grade: 'A+', icon: FaAward, label: 'Outstanding', color: 'emerald' },
  { min: 80, grade: 'A', icon: FaStar, label: 'Excellent', color: 'green' },
  { min: 70, grade: 'B', icon: FaMedal, label: 'Very Good', color: 'blue' },
  { min: 60, grade: 'C', icon: FaChartLine, label: 'Good Progress', color: 'amber' },
  { min: 50, grade: 'D', icon: FaLightbulb, label: 'Developing', color: 'orange' },
  { min: 0, grade: 'F', icon: FaBrain, label: 'Keep Learning', color: 'red' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
const getScoreGrade = (score, total) => {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  return SCORE_GRADES.find(g => percentage >= g.min) || SCORE_GRADES[SCORE_GRADES.length - 1];
};

const getProgressBarColor = (percentage) => {
  if (percentage >= 80) return {
    bg: 'bg-emerald-500 dark:bg-emerald-400',
    light: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: '#10b981'
  };
  if (percentage >= 60) return {
    bg: 'bg-amber-500 dark:bg-amber-400',
    light: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    bar: '#f59e0b'
  };
  return {
    bg: 'bg-red-500 dark:bg-red-400',
    light: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    bar: '#ef4444'
  };
};

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ icon: Icon, label, value, subtext, color }) => {
  const colorClasses = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color] || colorClasses.blue}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

// ============================================
// OPTION BADGE COMPONENT
// ============================================
const OptionBadge = ({ opt, text, isSelected, isCorrect }) => {
  // Determine colors based on state
  let containerClasses = '';
  let badgeClasses = '';
  let textClasses = '';
  let icon = null;

  if (isSelected && isCorrect) {
    // User selected the correct answer
    containerClasses = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    badgeClasses = 'bg-emerald-500 text-white';
    textClasses = 'text-emerald-700 dark:text-emerald-300 font-medium';
    icon = <FaCheckCircle className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" size={14} />;
  } else if (isSelected && !isCorrect) {
    // User selected wrong answer
    containerClasses = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    badgeClasses = 'bg-red-500 text-white';
    textClasses = 'text-red-700 dark:text-red-300';
    icon = <FaTimesCircle className="text-red-500 dark:text-red-400 flex-shrink-0" size={14} />;
  } else if (!isSelected && isCorrect) {
    // Correct answer user didn't select
    containerClasses = 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50';
    badgeClasses = 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300';
    textClasses = 'text-emerald-600 dark:text-emerald-400';
  } else {
    // Neutral option
    containerClasses = 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700';
    badgeClasses = 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    textClasses = 'text-gray-600 dark:text-gray-400';
  }

  return (
    <div className={`p-3 rounded-lg border ${containerClasses} transition-all duration-200`}>
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeClasses}`}>
          {opt}
        </div>
        <span className={`flex-1 text-sm ${textClasses}`}>{text}</span>
        {icon}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedDay, setSelectedDay] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [quizDetail, setQuizDetail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const profileRes = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentId = profileRes.data._id;

      const res = await API.get(
        `/api/quizreports/quiz-attempts?studentId=${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReports(res.data);
      setFilteredReports(res.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("We encountered an issue while loading your quiz reports. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...reports];

    if (selectedModule !== "All") {
      filtered = filtered.filter((r) => r.module === selectedModule);
    }

    if (selectedDay !== "All") {
      filtered = filtered.filter((r) => r.day === parseInt(selectedDay));
    }

    setFilteredReports(filtered);
  }, [selectedModule, selectedDay, reports]);

  const openModal = async (noteId) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const res = await API.get(
        `/api/quizreports/quiz-detail/${noteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedReport(noteId);
      setQuizDetail(res.data);
      setModalOpen(true);
      setIsFullscreen(false);
    } catch (err) {
      console.error("Failed to fetch quiz details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedReport(null);
    setQuizDetail(null);
    setModalOpen(false);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getOverallStats = () => {
    if (reports.length === 0) return null;
    const totalScore = reports.reduce((acc, r) => acc + (r.score || 0), 0);
    const totalPossible = reports.reduce((acc, r) => acc + (r.total || 1), 0);
    const overallPercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
    const bestScore = Math.max(...reports.map(r => r.total > 0 ? (r.score / r.total) * 100 : 0));
    
    return { 
      overallPercentage, 
      bestScore, 
      totalQuizzes: reports.length 
    };
  };

  if (loading) return <ReportListSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchReports} />;

  const uniqueModules = ["All", ...new Set(reports.map((r) => r.module))];
  const uniqueDays = ["All", ...new Set(reports.map((r) => r.day))];
  const overallStats = getOverallStats();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <FadeIn delay={100}>
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-xs font-semibold">
                        <MdOutlineQuiz className="text-xs" />
                        Performance Dashboard
                      </span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      Quiz Reports
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Track your progress and review past quiz attempts
                    </p>
                  </div>
                  
                  {overallStats && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl px-5 py-4 border border-blue-100 dark:border-blue-800/30">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                        <FaTrophy className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {overallStats.overallPercentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Overall Average • {overallStats.totalQuizzes} Quiz{overallStats.totalQuizzes !== 1 ? 'zes' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Filter Section */}
          <SlideUp delay={250}>
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FaFilter className="text-blue-500" size={14} />
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Filter Reports</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Module
                    </label>
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {uniqueModules.map((mod, idx) => (
                        <option key={idx} value={mod}>
                          {mod === "All" ? "All Modules" : mod}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Day
                    </label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {uniqueDays.map((d, idx) => (
                        <option key={idx} value={d}>
                          {d === "All" ? "All Days" : `Day ${d}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </SlideUp>

          {/* Reports List */}
          <SlideUp delay={350}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaClipboardList className="text-blue-500" size={16} />
                  Quiz Attempts
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({filteredReports.length})
                  </span>
                </h2>
              </div>
              
              <div className="p-5">
                {filteredReports.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map((report, index) => {
                      const scorePercentage = Math.min(
                        ((report.score || 0) / (report.total || 1)) * 100, 
                        100
                      );
                      const gradeInfo = getScoreGrade(report.score || 0, report.total || 1);
                      const GradeIcon = gradeInfo.icon;
                      const progressColor = getProgressBarColor(scorePercentage);
                      
                      return (
                        <div
                          key={index}
                          className="group border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800/50"
                        >
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-xl ${progressColor.light} flex items-center justify-center flex-shrink-0`}>
                                    <GradeIcon className={`text-lg ${progressColor.text}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                      {report.module}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      <span>Day {report.day}</span>
                                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${progressColor.light} ${progressColor.text}`}>
                                        {gradeInfo.grade} • {gradeInfo.label}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className={`text-sm font-semibold ${progressColor.text}`}>
                                      {report.score} / {report.total}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {scorePercentage.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor.bg}`}
                                      style={{ width: `${scorePercentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => openModal(report.noteId)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex-shrink-0"
                              >
                                <FaEye size={12} />
                                Review
                                <FaChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </SlideUp>
        </div>
      </div>

      {/* Quiz Detail Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/80 dark:bg-black/90 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className={`relative bg-white dark:bg-gray-800 flex flex-col shadow-2xl animate-scaleIn ${
            isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl max-h-[90vh] rounded-2xl mx-4'
          }`}>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <MdOutlineQuiz className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Quiz Review</h3>
                  {quizDetail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {quizDetail.detail?.length || 0} Question{quizDetail.detail?.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <FaSpinner className="animate-spin text-blue-500 text-3xl mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading quiz details...</p>
                </div>
              ) : quizDetail && quizDetail.detail ? (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {quizDetail.detail.map((item, idx) => {
                    const { question, options, selected, correct } = item;
                    const isCorrect = selected === correct;
                    
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl overflow-hidden border ${
                          isCorrect 
                            ? 'border-emerald-200 dark:border-emerald-800' 
                            : 'border-red-200 dark:border-red-800'
                        }`}
                      >
                        {/* Question Header */}
                        <div className={`px-4 py-3 ${
                          isCorrect 
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/10' 
                            : 'bg-red-50/50 dark:bg-red-900/10'
                        }`}>
                          <div className="flex items-start gap-3">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 ${
                              isCorrect 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs text-gray-500">Question {idx + 1}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isCorrect 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  {isCorrect ? (
                                    <><FaCheckCircle size={10} /> Correct</>
                                  ) : (
                                    <><FaTimesCircle size={10} /> Incorrect</>
                                  )}
                                </span>
                              </div>
                              <p className="text-gray-900 dark:text-white font-medium leading-relaxed">
                                {question}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Options */}
                        <div className="p-4 bg-white dark:bg-gray-800/50 space-y-2">
                          {["A", "B", "C", "D"].map((opt) => (
                            <OptionBadge
                              key={opt}
                              opt={opt}
                              text={options[opt]}
                              isSelected={selected === opt}
                              isCorrect={correct === opt}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all duration-200"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReportList;