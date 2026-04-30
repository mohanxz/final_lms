import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import {
  FaPlus,
  FaEdit,
  FaLink,
  FaFilePdf,
  FaCalendarAlt,
  FaVideo,
  FaCode,
  FaGraduationCap,
  FaUserTie,
  FaSpinner,
  FaArrowLeft,
  FaFire,
  FaLayerGroup,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaUpload,
  FaCloudUploadAlt,
  FaFile,
  FaFileImage,
  FaFileAlt,
  FaFileArchive,
  FaEye,
} from "react-icons/fa";
import {
  MdOutlineMenuBook,
} from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EvaluateCodeModal from "../components/EvaluateCodeModal";

// Helper function to get file icon based on file type
const getFileIcon = (fileName) => {
  if (!fileName) return <FaFile className="text-gray-400" />;

  const extension = fileName.split(".").pop().toLowerCase();

  if (extension === "pdf") {
    return <FaFilePdf className="text-red-500" />;
  } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) {
    return <FaFileImage className="text-blue-500" />;
  } else if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return <FaFileAlt className="text-blue-600" />;
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return <FaFileArchive className="text-yellow-600" />;
  } else {
    return <FaFile className="text-gray-500" />;
  }
};

// Helper function to get file type display name
const getFileTypeDisplay = (fileName) => {
  if (!fileName) return "File";

  const extension = fileName.split(".").pop().toLowerCase();
  const typeMap = {
    pdf: "PDF Document",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    svg: "Image",
    webp: "Image",
    doc: "Word Document",
    docx: "Word Document",
    txt: "Text File",
    rtf: "Rich Text",
    zip: "Archive",
    rar: "Archive",
    "7z": "Archive",
    tar: "Archive",
    gz: "Archive",
    xls: "Excel",
    xlsx: "Excel",
    ppt: "PowerPoint",
    pptx: "PowerPoint",
  };

  return typeMap[extension] || `${extension.toUpperCase()} File`;
};

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
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Enhanced Note Card Component for Admin
const AdminNoteCard = ({
  note,
  module,
  isLatest,
  onEdit,
  onCodeEval,
  getSubmissionCount,
}) => {
  const submissionCount = getSubmissionCount(note._id);

  return (
    <div
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${isLatest ? "lg:col-span-2" : ""}`}
    >
      {/* Card Header */}
      <div className="relative p-5 pb-3">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold rounded-full shadow-md">
                <FaCalendarAlt className="text-[10px]" />
                Day {note.day}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-600">
                {note.type ? note.type.charAt(0).toUpperCase() + note.type.slice(1) : "Regular"}
              </span>
              {isLatest && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-full shadow-md">
                  <FaFire className="text-[10px]" />
                  Latest
                </span>
              )}
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white">
              {note.title}
            </h4>
          </div>
          {!isLatest && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              <FaLayerGroup className="text-blue-400 dark:text-cyan-400 text-xs" />
              <span>{module}</span>
            </div>
          )}
        </div>
      </div>

      {/* Resources Section */}
      {(note.assignmentlink || note.assignmentS3Url) && (
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {note.assignmentlink && (
             <div>
              { note.assignmentlink.split(",").map((l,i)=>(
             <a key={i}
                href={l}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-600 dark:text-cyan-400 rounded-lg text-xs hover:from-blue-100 hover:to-cyan-100 transition-all"
              >
                <FaLink size={12} />
                Assignment Link { i+1}
              </a>
             ))}</div>
            )}
            {note.assignmentS3Url && (
              <a
                href={note.assignmentS3Url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs hover:from-green-100 hover:to-emerald-100 transition-all"
              >
                <FaEye size={12} />
                View Notes
              </a>
            )}
          </div>
        </div>
      )}

      {/* Meet Link */}
      {note.meetlink && (
        <div className="px-5 pb-3">
          <a
            href={note.meetlink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-600 dark:text-cyan-400 rounded-lg text-xs hover:from-blue-100 hover:to-cyan-100 transition-all"
          >
            <FaVideo size={12} />
            Join Live Session
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-5 pb-5">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className={`${["seminar", "theory", "hackerrank"].includes(note.type) ? "grid-cols-1" : "grid-cols-2"} grid gap-2`}>
            <button
              onClick={() => onEdit(note)}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
            >
              <FaEdit className="text-sm group-hover/btn:scale-110 transition-transform" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {!["seminar", "theory", "hackerrank"].includes(note.type) ? (
              <button
                onClick={() => onCodeEval(note._id)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg group/btn"
              >
                <FaCode className="text-sm group-hover/btn:scale-110 transition-transform" />
                <span className="hidden sm:inline">Code</span>
                {submissionCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                    {submissionCount}
                  </span>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LessonPlan() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    meetlink: "",
    assignmentlink: "",
    day: "",
    type: "regular",
  });
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCodeEvalModal, setShowCodeEvalModal] = useState(false);
  const [codeEvalData, setCodeEvalData] = useState(null);
  const [batchDetails, setBatchDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissionCounts, setSubmissionCounts] = useState({});

  // Mark as completed states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [completedModules, setCompletedModules] = useState({});

  const token = localStorage.getItem("token");

  // Check completion status for all modules
  const fetchModuleCompletionStatus = useCallback(async (adminModules) => {
    try {
      const res = await API.get(
        `/api/admin-batches/check-complete/${batchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.moduleCompletions) {
        // Only keep completion status for modules this admin owns
        const relevantCompletions = {};
        Object.keys(res.data.moduleCompletions).forEach(module => {
          if (adminModules.includes(module)) {
            relevantCompletions[module] = res.data.moduleCompletions[module];
          }
        });
        setCompletedModules(relevantCompletions);
      }
    } catch (err) {
      console.error("Error checking module completion status:", err);
    }
  }, [batchId, token]);

  const fetchBatchModule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const batch = res.data;
      setBatchDetails({
        batchName: batch.batchName,
        courseName: batch.course.courseName,
        studentCount: batch.students?.length || 0,
      });

      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentAdminId = payload.id;
      const adminModules = batch.admins
        .filter((a) => a.admin === currentAdminId)
        .map((a) => a.module);

      if (!adminModules.length) return navigate("/unauthorized");

      setAdminId(currentAdminId);
      setModules(adminModules);
      setSelectedModule(adminModules[0]);
      
      // Fetch completion status for admin's modules
      await fetchModuleCompletionStatus(adminModules);
    } catch (e) {
      console.error(e);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [batchId, navigate, token, fetchModuleCompletionStatus]);

  const fetchNotes = useCallback(async () => {
    if (!selectedModule) return;
    try {
      const res = await API.get(
        `/notes/${batchId}/${encodeURIComponent(selectedModule)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const sorted = res.data.sort((a, b) => b.day - a.day);
      setNotes(sorted);

      // Count code submissions only
      const counts = {};
      for (const note of sorted) {
        try {
          const submissionsRes = await API.get(
            `/api/codeEval/${note._id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          counts[note._id] = submissionsRes.data.length || 0;
        } catch (e) {
          counts[note._id] = 0;
        }
      }
      setSubmissionCounts(counts);
    } catch (e) {
      console.error(e);
    }
  }, [batchId, selectedModule, token]);

  useEffect(() => {
    fetchBatchModule();
  }, [fetchBatchModule]);
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Handle module completion
  const handleMarkModuleComplete = async () => {
    try {
      const res = await API.patch(
        `/api/admin-batches/mark-module-complete/${batchId}`,
        { 
          module: selectedModule,
          isCompleted: true 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Marked "${selectedModule}" module as completed!`);
      setShowCompleteModal(false);
      setConfirmText("");
      
      // Update local state
      setCompletedModules(prev => ({
        ...prev,
        [selectedModule]: true
      }));
    } catch (err) {
      console.error("Error marking module complete:", err);
      if (err.response?.status === 404) {
        toast.error("Module not found or you're not assigned to this module.");
      } else {
        toast.error("Something went wrong while marking module as completed.");
      }
    }
  };

  const openModalForAdd = () => {
    setEditingNoteId(null);
    setForm({
      title: "",
      meetlink: "",
      assignmentlink: "",
      day: "",
      type: "regular",
    });
    setAssignmentFile(null);
    setShowModal(true);
  };

  const openModalForEdit = (note) => {
    setForm({
      title: note.title,
      meetlink: note.meetlink || "",
      assignmentlink: note.assignmentlink || "",
      day: note.day,
      type: note.type || "regular",
    });
    setEditingNoteId(note._id);
    setAssignmentFile(null);
    setShowModal(true);
  };

  const openCodeEvalModal = async (noteId) => {
    try {
      const res = await API.get(`/api/codeEval/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCodeEvalData({
        noteId: noteId,
        submissions: res.data,
      });
      setShowCodeEvalModal(true);
    } catch (err) {
      console.error("Failed to load code submissions", err);
      toast.error("Unable to fetch code submissions.");
    }
  };

  const getSubmissionCount = (noteId) => {
    return submissionCounts[noteId] || 0;
  };

  // handleSubmit with proper data types
  const handleSubmit = async () => {
    const finalTitle = form.title.trim();

    if (!finalTitle || !form.day) {
      toast.warn("Please fill title and day");
      return;
    }

    const dayNumber = Number(form.day);
    if (isNaN(dayNumber) || dayNumber < 1) {
      toast.warn("Please enter a valid day number (positive integer)");
      return;
    }

    const weekNumber = Math.ceil(dayNumber / 5);

    if (!adminId) {
      toast.error("Admin ID not found. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    try {
      let assignmentS3Url = "";

      if (assignmentFile) {
        const fd = new FormData();
        fd.append("file", assignmentFile);

        const uploadRes = await API.post(
          `/upload-assignment?batch=${batchId}&module=${selectedModule}&title=${finalTitle}`,
          fd,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        assignmentS3Url = uploadRes.data.s3path;
      }

      const payload = {
        title: finalTitle,
        meetlink: form.meetlink || "",
        assignmentlink: form.assignmentlink || "",
        assignmentS3Url,
        batch: batchId,
        module: selectedModule,
        admin: adminId,
        day: dayNumber,
        weekNumber: weekNumber,
        type: form.type || "regular",
      };

      console.log("Submitting payload:", payload);

      if (editingNoteId) {
        await API.put(`/notes/${editingNoteId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Note updated successfully 🎉");
      } else {
        await API.post(`/notes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Note created successfully 🔥");
      }

      setShowModal(false);
      fetchNotes();
    } catch (e) {
      console.error("Error saving note:", e);
      
      if (e.response?.status === 400) {
        if (e.response?.data?.error?.includes("already exists")) {
          toast.error(`Day ${form.day} already exists for this module. Please use a different day.`);
        } else {
          toast.error(e.response?.data?.error || "Invalid data. Please check all fields.");
        }
      } else if (e.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error(e.response?.data?.error || "Error saving note. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalLessons = notes.length;

  if (loading) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        <button
          onClick={() => navigate("/admin/batches")}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 group"
        >
          <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
          Back to Batches
        </button>

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
                      <FaGraduationCap className="text-xs" />
                      Admin Dashboard
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                      <FaChartLine className="text-xs" />
                      Lesson Management
                    </span>
                    {completedModules[selectedModule] && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-400/30 backdrop-blur-sm rounded-full text-green-100 text-xs font-semibold border border-green-400/50">
                        <FaCheckCircle className="text-xs" />
                        Module Completed
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    {batchDetails.batchName}
                  </h1>
                  <div className="flex items-center gap-4 text-blue-50 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <MdOutlineMenuBook className="text-xs" />
                      {batchDetails.courseName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaUserTie className="text-xs" />
                      {modules.length} Modules
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaCheckCircle className="text-xs" />
                      {Object.keys(completedModules).filter(m => completedModules[m]).length} Completed
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/30 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaFire className="text-orange-300 text-xl" />
                    <span className="text-white text-sm font-medium">
                      Total Day
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {totalLessons}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
            <div className="flex gap-1 min-w-max items-center">
              {modules.map((module) => (
                <button
                  key={module}
                  onClick={() => setSelectedModule(module)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 relative ${
                    selectedModule === module
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                      : completedModules[module]
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <FaLayerGroup className="text-xs" />
                  {module}
                  {completedModules[module] && (
                    <FaCheckCircle className="text-xs text-green-500 ml-1" />
                  )}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                {completedModules[selectedModule] ? (
                  <div className="px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-medium text-sm border border-green-300 dark:border-green-700 flex items-center gap-2 shadow-md">
                    <FaCheckCircle />
                    Module Completed
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2"
                  >
                    <FaCheckCircle className="text-xs" />
                    Mark Complete
                  </button>
                )}
                <button
                  onClick={openModalForAdd}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
                >
                  <FaPlus className="text-xs group-hover/btn:rotate-90 transition-transform" />
                  New Days
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          {notes.length > 0 ? (
            <>
              {notes[0] && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-7 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <FaFire className="text-orange-500" />
                      Current Day
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <AdminNoteCard
                      note={notes[0]}
                      module={selectedModule}
                      isLatest={true}
                      onEdit={openModalForEdit}
                      onCodeEval={openCodeEvalModal}
                      getSubmissionCount={getSubmissionCount}
                    />
                  </div>
                </div>
              )}

              {notes.length > 1 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-7 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <FaClock className="text-blue-500" />
                      Previous Days
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({notes.length - 1} Days)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notes.slice(1).map((note) => (
                      <AdminNoteCard
                        key={note._id}
                        note={note}
                        module={selectedModule}
                        isLatest={false}
                        onEdit={openModalForEdit}
                        onCodeEval={openCodeEvalModal}
                        getSubmissionCount={getSubmissionCount}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mb-4">
                <MdOutlineMenuBook className="text-3xl text-blue-500 dark:text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Lessons Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Get started by creating your first lesson for this module
              </p>
              <button
                onClick={openModalForAdd}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn mx-auto"
              >
                <FaPlus />
                Create First Lesson
              </button>
            </div>
          )}
        </div>

        {/* Module Completion Confirmation Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-96 shadow-2xl space-y-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                Confirm Module Completion
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This action cannot be undone. Please make sure all lessons for this module are completed.
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Type <strong className="text-blue-600 dark:text-blue-400 font-mono">confirm</strong> to mark 
                <span className="font-medium text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mx-1"> 
                  {selectedModule} 
                </span> 
                module as completed.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder='Type "confirm" to proceed...'
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setConfirmText("");
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmText.toLowerCase().trim() === "confirm") {
                      handleMarkModuleComplete();
                    } else {
                      toast.error("Please type 'confirm' to proceed.");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Confirm Completion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Code Evaluation Modal */}
        {showCodeEvalModal && codeEvalData && (
          <EvaluateCodeModal
            data={codeEvalData}
            module={selectedModule}
            onClose={() => setShowCodeEvalModal(false)}
          />
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-t-2xl flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaFire className="text-orange-500" />
                  {editingNoteId ? "Edit Lesson" : "Create New Lesson"}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className={`grid grid-cols-1 ${["seminar", "theory", "practical"].includes(form.type) ? "" : "md:grid-cols-2"} gap-5`}>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lesson Title *
                      </label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Introduction to React Hooks"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Day Number * (Number)
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., 1"
                        value={form.day}
                        onChange={(e) => setForm({ ...form, day: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Week will be automatically calculated (5 days per week)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lesson Type *
                      </label>
                      <select
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        <option value="regular">Regular Lesson</option>
                        <option value="seminar">Seminar</option>
                        <option value="practical">Practical</option>
                        <option value="theory">Theory</option>
                        <option value="hackerrank">HackerRank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Meet Link
                      </label>
                      <div className="relative">
                        <FaVideo className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm" />
                        <input
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="https://meet.google.com/xyz-abc"
                          value={form.meetlink}
                          onChange={(e) => setForm({ ...form, meetlink: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {!["seminar", "theory", "practical"].includes(form.type) && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Assignment Link
                        </label>
                        <div className="relative">
                          <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm" />
                          <input
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl py-3 pl-10 pr-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="https://forms.gle/..."
                            value={form.assignmentlink}
                            onChange={(e) => setForm({ ...form, assignmentlink: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notes File
                        </label>
                        <div className="space-y-3">
                          <div
                            onClick={() => document.getElementById("file-upload").click()}
                            className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                              assignmentFile
                                ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                                : "border-gray-300 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30"
                            }`}
                          >
                            {assignmentFile ? (
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {getFileIcon(assignmentFile.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {assignmentFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {getFileTypeDisplay(assignmentFile.name)} • {(assignmentFile.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <FaCloudUploadAlt className="text-3xl text-blue-400 dark:text-cyan-400 flex-shrink-0" />
                                <div className="flex flex-col">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Click to upload notes file
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    PDF, DOC, Images, Archives supported
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) setAssignmentFile(file);
                            }}
                          />

                          <div className="flex gap-2">
                            <label
                              htmlFor="file-upload"
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                            >
                              <FaUpload size={14} />
                              Browse Files
                            </label>
                            {assignmentFile && (
                              <button
                                type="button"
                                onClick={() => setAssignmentFile(null)}
                                className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all shadow-md"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all ${
                      submitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg transform hover:scale-[1.01]"
                    }`}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin" />
                        {editingNoteId ? "Updating..." : "Creating..."}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {editingNoteId ? (
                          <>
                            <FaEdit />
                            Update Lesson
                          </>
                        ) : (
                          <>
                            <FaPlus />
                            Create Lesson
                          </>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}