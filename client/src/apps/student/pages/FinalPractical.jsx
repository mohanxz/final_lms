import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import axios from "axios";
import { FaFlask, FaPlayCircle, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";

const FinalPractical = () => {
    const [practicals, setPracticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPracticals = async () => {
            try {
                // We need to fetch all notes that are of type 'practical' for the student's batch
                // And check if they have questions and if they are submitted.
                // For simplicity, let's fetch all modules and their practicals.
                // We'll reuse the logic from StudentBatch but specialized for practicals.
                
                // Fetch student details properly
                const meRes = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const student = meRes.data;
                const sId = student._id || student.id;
                const bId = student.batch || student.batchId;

                console.log("Checking practicals for student:", sId, "batch:", bId);

                const res = await API.get(`/student/batch/overview/${bId}/${sId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log("Practicals Map from backend:", res.data.practicalsMap);

                // notesMap contains module -> { today: [], others: [] }
                const allPracticals = [];
                Object.entries(res.data.notesMap).forEach(([moduleName, { today, others }]) => {
                    [...today, ...others].forEach(note => {
                        if (note.type === 'practical') {
                            const nid = note._id || note.id;
                            const submissionData = res.data.practicalsMap?.[nid];
                            const isSubmitted = submissionData?.submitted || false;
                            
                            allPracticals.push({ ...note, moduleName, isSubmitted });
                        }
                    });
                });
                
                setPracticals(allPracticals);
            } catch (err) {
                console.error("Failed to load practicals", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPracticals();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 font-sans">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <FaFlask className="text-indigo-600" />
                Practical Sessions
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-10">Select a day to attempt your practical coding tasks.</p>

            {practicals.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500">No practical sessions found for your batch.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {practicals.map((p) => (
                        <div key={p._id} className="bg-white dark:bg-[#0f111a] p-6 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    Day {p.day}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{p.courseName || p.module}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 group-hover:text-indigo-600 transition-colors truncate">
                                {p.title}
                            </h3>
                            
                            {p.isSubmitted ? (
                                <div className="w-full flex items-center justify-center gap-3 py-3.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl font-black text-sm border-2 border-green-100 dark:border-green-800/50 shadow-sm">
                                    <FaCheckCircle className="animate-pulse" />
                                    COMPLETED
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate(`/student/practical/attempt/${p._id}`)}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-950 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/10 active:scale-95 group-hover:scale-[1.02]"
                                >
                                    <FaPlayCircle className="group-hover:rotate-12 transition-transform" />
                                    ATTEND TEST
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FinalPractical;
