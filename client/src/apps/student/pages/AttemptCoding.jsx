import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api.jsx"; 
import { toast } from "react-toastify";
import CodeCompiler from "./CodeCompiler";

const AttemptCoding = () => {
    const { noteId, studentId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                // Fetch all questions for this note
                const res = await API.get(`/api/coding/${noteId}`);
                
                // Format questions for CodeCompiler
                // CodeCompiler expects: { questionHtml, testCases, language, defaultScorePerQuestion, userId }
                const formattedQuestions = res.data.map(q => ({
                    ...q,
                    userId: studentId, // Pass studentId so CodeCompiler knows who is submitting
                    testCases: q.testCases || [],
                    language: q.language || ["python3"],
                    defaultScorePerQuestion: q.defaultScorePerQuestion || 10
                }));

                setQuestions(formattedQuestions);
            } catch (err) {
                console.error("Error fetching questions:", err);
                toast.error("Failed to load coding questions.");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        if (noteId) fetchQuestions();
    }, [noteId, studentId, navigate]);

    const handleSaveCode = async (qIdx, code, langId) => {
        // Individual save logic can be added here if there's a specific endpoint
        // For now, we'll just log it. CodeCompiler also keeps internal state.
        console.log(`Auto-saving question ${qIdx} [${langId}]`);
    };

    const handleSubmitAll = async (payload) => {
        // payload: { userId, earnedScore, maxScore, results }
        // results: [{ questionIndex, passed, score, code, lang }]
        try {
            await API.post(`/api/coding/submit/${noteId}/${studentId}`, {
                results: payload.results,
                earnedScore: payload.earnedScore,
                maxScore: payload.maxScore
            });
            
            toast.success("Final submission successful!");
            navigate("/student/reports");
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Failed to submit results. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0a0e17] text-white">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-medium">Loading Workspace...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0a0e17] text-white">
                <p className="text-gray-400 font-medium">No coding questions found for this note.</p>
                <button 
                  onClick={() => navigate(-1)}
                  className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >Go Back</button>
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <CodeCompiler 
                questions={questions} 
                onSave={handleSaveCode}
                onSubmit={handleSubmitAll}
            />
        </div>
    );
};

export default AttemptCoding;
