import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api";
import { toast } from "react-toastify";
import { 
  FaClock, 
  FaArrowLeft, 
  FaArrowRight, 
  FaCheckCircle, 
  FaQuestionCircle,
  FaFlagCheckered,
  FaSave,
  FaExclamationTriangle,
  FaList,
  FaGraduationCap
} from "react-icons/fa";

const AttemptQuiz = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/api/quiz/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(res.data);
        setAnswers(new Array(res.data.questions.length).fill(null));
        setTimer(res.data.questions.length * 60);
      } catch (err) {
        toast.error("Quiz not found.");
        navigate("/");
      }
    };
    fetchQuiz();
  }, [noteId, navigate]);

  // Fullscreen mode on load
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen failed:", err);
      }
    };
    enterFullScreen();
  }, []);

  // Auto-submit on fullscreen exit or refresh/back
  useEffect(() => {
    const handleFullScreenExit = () => {
      if (!document.fullscreenElement && !submitting) {
        handleSubmit();
      }
    };

    const handleUnload = (e) => {
      e.preventDefault();
      handleSubmit();
    };

    document.addEventListener("fullscreenchange", handleFullScreenExit);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenExit);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [answers, quiz, submitting]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0 && !submitting) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleSelect = (index, option) => {
    const updated = [...answers];
    updated[index] = option;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    setShowConfirmModal(false);
    
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/api/quiz/submit/${noteId}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Quiz submitted successfully! 🎉");
      navigate("/student/reports");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Error submitting quiz. Please try again.");
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return answers.filter(a => a !== null).length;
  };

  const getTimerColor = () => {
    const percentage = (timer / (quiz?.questions.length * 60)) * 100;
    if (percentage <= 20) return "#ef4444";
    if (percentage <= 50) return "#f59e0b";
    return "#10b981";
  };

  const formatTime = () => {
    const mins = String(Math.floor(timer / 60)).padStart(2, "0");
    const secs = String(timer % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentQ];
  if (!q || !q.options) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <FaExclamationTriangle className="inline mr-2" />
          Invalid question format.
        </div>
      </div>
    );
  }

  const answeredCount = getAnsweredCount();
  const totalQuestions = quiz.questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <FaGraduationCap className="text-white text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Quiz Assessment</h1>
                  <p className="text-blue-100 text-sm mt-1">Test your knowledge</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 px-4 py-2 rounded-xl">
                  <div className="text-white text-sm">Progress</div>
                  <div className="text-white font-bold">
                    {answeredCount}/{totalQuestions} Answered
                  </div>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-xl">
                  <div className="text-white text-sm">Time Left</div>
                  <div className="text-white font-bold font-mono text-lg">
                    <FaClock className="inline mr-1" />
                    {formatTime()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timer Progress Bar */}
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${(timer / (quiz.questions.length * 60)) * 100}%`,
                backgroundColor: getTimerColor()
              }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              {/* Question Header */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    Question {currentQ + 1} of {totalQuestions}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {answeredCount} answered so far
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  {q.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {["A", "B", "C", "D"].map((opt) => {
                  const isSelected = answers[currentQ] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(currentQ, opt)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 group ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-102"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-2 border-transparent hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 group-hover:bg-blue-100"
                        }`}>
                          {opt}
                        </div>
                        <span className="flex-1">{q.options?.[opt] || ""}</span>
                        {isSelected && <FaCheckCircle className="text-white text-xl" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setCurrentQ(currentQ - 1)}
                  disabled={currentQ === 0}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    currentQ === 0
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <FaArrowLeft /> Previous
                </button>
                
                {currentQ === totalQuestions - 1 ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg"
                  >
                    <FaFlagCheckered /> Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQ(currentQ + 1)}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                  >
                    Next <FaArrowRight />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b dark:border-gray-700">
                <FaList className="text-blue-600" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Question Navigator</h3>
              </div>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {quiz.questions.map((_, idx) => {
                  const isAnswered = answers[idx] !== null;
                  const isCurrent = idx === currentQ;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQ(idx)}
                      className={`relative w-full aspect-square rounded-xl font-semibold transition-all duration-300 ${
                        isCurrent
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105"
                          : isAnswered
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {idx + 1}
                      {isAnswered && !isCurrent && (
                        <FaCheckCircle className="absolute -top-1 -right-1 text-white text-xs" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t dark:border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Answered:</span>
                  <span className="font-semibold text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Unanswered:</span>
                  <span className="font-semibold text-red-600">{totalQuestions - answeredCount}</span>
                </div>
                <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {answeredCount < totalQuestions && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <FaExclamationTriangle className="inline mr-1" />
                    {totalQuestions - answeredCount} question(s) remaining
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <FaExclamationTriangle className="text-yellow-600 text-3xl" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">
                  Submit Quiz?
                </h3>
                
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                  You have answered {answeredCount} out of {totalQuestions} questions.
                  {answeredCount < totalQuestions && " Some questions are unanswered."}
                  <br />
                  Are you sure you want to submit?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scale102 {
          from { transform: scale(1); }
          to { transform: scale(1.02); }
        }
        .transform-scale-102 {
          animation: scale102 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AttemptQuiz;