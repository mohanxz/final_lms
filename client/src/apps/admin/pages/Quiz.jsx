import React, { useEffect, useState, useCallback, useRef } from "react";
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

// ============================================
// PRODUCTION-READY QUIZ MODAL COMPONENT
// ============================================

/**
 * Reusable Icon Button Component
 */
const IconButton = ({ onClick, icon: Icon, variant = "default", label, className = "", size = 16 }) => {
  const variants = {
    default: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
    danger: "text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
    primary: "text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    ghost: "text-white hover:text-gray-200 hover:bg-white/20",
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-200 ${variants[variant]} ${className}`}
      aria-label={label}
      title={label}
      type="button"
    >
      <Icon size={size} />
    </button>
  );
};

/**
 * Question Card Component - Displays individual quiz question
 */
const QuestionCard = ({ question, index, onEdit, onDelete }) => {
  const options = ["A", "B", "C", "D"];
  
  return (
    <div className="group border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200 animate-fadeIn">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold flex-shrink-0 mt-0.5">
            {index + 1}
          </span>
          <p className="font-medium text-gray-900 dark:text-white leading-relaxed break-words pt-0.5">
            {question.question}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
          <IconButton
            onClick={() => onEdit(question, index)}
            icon={FaEdit}
            variant="primary"
            label="Edit question"
          />
          <IconButton
            onClick={() => onDelete(index)}
            icon={FaTrash}
            variant="danger"
            label="Delete question"
          />
        </div>
      </div>

      {/* Options Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const isCorrect = question.answer === opt;
            return (
              <div
                key={opt}
                className={`
                  relative flex items-start gap-2.5 p-2.5 rounded-lg text-sm transition-all duration-200
                  ${
                    isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50"
                      : "bg-gray-50 dark:bg-gray-900/30 border border-transparent"
                  }
                `}
              >
                <span className={`
                  inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold flex-shrink-0
                  ${isCorrect 
                    ? "bg-emerald-500 text-white shadow-sm" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }
                `}>
                  {opt}
                </span>
                <span className={`flex-1 break-words pt-0.5 ${isCorrect ? "text-emerald-900 dark:text-emerald-300 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                  {question.options[opt]}
                </span>
                {isCorrect && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-auto">
                    <FaCheckCircle size={10} />
                    <span className="hidden sm:inline">Correct</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty State Component
 */
const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
    <Icon className="mx-auto text-3xl text-gray-300 dark:text-gray-600 mb-3" />
    <p className="text-gray-900 dark:text-white font-medium mb-1">{title}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

/**
 * Form Input Component
 */
const FormInput = ({ label, required, children, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

/**
 * QuizModal - Production-grade modal for quiz management
 * Bulk upload at TOP, form section at BOTTOM with auto-scroll on edit
 */
const QuizModal = ({
  isOpen,
  onClose,
  noteTitle,
  questions = [],
  onAddOrUpdate,
  onDelete,
  editIndex,
  newQuestion,
  setNewQuestion,
  setEditIndex,
  uploadLoading = false,
  uploadErrors = [],
  showExcelSection,
  setShowExcelSection,
  onDownloadTemplate,
  onExcelUpload,
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const fileInputRef = useRef(null);
  const formSectionRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-scroll to form section when editIndex changes
  useEffect(() => {
    if (editIndex !== null && formSectionRef.current && scrollContainerRef.current) {
      // Smooth scroll to the form section
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [editIndex]);

  // Handle ESC key and focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    
    // Focus trap
    if (e.key === "Tab" && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  }, [onClose]);

  // Lock body scroll and manage focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
      
      // Focus the modal after animation
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onExcelUpload(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay with backdrop blur */}
      <div
        className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scaleIn ring-1 ring-black/5 dark:ring-white/10"
        style={{ zIndex: 101 }}
      >
        {/* ============ HEADER ============ */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
              <MdOutlineQuiz className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div className="min-w-0">
              <h3 
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white truncate"
              >
                Quiz Manager
              </h3>
              {noteTitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {noteTitle}
                </p>
              )}
            </div>
          </div>
          
          <IconButton
            onClick={onClose}
            icon={FaTimes}
            variant="default"
            label="Close modal"
            size={20}
            className="flex-shrink-0 p-2.5"
          />
        </div>

        {/* ============ SCROLLABLE BODY ============ */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="px-5 py-6 space-y-8">
            
            {/* ===== 1. EXCEL UPLOAD SECTION (MOVED TO TOP) ===== */}
            <section>
              <button
                onClick={() => setShowExcelSection(!showExcelSection)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50 rounded-xl transition-all duration-200 group"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <FaFileUpload className="text-blue-500 group-hover:text-blue-600 transition-colors" />
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    Bulk Upload via Excel
                  </span>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  {showExcelSection ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                </div>
              </button>

              {showExcelSection && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 animate-fadeIn">
                  {/* Upload Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <button
                      onClick={onDownloadTemplate}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm font-medium"
                      type="button"
                    >
                      <FaDownload size={14} />
                      Download Template
                    </button>

                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer shadow-sm hover:shadow-md">
                      {uploadLoading ? (
                        <>
                          <FaSpinner className="animate-spin" size={14} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FaFileUpload size={14} />
                          Upload Excel
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={uploadLoading}
                      />
                    </label>
                  </div>

                  {/* Upload Errors */}
                  {uploadErrors.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-3">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
                        <FaExclamationTriangle size={14} />
                        <span className="text-sm font-medium">Upload Warnings</span>
                      </div>
                      <ul className="space-y-1">
                        {uploadErrors.map((error, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2"
                          >
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={12} />
                      <span>
                        Excel file should have columns:{" "}
                        <strong className="text-blue-800 dark:text-blue-200">
                          question, optionA, optionB, optionC, optionD, answer
                        </strong>
                        . Answer should be A, B, C, or D.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ===== 2. QUESTIONS LIST SECTION ===== */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaQuestionCircle className="text-blue-500" />
                  Questions
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {questions.length}
                  </span>
                </h4>
              </div>

              {questions.length === 0 ? (
                <EmptyState 
                  icon={FaLightbulb}
                  title="No questions yet"
                  description="Add your first question below or upload via Excel."
                />
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <QuestionCard
                      key={idx}
                      question={q}
                      index={idx}
                      onEdit={(question, index) => {
                        setEditIndex(index);
                        setNewQuestion(question);
                        // Auto-scroll will trigger via useEffect
                      }}
                      onDelete={(index) => onDelete(index)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ===== 3. ADD/EDIT FORM SECTION (WITH AUTO-SCROLL) ===== */}
            <section ref={formSectionRef}>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {editIndex !== null ? (
                  <>
                    <FaEdit className="text-blue-500" />
                    Edit Question #{editIndex + 1}
                  </>
                ) : (
                  <>
                    <FaPlus className="text-emerald-500" />
                    Add New Question
                  </>
                )}
              </h4>

              <div className="space-y-4">
                {/* Question Text */}
                <FormInput label="Question Text" required>
                  <input
                    type="text"
                    placeholder="Enter your question"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
                    value={newQuestion.question}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({
                        ...prev,
                        question: e.target.value,
                      }))
                    }
                    autoFocus={editIndex !== null}
                  />
                </FormInput>

                {/* Options */}
                <FormInput label="Options" required>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["A", "B", "C", "D"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold flex-shrink-0">
                          {opt}
                        </span>
                        <input
                          type="text"
                          placeholder={`Option ${opt}`}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
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
                </FormInput>

                {/* Correct Answer */}
                <FormInput label="Correct Answer" required className="max-w-xs">
                  <select
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm cursor-pointer"
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
                </FormInput>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={onAddOrUpdate}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] text-sm"
                    type="button"
                  >
                    {editIndex !== null ? (
                      <>
                        <FaEdit size={14} />
                        Update Question
                      </>
                    ) : (
                      <>
                        <FaPlus size={14} />
                        Add Question
                      </>
                    )}
                  </button>

                  {editIndex !== null && (
                    <button
                      onClick={() => {
                        setEditIndex(null);
                        setNewQuestion({
                          question: "",
                          options: { A: "", B: "", C: "", D: "" },
                          answer: "A",
                        });
                      }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 text-sm"
                      type="button"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

// ============================================
// SKELETON LOADER
// ============================================
const SkeletonLoader = () => (
  <div className="min-h-screen bg-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 lg:p-8">
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

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
    teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <Icon className="text-lg" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN ADMIN QUIZZES COMPONENT
// ============================================
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

  // Calculate statistics
  const totalQuestions = Object.values(quizzes).reduce(
    (sum, quiz) => sum + (quiz?.questions?.length || 0),
    0,
  );

  const quizzesWithQuestions = Object.values(quizzes).filter(
    (q) => q && q.questions?.length > 0,
  ).length;

  if (loading.modules || loading.batch) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/admin/batch/${batchId}/lesson-plan/`)}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
        >
          <FaArrowLeft className="text-sm" />
          Back to Lesson Plan
        </button>

        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    <MdOutlineQuiz className="text-xs" />
                    Quiz Management
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 text-xs font-semibold">
                    <FaChartLine className="text-xs" />
                    Interactive Assessments
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Quiz Manager
                </h1>
                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <MdOutlineMenuBook className="text-xs" />
                    {batchDetails.courseName || "Course"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FaFire className="text-xs" />
                    {selectedModule || "Select Module"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={MdOutlineMenuBook}
            label="Lessons"
            value={notes.length}
            color="blue"
          />
          <StatCard
            icon={MdOutlineQuiz}
            label="Quizzes Active"
            value={quizzesWithQuestions}
            color="cyan"
          />
          <StatCard
            icon={FaRocket}
            label="Total Questions"
            value={totalQuestions}
            color="teal"
          />
        </div>

        {/* Module Tabs */}
        {modules.length > 1 && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {modules.map((module) => (
                  <button
                    key={module}
                    onClick={() => setSelectedModule(module)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      selectedModule === module
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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

        {/* Notes Grid */}
        {loading.notes ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <MdOutlineQuiz className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Quiz-Ready Lessons
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              No regular or theory lessons found for this module. Create lesson plans first to add quizzes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => {
              const quiz = quizzes[note._id];
              const questionCount = quiz?.questions?.length || 0;
              const hasQuestions = questionCount > 0;

              return (
                <div
                  key={note._id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold flex-shrink-0">
                            D{note.day}
                          </span>
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {note.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                              hasQuestions
                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {questionCount} Question{questionCount !== 1 ? "s" : ""}
                          </span>
                          {hasQuestions && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
                              <FaCheckCircle size={10} />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openQuizModal(note._id)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                      {hasQuestions ? (
                        <>
                          <FaEdit size={12} />
                          Manage Quiz
                        </>
                      ) : (
                        <>
                          <FaPlus size={12} />
                          Create Quiz
                        </>
                      )}
                    </button>
                  </div>

                  {/* Left border accent */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    hasQuestions ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                  }`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ QUIZ MODAL ============ */}
      <QuizModal
        isOpen={quizModalOpen}
        onClose={closeModal}
        noteTitle={notes.find((n) => n._id === selectedNote)?.title}
        questions={quizzes[selectedNote]?.questions || []}
        onAddOrUpdate={handleAddOrUpdateQuestion}
        onDelete={(index) => handleDeleteQuestion(selectedNote, index)}
        editIndex={editIndex}
        newQuestion={newQuestion}
        setNewQuestion={setNewQuestion}
        setEditIndex={setEditIndex}
        uploadLoading={loading.upload}
        uploadErrors={uploadErrors}
        showExcelSection={showExcelSection}
        setShowExcelSection={setShowExcelSection}
        onDownloadTemplate={handleDownloadTemplate}
        onExcelUpload={handleExcelUpload}
      />
    </div>
  );
}