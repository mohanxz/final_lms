import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api";
import { 
  FaArrowLeft, FaClock, FaCheckCircle, FaQuestionCircle, 
  FaSpinner, FaChartLine, FaCalendarAlt, FaUserGraduate
} from "react-icons/fa";
import { MdOutlineEmojiEvents, MdOutlineMenuBook } from "react-icons/md";
import { toast } from "react-toastify";

// Brand color constant
const brandColor = "#08CAFC";

const FinalQuiz = () => {
  const { module } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await API.get(`/api/final-quiz/${module}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(res.data);
        setAnswers(new Array(res.data.questions.length).fill(null));
        setTimer(res.data.questions.length * 60);
      } catch (err) {
        toast.error("Quiz not available.");
        navigate("/student/theory");
      }
    };

    fetchQuiz();
  }, [module, token, navigate]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleAnswerChange = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await API.post(
        `/api/final-quiz/submit/${module}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Quiz submitted successfully!");
      navigate("/student/theory");
    } catch (err) {
      toast.error("Submission failed.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#08CAFC]/5 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
               style={{ borderColor: `${brandColor}40`, borderTopColor: brandColor }}></div>
          <p className="text-gray-500 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQ];
  const optionEntries = currentQuestion && currentQuestion.options
    ? Object.entries(currentQuestion.options)
    : [];
  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercentage = (answeredCount / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#08CAFC]/5 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
             style={{ background: `${brandColor}15` }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse delay-1000"
             style={{ background: `${brandColor}10` }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
             style={{ background: `${brandColor}08` }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/student/theory")}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FaArrowLeft className="text-sm" />
          Back to Theory
        </button>

        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl mb-8"
             style={{ background: `linear-gradient(135deg, ${brandColor}, #0284c7, #0369a1)` }}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <FaQuestionCircle className="text-yellow-300" />
                  <span className="text-white text-sm font-medium">Final Assessment</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {module} - Final Quiz
                </h1>
                <p className="text-blue-100 text-sm">
                  Test your knowledge with this comprehensive assessment
                </p>
              </div>
              
              {/* Timer Badge */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center min-w-[140px] border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaClock className="text-yellow-300 text-lg" />
                  <span className="text-white text-sm font-medium">Time Left</span>
                </div>
                <p className={`text-2xl font-bold ${timer <= 60 ? 'text-red-300' : 'text-white'}`}>
                  {formatTime(timer)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Question {currentQ + 1} of {quiz.questions.length}</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progressPercentage}%`,
                    background: `linear-gradient(135deg, ${brandColor}, #0284c7)`
                  }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {optionEntries.map(([key, option]) => (
                  <label
                    key={key}
                    className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      answers[currentQ] === key
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-800/50'
                    }`}
                    style={answers[currentQ] === key ? { 
                      borderColor: brandColor,
                      borderWidth: '2px'
                    } : {}}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ}`}
                      value={key}
                      checked={answers[currentQ] === key}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="mt-0.5 mr-3"
                      style={{ accentColor: brandColor }}
                    />
                    <span className="text-gray-900 dark:text-white">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
              >
                Previous
              </button>

              <div className="flex flex-wrap gap-2 justify-center">
                {quiz.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQ(idx)}
                    className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${
                      idx === currentQ
                        ? 'text-white shadow-md'
                        : answers[idx] !== null
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={idx === currentQ ? { 
                      background: `linear-gradient(135deg, ${brandColor}, #0284c7)`
                    } : {}}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentQ === quiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || answers.some(a => a === null)}
                  className="px-6 py-2.5 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md"
                  style={!(submitting || answers.some(a => a === null)) ? {
                    background: `linear-gradient(135deg, #10b981, #059669)`
                  } : {}}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin inline mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQ(Math.min(quiz.questions.length - 1, currentQ + 1))}
                  className="px-6 py-2.5 text-white rounded-xl transition-all duration-200 font-medium shadow-md"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, #0284c7)` }}
                >
                  Next
                </button>
              )}
            </div>

            {/* Answer Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Progress:</span> {answeredCount} of {quiz.questions.length} questions answered
                </div>
                {answers.some(a => a === null) && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                    <FaClock className="text-xs" />
                    Please answer all questions before submitting
                  </div>
                )}
                {!answers.some(a => a === null) && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <FaCheckCircle className="text-xs" />
                    All questions answered. Ready to submit!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalQuiz;