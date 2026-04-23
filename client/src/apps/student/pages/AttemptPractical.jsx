import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api.jsx"; 
import { toast } from "react-toastify";
import CodeEditor from "./PracticalCoding"; // This is the component the user mentioned

const AttemptPractical = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);

    const [studentId, setStudentId] = useState(null);

    useEffect(() => {
        const fetchStudentId = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const meRes = await fetch(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const student = await meRes.json();
                setStudentId(student._id);
            } catch (e) {
                console.error("Failed to fetch student profile", e);
            }
        };
        fetchStudentId();
    }, []);

    const [userResults, setUserResults] = useState({});

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await API.get(`/api/practical/${noteId}`);
                setQuestions(res.data);
                
                // Initialize userResults with empty entries
                const initialResults = {};
                res.data.forEach((_, i) => {
                    initialResults[i] = { 
                        questionIndex: i, 
                        passed: false, 
                        score: 0, 
                        code: "", 
                        lang: "python" 
                    };
                });
                setUserResults(initialResults);
            } catch (err) {
                console.error("Error fetching practical questions:", err);
                toast.error("Failed to load practical questions.");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        if (noteId) fetchQuestions();
    }, [noteId, navigate]);

    const handleCodeChange = (code, lang, passed = false) => {
        setUserResults(prev => ({
            ...prev,
            [currentIdx]: {
                ...prev[currentIdx],
                code,
                lang,
                passed,
                score: passed ? 10 : 0
            }
        }));
    };

    const handleSubmission = async () => {
        try {
            const resultsArray = Object.values(userResults);
            if (resultsArray.some(r => r.code.trim() === "")) {
                if (!window.confirm("Some questions are not attempted. Submit anyway?")) return;
            }

            const earnedScore = resultsArray.reduce((acc, curr) => acc + (curr.passed ? 20 : 0), 0);
            const maxScore = resultsArray.length * 10;

            await API.post(`/api/practical/submit/${noteId}/${studentId}`, {
                results: resultsArray,
                earnedScore,
                maxScore
            });
            
            toast.success("Practical session submitted successfully!");
            navigate("/student/reports");
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Failed to submit practical results.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0d1117] text-white">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0d1117] text-white">
                <p>No practical questions found.</p>
            </div>
        );
    }

    const currentQuestion = questions[currentIdx];

    return (
        <div className="h-screen flex flex-col bg-[#0d1117]">
            {/* Question Header */}
            <div className="bg-[#161b22] px-6 py-3 border-b border-[#30363d] flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-indigo-400 font-bold">Practical Q{currentIdx + 1}</span>
                    <h2 className="text-white font-semibold">{currentQuestion.title}</h2>
                </div>
                <div className="flex gap-2">
                <div className="flex bg-[#1f2937]/50 p-1 rounded-xl border border-gray-800">
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIdx(i)}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                                currentIdx === i 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105" 
                                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                            }`}
                        >
                            Q{i + 1}
                        </button>
                    ))}
                </div>
                    <button
                        onClick={handleSubmission}
                        className="ml-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        Submit Test
                    </button>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Problem Statement */}
                <div className="w-1/3 p-8 overflow-y-auto text-gray-300 border-r border-gray-800 bg-[#0d1117] scrollbar-hide">
                    <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Problem Statement</h3>
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQuestion.questionHtml }} />
                </div>

                {/* Right: Code Editor */}
                <div className="flex-1">
                    <CodeEditor 
                        key={`${currentIdx}-${currentQuestion._id}`}
                        testCases={currentQuestion.testCases || []}
                        onChange={handleCodeChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default AttemptPractical;
