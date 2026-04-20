import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import {
  FaVideo,
  FaQuestionCircle,
  FaFileAlt,
  FaUpload,
  FaCheckCircle,
  FaCode,
  FaCalendarAlt,
  FaUserGraduate,
  FaBookOpen,
  FaChartLine,
  FaCloudUploadAlt,
  FaSpinner,
  FaArrowLeft,
  FaFire,
  FaStar,
  FaLayerGroup,
  FaExternalLinkAlt,
  FaRegFilePdf,
  FaRegClock,
  FaLink,
} from "react-icons/fa";
import { MdOutlineEmojiEvents, MdOutlineMenuBook } from "react-icons/md";
import { toast } from "react-toastify";

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 lg:p-8">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-32 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl animate-pulse"></div>
      </div>
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex-shrink-0"
          ></div>
        ))}
      </div>
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 animate-pulse"
          >
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
            <div className="flex gap-3 mb-6">
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Static File Upload Component
const StaticFileUpload = ({ onFileSelect, fileName, setFileName, noteId }) => {
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
      setFileName(file.name);
    } else if (file) {
      toast.error("Please upload a PDF file");
    }
  };

  return (
    <div className="flex-1">
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
          fileName
            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-cyan-600 dark:hover:bg-cyan-900/20"
        }`}
      >
        {fileName ? (
          <>
            <FaCheckCircle className="text-green-500 text-lg" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium truncate max-w-[150px]">
              {fileName}
            </span>
          </>
        ) : (
          <>
            <FaCloudUploadAlt className="text-gray-400 text-lg" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Click to select PDF
            </span>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

// Drive Link Input Component
const DriveLinkInput = ({
  driveLink,
  setDriveLink,
  onSubmit,
  isSubmitting,
  isSubmitted,
}) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <FaLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="url"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="Paste your Google Drive link"
            disabled={isSubmitted}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

// Note Card Component
const NoteCard = ({
  note,
  student,
  batch,
  module,
  large,
  onNavigate,
  onUpload,
  onDriveSubmit,
  uploadingStates,
  fileNames,
  setFileNames,
  driveLinks,
  setDriveLinks,
  getAssignmentData,
  getQuizMark,
  quizzesMap,
  codingQuestionsMap,
}) => {
  const noteId = note._id;
  const isUploading = uploadingStates[noteId];
  const fileName = fileNames[noteId];
  const driveLink = driveLinks[noteId] || "";
  const isDriveSubmitting = uploadingStates[`drive_${noteId}`];

  const hasCoding = codingQuestionsMap[noteId];
  const hasQuiz = quizzesMap[noteId];
  const quizMark = getQuizMark(module, note.day);

  // ✅ FIXED: Get assignment data dynamically (no fixed A1/A2/A3 assumption)
  const assignmentData = getAssignmentData(module, note.day);

  const handleFileSelect = (noteId, file) => {
    window[`file_${noteId}`] = file;
    setFileNames((prev) => ({ ...prev, [noteId]: file.name }));
  };

  const handleUploadClick = () => {
    const file = window[`file_${noteId}`];
    if (!file) {
      toast.warn("Please choose a PDF file");
      return;
    }
    onUpload(note, module, batch.batchName, student, noteId);
  };

  const handleDriveSubmitClick = () => {
    const trimmedLink = driveLink?.trim();

    if (!trimmedLink) {
      toast.warn("Please enter a Google Drive link");
      return;
    }

    const isValidDriveLink = /^https:\/\/(drive|docs)\.google\.com\/.+/i.test(
      trimmedLink,
    );

    if (!isValidDriveLink) {
      toast.warn("Please enter a valid Google Drive link");
      return;
    }

    if (isDriveSubmitting) {
      toast.info("Submission already in progress...");
      return;
    }

    onDriveSubmit(note, module, student, noteId, trimmedLink);
  };

  // Determine which submission options to show
  const hasAssignmentLink = !!note.assignmentlink;
  const hasAssignmentFile = !!note.assignmentS3Url;

  // ✅ FIXED: Simple existence check (no evaluation logic for drive links)
  const isDriveSubmitted = !!assignmentData?.driveLink;
  const isPdfSubmitted = !!assignmentData?.pdfStatus;
  const isPdfEvaluated = assignmentData?.pdfStatus === "evaluated";
  const pdfMarks = assignmentData?.pdfMarks || 0;

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800 ${large ? "lg:col-span-2" : ""}`}
    >
      {/* Card Header with gradient accent */}
      <div className="relative p-5 pb-3">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-cyan-500 to-blue-600 rounded-l-2xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>

        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-white text-xs font-semibold rounded-full shadow-md bg-gradient-to-r from-blue-500 to-cyan-500">
                <FaCalendarAlt className="text-[10px]" />
                Day {note.day}
              </span>
              {large && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-full shadow-md animate-pulse">
                  <FaFire className="text-[10px]" />
                  Latest
                </span>
              )}
              {note.isImportant && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-semibold rounded-full shadow-md">
                  <FaStar className="text-[10px]" />
                  Important
                </span>
              )}
            </div>
            <h4 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
              {note.title}
            </h4>
            {note.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {note.description}
              </p>
            )}
          </div>
          {!large && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">
              <FaLayerGroup className="text-blue-500 dark:text-cyan-400 text-xs" />
              <span>{module}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Meet Button */}
          {note.meetlink && (
            <button
              onClick={() => window.open(note.meetlink, "_blank")}
              className="group/btn flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transform hover:-translate-y-0.5"
              title="Join Live Session"
            >
              <FaVideo className="text-sm group-hover/btn:scale-110 transition-transform" />
              <span className="hidden sm:inline">Join Meet</span>
            </button>
          )}

          {/* Quiz Button */}
          {!hasQuiz ? (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl cursor-not-allowed text-sm font-medium"
              title="No quiz available for this day"
            >
              <FaQuestionCircle className="text-sm" />
              <span className="hidden sm:inline">No Quiz</span>
            </button>
          ) : quizMark >= 0 ? (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 text-white rounded-xl cursor-not-allowed shadow-md text-sm font-medium"
              title={`Quiz completed with score: ${quizMark}`}
            >
              <FaCheckCircle className="text-sm" />
              <span className="hidden sm:inline">Quiz Done</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate(`/student/quiz/attempt/${note._id}`)}
              className="group/btn flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transform hover:-translate-y-0.5"
              title="Attempt the quiz"
            >
              <FaQuestionCircle className="text-sm group-hover/btn:scale-110 transition-transform" />
              <span className="hidden sm:inline">Attempt Quiz</span>
            </button>
          )}

          {/* Coding Button */}
          {!hasCoding ? (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl cursor-not-allowed text-sm font-medium"
              title="No coding assignment available"
            >
              <FaCode className="text-sm" />
              <span className="hidden sm:inline">No Coding</span>
            </button>
          ) : hasCoding.submitted ? (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 text-white rounded-xl cursor-not-allowed shadow-md text-sm font-medium"
              title="Coding assignment submitted"
            >
              <FaCheckCircle className="text-sm" />
              <span className="hidden sm:inline">Coding Done</span>
            </button>
          ) : (
            <button
              onClick={() =>
                onNavigate(`/student/code/attempt/${note._id}/${student._id}`)
              }
              className="group/btn flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transform hover:-translate-y-0.5"
              title="Start coding assignment"
            >
              <FaCode className="text-sm group-hover/btn:scale-110 transition-transform" />
              <span className="hidden sm:inline">Coding</span>
            </button>
          )}
        </div>
      </div>

      {/* Assignment Resources Section */}
      {(hasAssignmentLink || hasAssignmentFile) && (
        <div className="px-5 pb-2">
          <div className="border-t border-gray-100 dark:border-gray-700/50 pt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
              <FaFileAlt className="text-[10px]" />
              Assignment Resources
            </p>
            <div className="flex flex-wrap gap-2">
              {hasAssignmentLink && (
                <button
                  onClick={() => window.open(note.assignmentlink, "_blank")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <FaExternalLinkAlt className="text-[10px]" />
                  Reference Link
                </button>
              )}
              {hasAssignmentFile && (
                <button
                  onClick={() => window.open(note.assignmentS3Url, "_blank")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-purple-600 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                >
                  <FaRegFilePdf className="text-[10px]" />
                  View PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Submission Section */}
      <div className="px-5 pb-5">
        <div className="border-t border-gray-100 dark:border-gray-700/50 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <FaUpload className="text-xs text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Assignment Submission
            </span>
          </div>

          {/* Drive Link Submission Section */}
          {hasAssignmentLink && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Google Drive Link
              </div>
              {!isDriveSubmitted ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <DriveLinkInput
                      driveLink={driveLink}
                      setDriveLink={(value) =>
                        setDriveLinks((prev) => ({ ...prev, [noteId]: value }))
                      }
                      onSubmit={handleDriveSubmitClick}
                      isSubmitting={isDriveSubmitting}
                      isSubmitted={isDriveSubmitted}
                    />
                    <button
                      onClick={handleDriveSubmitClick}
                      disabled={isDriveSubmitting || !driveLink.trim()}
                      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 min-w-[120px] ${
                        isDriveSubmitting || !driveLink.trim()
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                      }`}
                    >
                      {isDriveSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin text-sm" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaLink />
                          Submit Drive Link
                        </>
                      )}
                    </button>
                  </div>
                  {driveLink && !isDriveSubmitted && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Link: {driveLink}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <FaCheckCircle className="text-green-500 text-lg" />
                  <div className="flex-1">
                    <span className="text-green-700 dark:text-green-300 font-medium text-sm">
                      Drive Link Submitted
                    </span>
                    {assignmentData?.driveLink && (
                      <a
                        href={assignmentData.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 dark:text-green-400 ml-2 hover:underline inline-flex items-center gap-1"
                      >
                        <FaExternalLinkAlt className="text-[10px]" />
                        View Submission
                      </a>
                    )}
                  </div>
                  <FaRegClock className="text-green-500 text-sm" />
                </div>
              )}
            </div>
          )}

          {/* PDF Upload Section */}
          {hasAssignmentFile && (
            <div
              className={
                hasAssignmentLink
                  ? "border-t border-gray-100 dark:border-gray-700/50 pt-4"
                  : ""
              }
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                PDF Assignment
              </div>
              {!isPdfSubmitted ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <StaticFileUpload
                    onFileSelect={(file) => handleFileSelect(noteId, file)}
                    fileName={fileName}
                    setFileName={(name) =>
                      setFileNames((prev) => ({ ...prev, [noteId]: name }))
                    }
                    noteId={noteId}
                  />
                  <button
                    onClick={handleUploadClick}
                    disabled={isUploading || !fileName}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 min-w-[120px] ${
                      isUploading || !fileName
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaUpload />
                        Upload PDF
                      </>
                    )}
                  </button>
                </div>
              ) : isPdfEvaluated ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <FaCheckCircle className="text-green-500 text-lg" />
                  <div className="flex-1">
                    <span className="text-green-700 dark:text-green-300 font-medium text-sm">
                      PDF Score: {pdfMarks} / 100
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${pdfMarks}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {pdfMarks}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <span className="text-orange-700 dark:text-orange-300 font-medium text-sm">
                      PDF Submitted • Pending Evaluation
                    </span>
                  </div>
                  <FaRegClock className="text-orange-500 text-sm" />
                </div>
              )}
            </div>
          )}

          {/* No submission options available */}
          {!hasAssignmentLink && !hasAssignmentFile && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No assignment available for this day
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function StudentBatch() {
  const { batchId } = useParams();
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);
  const [notesMap, setNotesMap] = useState({});
  const [activeModule, setActiveModule] = useState(null);
  const [reports, setReports] = useState([]);
  const [quizzesMap, setQuizzesMap] = useState({});
  const [codingQuestionsMap, setCodingQuestionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingStates, setUploadingStates] = useState({});
  const [fileNames, setFileNames] = useState({});
  const [driveLinks, setDriveLinks] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_LOGIN_API}/auth/student/me`,
        );
        setStudent(res.data);
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };
    fetchStudent();
  }, [navigate]);

  useEffect(() => {
    const fetchBatchOverview = async () => {
      try {
        if (!student) return;
        setLoading(true);
        const res = await api.get(
          `/student/batch/overview/${batchId}/${student._id}`,
        );
        setBatch(res.data.batch);
        setNotesMap(res.data.notesMap);
        setQuizzesMap(res.data.quizzesMap);
        setCodingQuestionsMap(res.data.codingQuestionsMap);
        if (res.data.latestModule) setActiveModule(res.data.latestModule);
      } catch (err) {
        console.error("Error loading batch overview:", err);
      } finally {
        setLoading(false);
      }
    };

    if (batchId && student) fetchBatchOverview();
  }, [batchId, student]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!student?._id) return;
        const res = await api.get(`/api/reports/${student._id}`);
        setReports(res.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        if (err.response?.status === 401) {
          toast.error("Authentication failed. Please login again.");
          navigate("/");
        }
      }
    };

    if (student) fetchReports();
  }, [student, navigate]);

  // ✅ FIXED: Get assignment data dynamically (no fixed pattern assumption)
  const getAssignmentData = (module, day) => {
    const report = reports.find((r) => r.module === module && r.day === day);
    if (!report) return null;

    const assignments = report.weeklyAssignments || {};
    
    // ✅ Return ANY assignment for this day (since backend handles mapping)
    // Just take the first available assignment
    const values = Object.values(assignments);
    return values.length > 0 ? values[0] : null;
  };

  const getQuizMark = (module, day) => {
    const match = reports.find((r) => r.module === module && r.day === day);
    return match ? (match.marksObtained?.[1] ?? -2) : -2;
  };

  const handleUpload = async (note, module, batchName, student, noteId) => {
    const file = window[`file_${noteId}`];
    if (!file) {
      toast.warn("Please choose a PDF file");
      return;
    }

    setUploadingStates((prev) => ({ ...prev, [noteId]: true }));

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "pdf");

    try {
      await api.post(
        `${import.meta.env.VITE_ADMIN_API}/notes/upload/${encodeURIComponent(batchName)}/${module}/${encodeURIComponent(note.title)}/${encodeURIComponent(student.user.name)}/${student._id}/${student.rollNo}/${note.day}`,
        fd,
      );
      toast.success("PDF uploaded successfully!");
      delete window[`file_${noteId}`];
      setFileNames((prev) => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });

      // Refresh reports after upload
      const reportsRes = await api.get(`/api/reports/${student._id}`);
      setReports(reportsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingStates((prev) => ({ ...prev, [noteId]: false }));
    }
  };

  // ✅ FIXED: Handle Drive Link Submission (NO weekNumber needed)
  const handleDriveSubmit = async (
    note,
    module,
    student,
    noteId,
    driveLink,
  ) => {
    setUploadingStates((prev) => ({ ...prev, [`drive_${noteId}`]: true }));

    try {
      // ✅ REMOVED weekNumber - backend calculates it automatically
      await api.post("/api/reports/submit-link", {
        studentId: student._id,
        module: module,
        day: note.day,
        driveLink: driveLink,
      });

      toast.success("Drive link submitted successfully!");
      setDriveLinks((prev) => ({ ...prev, [noteId]: "" }));

      const reportsRes = await api.get(`/api/reports/${student._id}`);
      setReports(reportsRes.data);
    } catch (err) {
      console.error("Drive link submission error:", err);
      if (err.response?.status === 404) {
        toast.error(
          "API endpoint not found. Please check backend configuration.",
        );
      } else if (err.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
        navigate("/");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Failed to submit drive link. Please try again.",
        );
      }
    } finally {
      setUploadingStates((prev) => ({ ...prev, [`drive_${noteId}`]: false }));
    }
  };

  // Calculate stats
  const totalNotes = Object.values(notesMap).reduce(
    (acc, module) =>
      acc + (module.today?.length || 0) + (module.others?.length || 0),
    0,
  );

  // Track PDF submissions only (since drive links don't have evaluation)
  const completedPdfAssignments = reports.reduce((count, report) => {
    const assignments = report.weeklyAssignments || {};
    const evaluatedPdfs = Object.values(assignments).filter(
      (a) => a.pdfStatus === "evaluated",
    ).length;
    return count + evaluatedPdfs;
  }, 0);

  const completedQuizzes = reports.filter(
    (r) => r.marksObtained?.[1] >= 0,
  ).length;

  const overallProgress =
    totalNotes > 0
      ? Math.round(
          ((completedPdfAssignments + completedQuizzes) / (totalNotes * 2)) *
            100,
        )
      : 0;

  if (loading) return <SkeletonLoader />;

  if (!student || !batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/40 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const currentModuleNotes = notesMap[activeModule] || {
    today: [],
    others: [],
  };
  const moduleCount = Object.keys(notesMap).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/student/home")}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FaArrowLeft className="text-sm" />
          Back to Dashboard
        </button>

        {/* Header Section - Hero Banner */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/30">
                      <FaUserGraduate className="text-xs" />
                      Student Dashboard
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                      <FaChartLine className="text-xs" />
                      Batch Access
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    {batch.batchName}
                  </h1>
                  <div className="flex items-center gap-4 text-blue-100 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <FaUserGraduate className="text-xs" />
                      {student.user?.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-xs" />
                      Roll No: {student.rollNo}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MdOutlineMenuBook className="text-xs" />
                      {moduleCount} Modules
                    </span>
                  </div>
                </div>

                {/* Progress Badge */}
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/20 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MdOutlineEmojiEvents className="text-yellow-300 text-xl" />
                    <span className="text-white text-sm font-medium">
                      Your Progress
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {overallProgress}%
                  </p>
                  <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-blue-100 text-xs mt-2">
                    Overall Completion
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-cyan-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <MdOutlineMenuBook className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Notes
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {totalNotes}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaCheckCircle className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDFs Evaluated
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {completedPdfAssignments}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaQuestionCircle className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quizzes Completed
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {completedQuizzes}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <FaFire className="text-white text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Activities
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {completedPdfAssignments + completedQuizzes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {Object.keys(notesMap).map((module) => (
                <button
                  key={module}
                  onClick={() => setActiveModule(module)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    activeModule === module
                      ? "text-white shadow-md bg-gradient-to-r from-blue-500 to-cyan-500"
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

        {/* Notes Content */}
        <div>
          {currentModuleNotes.today.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <FaFire className="text-white text-xs" />
                  </div>
                  Latest Note
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {currentModuleNotes.today.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    student={student}
                    batch={batch}
                    module={activeModule}
                    large={true}
                    onNavigate={navigate}
                    onUpload={handleUpload}
                    onDriveSubmit={handleDriveSubmit}
                    uploadingStates={uploadingStates}
                    fileNames={fileNames}
                    setFileNames={setFileNames}
                    driveLinks={driveLinks}
                    setDriveLinks={setDriveLinks}
                    getAssignmentData={getAssignmentData}
                    getQuizMark={getQuizMark}
                    quizzesMap={quizzesMap}
                    codingQuestionsMap={codingQuestionsMap}
                  />
                ))}
              </div>
            </div>
          )}

          {currentModuleNotes.others.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FaBookOpen className="text-white text-xs" />
                  </div>
                  Previous Notes
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({currentModuleNotes.others.length} notes)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentModuleNotes.others.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    student={student}
                    batch={batch}
                    module={activeModule}
                    large={false}
                    onNavigate={navigate}
                    onUpload={handleUpload}
                    onDriveSubmit={handleDriveSubmit}
                    uploadingStates={uploadingStates}
                    fileNames={fileNames}
                    setFileNames={setFileNames}
                    driveLinks={driveLinks}
                    setDriveLinks={setDriveLinks}
                    getAssignmentData={getAssignmentData}
                    getQuizMark={getQuizMark}
                    quizzesMap={quizzesMap}
                    codingQuestionsMap={codingQuestionsMap}
                  />
                ))}
              </div>
            </div>
          )}

          {currentModuleNotes.today.length === 0 &&
            currentModuleNotes.others.length === 0 && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-4">
                  <MdOutlineMenuBook className="text-3xl text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Notes Available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Notes haven't been uploaded for this module yet. Check back
                  later!
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}