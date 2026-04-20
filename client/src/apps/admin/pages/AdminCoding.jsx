import React, { useEffect, useState, useCallback } from "react";
import { FaPlus, FaEdit, FaTimes, FaTrash, FaEyeSlash, FaEye } from "react-icons/fa";
import { useParams } from "react-router-dom";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast, { Toaster } from "react-hot-toast";
import API from "../api";
import CodeCompiler from "../../student/pages/CodeCompiler";

export default function AdminCoding() {
  const { batchId } = useParams();
  const token = localStorage.getItem("token");

  const [notes, setNotes] = useState([]);
  const [codingMap, setCodingMap] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [adminId, setAdminId] = useState("");
 
  const languages = ["python3", "java", "cpp", "javascript", "c", "csharp"];

  const getInitialQuestion = () => ({
    title: "",
    questionHtml: "",
    testCases: [{ input: [""], expectedOutput: [""], hidden: false }],
    defaultScorePerQuestion: 10,
    totalMark: 0,
    language: ["python3", "java", "cpp"],
  });

  const [questions, setQuestions] = useState([getInitialQuestion()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPreview, setIsPreview] = useState(false);

  const isQuestionValid = (q) => {
    if (!q) return false;
    const hasTitle = String(q.title || "").trim().length > 0;
    const hasHtml = String(q.questionHtml || "").replace(/<[^>]*>/g, "").trim().length > 0;
    const hasTestCases = Array.isArray(q.testCases) && 
                       q.testCases.length > 0 && 
                       q.testCases.every(tc => {
                         const inStr = Array.isArray(tc?.input) ? tc.input.join("").trim() : String(tc?.input || "").trim();
                         const outStr = Array.isArray(tc?.expectedOutput) ? tc.expectedOutput.join("").trim() : String(tc?.expectedOutput || "").trim();
                         return inStr.length > 0 && outStr.length > 0;
                       });
    const hasLanguages = Array.isArray(q.language) && q.language.length > 0;
    
    return hasTitle && hasHtml && hasTestCases && hasLanguages;
  };

  const fetchModules = useCallback(async () => {
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
    }
  }, [batchId, token]);

  const fetchNotes = useCallback(async () => {
    if (!selectedModule) return;
    try {
      const res = await API.get(`/notes/${batchId}/${encodeURIComponent(selectedModule)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data);
      fetchCodingQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  }, [batchId, selectedModule, token]);

  const fetchCodingQuestions = async (noteList) => {
    const map = {};
    for (let note of noteList) {
      try {
        const { data } = await API.get(`/api/codingquestions/by-note/${note._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        map[note._id] = data;
      } catch {}
    }
    setCodingMap(map);
  };

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openModal = (noteId) => {
    setSelectedNote(noteId);
    const codingQuestions = codingMap[noteId] || [];

    if (Array.isArray(codingQuestions) && codingQuestions.length > 0) {
      setQuestions(codingQuestions.map(q => ({
        ...getInitialQuestion(),
        ...q
      })));
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
  };

  const updateCurrentQuestion = (fields) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (!updated[currentIdx]) return prev;
      updated[currentIdx] = { ...updated[currentIdx], ...fields };
      return updated;
    });
  };

  const updateTestCaseField = (tcIndex, field, value) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      const updatedTestCases = [...updatedQuestions[currentIdx].testCases];
      // Store as array split by newlines
      updatedTestCases[tcIndex][field] = value.split('\n');
      updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], testCases: updatedTestCases };
      return updatedQuestions;
    });
  };

  const handleLanguageToggle = (lang) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      const currentQ = updatedQuestions[currentIdx];
      const updatedLangs = currentQ.language.includes(lang)
        ? currentQ.language.filter((l) => l !== lang)
        : [...currentQ.language, lang];
      updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], language: updatedLangs };
      return updatedQuestions;
    });
  };

  const addNewQuestionToModal = () => {
    const nextIdx = questions.length;
    setQuestions(prev => [...prev, getInitialQuestion()]);
    setCurrentIdx(nextIdx);
  };

  const removeQuestionFromModal = (index) => {
    if (questions.length === 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (currentIdx >= updated.length) {
      setCurrentIdx(updated.length - 1);
    }
  };

  const addTestCase = () => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      updatedQuestions[currentIdx] = {
        ...updatedQuestions[currentIdx],
        testCases: [
          ...updatedQuestions[currentIdx].testCases,
          { input: [""], expectedOutput: [""], hidden: false },
        ]
      };
      return updatedQuestions;
    });
  };

  const removeTestCase = (index) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      const updatedTestCases = updatedQuestions[currentIdx].testCases.filter((_, i) => i !== index);
      updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], testCases: updatedTestCases };
      return updatedQuestions;
    });
  };

  const toggleHidden = (index) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      const updatedTestCases = [...updatedQuestions[currentIdx].testCases];
      updatedTestCases[index].hidden = !updatedTestCases[index].hidden;
      updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], testCases: updatedTestCases };
      return updatedQuestions;
    });
  };

  const handleAddOrUpdate = async () => {
    // Final check for all questions
    for (let i = 0; i < questions.length; i++) {
        if (!isQuestionValid(questions[i])) {
            toast.error(`Please fill all mandatory fields for Question ${i + 1}`);
            setCurrentIdx(i);
            return;
        }
    }

    try {
      const payload = {
        questions: questions.map(q => ({
          ...q,
          noteId: selectedNote,
          createdBy: adminId
        }))
      };

      await API.post(`/api/codingquestions/batch`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data } = await API.get(`/api/codingquestions/by-note/${selectedNote}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCodingMap((prev) => ({ ...prev, [selectedNote]: data }));
      toast.success("Successfully saved all coding questions!");
      closeModal();
    } catch (err) {
      console.error("Failed to save coding questions", err);
      toast.error("Failed to save questions. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 mx-auto text-gray-900 dark:bg-black dark:text-white min-h-screen max-w-5xl">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-6">
        Coding Manager – <span className="text-indigo-600">{selectedModule}</span>
      </h2>

      {/* Modules buttons */}
      {modules.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {modules.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-4 py-1 rounded-full border text-sm font-medium transition w-full sm:w-auto ${
                selectedModule === mod
                  ? "bg-black text-white border-black"
                  : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-6">
        {notes.filter(note => note.type !== 'theory' && note.type !== 'seminar').map((note) => (
          <div
            key={note._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold">
                Day {note.day}: <span className="break-words">{note.title}</span>
              </h3>
              {codingMap[note._id] && codingMap[note._id].length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {codingMap[note._id].map((q, qidx) => (
                    <span 
                      key={q._id || qidx} 
                      className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded border border-indigo-100 dark:border-indigo-800"
                    >
                      {q.title || `Q${qidx + 1}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => openModal(note._id)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-500/20 whitespace-nowrap w-full sm:w-auto justify-center font-semibold"
            >
              <FaEdit />
              {(codingMap[note._id] && codingMap[note._id].length > 0) ? "Manage Coding" : "Add Coding"}
            </button>
          </div>
        ))}
      </div>

      {/* Premium Tailwind Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 transition-all duration-300">
          {/* Backdrop with Blur */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"></div>

          {/* Modal Container */}
          <div className="bg-white dark:bg-[#0f111a] w-full max-w-5xl max-h-full overflow-hidden rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col relative z-10 animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#0f111a] z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <FaEdit size={20} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Manage Coding Questions</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">Configure test cases and problem statements</p>
                </div>
              </div>
          
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {!questions[currentIdx] ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Preparing question workspace...</p>
                </div>
              ) : (
                <>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-1">
                  <div className="flex-1 overflow-x-auto no-scrollbar pb-1">
                    <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl w-fit border border-gray-100 dark:border-gray-800">
                      {questions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIdx(idx)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap min-w-[120px] ${
                            currentIdx === idx
                              ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-black/5 ring-1 ring-gray-100 dark:ring-gray-600 scale-[1.02]"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/40"
                          }`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 ${isQuestionValid(q) ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                          <span>Q{idx + 1}: {String(q.title || 'Untitled').slice(0, 12)}{(q.title || '').length > 12 ? '...' : ''}</span>
                          {questions.length > 1 && (
                            <FaTrash 
                              className="ml-auto text-gray-300 hover:text-red-500 transition-colors" 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuestionFromModal(idx);
                              }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={addNewQuestionToModal}
                    disabled={!isQuestionValid(questions[currentIdx])}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shrink-0 ${
                      isQuestionValid(questions[currentIdx]) 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-95" 
                        : "bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    <FaPlus size={14} /> <span>Add New Question</span>
                  </button>
                </div>

            <div className="flex gap-4 mb-4 border-b border-gray-300 dark:border-gray-700">
  
  <button 
    onClick={() => setIsPreview(false)}
    className={`pb-2 text-sm font-medium transition ${
      !isPreview 
        ? 'border-b-2 border-indigo-600 text-indigo-600'
        : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    Edit
  </button>

  <button 
    onClick={() => setIsPreview(true)}
    className={`pb-2 text-sm font-medium transition ${
      isPreview 
        ? 'border-b-2 border-indigo-600 text-indigo-600'
        : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    Preview
  </button>

</div>

            {!isPreview ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title <span className="text-red-500">*</span></label>
                    <input
                      key={`title-${currentIdx}`}
                      type="text"
                      placeholder="Title"
                      className="w-full p-2 border dark:bg-gray-800 dark:border-gray-600 rounded text-lg font-medium"
                      value={questions[currentIdx].title}
                      onChange={(e) => updateCurrentQuestion({ title: e.target.value })}
                    />
                  </div>

                  <div className="my-3">
                    <label className="text-sm font-medium mb-1 block">Question HTML Content <span className="text-red-500">*</span></label>
                    <ReactQuill
                      key={`quill-${currentIdx}`}
                      theme="snow"
                      value={questions[currentIdx].questionHtml || ""}
                      onChange={(content) => updateCurrentQuestion({ questionHtml: content })}
                      className="bg-white dark:bg-gray-800 dark:text-gray-900 rounded"
                      placeholder="Detailed Question HTML content"
                    />
                  </div>

                  <div className="my-3">
                    <label className="text-sm font-medium mb-1 block">Supported Languages <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageToggle(lang)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            questions[currentIdx].language.includes(lang)
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-bold">Test Cases <span className="text-red-500">* (At least 1 valid)</span></label>
                      <button onClick={addTestCase} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        + Add Test Case
                      </button>
                    </div>
                    {questions[currentIdx].testCases.map((tc, tcIndex) => (
                      <div key={tcIndex} className="border rounded-lg p-3 mb-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Test Case {tcIndex + 1}</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleHidden(tcIndex)} className="text-gray-500 hover:text-indigo-600 transition">
                              {tc.hidden ? <FaEyeSlash title="Hidden" /> : <FaEye title="Visible" />}
                            </button>
                            <button onClick={() => removeTestCase(tcIndex)} className="text-red-400 hover:text-red-600 transition">
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Input <span className="text-red-500">*</span></label>
                            <textarea
                              placeholder="Input"
                              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 min-h-[60px] text-sm font-mono"
                              value={Array.isArray(tc.input) ? tc.input.join('\n') : tc.input}
                              onChange={(e) => updateTestCaseField(tcIndex, "input", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Expected Output <span className="text-red-500">*</span></label>
                            <textarea
                              placeholder="Expected Output"
                              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 min-h-[60px] text-sm font-mono"
                              value={Array.isArray(tc.expectedOutput) ? tc.expectedOutput.join('\n') : tc.expectedOutput}
                              onChange={(e) => updateTestCaseField(tcIndex, "expectedOutput", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            ) : (
                <div className="w-full border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden" style={{ minHeight: "600px", height: "70vh" }}>
                    <CodeCompiler 
                        questions={questions} 
                        hideSubmit={true} 
                        isEmbedded={true} 
                    />
                </div>
            )}
                </>
              )}
            </div>

           <div className="px-6 py-4 flex justify-end gap-3">
  
  <button
    onClick={handleAddOrUpdate}
    disabled={!questions.every(isQuestionValid)}
    className={`px-4 py-3 rounded-xl text-sm font-semibold transition transform active:scale-[0.98] ${
      questions.every(isQuestionValid)
        ? "bg-black text-white hover:bg-gray-800"
        : "bg-gray-700 text-gray-400 cursor-not-allowed"
    }`}
  >
    Save Changes
  </button>

  <button
    onClick={closeModal}
    className="px-4 py-3 rounded-xl bg-gray-200 text-black hover:bg-gray-700 hover:text-white transition"
  >
    Close
  </button>

</div>
          </div>
        </div>
      )}
    </div>
  );
}
