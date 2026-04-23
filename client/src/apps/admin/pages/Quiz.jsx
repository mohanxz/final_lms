import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import {
  FaPlus,
  FaEdit,
  FaTimes,
  FaFileUpload,
  FaTrash,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaQuestionCircle,
  FaLightbulb,
  FaArrowLeft,
  FaFire,
  FaLayerGroup,
  FaChartLine,
  FaSpinner,
  FaBookOpen,
  FaTrophy,
  FaAward,
  FaRocket,
} from "react-icons/fa";
import { MdOutlineQuiz, MdOutlineMenuBook } from "react-icons/md";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 lg:p-8">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-32 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl animate-pulse"></div>
      </div>
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex-shrink-0"
          ></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 animate-pulse"
          >
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AdminQuizzes() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [adminId, setAdminId] = useState("");
  const [batchDetails, setBatchDetails] = useState({});
  const [loading, setLoading] = useState({
    notes: false,
    modules: false,
    upload: false,
    batch: false,
  });
  const [uploadErrors, setUploadErrors] = useState([]);
  const [showExcelSection, setShowExcelSection] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: { A: "", B: "", C: "", D: "" },
    answer: "A",
  });

  const [editIndex, setEditIndex] = useState(null);

  /* ---------------- FETCH BATCH DETAILS ---------------- */
  const fetchBatchDetails = useCallback(async () => {
    setLoading((prev) => ({ ...prev, batch: true }));
    try {
      const res = await API.get(`/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatchDetails({
        batchName: res.data.batchName,
        courseName: res.data.course.courseName,
        studentCount: res.data.students?.length || 0,
      });
    } catch (err) {
      console.error("Failed to fetch batch details", err);
    } finally {
      setLoading((prev) => ({ ...prev, batch: false }));
    }
  }, [batchId, token]);

  /* ---------------- FETCH MODULES ---------------- */
  const fetchModules = useCallback(async () => {
    setLoading((prev) => ({ ...prev, modules: true }));
    try {
      const res = await API.get(`/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!token) {
        toast.error("No authentication token found");
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const id = payload.id;
        setAdminId(id);

        const adminModules = res.data.admins
          .filter((a) => a.admin === id)
          .map((a) => a.module);

        setModules(adminModules);
        if (adminModules.length > 0) {
          setSelectedModule(adminModules[0]);
        }
      } catch (tokenError) {
        console.error("Failed to parse token:", tokenError);
        toast.error("Authentication error");
      }
    } catch (err) {
      console.error("Failed to fetch modules", err);
      toast.error("Failed to load modules");
    } finally {
      setLoading((prev) => ({ ...prev, modules: false }));
    }
  }, [batchId, token]);

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = useCallback(async () => {
    if (!selectedModule) return;

    setLoading((prev) => ({ ...prev, notes: true }));
    try {
      const res = await API.get(
        `/notes/${batchId}/${encodeURIComponent(selectedModule)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Filter out practical and seminar notes as they don't have quizzes
      const filteredNotes = res.data.filter(
        (note) => note.type !== "practical" && note.type !== "seminar",
      );
      setNotes(filteredNotes);
      await fetchQuizzes(filteredNotes);
    } catch (err) {
      console.error("Failed to fetch notes", err);
      toast.error("Failed to fetch notes");
    } finally {
      setLoading((prev) => ({ ...prev, notes: false }));
    }
  }, [batchId, selectedModule, token]);

  /* ---------------- FETCH QUIZZES ---------------- */
  const fetchQuizzes = async (noteList) => {
    const result = {};

    await Promise.all(
      noteList.map(async (note) => {
        try {
          const { data } = await API.get(`/api/quiz/by-note/${note._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          result[note._id] = data;
        } catch {
          result[note._id] = null;
        }
      }),
    );

    setQuizzes(result);
  };

  useEffect(() => {
    fetchBatchDetails();
    fetchModules();
  }, [fetchBatchDetails, fetchModules]);

  useEffect(() => {
    if (selectedModule) {
      fetchNotes();
    }
  }, [selectedModule, fetchNotes]);

  /* ---------------- VALIDATE QUESTION ---------------- */
  const validateQuestion = (question) => {
    if (!question.question.trim()) {
      return "Question cannot be empty";
    }

    const options = Object.values(question.options);
    const emptyOptions = options.filter((opt) => !opt.trim());
    if (emptyOptions.length > 0) {
      return "All options must be filled";
    }

    if (!question.answer || !["A", "B", "C", "D"].includes(question.answer)) {
      return "Please select a valid answer";
    }

    return null;
  };

  /* ---------------- OPEN MODAL ---------------- */
  const openQuizModal = (noteId) => {
    setSelectedNote(noteId);
    setQuizModalOpen(true);
    setUploadErrors([]);
    setShowExcelSection(false);
  };

  /* ---------------- ADD / UPDATE QUESTION ---------------- */
  const handleAddOrUpdateQuestion = async () => {
    if (!selectedNote) return;

    const validationError = validateQuestion(newQuestion);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      let quizId = quizzes[selectedNote]?._id;

      if (!quizId) {
        const res = await API.post(
          "/api/quiz/create",
          { noteId: selectedNote, createdBy: adminId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        quizId = res.data.quiz._id;

        setQuizzes((prev) => ({
          ...prev,
          [selectedNote]: { ...res.data.quiz, questions: [] },
        }));
      }

      if (editIndex !== null) {
        await API.put(
          `/api/quiz/${quizId}/question/${editIndex}`,
          newQuestion,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Question updated successfully 🎉");
      } else {
        await API.post(`/api/quiz/${quizId}/add-question`, newQuestion, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Question added successfully 🔥");
      }

      const { data } = await API.get(`/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuizzes((prev) => ({ ...prev, [selectedNote]: data }));

      setNewQuestion({
        question: "",
        options: { A: "", B: "", C: "", D: "" },
        answer: "A",
      });
      setEditIndex(null);
    } catch (err) {
      console.error("Question operation failed:", err);
      toast.error(err.response?.data?.error || "Operation failed");
    }
  };

  /* ---------------- DELETE QUESTION ---------------- */
  const handleDeleteQuestion = async (noteId, questionIndex) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const quizId = quizzes[noteId]?._id;
      if (!quizId) return;

      await API.delete(`/api/quiz/${quizId}/question/${questionIndex}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data } = await API.get(`/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuizzes((prev) => ({ ...prev, [noteId]: data }));
      toast.success("Question deleted successfully");
    } catch (err) {
      console.error("Failed to delete question", err);
      toast.error("Failed to delete question");
    }
  };

  /* ---------------- DOWNLOAD TEMPLATE ---------------- */
  const handleDownloadTemplate = async () => {
    try {
      const response = await API.get("/api/quiz/template", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "quiz_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully 📥");
    } catch (err) {
      console.error("Template download failed:", err);
      toast.error("Failed to download template");
    }
  };

  /* ---------------- BULK EXCEL UPLOAD ---------------- */
  const handleExcelUpload = async (file) => {
    if (!file) return;

    setLoading((prev) => ({ ...prev, upload: true }));
    setUploadErrors([]);

    try {
      let quizId = quizzes[selectedNote]?._id;

      if (!quizId) {
        const res = await API.post(
          "/api/quiz/create",
          { noteId: selectedNote, createdBy: adminId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        quizId = res.data.quiz._id;

        setQuizzes((prev) => ({
          ...prev,
          [selectedNote]: { ...res.data.quiz, questions: [] },
        }));
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(
        `/api/quiz/${quizId}/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.errors && response.data.errors.length > 0) {
        setUploadErrors(response.data.errors);
        toast.warning(`Uploaded with ${response.data.errors.length} errors`);
      } else {
        toast.success(
          `Successfully uploaded ${response.data.added} questions 🚀`,
        );
      }

      const { data } = await API.get(`/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuizzes((prev) => ({ ...prev, [selectedNote]: data }));
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(err.response?.data?.error || "Upload failed");
      if (err.response?.data?.details) {
        setUploadErrors(err.response.data.details);
      }
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

  /* ---------------- EDIT QUESTION ---------------- */
  const handleEditClick = (question, index) => {
    setEditIndex(index);
    setNewQuestion(question);
  };

  /* ---------------- CLOSE MODAL ---------------- */
  const closeModal = () => {
    setQuizModalOpen(false);
    setSelectedNote(null);
    setEditIndex(null);
    setNewQuestion({
      question: "",
      options: { A: "", B: "", C: "", D: "" },
      answer: "A",
    });
    setUploadErrors([]);
    setShowExcelSection(false);
  };

  // Calculate total questions across all quizzes
  const totalQuestions = Object.values(quizzes).reduce(
    (sum, quiz) => sum + (quiz?.questions?.length || 0),
    0,
  );

  const quizzesWithQuestions = Object.values(quizzes).filter(
    (q) => q && q.questions?.length > 0,
  ).length;

  if (loading.modules || loading.batch) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/admin/batch/${batchId}/lesson-plan/`)}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FaArrowLeft className="text-sm" />
          Back to Lesson Plan
        </button>

        {/* Header Section - Blue to Cyan Gradient Hero Banner */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                      <MdOutlineQuiz className="text-xs" />
                      Quiz Management
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold">
                      <FaChartLine className="text-xs" />
                      Interactive Assessments
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    Quiz Manager
                  </h1>
                  <div className="flex items-center gap-4 text-blue-100 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <MdOutlineMenuBook className="text-xs" />
                      {batchDetails.courseName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaFire className="text-xs" />
                      {selectedModule || "Select Module"}
                    </span>
                  </div>
                </div>

                {/* Stats Badge */}
                {/* <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaTrophy className="text-yellow-300 text-xl" />
                    <span className="text-white text-sm font-medium">
                      Total Questions
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {totalQuestions}
                  </p>
                  <p className="text-blue-100 text-xs">
                    {quizzesWithQuestions} Active Quizzes
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <MdOutlineMenuBook className="text-blue-600 dark:text-blue-400 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lessons
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {notes.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                <MdOutlineQuiz className="text-cyan-600 dark:text-cyan-400 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quizzes
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {quizzesWithQuestions}
                </p>
              </div>
            </div>
          </div>
          {/* <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <FaQuestionCircle className="text-indigo-600 dark:text-indigo-400 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Questions
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {totalQuestions}
                </p>
              </div>
            </div>
          </div> */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                <FaRocket className="text-teal-600 dark:text-teal-400 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Modules
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {modules.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Tabs - Blue to Cyan Gradient */}
        {modules.length > 1 && (
          <div className="mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {modules.map((module) => (
                  <button
                    key={module}
                    onClick={() => setSelectedModule(module)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      selectedModule === module
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <FaLayerGroup className="text-xs" />
                    {module}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes List - Enhanced Cards */}
        {loading.notes ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <MdOutlineQuiz className="text-3xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Quiz-Ready Lessons
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No regular or theory lessons found for this module. Create lesson
              plans first to add quizzes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note, idx) => {
              const quiz = quizzes[note._id];
              const questionCount = quiz?.questions?.length || 0;

              return (
                <div
                  key={note._id}
                  className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 transform hover:-translate-y-1"
                >
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-900/50 dark:to-cyan-900/50 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-700 dark:text-white">
                                D{note.day}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {note.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <div
                              className={`px-2 py-1 rounded-lg ${
                                questionCount > 0
                                  ? "bg-green-100 dark:bg-green-900/30"
                                  : "bg-gray-100 dark:bg-gray-700"
                              }`}
                            >
                              <span
                                className={`text-xs font-medium ${
                                  questionCount > 0
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {questionCount} Question
                                {questionCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {questionCount > 0 && (
                              <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                  <FaCheckCircle size={10} />
                                  Active
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => openQuizModal(note._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-md transition-all transform hover:scale-105 text-sm whitespace-nowrap"
                        >
                          {questionCount > 0 ? (
                            <>
                              <FaEdit size={12} />
                              Manage
                            </>
                          ) : (
                            <>
                              <FaPlus size={12} />
                              Add Quiz
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quiz Modal - Blue to Cyan Gradient */}
        {quizModalOpen && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-start pt-10 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4 relative animate-fadeIn">
              {/* Header - Blue to Cyan Gradient */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <MdOutlineQuiz />
                      Quiz Manager
                    </h3>
                    <p className="text-sm text-blue-100 mt-1">
                      {notes.find((n) => n._id === selectedNote)?.title}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 text-2xl transition-colors p-2 hover:bg-white/20 rounded-full"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Questions List */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <FaQuestionCircle className="text-blue-500" />
                      Questions ({quizzes[selectedNote]?.questions?.length || 0}
                      )
                    </h4>
                  </div>

                  {(quizzes[selectedNote]?.questions || []).length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900/50 dark:to-gray-900/50 rounded-xl">
                      <FaLightbulb className="mx-auto text-4xl text-blue-400 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No questions yet. Add your first question below or
                        upload via Excel.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(quizzes[selectedNote]?.questions || []).map(
                        (q, idx) => (
                          <div
                            key={idx}
                            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <p className="font-medium text-gray-900 dark:text-white">
                                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text font-bold mr-2">
                                  Q{idx + 1}.
                                </span>
                                {q.question}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditClick(q, idx)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteQuestion(selectedNote, idx)
                                  }
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                              {["A", "B", "C", "D"].map((opt) => (
                                <div
                                  key={opt}
                                  className={`p-2 rounded-lg text-sm transition-all ${
                                    q.answer === opt
                                      ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 shadow-sm"
                                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                  }`}
                                >
                                  <span className="font-semibold mr-2">
                                    {opt}:
                                  </span>
                                  {q.options[opt]}
                                  {q.answer === opt && (
                                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                                      <FaCheckCircle size={10} /> Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Add/Edit Question Form */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    {editIndex !== null ? (
                      <>
                        <FaEdit className="text-blue-500" />
                        Edit Question
                      </>
                    ) : (
                      <>
                        <FaPlus className="text-green-500" />
                        Add New Question
                      </>
                    )}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question Text *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your question"
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 w-full dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        value={newQuestion.question}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            question: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Options *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {["A", "B", "C", "D"].map((opt) => (
                          <div key={opt} className="flex items-center gap-2">
                            <span className="font-semibold w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                              {opt}
                            </span>
                            <input
                              type="text"
                              placeholder={`Option ${opt}`}
                              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 flex-1 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={newQuestion.options[opt]}
                              onChange={(e) =>
                                setNewQuestion((prev) => ({
                                  ...prev,
                                  options: {
                                    ...prev.options,
                                    [opt]: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Correct Answer *
                      </label>
                      <select
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        value={newQuestion.answer}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            answer: e.target.value,
                          }))
                        }
                      >
                        {["A", "B", "C", "D"].map((opt) => (
                          <option key={opt} value={opt}>
                            Option {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleAddOrUpdateQuestion}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
                    >
                      {editIndex !== null ? (
                        <>
                          <FaEdit /> Update Question
                        </>
                      ) : (
                        <>
                          <FaPlus /> Add Question
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Excel Upload Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
                  <button
                    onClick={() => setShowExcelSection(!showExcelSection)}
                    className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-900/50 dark:to-gray-900/50 rounded-xl hover:from-blue-100 hover:to-cyan-100 dark:hover:from-gray-800/50 dark:hover:to-gray-800/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <FaFileUpload className="text-blue-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Bulk Upload via Excel
                      </span>
                    </div>
                    {showExcelSection ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {showExcelSection && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-900/30 dark:to-gray-900/30 rounded-xl">
                      <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <button
                          onClick={handleDownloadTemplate}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition shadow-md"
                        >
                          <FaDownload /> Download Template
                        </button>

                        <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg transition shadow-md cursor-pointer">
                          <FaFileUpload />
                          {loading.upload ? "Uploading..." : "Upload Excel"}
                          <input
                            type="file"
                            hidden
                            accept=".xlsx,.xls"
                            onChange={(e) =>
                              handleExcelUpload(e.target.files[0])
                            }
                            disabled={loading.upload}
                          />
                        </label>
                      </div>

                      {loading.upload && (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <FaSpinner className="animate-spin text-blue-500 text-xl" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Uploading questions...
                          </span>
                        </div>
                      )}

                      {uploadErrors.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
                            <FaExclamationTriangle />
                            <span className="font-medium">
                              Upload Warnings:
                            </span>
                          </div>
                          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            {uploadErrors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                          <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span>
                            Excel file should have columns:{" "}
                            <strong>
                              question, optionA, optionB, optionC, optionD,
                              answer
                            </strong>
                            . Answer should be A, B, C, or D.
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}