import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaDownload, FaArrowLeft, FaSpinner, FaChartLine, FaUsers, FaBookOpen } from "react-icons/fa";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const BatchEvaluation = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [batchDetails, setBatchDetails] = useState({ batchName: "", courseName: "" });
  const [adminId, setAdminId] = useState(null);

  const [evaluation, setEvaluation] = useState(null);
  const [formData, setFormData] = useState({ projectS3Url: "", studentMarks: [] });
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBatchModules = useCallback(async () => {
    if (!token) return navigate("/login");

    try {
      const res = await API.get(`/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const batch = res.data;
      setBatchDetails({ batchName: batch.batchName, courseName: batch.course.courseName });

      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentAdminId = payload.id;

      const adminModules = batch.admins
        .filter((a) => a.admin === currentAdminId)
        .map((a) => a.module);

      if (!adminModules.length) return navigate("/unauthorized");

      setAdminId(currentAdminId);
      setModules(adminModules);
      setSelectedModule(adminModules[0]);
    } catch (err) {
      console.error("Failed to fetch batch modules:", err);
      navigate("/login");
    }
  }, [batchId, navigate, token]);

  const fetchAnswerUrls = async (student, batchName) => {
    try {
      const res = await API.get(`/api/s3-answers/check`, {
        params: {
          batchName,
          studentName: student.user?.name,
          rollNo: student.rollNo,
          module: selectedModule,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      return { projectAnswerUrl: res.data.projectAnswerUrl };
    } catch {
      return { projectAnswerUrl: null };
    }
  };

  const fetchEvaluation = useCallback(async () => {
    if (!selectedModule) return;

    setLoading(true);
    try {
      const res = await API.get(`/api/batch-evaluation/${batchId}/${encodeURIComponent(selectedModule)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let reports = [];
      try {
        const reportRes = await API.get(`/api/reports/batch/${batchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        reports = reportRes.data.filter((r) => r.module === selectedModule);
      } catch (err) {
        console.error("Failed to fetch reports for calculation", err);
      }

      let batchStudents = [];
      try {
        const bsRes = await API.get(`/api/students/my-students?batchId=${batchId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        batchStudents = bsRes.data.students || [];
      } catch (e) {
        console.error("Failed to fetch all batch students", e);
      }

      // Merge existing evaluation marks and missing students
      const mergedMarksMap = new Map();
      res.data.studentMarks.forEach(sm => {
         if (sm.student && sm.student._id) mergedMarksMap.set(sm.student._id, sm);
      });

      batchStudents.forEach(bs => {
         if (!mergedMarksMap.has(bs._id)) {
            mergedMarksMap.set(bs._id, {
               student: { 
                 _id: bs._id, 
                 rollNo: bs.rollNo, 
                 user: { name: bs.name, email: bs.email },
                 phone: bs.phone
               },
               projectMarks: -2
            });
         }
      });

      const allMarks = Array.from(mergedMarksMap.values());

      let studentMarksWithUrls = await Promise.all(
        allMarks.map(async (s) => {
          const answerUrls = await fetchAnswerUrls(s.student, batchDetails.batchName);
          const studentReports = reports.filter(r => r.student?._id === s.student?._id);

          let obtained = 0;
          let possible = 0;
          const categoryTotals = [0,0,0,0,0,0];

          studentReports.forEach(r => {
             (r.marksObtained || []).forEach((m, idx) => {
                if (m >= -2) {
                   possible += 10;
                   if (m >= 0) {
                      obtained += m;
                      if (idx < 6) categoryTotals[idx] += m;
                   }
                }
             });
          });

          const codingMarks = categoryTotals[0];
          const quizMarks = categoryTotals[1];
          const assignmentMarks = categoryTotals[2];
          const seminarMarks = categoryTotals[3];
          const theoryMarks = categoryTotals[4];
          const practicalMarks = categoryTotals[5];

          const internalMarks = Math.round(((codingMarks + quizMarks + assignmentMarks) / 350) * 50);
          const projectMarks = seminarMarks + practicalMarks;
          const externalMarks = projectMarks + theoryMarks;
          const finalScore = internalMarks + externalMarks;

          return { 
            ...s, 
            ...answerUrls, 
            codingMarks, 
            quizMarks, 
            assignmentMarks, 
            internalMarks,
            seminarMarks, 
            theoryMarks, 
            projectMarks,
            practicalMarks, 
            externalMarks,
            finalScore 
          };
        })
      );

      // Sort students based on final score descending
      studentMarksWithUrls.sort((a,b) => b.finalScore - a.finalScore);

      setEvaluation(res.data);
      setFormData({
        projectS3Url: res.data.projectS3Url || "",
        studentMarks: studentMarksWithUrls || [],
      });
      setCurrentPage(1);
    } catch (err) {
      if (err.response?.status === 404) {
        setEvaluation(null);
      } else {
        toast.error("Failed to load evaluation");
      }
    } finally {
      setLoading(false);
    }
  }, [batchId, selectedModule, token, batchDetails.batchName]);

  const createEvaluation = async () => {
    try {
      await API.post(
        `/api/batch-evaluation`,
        {
          batch: batchId,
          module: selectedModule,
          projectS3Url: "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchEvaluation();
    } catch (err) {
      console.error("Evaluation creation failed:", err);
    }
  };

  const handleExportAll = () => {
    const data = formData.studentMarks.map((s) => ({
      Roll: s.student.rollNo,
      Name: s.student.user?.name || "Unknown",
      Phone: s.student.phone || "N/A",
      Email: s.student.user?.email || "N/A",
      Coding: s.codingMarks,
      Quiz: s.quizMarks,
      Assignment: s.assignmentMarks,
      "Internal (50)": s.internalMarks,
      Seminar: s.seminarMarks,
      Theory: s.theoryMarks,
      "Project (30)": s.projectMarks,
      Practical: s.practicalMarks,
      "External (50)": s.externalMarks,
      "Final Score (100)": s.finalScore,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Students");
    XLSX.writeFile(wb, `${batchDetails.batchName}_${selectedModule}_AllStudents.xlsx`);
    toast.success("Export completed!");
  };

  const handleExportAbove70 = () => {
    const data = formData.studentMarks
      .filter((s) => s.finalScore >= 70)
      .map((s) => ({
        Roll: s.student.rollNo,
        Name: s.student.user?.name || "Unknown",
        Phone: s.student.phone || "N/A",
        Email: s.student.user?.email || "N/A",
        Coding: s.codingMarks,
        Quiz: s.quizMarks,
        Assignment: s.assignmentMarks,
        "Internal (50)": s.internalMarks,
        Seminar: s.seminarMarks,
        Theory: s.theoryMarks,
        "Project (30)": s.projectMarks,
        Practical: s.practicalMarks,
        "External (50)": s.externalMarks,
        "Final Score (100)": s.finalScore,
      }));

    if (data.length === 0) return toast.info("No students with final score >= 70");

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Above 70");
    XLSX.writeFile(wb, `${batchDetails.batchName}_${selectedModule}_Above70.xlsx`);
    toast.success("Export completed!");
  };

  useEffect(() => {
    fetchBatchModules();
  }, [fetchBatchModules]);

  useEffect(() => {
    if (selectedModule) {
      fetchEvaluation();
    }
  }, [fetchEvaluation]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = formData.studentMarks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(formData.studentMarks.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading evaluation data...</p>
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
        <div className="max-w-7xl mx-auto">
          {/* Back Button - Enhanced */}
          <button
            onClick={() => navigate('/admin/batches')}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 group"
          >
            <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
            Back to Batches
          </button>

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
                    <FaChartLine className="text-yellow-300" />
                    <span className="text-white text-sm font-medium">Batch Evaluation</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    {batchDetails.courseName}
                  </h1>
                  <p className="text-blue-50 text-sm">
                    {batchDetails.batchName}
                  </p>
                </div>
                
                {/* Stats Badge */}
                <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/30 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FaUsers className="text-green-300 text-xl" />
                    <span className="text-white text-sm font-medium">Students</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formData.studentMarks.length}</p>
                  <p className="text-blue-100 text-xs">Total Enrolled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Module Tabs - Enhanced */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto mb-8">
            <div className="flex gap-1 min-w-max">
              {modules.map((module) => (
                <button
                  key={module}
                  onClick={() => setSelectedModule(module)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    selectedModule === module
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <FaBookOpen className="text-xs" />
                  {module}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6">
              {/* Header with Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                    <FaChartLine className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Evaluation Results
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedModule} module performance
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {!evaluation && (
                    <button
                      onClick={createEvaluation}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
                    >
                      <FaPlus className="text-sm" />
                      Create Evaluation
                    </button>
                  )}

                  {evaluation && (
                    <>
                      <button
                        onClick={handleExportAll}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
                      >
                        <FaDownload className="text-sm group-hover/btn:animate-bounce" />
                        Export All
                      </button>
                      <button
                        onClick={handleExportAbove70}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg group/btn"
                      >
                        <FaDownload className="text-sm" />
                        Export {'>'}70
                      </button>
                    </>
                  )}
                </div>
              </div>

              {evaluation ? (
                <>
                  {formData.projectS3Url && (
                    <a
                      href={formData.projectS3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg text-blue-600 dark:text-cyan-400 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all text-sm border border-blue-200 dark:border-cyan-800"
                    >
                      <FaDownload className="text-xs" />
                      View Uploaded Project
                    </a>
                  )}

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full min-w-[1000px] border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-500 to-cyan-500">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-white">Roll</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-white">Name</th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-white">Code</th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-white">Quiz</th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-white">Assig.</th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-white bg-blue-600/50">Int.</th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-white bg-cyan-600/50">Proj.</th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-white">Thry</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-white bg-blue-700/50">Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((s, idx) => (
                          <tr key={s.student._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all">
                            <td className="px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{s.student.rollNo}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">{s.student.user?.name}</td>
                            <td className="px-2 py-2.5 text-sm text-center text-gray-700 dark:text-gray-300">{s.codingMarks}</td>
                            <td className="px-2 py-2.5 text-sm text-center text-gray-700 dark:text-gray-300">{s.quizMarks}</td>
                            <td className="px-2 py-2.5 text-sm text-center text-gray-700 dark:text-gray-300">{s.assignmentMarks}</td>
                            <td className="px-2 py-2.5 text-sm text-center font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">{s.internalMarks}</td>
                            <td className="px-2 py-2.5 text-sm text-center font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20">{s.projectMarks}</td>
                            <td className="px-2 py-2.5 text-sm text-center text-gray-700 dark:text-gray-300">{s.theoryMarks}</td>
                            <td className="px-3 py-2.5 text-sm text-center font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{s.finalScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {currentItems.map((s) => (
                      <div key={s.student._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{s.student.rollNo}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{s.student.user?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Final Score</p>
                            <p className={`text-2xl font-bold ${
                              s.finalScore >= 70 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent' 
                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'
                            }`}>{s.finalScore}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                            <p className="font-semibold text-blue-600 dark:text-blue-400">Code</p>
                            <p className="font-medium">{s.codingMarks}</p>
                          </div>
                          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2">
                            <p className="font-semibold text-cyan-600 dark:text-cyan-400">Quiz</p>
                            <p className="font-medium">{s.quizMarks}</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                            <p className="font-semibold text-blue-600 dark:text-blue-400">Assig</p>
                            <p className="font-medium">{s.assignmentMarks}</p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-2">
                            <p className="font-semibold text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text">Int</p>
                            <p className="font-bold">{s.internalMarks}</p>
                          </div>
                          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2">
                            <p className="font-semibold text-cyan-600 dark:text-cyan-400">Proj</p>
                            <p className="font-medium">{s.projectMarks}</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                            <p className="font-semibold text-blue-600 dark:text-blue-400">Thry</p>
                            <p className="font-medium">{s.theoryMarks}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination - Enhanced */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 gap-2 flex-wrap">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            currentPage === i + 1
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaChartLine className="text-3xl text-blue-500 dark:text-cyan-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No evaluation data available</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Create Evaluation" to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchEvaluation;