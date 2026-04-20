import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api";
import { 
  FaFileAlt, FaUpload, FaCheckCircle, FaProjectDiagram, 
  FaFolderOpen, FaClock, FaArrowLeft, FaSpinner, 
  FaExternalLinkAlt, FaCheckDouble, FaUserGraduate, 
  FaBookOpen, FaChartLine
} from "react-icons/fa";
import { MdOutlineAssignment, MdOutlineMenuBook } from "react-icons/md";
import { toast } from "react-toastify";

const ProjectSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 lg:p-8">
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="h-32 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl animate-pulse"></div>
      </div>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function StudentProject() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [files, setFiles] = useState({});
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [courseModules, setCourseModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const studentRes = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const studentData = studentRes.data;
        setStudent(studentData);
        setBatch(studentData.batch);

        const batchRes = await API.get(`/student/batch/by-id/${studentData.batch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const course = batchRes.data.course;
        setBatchName(batchRes.data.batchName);

        const courseRes = await API.get(`/api/courses/${course}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mods = courseRes.data.modules;
        setCourseModules(mods);

        const res = await API.post(
          "/api/project/check-submissions",
          {
            batchName: batchRes.data.batchName,
            studentName: studentData.user.name,
            rollNo: studentData.rollNo,
            modules: mods
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setModules(
          res.data.map((m) => ({
            module: m.module,
            questionUrl: m.questionUrl,
            answerSubmitted: m.answerExists,
          }))
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch project modules");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFileChange = (module, file) => {
    if (file && file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }
    setFiles((prev) => ({ ...prev, [module]: file }));
  };

  const handleSubmit = async (module) => {
    const file = files[module];
    if (!file || !batch || !student) {
      toast.error("Missing file or data");
      return;
    }

    setUploading(prev => ({ ...prev, [module]: true }));

    const fd = new FormData();
    fd.append("file", file);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_ADMIN_API}/upload-project?batch=${batch}&module=${module}&studentName=${student.user.name}&rollNo=${student.rollNo}`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Project submitted successfully!");
      setModules((prev) =>
        prev.map((m) =>
          m.module === module ? { ...m, answerSubmitted: true } : m
        )
      );
      setFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[module];
        return newFiles;
      });
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(prev => ({ ...prev, [module]: false }));
    }
  };

  const submittedCount = modules.filter(m => m.answerSubmitted).length;
  const totalCount = modules.length;
  const progressPercentage = totalCount > 0 ? (submittedCount / totalCount) * 100 : 0;

  if (loading) return <ProjectSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/home')}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FaArrowLeft className="text-sm" />
          Back to Dashboard
        </button>

        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl mb-8">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <FaProjectDiagram className="text-yellow-300" />
                  <span className="text-white text-sm font-medium">Project Submission Portal</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                  Practical Submission
                </h1>
                <p className="text-blue-100 text-sm">
                  Submit your module-wise Practical assignments for evaluation
                </p>
              </div>
              
              {/* Progress Badge */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center min-w-[160px] border border-white/20 shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaCheckDouble className="text-green-300 text-lg" />
                  <span className="text-white text-sm font-medium">Progress</span>
                </div>
                <p className="text-2xl font-bold text-white">{submittedCount}/{totalCount}</p>
                <p className="text-blue-100 text-xs">Practicals Completed</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-blue-100 mb-2">
                <span>Overall Completion</span>
                <span>{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Info Card */}
        {student && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                  <FaUserGraduate className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Roll No: {student.rollNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <FaBookOpen className="text-blue-500 dark:text-cyan-400 text-xs" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{batchName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Project Modules List */}
        <div className="space-y-5">
          {modules.map((m, index) => (
            <div
              key={m.module}
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Module Header */}
              <div className="relative p-5 pb-3">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-2xl"></div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                      <span className="text-white font-bold text-sm">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {m.module}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MdOutlineAssignment className="text-gray-400 text-xs" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Module Practical</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {m.answerSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                      <FaCheckCircle className="text-xs" />
                      Submitted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full">
                      <FaClock className="text-xs" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Module Content */}
              <div className="px-5 pb-5">
                {/* Question Link */}
                <div className="mb-4">
                  {m.questionUrl ? (
                    <a
                      href={m.questionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 text-sm font-medium group/link"
                    >
                      <FaFileAlt className="text-sm" />
                      View Practical Question
                      <FaExternalLinkAlt className="text-xs opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded-xl text-sm">
                      <FaFolderOpen />
                      No question posted yet
                    </div>
                  )}
                </div>

                {/* Submission Section */}
                <div>
                  {m.answerSubmitted ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <FaCheckCircle className="text-green-600 dark:text-green-400 text-lg" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300">Practical Submitted Successfully</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Your Practical has been received and will be reviewed</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* File Upload Area */}
                      <div 
                        className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 ${
                          files[m.module] 
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-cyan-600 dark:hover:bg-cyan-900/20'
                        }`}
                      >
                        <label className="flex flex-col items-center justify-center cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            {files[m.module] ? (
                              <>
                                <FaCheckCircle className="text-green-500 text-2xl" />
                                <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                                  {files[m.module].name}
                                </span>
                                <span className="text-xs text-gray-500">Click to change file</span>
                              </>
                            ) : (
                              <>
                                <FaUpload className="text-gray-400 text-2xl" />
                                <span className="text-gray-500 dark:text-gray-400 text-sm">
                                  Click to upload PDF
                                </span>
                                <span className="text-xs text-gray-400">PDF only, max 10MB</span>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleFileChange(m.module, e.target.files[0])}
                            disabled={!m.questionUrl}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      {/* Submit Button */}
                      <button
                        onClick={() => handleSubmit(m.module)}
                        disabled={!m.questionUrl || !files[m.module] || uploading[m.module]}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          !m.questionUrl || !files[m.module] || uploading[m.module]
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]'
                        }`}
                      >
                        {uploading[m.module] ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FaUpload />
                            Submit Practical
                          </>
                        )}
                      </button>
                      
                      {!m.questionUrl && (
                        <p className="text-xs text-orange-500 text-center mt-2">
                          Practical submission is disabled until the question is posted
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {modules.length === 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-4">
              <FaProjectDiagram className="text-3xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Practicals Available</h3>
            <p className="text-gray-500 dark:text-gray-400">No practical modules have been assigned yet. Check back later!</p>
          </div>
        )}

        {/* Footer Note */}
        {modules.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-cyan-800">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-cyan-300">
              <FaCheckCircle className="text-sm" />
              <span>All Practicals submissions are final. Please ensure you upload the correct file before submitting.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}