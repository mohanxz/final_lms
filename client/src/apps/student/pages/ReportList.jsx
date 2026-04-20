import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { 
  FaClipboardList, FaCheckCircle, FaTimesCircle, FaChartLine, 
  FaCalendarAlt, FaBookOpen, FaFilter, FaTimes,
  FaEye, FaTrophy, FaMedal, FaStar, FaAward, FaPercentage,
  FaArrowRight, FaBrain, FaClock, FaUserGraduate, FaChevronRight,
  FaLightbulb, FaList, FaLayerGroup, FaGraduationCap, FaExpand,
  FaCompress
} from "react-icons/fa";
import { MdOutlineQuiz, MdOutlineSpeed, MdOutlineDateRange } from "react-icons/md";
import { FadeIn, SlideUp } from "../../../shared/LoadingComponents";

const ReportListSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
    <div className="max-w-screen mx-auto">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6 animate-pulse"></div>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded-xl w-48 animate-pulse"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded-xl w-48 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl animate-pulse">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                  <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

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

  useEffect(() => {
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
        setError("Failed to load quiz reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

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

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return { bg: '#22c55e', light: '#dcfce7', text: '#166534' };
    if (percentage >= 60) return { bg: '#f59e0b', light: '#fed7aa', text: '#9a3412' };
    return { bg: '#ef4444', light: '#fee2e2', text: '#991b1b' };
  };

  const getScoreGrade = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { grade: 'A+', icon: FaAward, label: 'Excellent' };
    if (percentage >= 80) return { grade: 'A', icon: FaStar, label: 'Very Good' };
    if (percentage >= 70) return { grade: 'B', icon: FaStar, label: 'Good' };
    if (percentage >= 60) return { grade: 'C', icon: FaMedal, label: 'Satisfactory' };
    if (percentage >= 50) return { grade: 'D', icon: FaChartLine, label: 'Needs Improvement' };
    return { grade: 'F', icon: FaTimesCircle, label: 'Poor' };
  };

  const getOverallStats = () => {
    if (reports.length === 0) return null;
    const totalScore = reports.reduce((acc, r) => acc + (r.score || 0), 0);
    const totalPossible = reports.reduce((acc, r) => acc + (r.total || 1), 0);
    const overallPercentage = (totalScore / totalPossible) * 100;
    const bestScore = Math.max(...reports.map(r => (r.score / r.total) * 100));
    const averageScore = overallPercentage;
    
    return { overallPercentage, bestScore, averageScore, totalQuizzes: reports.length };
  };

  // Calculate correct and wrong answers for the current quiz
  const getQuizStats = () => {
    if (!quizDetail) return { correct: 0, wrong: 0, total: 0 };
    const correct = quizDetail.score;
    const total = quizDetail.total;
    const wrong = total - correct;
    return { correct, wrong, total };
  };

  if (loading) return <ReportListSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-screen mx-auto">
          <FadeIn>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md mx-auto border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Error Loading Reports</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Try Again
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  const uniqueModules = ["All", ...new Set(reports.map((r) => r.module))];
  const uniqueDays = ["All", ...new Set(reports.map((r) => r.day))];
  const overallStats = getOverallStats();
  const quizStats = getQuizStats();

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
          {/* Header Section */}
          <FadeIn delay={100}>
            <div className="relative mb-8 overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                      <MdOutlineQuiz className="text-yellow-300" />
                      <span className="text-white text-sm font-medium">Quiz Performance Dashboard</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-sm">
                      Quiz Reports
                    </h1>
                    <p className="text-blue-100 text-base lg:text-lg max-w-2xl">
                      Track your quiz performance, review answers, and monitor your progress across all modules.
                    </p>
                  </div>
                  
                  {overallStats && (
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 text-center min-w-[180px] border border-white/20 shadow-lg group hover:bg-white/20 transition-all duration-300">
                      <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FaTrophy className="text-2xl text-white" />
                      </div>
                      <p className="text-2xl font-bold text-white">{overallStats.overallPercentage.toFixed(1)}%</p>
                      <p className="text-blue-100 text-sm">Overall Average</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Filter Section */}
          <SlideUp delay={350}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden mb-8">
              <div className="relative px-6 pt-6 pb-3">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FaFilter className="text-white text-xs" />
                  </div>
                  Filter Reports
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Filter by module or day to find specific reports</p>
              </div>
              <div className="p-6 pt-2">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaBookOpen className="inline mr-2 text-blue-500 dark:text-cyan-400" /> Module
                    </label>
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      {uniqueModules.map((mod, idx) => (
                        <option key={idx} value={mod}>
                          {mod === "All" ? "All Modules" : `Module: ${mod}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <MdOutlineDateRange className="inline mr-2 text-blue-500 dark:text-cyan-400" /> Day
                    </label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
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
          <SlideUp delay={400}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="relative px-6 pt-6 pb-3">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-600 rounded-l-2xl"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <FaClipboardList className="text-white text-xs" />
                  </div>
                  Quiz Attempts
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {filteredReports.length} quiz{filteredReports.length !== 1 ? 'zes' : ''} found
                </p>
              </div>
              <div className="p-6 pt-2">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12">
                    <MdOutlineQuiz className="text-5xl mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">No quiz reports found matching your filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReports.map((report, index) => {
                      const scorePercentage = Math.min(((report.score || 0) / (report.total || 1)) * 100, 100);
                      const scoreColor = getScoreColor(report.score || 0, report.total || 1);
                      const gradeInfo = getScoreGrade(report.score || 0, report.total || 1);
                      const GradeIcon = gradeInfo.icon;
                      
                      return (
                        <div
                          key={index}
                          className="group relative overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-white dark:bg-gray-800/50"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative p-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                    <MdOutlineQuiz className="text-white text-xl" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                      Module: {report.module}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                      <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <MdOutlineDateRange className="text-gray-400 text-xs" />
                                        <span>Day {report.day}</span>
                                      </div>
                                      <div className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded-full`} style={{ backgroundColor: scoreColor.light, color: scoreColor.text }}>
                                        <GradeIcon className="text-xs" />
                                        <span className="font-medium">{gradeInfo.grade} - {gradeInfo.label}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Score Display */}
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <FaChartLine style={{ color: scoreColor.bg }} />
                                      <span className="font-semibold" style={{ color: scoreColor.text }}>
                                        Score: {report.score} / {report.total}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        ({scorePercentage.toFixed(1)}%)
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400">Accuracy Rate</span>
                                  </div>
                                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                                      style={{ 
                                        width: `${scorePercentage}%`, 
                                        backgroundColor: scoreColor.bg,
                                        boxShadow: `0 0 8px ${scoreColor.bg}`
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => openModal(report.noteId)}
                                className="group/btn relative px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 shadow-md overflow-hidden"
                              >
                                <span className="relative z-10 flex items-center gap-2">
                                  <FaEye className="text-sm" />
                                  Review Quiz
                                  <FaChevronRight className="text-sm group-hover/btn:translate-x-1 transition-transform" />
                                </span>
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

      {/* Full-Screen Modal */}
      {modalOpen && quizDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden">
          <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full h-full flex flex-col transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4'}`}>
            {/* Sticky Header */}
            <div className="relative bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl flex-shrink-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -ml-40 -mb-40"></div>
              
              <div className="relative px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                      <MdOutlineQuiz className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Quiz Review</h3>
                      <p className="text-blue-100 text-sm mt-0.5">Comprehensive answer analysis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleFullscreen}
                      className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200 transform hover:scale-110"
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? <FaCompress className="text-xl" /> : <FaExpand className="text-xl" />}
                    </button>
                    <button
                      onClick={closeModal}
                      className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200 transform hover:scale-110"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Questions Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <FaBrain className="text-purple-400 text-xl" />
                    </div>
                    <h4 className="text-xl font-bold text-white">Question Review</h4>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium">
                    {quizDetail.detail.length} Questions
                  </div>
                </div>
                
                <div className="space-y-4">
                  {quizDetail.detail.map((item, idx) => {
                    const { question, options, selected, correct } = item;
                    const isCorrect = selected === correct;
                    
                    return (
                      <div key={idx} className={`rounded-xl overflow-hidden transition-all duration-300 ${isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'} bg-gray-800/30`}>
                        {/* Question Header */}
                        <div className={`p-4 ${isCorrect ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                              isCorrect ? 'bg-green-500' : 'bg-red-500'
                            } text-white`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                <span className="text-xs text-gray-500">Question {idx + 1}</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  isCorrect 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>
                              <p className="text-base text-white leading-relaxed">
                                {question}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Options */}
                        <div className="p-4 space-y-2">
                          {["A", "B", "C", "D"].map((opt) => {
                            const isSelected = selected === opt;
                            const isCorrectOpt = correct === opt;
                            
                            let bgColor = 'bg-gray-900/30';
                            let borderColor = 'border-gray-700';
                            let textColor = 'text-gray-300';
                            
                            if (isSelected && isCorrectOpt) {
                              bgColor = 'bg-green-500/20';
                              borderColor = 'border-green-500';
                              textColor = 'text-green-400';
                            } else if (isSelected && !isCorrectOpt) {
                              bgColor = 'bg-red-500/20';
                              borderColor = 'border-red-500';
                              textColor = 'text-red-400';
                            } else if (isCorrectOpt) {
                              bgColor = 'bg-green-500/10';
                              borderColor = 'border-green-500/30';
                              textColor = 'text-green-300';
                            }
                            
                            return (
                              <div
                                key={opt}
                                className={`p-3 rounded-lg border ${borderColor} ${bgColor}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                                    isCorrectOpt ? 'bg-green-500 text-white' : 
                                    isSelected ? 'bg-red-500 text-white' : 
                                    'bg-gray-700 text-gray-400'
                                  }`}>
                                    {opt}
                                  </div>
                                  <span className={`flex-1 text-sm ${textColor}`}>{options[opt]}</span>
                                  {isSelected && (
                                    <span>
                                      {isCorrectOpt ? (
                                        <FaCheckCircle className="text-green-500" />
                                      ) : (
                                        <FaTimesCircle className="text-red-500" />
                                      )}
                                    </span>
                                  )}
                                  {!isSelected && isCorrectOpt && (
                                    <span className="text-xs text-green-400">✓ Correct</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-700 bg-gray-900/50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                <FaTimes />
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;