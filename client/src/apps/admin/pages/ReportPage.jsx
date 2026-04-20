import React, { useState, useEffect, useCallback } from "react";
import { 
  FaSearch, FaThList, FaThLarge, FaFilter, FaDownload, 
  FaChartLine, FaUserGraduate, FaCheckCircle, FaClock, 
  FaExclamationTriangle, FaSpinner, FaStar, FaTrophy,
  FaCode, FaComments, FaBook, FaFlask,
  FaChevronDown, FaChevronUp, FaLink
} from "react-icons/fa";
import { MdGrade, MdAssignment, MdQuiz } from "react-icons/md";
import { useParams } from "react-router-dom";
import API from "../api"; 

const ReportPage = () => {
  const { batchId } = useParams();
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedMarksFilter, setSelectedMarksFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("Coding");
  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState([]);
  const [viewType, setViewType] = useState("table");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  
  // Categories - Assignment is READ-ONLY
  const categories = [
    { name: "Coding", icon: FaCode, color: "from-blue-500 to-cyan-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-700 dark:text-blue-400", editable: false, maxMarks: 10 },
    { name: "Quiz", icon: MdQuiz, color: "from-cyan-500 to-teal-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", textColor: "text-cyan-700 dark:text-cyan-400", editable: false, maxMarks: 10 },
    { name: "Assignment", icon: MdAssignment, color: "from-indigo-500 to-blue-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30", textColor: "text-indigo-700 dark:text-indigo-400", editable: false, maxMarks: 100 },
    { name: "Seminar", icon: FaComments, color: "from-purple-500 to-pink-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-700 dark:text-purple-400", editable: true, maxMarks: 10 },
    { name: "Theory", icon: FaBook, color: "from-teal-500 to-cyan-600", bgColor: "bg-teal-100 dark:bg-teal-900/30", textColor: "text-teal-700 dark:text-teal-400", editable: false, maxMarks: 10 },
    { name: "Practical", icon: FaFlask, color: "from-emerald-500 to-teal-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", textColor: "text-emerald-700 dark:text-emerald-400", editable: false, maxMarks: 10 }
  ];
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchReports();
    fetchNotes();
  }, [batchId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/reports/batch/${batchId}`);
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Only editable for Seminar
  const updateMark = async (studentId, day, category, marksObtained, module) => {
    try {
      let parsedMarks = parseInt(marksObtained);
      if (isNaN(parsedMarks)) parsedMarks = 0;
      
      await API.post("/api/reports/add", 
        { studentId, quizType: category, day, marksObtained: parsedMarks, module }
      );
      setEditing(null);
      fetchReports();
    } catch (err) {
      console.error("Failed to update mark", err);
    }
  };

  const fetchNotes = async () => {
    try {
      const parts = token ? token.split(".") : [];
      if (parts.length < 2) return;
      const payload = JSON.parse(atob(parts[1]));
      const adminId = payload.id;

      const batchRes = await API.get(`/api/admin-batches/${batchId}`);
      const adminModules = batchRes.data.admins
        .filter((a) => a.admin === adminId)
        .map((a) => a.module);

      const allNotes = [];
      for (const mod of adminModules) {
        try {
          const noteRes = await API.get(`/notes/${batchId}/${encodeURIComponent(mod)}`);
          allNotes.push(...noteRes.data);
        } catch {}
      }
      setNotes(allNotes);
    } catch (err) {
      console.error("Error fetching notes", err);
    }
  };

  const lessonPlanDays = Array.from(new Set(notes.map((n) => n.day))).sort((a, b) => a - b);

  const displayDays = React.useMemo(() => {
    let filteredNotes = notes;
    const categoryMap = {
      "Theory": "theory",
      "Practical": "practical",
      "Seminar": "seminar"
    };
    const filterType = categoryMap[selectedCategory];
    if (filterType) {
      filteredNotes = notes.filter(n => n.type === filterType);
    }
    return Array.from(new Set(filteredNotes.map((n) => n.day))).sort((a, b) => a - b);
  }, [notes, selectedCategory]);

  const days = ["All", ...displayDays.map((d) => `Day ${d}`)];
  const moduleOptions = ["All", ...Array.from(new Set(reports.map((r) => r.module)))];

  const getMarksStatus = (report) => {
    if (!report) return { status: "Not uploaded", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: FaExclamationTriangle };
    
    const marksObtained = report.marksObtained || [];
    const weeklyAssignments = report.weeklyAssignments || {};
    
    const hasAssignments = Object.keys(weeklyAssignments).length > 0;
    const hasMarks = marksObtained.some(m => m >= 0);
    const hasPending = marksObtained.some(m => m === -1);
    const hasNotUploaded = marksObtained.some(m => m === -2);
    
    if (hasAssignments && !hasMarks && !hasPending) return { status: "Submitted (Pending)", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: FaClock };
    if (hasMarks) return { status: "Evaluated", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: FaCheckCircle };
    if (hasPending) return { status: "Pending Evaluation", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: FaClock };
    if (hasNotUploaded) return { status: "Not Uploaded", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: FaExclamationTriangle };
    
    return { status: "Not Assigned", color: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400", icon: FaSpinner };
  };

  const filtered = reports.filter((s) => {
    const studentName = s.student?.user?.name || "Unknown";
    const matchesName = studentName.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedDay === "All" || `Day ${s.day}` === selectedDay;
    const matchesModule = selectedModule === "All" || s.module === selectedModule;
    const statusInfo = getMarksStatus(s);
    const matchesMarks = selectedMarksFilter === "All" || statusInfo.status === selectedMarksFilter;
    return matchesName && matchesDay && matchesModule && matchesMarks;
  });

  const currentActivityStats = React.useMemo(() => {
    if (reports.length === 0) return { latestDay: null, counts: {}, totalStudents: 0 };
    const relevantReports = selectedModule === "All" ? reports : reports.filter((r) => r.module === selectedModule);
    if (relevantReports.length === 0) return { latestDay: null, counts: {}, totalStudents: 0 };
    
    let latestDay = lessonPlanDays.length > 0 
      ? lessonPlanDays[lessonPlanDays.length - 1] 
      : Math.max(...relevantReports.map((r) => r.day));

    const latestReports = relevantReports.filter((r) => r.day === latestDay);
    
    const counts = {};
    categories.forEach((cat, index) => {
      if (cat.name === "Assignment") {
        counts[cat.name] = latestReports.filter((r) => {
          const assignments = r.weeklyAssignments || {};
          return Object.keys(assignments).length > 0;
        }).length;
      } else {
        counts[cat.name] = latestReports.filter((r) => r.marksObtained && r.marksObtained[index] >= -1).length;
      }
    });
    
    const uniqueStudentCount = new Set(
      relevantReports.map((r) => r.student?._id).filter(Boolean)
    ).size;

    return { latestDay, counts, totalStudents: uniqueStudentCount };
  }, [reports, selectedModule, lessonPlanDays]);

  const getMarkDisplay = (mark) => {
    if (mark >= 0) return mark;
    if (mark === -1) return { text: "NE", tooltip: "Not Evaluated", color: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30" };
    if (mark === -2) return { text: "NU", tooltip: "Not Uploaded", color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30" };
    if (mark === -3) return { text: "YTA", tooltip: "Yet to Assign", color: "text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-700/50" };
    return { text: "—", tooltip: "No data", color: "text-gray-400 bg-gray-50 dark:text-gray-500 dark:bg-gray-700/30" };
  };

  // ✅ Assignment display - READ-ONLY
  const getAssignmentDisplay = (weeklyAssignments) => {
    const assignments = weeklyAssignments || {};
    const values = Object.values(assignments);
    
    if (values.length === 0) {
      return { text: "NU", tooltip: "Not Submitted", color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30", hasDriveLink: false, assignments: [] };
    }
    
    const evaluated = values.filter(a => a.status === "evaluated");
    if (evaluated.length > 0) {
      const marks = evaluated.map(a => a.marks).join(",");
      return { text: marks, tooltip: `Auto Score: ${marks}`, color: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30", hasDriveLink: true, assignments: values };
    }
    
    const pending = values.filter(a => a.status === "pending");
    if (pending.length > 0) {
      return { text: "P", tooltip: "Pending Evaluation", color: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30", hasDriveLink: true, assignments: values };
    }
    
    return { text: "S", tooltip: "Submitted", color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30", hasDriveLink: true, assignments: values };
  };

  const StatusBadge = ({ statusInfo }) => {
    const Icon = statusInfo.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <Icon size={10} />
        {statusInfo.status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <FaUserGraduate className="text-blue-500" />
                <span>Reports</span>
                <FaChevronDown size={10} />
                <span>Student Performance</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Performance Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track and evaluate student progress across all activities
              </p>
            </div>
            
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700">
                <FaDownload className="text-blue-500" />
                <span className="text-sm font-medium">Export Report</span>
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
              >
                <FaFilter className="text-blue-500" />
                <span className="text-sm font-medium">Filters</span>
                {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {currentActivityStats.latestDay && (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <FaChartLine size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.latestDay}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Current Day</p>
                <p className="text-2xl font-bold mt-1">Day {currentActivityStats.latestDay}</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <FaUserGraduate size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.totalStudents}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Total Students</p>
                <p className="text-2xl font-bold mt-1">{currentActivityStats.totalStudents}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <FaCode size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.counts["Coding"] || 0}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Coding</p>
                <p className="text-xs opacity-75 mt-1">Submissions</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <MdQuiz size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.counts["Quiz"] || 0}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Quiz</p>
                <p className="text-xs opacity-75 mt-1">Submissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <MdAssignment size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.counts["Assignment"] || 0}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Assignment</p>
                <p className="text-xs opacity-75 mt-1">Submissions</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <FaComments size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.counts["Seminar"] || 0}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Seminar</p>
                <p className="text-xs opacity-75 mt-1">Submissions</p>
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <FaBook size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.counts["Theory"] || 0}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Theory</p>
                <p className="text-xs opacity-75 mt-1">Submissions</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <FaFlask size={20} className="opacity-90" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {currentActivityStats.counts["Practical"] || 0}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">Practical</p>
                <p className="text-xs opacity-75 mt-1">Submissions</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white/80 backdrop-blur-md dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-all border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaSearch className="inline mr-2 text-blue-500" /> Search Student
                </label>
                <input
                  type="text"
                  placeholder="Enter student name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Module</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                >
                  {moduleOptions.map((module) => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={selectedMarksFilter}
                  onChange={(e) => setSelectedMarksFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                >
                  <option value="All">All</option>
                  <option value="Not Uploaded">Not Uploaded</option>
                  <option value="Pending Evaluation">Pending Evaluation</option>
                  <option value="Submitted (Pending)">Submitted (Pending)</option>
                  <option value="Not Assigned">Not Assigned</option>
                  <option value="Evaluated">Evaluated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`group px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg transform scale-105`
                      : 'bg-white/80 backdrop-blur-md dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {cat.name}
                  {currentActivityStats.latestDay && (
                    <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-white/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {currentActivityStats.counts[cat.name] || 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewType("table")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                viewType === "table" 
                  ? "bg-white/80 backdrop-blur-md dark:bg-gray-700 shadow-md text-blue-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaThList /> Table View
            </button>
            <button
              onClick={() => setViewType("card")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                viewType === "card" 
                  ? "bg-white/80 backdrop-blur-md dark:bg-gray-700 shadow-md text-blue-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaThLarge /> Card View
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* TABLE VIEW */}
        {!loading && viewType === "table" && (
          <div className="bg-white/80 backdrop-blur-md dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold sticky left-0 bg-inherit z-10">
                      Student
                    </th>
                    {displayDays.map(day => (
                      <th key={day} className="px-4 py-4 text-center text-sm font-semibold whitespace-nowrap">
                        Day {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(() => {
                    const studentMap = {};
                    filtered.forEach(r => {
                      const sid = r.student?._id;
                      if (!sid) return;
                      if (!studentMap[sid]) {
                        studentMap[sid] = {
                          name: r.student?.user?.name || "Unknown",
                          days: {},
                          module: r.module,
                          _id: sid,
                          email: r.student?.user?.email
                        };
                      }
                      studentMap[sid].days[r.day] = {
                        marksObtained: r.marksObtained,
                        weeklyAssignments: r.weeklyAssignments
                      };
                    });

                    const allDays = displayDays;
                    const catIndex = categories.findIndex(c => c.name === selectedCategory);
                    const currentCategory = categories[catIndex];
                    const isEditableCategory = currentCategory?.editable === true;

                    return Object.values(studentMap).length > 0 ? (
                      Object.values(studentMap).map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 sticky left-0 bg-white/80 backdrop-blur-md dark:bg-gray-800 z-10">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                            </div>
                          </td>
                          {allDays.map(day => {
                            const dayData = s.days[day];
                            
                            // ASSIGNMENT CATEGORY - READ-ONLY
                            if (selectedCategory === "Assignment") {
                              const assignments = dayData?.weeklyAssignments || {};
                              const assignmentInfo = getAssignmentDisplay(assignments);
                              
                              return (
                                <td key={day} className="px-4 py-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-lg font-semibold text-sm ${assignmentInfo.color}`}>
                                      {assignmentInfo.text}
                                    </span>
                                    {assignmentInfo.assignments?.map((a, idx) => (
                                      a.driveLink && (
                                        <button
                                          key={idx}
                                          onClick={() => window.open(a.driveLink, "_blank")}
                                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                          title="View Drive Link"
                                        >
                                          <FaLink size={10} />
                                          <span>Link</span>
                                        </button>
                                      )
                                    ))}
                                  </div>
                                </td>
                              );
                            } else {
                              // Handle other categories (Coding, Quiz, Seminar, Theory, Practical)
                              const marks = dayData?.marksObtained || [];
                              const mark = marks[catIndex] !== undefined ? marks[catIndex] : -2;
                              const markInfo = getMarkDisplay(mark);
                              const isEditingCell = editing && editing.studentId === s._id && editing.day === day && editing.category === selectedCategory;
                              
                              if (isEditingCell) {
                                return (
                                  <td key={day} className="px-4 py-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max={currentCategory?.maxMarks || 10}
                                      className="w-16 px-2 py-1 border border-blue-500 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      value={editing.value}
                                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          updateMark(editing.studentId, editing.day, editing.category, editing.value, s.module);
                                        }
                                      }}
                                      autoFocus
                                    />
                                  </td>
                                );
                              }
                              
                              return (
                                <td key={day} className="px-4 py-3 text-center">
                                  <div 
                                    className={`inline-block ${isEditableCategory ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                                    onClick={() => isEditableCategory && setEditing({ 
                                      studentId: s._id, 
                                      day, 
                                      category: selectedCategory, 
                                      value: mark >= 0 ? mark : 0, 
                                      module: s.module 
                                    })}
                                  >
                                    {typeof markInfo === 'object' ? (
                                      <span className={`inline-flex items-center justify-center w-10 h-8 rounded-lg font-semibold text-sm ${markInfo.color}`}>
                                        {markInfo.text}
                                      </span>
                                    ) : (
                                      <span className={`inline-flex items-center justify-center w-10 h-8 ${currentCategory?.bgColor} ${currentCategory?.textColor} rounded-lg font-bold text-sm`}>
                                        {markInfo}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            }
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={allDays.length + 1} className="text-center py-12 text-gray-500">
                          No records found
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CARD VIEW */}
        {!loading && viewType === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length > 0 ? (
              filtered.map((s, idx) => {
                const studentName = s.student?.user?.name || "Unknown";
                const marks = s.marksObtained || [];
                const assignments = s.weeklyAssignments || {};
                
                const total = marks.reduce((acc, m) => acc + (m >= 0 ? m : 0), 0);
                const maxPossibleMarks = 60;
                const percentage = Math.round((total / maxPossibleMarks) * 100);
                const statusInfo = getMarksStatus(s);
                const assignmentInfo = getAssignmentDisplay(assignments);

                return (
                  <div key={idx} className="group bg-white/80 backdrop-blur-md dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-blue-100 transition-colors">
                              {studentName}
                            </h3>
                            <p className="text-xs text-blue-100 font-mono">{s.module}</p>
                          </div>
                        </div>
                        <StatusBadge statusInfo={statusInfo} />
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="text-center mb-5">
                        <div className="inline-flex items-baseline gap-1">
                          <span className="text-4xl font-black text-blue-500">{total}</span>
                          <span className="text-sm text-gray-400">/{maxPossibleMarks}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <FaStar className="text-yellow-400 text-xs" />
                          <p className="text-xs text-gray-500">Total Marks</p>
                        </div>
                      </div>

                      <div className="mb-5">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold text-blue-500">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {categories.map((cat, idx) => {
                          const Icon = cat.icon;
                          
                          if (cat.name === "Assignment") {
                            return (
                              <div key={cat.name} className="text-center p-2 rounded-lg">
                                <Icon className={`mx-auto mb-1 ${assignmentInfo.text !== "NU" ? cat.textColor : 'text-gray-400'}`} size={16} />
                                <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">{cat.name}</p>
                                <div className="flex flex-col items-center gap-1">
                                  <p className={`text-sm font-bold ${assignmentInfo.text !== "NU" ? cat.textColor : 'text-gray-400'}`}>
                                    {assignmentInfo.text}
                                  </p>
                                </div>
                              </div>
                            );
                          } else {
                            const mark = marks[idx];
                            const markInfo = getMarkDisplay(mark);
                            const isEditable = cat.name === "Seminar";
                            
                            return (
                              <div 
                                key={cat.name}
                                className={`text-center p-2 rounded-lg transition-all ${
                                  isEditable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                                }`}
                                onClick={() => isEditable && setEditing({ 
                                  studentId: s.student?._id, 
                                  day: s.day, 
                                  category: cat.name, 
                                  value: mark >= 0 ? mark : 0, 
                                  module: s.module 
                                })}
                              >
                                <Icon className={`mx-auto mb-1 ${mark >= 0 ? cat.textColor : 'text-gray-400'}`} size={16} />
                                <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">{cat.name}</p>
                                {editing && editing.studentId === s.student?._id && editing.day === s.day && editing.category === cat.name ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={cat.maxMarks}
                                    className="w-12 text-center text-xs border border-blue-500 rounded mx-auto px-1 py-0.5"
                                    value={editing.value}
                                    onChange={(e) => setEditing({...editing, value: e.target.value})}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        updateMark(editing.studentId, editing.day, editing.category, editing.value, editing.module);
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <p className={`text-sm font-bold ${
                                    mark >= 0 ? cat.textColor : 'text-gray-400'
                                  }`}>
                                    {typeof markInfo === 'object' ? markInfo.text : markInfo}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <FaSearch className="text-3xl text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No records found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;