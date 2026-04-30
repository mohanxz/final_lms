import React, { useEffect, useState, useCallback } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEyeSlash,
  FaEye,
  FaFlask,
  FaCheckCircle,
  FaArrowLeft,
  FaRocket,
  FaLayerGroup,
  FaCode,
  FaChevronDown,
  FaChevronUp,
  FaFileUpload,
  FaDownload,
  FaExclamationTriangle,
  FaSpinner,
  FaQuestionCircle,
  FaLightbulb,
  FaTimes,
  FaChartLine,
  FaFire,
} from "react-icons/fa";
import { MdOutlineQuiz, MdOutlineMenuBook } from "react-icons/md";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import toast, { Toaster } from "react-hot-toast";
import API from "../api";
import PracticalCoding from "../../student/pages/PracticalCoding";

export default function AdminPractical() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notes, setNotes] = useState([]);
  const [practicalMap, setPracticalMap] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [adminId, setAdminId] = useState("");
  const [loading, setLoading] = useState({
    notes: false,
    modules: false,
    save: false,
  });

  const languages = [
    "python",
    "java",
    "cpp",
    "javascript",
    "c",
    "typescript",
  ];

  const getInitialQuestion = () => ({
    title: "",
    questionHtml: "",
    testCases: [{ input: [""], expectedOutput: [""], hidden: false }],
    hiddenTestCases: [{ input: [""], expectedOutput: [""], hidden: true }],
    defaultScorePerQuestion: 10,
    totalMark: 0,
    language: ["python", "javascript", "cpp"],
  });

  const [questions, setQuestions] = useState([getInitialQuestion()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPreview, setIsPreview] = useState(false);

  const isQuestionValid = (q) => {
    if (!q) return false;
    const hasTitle = String(q.title || "").trim().length > 0;
    const hasHtml =
      String(q.questionHtml || "").replace(/<[^>]*>/g, "").trim().length > 0;
    const hasTestCases =
      Array.isArray(q.testCases) &&
      q.testCases.length > 0 &&
      q.testCases.every((tc) => {
        const inStr = Array.isArray(tc?.input)
          ? tc.input.join("").trim()
          : String(tc?.input || "").trim();
        const outStr = Array.isArray(tc?.expectedOutput)
          ? tc.expectedOutput.join("").trim()
          : String(tc?.expectedOutput || "").trim();
        return inStr.length > 0 && outStr.length > 0;
      });
    const hasHiddenTestCases =
      !q.hiddenTestCases ||
      q.hiddenTestCases.every((tc) => {
        const inStr = Array.isArray(tc?.input)
          ? tc.input.join("").trim()
          : String(tc?.input || "").trim();
        const outStr = Array.isArray(tc?.expectedOutput)
          ? tc.expectedOutput.join("").trim()
          : String(tc?.expectedOutput || "").trim();
        if (inStr.length === 0 && outStr.length === 0) return true;
        return inStr.length > 0 && outStr.length > 0;
      });
    const hasLanguages =
      Array.isArray(q.language) && q.language.length > 0;

    return (
      hasTitle && hasHtml && hasTestCases && hasHiddenTestCases && hasLanguages
    );
  };

  const fetchModules = useCallback(async () => {
    setLoading((prev) => ({ ...prev, modules: true }));
    if (!token) return;
    try {
      const res = await API.get(`/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (token && token.includes(".")) {
        const parts = token.split(".");
        if (parts.length > 1) {
          const payload = JSON.parse(atob(parts[1]));
          setAdminId(payload.id);

          const adminModules = res.data.admins
            .filter((a) => a.admin === payload.id)
            .map((a) => a.module);

          setModules(adminModules);
          if (adminModules.length > 0) {
            setSelectedModule(adminModules[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch modules", err);
    } finally {
      setLoading((prev) => ({ ...prev, modules: false }));
    }
  }, [batchId, token]);

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
      const practicalNotes = res.data.filter(
        (note) => note.type === "practical",
      );
      setNotes(practicalNotes);
      fetchPracticalQuestions(practicalNotes);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading((prev) => ({ ...prev, notes: false }));
    }
  }, [batchId, selectedModule, token]);

  const fetchPracticalQuestions = async (noteList) => {
    const map = {};
    for (let note of noteList) {
      try {
        const { data } = await API.get(
          `/api/practicals/by-note/${note._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        map[note._id] = data;
      } catch {}
    }
    setPracticalMap(map);
  };

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openModal = (noteId) => {
    setSelectedNote(noteId);
    const savedQuestions = practicalMap[noteId] || [];

    if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
      setQuestions(
        savedQuestions.map((q) => {
          const visibleTCs = q.testCases?.filter((tc) => !tc.hidden);
          const hiddenTCs = q.testCases?.filter((tc) => tc.hidden);
          return {
            ...getInitialQuestion(),
            ...q,
            testCases:
              visibleTCs?.length > 0
                ? visibleTCs
                : [{ input: [""], expectedOutput: [""], hidden: false }],
            hiddenTestCases:
              hiddenTCs?.length > 0
                ? hiddenTCs
                : [{ input: [""], expectedOutput: [""], hidden: true }],
          };
        }),
      );
      setCurrentIdx(0);
    } else {
      setQuestions([getInitialQuestion()]);
      setCurrentIdx(0);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNote(null);
    setModalOpen(false);
    setQuestions([getInitialQuestion()]);
    setCurrentIdx(0);
    setIsPreview(false);
  };

  const updateCurrentQuestion = (fields) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (!updated[currentIdx]) return prev;
      updated[currentIdx] = { ...updated[currentIdx], ...fields };
      return updated;
    });
  };

  const updateTestCaseField = (tcIndex, field, value, isHidden = false) => {
    setQuestions((prev) => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      if (isHidden) {
        const updatedTestCases = [
          ...(updatedQuestions[currentIdx].hiddenTestCases || []),
        ];
        if (!updatedTestCases[tcIndex]) return prev;
        updatedTestCases[tcIndex][field] = value.split("\n");
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          hiddenTestCases: updatedTestCases,
        };
      } else {
        const updatedTestCases = [
          ...(updatedQuestions[currentIdx].testCases || []),
        ];
        if (!updatedTestCases[tcIndex]) return prev;
        updatedTestCases[tcIndex][field] = value.split("\n");
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          testCases: updatedTestCases,
        };
      }
      return updatedQuestions;
    });
  };

  const handleLanguageToggle = (lang) => {
    setQuestions((prev) => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      const currentQ = updatedQuestions[currentIdx];
      const updatedLangs = currentQ.language.includes(lang)
        ? currentQ.language.filter((l) => l !== lang)
        : [...currentQ.language, lang];
      updatedQuestions[currentIdx] = {
        ...updatedQuestions[currentIdx],
        language: updatedLangs,
      };
      return updatedQuestions;
    });
  };

  const addNewQuestionToModal = () => {
    const nextIdx = questions.length;
    setQuestions((prev) => [...prev, getInitialQuestion()]);
    setCurrentIdx(nextIdx);
    setIsPreview(false);
  };

  const removeQuestionFromModal = (index) => {
    if (questions.length === 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (currentIdx >= updated.length) {
      setCurrentIdx(updated.length - 1);
    }
  };

  const addTestCase = (isHidden = false) => {
    setQuestions((prev) => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      if (isHidden) {
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          hiddenTestCases: [
            ...(updatedQuestions[currentIdx].hiddenTestCases || []),
            { input: [""], expectedOutput: [""], hidden: true },
          ],
        };
      } else {
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          testCases: [
            ...(updatedQuestions[currentIdx].testCases || []),
            { input: [""], expectedOutput: [""], hidden: false },
          ],
        };
      }
      return updatedQuestions;
    });
  };

  const removeTestCase = (index, isHidden = false) => {
    setQuestions((prev) => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      if (isHidden) {
        const updatedTestCases = (
          updatedQuestions[currentIdx].hiddenTestCases || []
        ).filter((_, i) => i !== index);
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          hiddenTestCases: updatedTestCases,
        };
      } else {
        const updatedTestCases = (
          updatedQuestions[currentIdx].testCases || []
        ).filter((_, i) => i !== index);
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          testCases: updatedTestCases,
        };
      }
      return updatedQuestions;
    });
  };

  const handleAddOrUpdate = async () => {
    for (let i = 0; i < questions.length; i++) {
      if (!isQuestionValid(questions[i])) {
        toast.error(`Please fill all mandatory fields for Question ${i + 1}`);
        setCurrentIdx(i);
        return;
      }
    }

    setLoading((prev) => ({ ...prev, save: true }));

    try {
      const payload = {
        questions: questions.map((q) => {
          const validHidden = (q.hiddenTestCases || [])
            .filter((tc) => {
              const inStr = Array.isArray(tc?.input)
                ? tc.input.join("").trim()
                : String(tc?.input || "").trim();
              const outStr = Array.isArray(tc?.expectedOutput)
                ? tc.expectedOutput.join("").trim()
                : String(tc?.expectedOutput || "").trim();
              return inStr.length > 0 && outStr.length > 0;
            })
            .map((tc) => ({ ...tc, hidden: true }));

          return {
            ...q,
            testCases: [...(q.testCases || []), ...validHidden],
            noteId: selectedNote,
            createdBy: adminId,
          };
        }),
      };

      await API.post(`/api/practicals/batch`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data } = await API.get(
        `/api/practicals/by-note/${selectedNote}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPracticalMap((prev) => ({ ...prev, [selectedNote]: data }));
      toast.success("Successfully saved all practical questions! 🚀");
      closeModal();
    } catch (err) {
      console.error("Failed to save practical questions", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  // Calculate stats
  const practicalsWithContent = Object.values(practicalMap).filter(
    (p) => p && p.length > 0,
  ).length;

  const totalQuestions = Object.values(practicalMap).reduce(
    (sum, practical) => sum + (practical?.length || 0),
    0,
  );

  // Skeleton Loader
  if (loading.modules) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-32 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl animate-pulse"></div>
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-right" />

      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
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
                      <FaFlask className="text-xs" />
                      Practical Management
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold">
                      <FaCode className="text-xs" />
                      Coding Assessments
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    Practical Code Editor
                  </h1>
                  <div className="flex items-center gap-4 text-blue-100 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <FaCode className="text-xs" />
                      {selectedModule || "Select Module"}
                    </span>
                  </div>
                </div>
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
                  Practical Sessions
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
                <FaCode className="text-cyan-600 dark:text-cyan-400 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  With Content
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {practicalsWithContent}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                <FaRocket className="text-teal-600 dark:text-teal-400 text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Questions
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {totalQuestions}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                <FaLayerGroup className="text-sky-600 dark:text-sky-400 text-lg" />
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
              <FaFlask className="text-3xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Practical Sessions
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No practical sessions found for this module. Create lesson plans
              with practical type to add coding tasks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => {
              const practical = practicalMap[note._id];
              const questionCount = practical?.length || 0;
              const hasContent = questionCount > 0;

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

                          {/* Preview of questions */}
                          {hasContent && (
                            <div className="mt-3 space-y-1.5">
                              {practical.slice(0, 2).map((q, qidx) => (
                                <div
                                  key={q._id || qidx}
                                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg border border-blue-100 dark:border-blue-800/50 truncate"
                                >
                                  <FaCheckCircle size={10} className="flex-shrink-0" />
                                  <span className="truncate">{q.title}</span>
                                </div>
                              ))}
                              {practical.length > 2 && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 pl-5">
                                  +{practical.length - 2} more questions
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-3">
                            <div
                              className={`px-2 py-1 rounded-lg ${
                                hasContent
                                  ? "bg-green-100 dark:bg-green-900/30"
                                  : "bg-gray-100 dark:bg-gray-700"
                              }`}
                            >
                              <span
                                className={`text-xs font-medium ${
                                  hasContent
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {questionCount} Question
                                {questionCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {hasContent && (
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
                          onClick={() => openModal(note._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-md transition-all transform hover:scale-105 text-sm whitespace-nowrap"
                        >
                          {hasContent ? (
                            <>
                              <FaEdit size={12} />
                              Edit Code
                            </>
                          ) : (
                            <>
                              <FaPlus size={12} />
                              Add Code
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
      </div>

      {/* Modal - Blue to Cyan Theme */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-start justify-center overflow-y-auto"
          style={{ zIndex: 99999 }}
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4 mt-10 animate-fadeIn"
            style={{ marginLeft: "150px" }}
          >
            {/* Header - Blue to Cyan Gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaCode />
                    Practical Code Editor
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">
                    {notes.find((n) => n._id === selectedNote)?.title ||
                      "Coding Workspace"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={addNewQuestionToModal}
                    className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-all shadow-sm active:scale-90"
                    title="Add another question"
                  >
                    <FaPlus size={18} />
                  </button>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 text-2xl transition-colors p-2 hover:bg-white/20 rounded-full"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden" style={{ maxHeight: "calc(90vh - 73px)" }}>
              {/* Question Navigation Sidebar */}
              <div className="w-full lg:w-64 bg-gray-50/50 dark:bg-gray-900/50 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 p-4 overflow-y-auto flex-shrink-0">
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="relative group/item">
                      <button
                        onClick={() => {
                          setCurrentIdx(idx);
                          setIsPreview(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                          currentIdx === idx
                            ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-gray-100 dark:ring-gray-700"
                            : "text-gray-500 hover:bg-gray-100/50 dark:hover:bg-gray-800/30"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isQuestionValid(q)
                              ? "bg-green-500"
                              : "bg-red-500 animate-pulse"
                          }`}
                        ></span>
                        <span className="truncate">
                          Q{idx + 1}: {q.title || "Untitled"}
                        </span>
                      </button>
                      {questions.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestionFromModal(idx);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Form Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex px-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 sticky top-0 z-10">
                  <button
                    onClick={() => setIsPreview(false)}
                    className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                      !isPreview
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <FaEdit className="inline mr-2" />
                    EDIT CONTENT
                  </button>
                  <button
                    onClick={() => setIsPreview(true)}
                    className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                      isPreview
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <FaEye className="inline mr-2" />
                    LIVE PREVIEW
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {!isPreview ? (
                    <div className="space-y-6">
                      {/* Question Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Question Title *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter a descriptive title..."
                          className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 w-full dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          value={questions[currentIdx]?.title || ""}
                          onChange={(e) =>
                            updateCurrentQuestion({ title: e.target.value })
                          }
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description (Rich Text) *
                        </label>
                        <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <ReactQuill
                            theme="snow"
                            value={questions[currentIdx]?.questionHtml || ""}
                            onChange={(content) =>
                              updateCurrentQuestion({ questionHtml: content })
                            }
                            className="bg-white dark:bg-gray-900 dark:text-white min-h-[200px]"
                            placeholder="Detailed instructions for the student..."
                          />
                        </div>
                      </div>

                      {/* Languages */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Supported Languages *
                        </label>
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                          {languages.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => handleLanguageToggle(lang)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                questions[currentIdx]?.language?.includes(lang)
                                  ? "bg-blue-500 text-white border-blue-500 shadow-md scale-105"
                                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                              }`}
                            >
                              {lang.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visible Test Cases */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Visible Test Cases *
                          </label>
                          <button
                            onClick={() => addTestCase(false)}
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            + Add Scenario
                          </button>
                        </div>

                        <div className="grid gap-4">
                          {questions[currentIdx]?.testCases.map(
                            (tc, tcIndex) => (
                              <div
                                key={tcIndex}
                                className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                      Scenario {tcIndex + 1}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      removeTestCase(tcIndex, false)
                                    }
                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                                      Standard Input
                                    </label>
                                    <textarea
                                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-blue-500 transition resize-none"
                                      value={
                                        Array.isArray(tc.input)
                                          ? tc.input.join("\n")
                                          : tc.input
                                      }
                                      onChange={(e) =>
                                        updateTestCaseField(
                                          tcIndex,
                                          "input",
                                          e.target.value,
                                          false,
                                        )
                                      }
                                      placeholder="Enter input lines..."
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                                      Expected Output
                                    </label>
                                    <textarea
                                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-blue-500 transition resize-none"
                                      value={
                                        Array.isArray(tc.expectedOutput)
                                          ? tc.expectedOutput.join("\n")
                                          : tc.expectedOutput
                                      }
                                      onChange={(e) =>
                                        updateTestCaseField(
                                          tcIndex,
                                          "expectedOutput",
                                          e.target.value,
                                          false,
                                        )
                                      }
                                      placeholder="Enter expected result..."
                                    />
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Hidden Test Cases */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                            <FaEyeSlash size={14} />
                            Hidden Test Cases *
                          </label>
                          <button
                            onClick={() => addTestCase(true)}
                            className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            + Add Hidden Scenario
                          </button>
                        </div>

                        <div className="grid gap-4">
                          {questions[currentIdx]?.hiddenTestCases?.map(
                            (tc, tcIndex) => (
                              <div
                                key={`hidden-${tcIndex}`}
                                className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-5 border border-orange-200 dark:border-orange-800/50"
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                      Hidden Scenario {tcIndex + 1}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      removeTestCase(tcIndex, true)
                                    }
                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-medium text-orange-500 dark:text-orange-400 mb-2 block">
                                      Hidden Input
                                    </label>
                                    <textarea
                                      className="w-full bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg p-3 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-orange-500 transition resize-none"
                                      value={
                                        Array.isArray(tc.input)
                                          ? tc.input.join("\n")
                                          : tc.input
                                      }
                                      onChange={(e) =>
                                        updateTestCaseField(
                                          tcIndex,
                                          "input",
                                          e.target.value,
                                          true,
                                        )
                                      }
                                      placeholder="Enter secret input lines..."
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-orange-500 dark:text-orange-400 mb-2 block">
                                      Expected Output
                                    </label>
                                    <textarea
                                      className="w-full bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg p-3 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-orange-500 transition resize-none"
                                      value={
                                        Array.isArray(tc.expectedOutput)
                                          ? tc.expectedOutput.join("\n")
                                          : tc.expectedOutput
                                      }
                                      onChange={(e) =>
                                        updateTestCaseField(
                                          tcIndex,
                                          "expectedOutput",
                                          e.target.value,
                                          true,
                                        )
                                      }
                                      placeholder="Enter expected secret result..."
                                    />
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[500px]">
                      <PracticalCoding
                        testInput={
                          questions[currentIdx]?.testCases?.[0]?.input?.join(
                            "\n",
                          ) || ""
                        }
                        testOutput={
                          questions[
                            currentIdx
                          ]?.testCases?.[0]?.expectedOutput?.join("\n") || ""
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500">
                    Questions: {questions.length}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddOrUpdate}
                      disabled={
                        !questions.every(isQuestionValid) || loading.save
                      }
                      className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 ${
                        questions.every(isQuestionValid) && !loading.save
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/25 hover:scale-[1.02] active:scale-95"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {loading.save ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaRocket />
                          Finalize & Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ql-container.ql-snow {
          border: none !important;
          border-radius: 0 0 0.5rem 0.5rem !important;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid rgba(156, 163, 175, 0.2) !important;
          border-radius: 0.5rem 0.5rem 0 0 !important;
          background: #f9fafb;
        }
        .dark .ql-toolbar.ql-snow {
          background: #111827;
        }
        .dark .ql-editor.ql-blank::before {
          color: #4b5563 !important;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
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
      `}</style>
    </div>
  );
}