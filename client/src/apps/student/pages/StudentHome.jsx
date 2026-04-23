import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import CalendarWidget from "../widgets/CalendarWidget";
import NotesWidget from '../widgets/NotesWidget';
import CourseProgressWidget from '../widgets/CourseProgressWidget';
import Quotes from '../widgets/Quotes';
import { FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";
import { 
  FaUserGraduate, FaChartLine, FaBookOpen, FaClipboardList, 
  FaCalendarAlt, FaBell, FaTrophy, FaRocket, FaBrain,
  FaCode, FaQuestionCircle, FaFileAlt, FaCheckCircle,
  FaArrowRight, FaStar, FaRegClock, FaMedal, FaFire
} from 'react-icons/fa';
import { MdOutlineEmojiEvents } from 'react-icons/md';

function StudentHome() {
  const [student, setStudent] = useState(null);
  const [date, setDate] = useState(new Date());
  const [latestNote, setLatestNote] = useState(null);
  const [progress, setProgress] = useState({ coding: 0, quiz: 0, assignment: 0 });
  const [reports, setReports] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) return navigate('/');

        await new Promise(resolve => setTimeout(resolve, 800));
        
        const res = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data);
      } catch (err) {
        setError('Failed to load student data');
        console.error('Failed to load student:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate]);

  useEffect(() => {
    const allQuotes = Quotes();
    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    setQuote(allQuotes[randomIndex]);
  }, []);

  useEffect(() => {
    const fetchLatestNote = async () => {
      try {
        if (!student?.batch) return;
        const token = localStorage.getItem('token');

        const batchRes = await API.get(`/student/batch/by-id/${student.batch}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const batch = batchRes.data;
        let latest = null;
        let maxDay = -1;

        for (const adminObj of batch.admins || []) {
          const moduleName = adminObj.module;

          const notesRes = await API.get(`/notes/${batch._id}/${moduleName}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const notes = Array.isArray(notesRes.data) ? notesRes.data : notesRes.data.notes || [];
          const latestModuleNote = notes.reduce((acc, note) => {
            if ((note.day || 0) > (acc?.day || 0)) return note;
            return acc;
          }, null);

          if (latestModuleNote && latestModuleNote.day > maxDay) {
            latest = latestModuleNote;
            maxDay = latestModuleNote.day;
          }
        }

        setLatestNote(latest);
      } catch (err) {
        console.error("Error fetching latest note:", err);
      }
    };

    const fetchProgress = async () => {
      try {
        if (!student?._id) return;
        const token = localStorage.getItem('token');
        const res = await API.get(`/api/progress/${student._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProgress(res.data);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    };

    const fetchReports = async () => {
      try {
        if (!student?._id) return;
        const token = localStorage.getItem('token');
        const res = await API.get(`/api/reports/${student._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    };

    if (student) {
      fetchLatestNote();
      fetchProgress();
      fetchReports();
    }
  }, [student]);

  // Calculate overall progress
  const overallProgress = Math.round((progress.assignment + progress.quiz + progress.coding) / 3);
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="max-w-screen mx-auto">
      <div className="mb-8">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mb-6 animate-pulse"></div>
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/80 dark:bg-gray-800/80 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    </div>
  );

  if (!student) return <p className="text-center mt-6 text-gray-500 dark:text-gray-400">Loading...</p>;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-screen mx-auto">
          <SkeletonLoader />
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
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-red-500 dark:text-red-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Error Loading Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
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
            <div className="relative mb-10 overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                      <FaFire className="text-orange-300" />
                      <span className="text-white text-sm font-medium">{getGreeting()}!</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                      Welcome back, {student.user?.name.split(' ')[0]}!
                    </h1>
                    <p className="text-blue-100 text-base lg:text-lg max-w-2xl">
                      Your learning journey is progressing beautifully. Keep up the great work!
                    </p>
                    
                    {/* Quote Card */}
                    {quote && (
                      <div className="mt-5 bg-white/15 backdrop-blur-md rounded-2xl p-4 max-w-2xl border border-white/20">
                        <div className="flex gap-3">
                          <div className="text-3xl text-yellow-300">"</div>
                          <div>
                            <p className="text-white/95 italic text-sm lg:text-base">{quote.text}</p>
                            <p className="text-blue-100 text-sm mt-2 font-medium">— {quote.author}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Stats Badge */}
                  <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 text-center min-w-[160px] border border-white/20">
                    {/* <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <FaTrophy className="text-2xl text-white" />
                    </div> */}
                    <p className="text-2xl font-bold text-white">{latestNote ? latestNote.day : 'N/A'}</p>
                    <p className="text-blue-100 text-sm">Current Day</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* <SlideUp delay={150}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-cyan-700 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                    <FaBookOpen className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Reports</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{reports.length}</p>
                  </div>
                </div>
              </div>
            </SlideUp> */}
{/* 
            <SlideUp delay={200}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                    <FaChartLine className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Average Score</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{overallProgress}%</p>
                  </div>
                </div>
              </div>
            </SlideUp> */}
{/* 
            <SlideUp delay={250}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                    <FaRegClock className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current Day</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{latestNote ? latestNote.day : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </SlideUp> */}

            {/* <SlideUp delay={300}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                    <FaMedal className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Achievements</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                      {Math.floor(overallProgress / 20)}
                    </p>
                  </div>
                </div>
              </div>
            </SlideUp> */}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols gap-8">
            {/* Left Column - Progress & Activities */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Progress Section */}
              <SlideUp delay={350}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="relative px-6 pt-6 pb-3">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <FaRocket className="text-white text-xs" />
                      </div>
                      Course Progress Overview
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your learning journey across all modules</p>
                  </div>
                  <div className="p-6 pt-2">
                    <CourseProgressWidget progress={overallProgress} />
                  </div>
                </div>
              </SlideUp>

              {/* Performance Metrics Cards */}
              <SlideUp delay={400}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="relative px-6 pt-6 pb-3">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <FaBrain className="text-white text-xs" />
                      </div>
                      Performance Metrics
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Detailed breakdown of your academic performance</p>
                  </div>
                  <div className="p-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Assignment Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 text-center border border-blue-200/50 dark:border-cyan-800/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-cyan-700 group">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                          <FaFileAlt className="text-2xl text-white" />
                        </div>
                        <div className="relative inline-block mb-2">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="4" fill="none" className="text-blue-200 dark:text-blue-800"/>
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress.assignment / 100)}`} className="text-blue-600 dark:text-cyan-400 transition-all duration-1000"/>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-blue-700 dark:text-cyan-300">{progress.assignment}%</span>
                        </div>
                        <p className="text-sm font-semibold text-blue-700 dark:text-cyan-300 mt-2">Assignments</p>
                      </div>

                      {/* Quiz Card */}
                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-6 text-center border border-yellow-200/50 dark:border-yellow-800/50 transition-all hover:shadow-lg hover:border-yellow-300 group">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                          <FaQuestionCircle className="text-2xl text-white" />
                        </div>
                        <div className="relative inline-block mb-2">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="4" fill="none" className="text-yellow-200 dark:text-yellow-800"/>
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress.quiz / 100)}`} className="text-yellow-600 dark:text-yellow-400 transition-all duration-1000"/>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-yellow-700 dark:text-yellow-300">{progress.quiz}%</span>
                        </div>
                        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mt-2">Quizzes</p>
                      </div>

                      {/* Coding Card */}
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-6 text-center border border-purple-200/50 dark:border-purple-800/50 transition-all hover:shadow-lg hover:border-purple-300 group">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                          <FaCode className="text-2xl text-white" />
                        </div>
                        <div className="relative inline-block mb-2">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="4" fill="none" className="text-purple-200 dark:text-purple-800"/>
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress.coding / 100)}`} className="text-purple-600 dark:text-purple-400 transition-all duration-1000"/>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-purple-700 dark:text-purple-300">{progress.coding}%</span>
                        </div>
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mt-2">Coding Tasks</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SlideUp>

              {/* Latest Activity */}
              {latestNote && (
                <SlideUp delay={450}>
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="relative px-6 pt-6 pb-3">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <FaStar className="text-white text-xs" />
                        </div>
                        Latest Activity
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your most recent learning material</p>
                    </div>
                    <div className="p-6 pt-2">
                      <div className="relative overflow-hidden rounded-xl p-6 border border-blue-200/50 dark:border-cyan-800/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl bg-blue-500/10"></div>
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 bg-blue-100 dark:bg-blue-900/30">
                              <FaRegClock className="text-blue-600 dark:text-cyan-400 text-xs" />
                              <span className="text-xs font-medium text-blue-700 dark:text-cyan-300">Day {latestNote.day}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{latestNote.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">New lesson available for you to explore and learn</p>
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            <a
                              href={latestNote.meetlink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                              </svg>
                              Join Meet
                            </a>
                            <a
                              href={latestNote.quizlink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                              </svg>
                              Take Quiz
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SlideUp>
              )}

              {/* Academic Performance Table */}
              {reports.length > 0 && (
                <SlideUp delay={500}>
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="relative px-6 pt-6 pb-3">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <FaClipboardList className="text-white text-xs" />
                        </div>
                        Academic Performance
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Detailed record of your assignments and assessments</p>
                    </div>
                    <div className="p-6 pt-2 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Module</th>
                            <th className="px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Day</th>
                            <th className="px-4 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">Code</th>
                            <th className="px-4 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">Quiz</th>
                            <th className="px-4 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">Assignment</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {[...reports]
                            .sort((a, b) => b.day - a.day)
                            .map((report, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-4 text-gray-800 dark:text-gray-200 font-medium">{report.module}</td>
                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium">
                                    {report.day}
                                  </span>
                                </td>
                                {report.marksObtained.slice(0,3).map((mark, i) => (
                                  <td className="px-4 py-4 text-center" key={i}>
                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium min-w-[90px] ${
                                      mark === -3 || mark === -2
                                        ?"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                                        : mark === -1 || mark === -4
                                        ?  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                        : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                    }`}>
                                      {mark === -2 ? "Not Submitted" : mark === -1 ? "Pending" : mark === -4 ? "Yet to Attend" : mark === -3 ? "Yet to Assign" : `${mark}%`}
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SlideUp>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Calendar Section */}
              {/* <SlideUp delay={150}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="relative px-6 pt-6 pb-3">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <FaCalendarAlt className="text-white text-xs" />
                      </div>
                      Calendar
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Stay organized with your schedule</p>
                  </div>
                  <div className="p-5 pt-2">
                    <CalendarWidget date={date} setDate={setDate} />
                  </div>
                </div>
              </SlideUp> */}

              {/* Reminders Section */}
              {/* <SlideUp delay={200}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="relative px-6 pt-6 pb-3">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <FaBell className="text-white text-xs" />
                      </div>
                      Reminders
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Important notes and deadlines</p>
                  </div>
                  <div className="p-5 pt-2">
                    <NotesWidget studentId={student._id} />
                  </div>
                </div>
              </SlideUp> */}

              {/* Quick Stats */}
            {/* <SlideUp delay={250}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="relative px-6 pt-6 pb-3">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <MdOutlineEmojiEvents className="text-white text-xs" />
                      </div>
                      Quick Stats
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your learning snapshot</p>
                  </div>
                  <div className="p-5 pt-2 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-cyan-800/50">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-blue-200 dark:text-blue-800"/>
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - overallProgress / 100)}`} className="text-blue-600 dark:text-cyan-400 transition-all duration-1000"/>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-cyan-300">{overallProgress}%</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">Keep Going!</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600 dark:text-cyan-400">{reports.length}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Reports</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FaCheckCircle className="text-blue-600 dark:text-cyan-400 text-sm" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed Tasks</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600 dark:text-cyan-400">
                          {reports.filter(r => !r.marksObtained.some(m => m === -2 || m === -1)).length}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                            <FaStar className="text-yellow-600 dark:text-yellow-400 text-sm" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Best Score</span>
                        </div>
                        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {Math.max(...reports.flatMap(r => r.marksObtained.filter(m => m >= 0)), 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </SlideUp> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;