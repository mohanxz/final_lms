import React, { useEffect, useState, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaEyeSlash, FaEye, FaFlask, FaCheckCircle } from "react-icons/fa";
import { useParams } from "react-router-dom";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast, { Toaster } from "react-hot-toast";
import API from "../api";
import PracticalCoding from "../../student/pages/PracticalCoding"; // Reusing the student's code editor as preview

export default function AdminPractical() {
  const { batchId } = useParams();
  const token = localStorage.getItem("token");

  const [notes, setNotes] = useState([]);
  const [practicalMap, setPracticalMap] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [adminId, setAdminId] = useState("");
  
  const languages = ["python", "java", "cpp", "javascript", "c", "typescript"];

  const getInitialQuestion = () => ({
    title: "",
    questionHtml: "",
    testCases: [{ input: [""], expectedOutput: [""], hidden: false }],
    hiddenTestCases: [{ input: [""], expectedOutput: [""], hidden: true }],
    defaultScorePerQuestion: 10,
    totalMark: 0,
    language: ["python", "javascript", "cpp"],
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
    const hasHiddenTestCases = !q.hiddenTestCases || q.hiddenTestCases.every(tc => {
                         const inStr = Array.isArray(tc?.input) ? tc.input.join("").trim() : String(tc?.input || "").trim();
                         const outStr = Array.isArray(tc?.expectedOutput) ? tc.expectedOutput.join("").trim() : String(tc?.expectedOutput || "").trim();
                         if (inStr.length === 0 && outStr.length === 0) return true;
                         return inStr.length > 0 && outStr.length > 0;
                       });
    const hasLanguages = Array.isArray(q.language) && q.language.length > 0;
    
    return hasTitle && hasHtml && hasTestCases && hasHiddenTestCases && hasLanguages;
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
      // Filter only for practical notes
      const practicalNotes = res.data.filter(note => note.type === 'practical');
      setNotes(practicalNotes);
      fetchPracticalQuestions(practicalNotes);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  }, [batchId, selectedModule, token]);

  const fetchPracticalQuestions = async (noteList) => {
    const map = {};
    for (let note of noteList) {
      try {
        const { data } = await API.get(`/api/practicals/by-note/${note._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        map[note._id] = data;
      } catch {}
    }
    setPracticalMap(map);
  };

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openModal = (noteId) => {
    setSelectedNote(noteId);
    const savedQuestions = practicalMap[noteId] || [];

    if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
      setQuestions(savedQuestions.map(q => {
        const visibleTCs = q.testCases?.filter(tc => !tc.hidden);
        const hiddenTCs = q.testCases?.filter(tc => tc.hidden);
        return {
          ...getInitialQuestion(),
          ...q,
          testCases: visibleTCs?.length > 0 ? visibleTCs : [{ input: [""], expectedOutput: [""], hidden: false }],
          hiddenTestCases: hiddenTCs?.length > 0 ? hiddenTCs : [{ input: [""], expectedOutput: [""], hidden: true }]
        };
      }));
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
    setIsPreview(false);
  };

  const updateCurrentQuestion = (fields) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (!updated[currentIdx]) return prev;
      updated[currentIdx] = { ...updated[currentIdx], ...fields };
      return updated;
    });
  };

  const updateTestCaseField = (tcIndex, field, value, isHidden = false) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      if (isHidden) {
        const updatedTestCases = [...(updatedQuestions[currentIdx].hiddenTestCases || [])];
        if (!updatedTestCases[tcIndex]) return prev;
        updatedTestCases[tcIndex][field] = value.split('\n');
        updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], hiddenTestCases: updatedTestCases };
      } else {
        const updatedTestCases = [...(updatedQuestions[currentIdx].testCases || [])];
        if (!updatedTestCases[tcIndex]) return prev;
        updatedTestCases[tcIndex][field] = value.split('\n');
        updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], testCases: updatedTestCases };
      }
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
    setIsPreview(false);
  };

  const removeQuestionFromModal = (index) => {
    if (questions.length === 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (currentIdx >= updated.length) {
      setCurrentIdx(updated.length - 1);
    }
  };

  const addTestCase = (isHidden = false) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      if (isHidden) {
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          hiddenTestCases: [
            ...(updatedQuestions[currentIdx].hiddenTestCases || []),
            { input: [""], expectedOutput: [""], hidden: true },
          ]
        };
      } else {
        updatedQuestions[currentIdx] = {
          ...updatedQuestions[currentIdx],
          testCases: [
            ...(updatedQuestions[currentIdx].testCases || []),
            { input: [""], expectedOutput: [""], hidden: false },
          ]
        };
      }
      return updatedQuestions;
    });
  };

  const removeTestCase = (index, isHidden = false) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      if (!updatedQuestions[currentIdx]) return prev;
      if (isHidden) {
        const updatedTestCases = (updatedQuestions[currentIdx].hiddenTestCases || []).filter((_, i) => i !== index);
        updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], hiddenTestCases: updatedTestCases };
      } else {
        const updatedTestCases = (updatedQuestions[currentIdx].testCases || []).filter((_, i) => i !== index);
        updatedQuestions[currentIdx] = { ...updatedQuestions[currentIdx], testCases: updatedTestCases };
      }
      return updatedQuestions;
    });
  };

  const handleAddOrUpdate = async () => {
    for (let i = 0; i < questions.length; i++) {
        if (!isQuestionValid(questions[i])) {
            toast.error(`Please fill all mandatory fields for Question ${i + 1}`);
            setCurrentIdx(i);
            return;
        }
    }

    try {
      const payload = {
        questions: questions.map(q => {
          const validHidden = (q.hiddenTestCases || []).filter(tc => {
             const inStr = Array.isArray(tc?.input) ? tc.input.join("").trim() : String(tc?.input || "").trim();
             const outStr = Array.isArray(tc?.expectedOutput) ? tc.expectedOutput.join("").trim() : String(tc?.expectedOutput || "").trim();
             return inStr.length > 0 && outStr.length > 0;
          }).map(tc => ({...tc, hidden: true}));
          
          return {
            ...q,
            testCases: [...(q.testCases || []), ...validHidden],
            noteId: selectedNote,
            createdBy: adminId
          };
        })
      };

      await API.post(`/api/practicals/batch`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data } = await API.get(`/api/practicals/by-note/${selectedNote}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPracticalMap((prev) => ({ ...prev, [selectedNote]: data }));
      toast.success("Successfully saved all practical questions!");
      // Don't close modal immediately to show "Edit Code" state if needed, 
      // but the user said "once saved show edit code after". 
      // Our UI already shows "Edit Code" (Manage Code) on the main list.
      closeModal();
    } catch (err) {
      console.error("Failed to save practical questions", err);
      toast.error("Failed to save. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 mx-auto text-gray-900 dark:bg-black dark:text-white min-h-screen max-w-5xl font-sans">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <FaFlask className="text-indigo-600" />
          Practical Management – <span className="text-indigo-600 font-medium">{selectedModule}</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage coding tasks for practical sessions</p>
      </div>

      {/* Modules Switcher */}
      {modules.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {modules.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-5 py-2 rounded-full border text-sm font-semibold transition-all ${
                selectedModule === mod
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      )}

      {/* Practical Notes List */}
      <div className="grid gap-4">
        {notes.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <FaFlask className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No practical sessions found for this module.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="group bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 p-6 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded-md">
                    DAY {note.day}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 italic">
                    {note.title}
                  </h3>
                </div>
                {practicalMap[note._id] && practicalMap[note._id].length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {practicalMap[note._id].map((q, qidx) => (
                      <div 
                        key={q._id || qidx} 
                        className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg border border-green-100 dark:border-green-800/50"
                      >
                        <FaCheckCircle size={10} />
                        {q.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => openModal(note._id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap w-full sm:w-auto justify-center font-bold"
              >
                <FaPlus />
                {(practicalMap[note._id] && practicalMap[note._id].length > 0) ? "Edit Code" : "Add Code"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal implementation */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500">
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal}></div>

          <div className="bg-white dark:bg-[#0a0c10] w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col relative z-20 animate-in zoom-in slide-in-from-bottom-5 duration-500">
            
            {/* Header */}
            <div className="px-8 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
               
                <div>
                  <h4 className="text-small font-black text-gray-900 dark:text-white italic capitalize">Practical Code Editor</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Day {notes.find(n => n.id === selectedNote)?.day || ''} Coding Workspace</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <button
                  onClick={addNewQuestionToModal}
                  className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                  title="Add another question"
                >
                  <FaPlus size={18} />
                </button>
                <button onClick={closeModal} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90">
                  <FaPlus className="rotate-45" size={18} />
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* Question Navigation Sidebar (Optional) */}
              <div className="w-full lg:w-auto text-wrap bg-gray-50/50 dark:bg-gray-900/50 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 p-4 overflow-y-auto">
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="relative group/item">
                      <button
                        onClick={() => { setCurrentIdx(idx); setIsPreview(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
                          currentIdx === idx
                            ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-gray-100 dark:ring-gray-700"
                            : "text-gray-500 hover:bg-gray-100/50 dark:hover:bg-gray-800/30"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isQuestionValid(q) ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className="truncate">Q{idx + 1}: {q.title || "Untiled"}</span>
                      </button>
                      {questions.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeQuestionFromModal(idx); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Form Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Tabs */}
                <div className="flex px-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0a0c10] sticky top-0 z-10">
                  <button 
                    onClick={() => setIsPreview(false)}
                    className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                      !isPreview ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    EDIT CONTENT
                  </button>
                  <button 
                    onClick={() => setIsPreview(true)}
                    className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                      isPreview ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    LIVE PREVIEW
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                  {!isPreview ? (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Question Title</label>
                        <input
                          type="text"
                          placeholder="Enter a catchy title..."
                          className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-2 text-small font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                          value={questions[currentIdx]?.title || ""}
                          onChange={(e) => updateCurrentQuestion({ title: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Description (Rich Text)</label>
                        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                          <ReactQuill
                            theme="snow"
                            value={questions[currentIdx]?.questionHtml || ""}
                            onChange={(content) => updateCurrentQuestion({ questionHtml: content })}
                            className="bg-white dark:bg-gray-900 dark:text-white min-h-[200px]"
                            placeholder="Detailed instructions for the student..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Supported Languages</label>
                            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                              {languages.map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() => handleLanguageToggle(lang)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                    questions[currentIdx]?.language?.includes(lang)
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-400"
                                  }`}
                                >
                                  {lang.toUpperCase()}
                                </button>
                              ))}
                            </div>
                         </div>
                         <div className="flex flex-col justify-end">
                            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                               <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-2">Instructions</p>
                               <ul className="text-xs text-indigo-600 dark:text-indigo-400/80 space-y-1 list-disc pl-4">
                                 <li>Include clear problem statement.</li>
                                 <li>Specify input/output formats.</li>
                                 <li>Provide at least one visible test case.</li>
                               </ul>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Test Cases Matrix</label>
                          <button onClick={() => addTestCase(false)} className="px-4 py-2 bg-black dark:bg-gray-800 text-white dark:text-indigo-400 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg active:scale-95">
                            + ADD SCENARIO
                          </button>
                         </div>
                        
                        <div className="grid gap-4">
                          {questions[currentIdx]?.testCases.map((tc, tcIndex) => (
                            <div key={tcIndex} className="bg-gray-50 dark:bg-[#11141b] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 transition-all  group/tc">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black italic">
                                     {tcIndex + 1}
                                   </div>
                                   <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Scenario {tcIndex + 1}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover/tc:opacity-100 transition-opacity">
                                  <button onClick={() => removeTestCase(tcIndex, false)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition">
                                    <FaTrash size={16} />
                                  </button>
                                </div>
                               </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block">Standard Input</label>
                                  <textarea
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
                                    value={Array.isArray(tc.input) ? tc.input.join('\n') : tc.input}
                                    onChange={(e) => updateTestCaseField(tcIndex, "input", e.target.value, false)}
                                    placeholder="Enter input lines..."
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block">Expected Output</label>
                                  <textarea
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
                                    value={Array.isArray(tc.expectedOutput) ? tc.expectedOutput.join('\n') : tc.expectedOutput}
                                    onChange={(e) => updateTestCaseField(tcIndex, "expectedOutput", e.target.value, false)}
                                    placeholder="Enter expected result..."
                                  />
                                </div>
                               </div>
                             </div>
                          ))}
                         </div>
                       </div>
                       
                      <div className="space-y-6 mt-8">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black text-orange-400 dark:text-orange-500 uppercase tracking-widest flex items-center gap-2">
                            <FaEyeSlash size={14} /> Hidden Test Cases Matrix
                          </label>
                          <button onClick={() => addTestCase(true)} className="px-4 py-2 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold hover:scale-105 transition-all active:scale-95 border border-orange-200 dark:border-orange-500/30">
                            + ADD HIDDEN SCENARIO
                          </button>
                         </div>
                        
                        <div className="grid gap-4 opacity-90">
                          {questions[currentIdx]?.hiddenTestCases?.map((tc, tcIndex) => (
                            <div key={`hidden-${tcIndex}`} className="bg-orange-50/50 dark:bg-[#161111] rounded-3xl p-6 border border-orange-100 dark:border-orange-900/50 transition-all group/tc">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black italic">
                                     {tcIndex + 1}
                                   </div>
                                   <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Hidden Scenario {tcIndex + 1}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover/tc:opacity-100 transition-opacity">
                                  <button onClick={() => removeTestCase(tcIndex, true)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition">
                                    <FaTrash size={16} />
                                  </button>
                                </div>
                               </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-2 block">Hidden Input</label>
                                  <textarea
                                    className="w-full bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-orange-500 transition-all resize-none shadow-inner"
                                    value={Array.isArray(tc.input) ? tc.input.join('\n') : tc.input}
                                    onChange={(e) => updateTestCaseField(tcIndex, "input", e.target.value, true)}
                                    placeholder="Enter secret input lines..."
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-2 block">Expected Output</label>
                                  <textarea
                                    className="w-full bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4 min-h-[100px] text-sm font-mono focus:ring-2 focus:ring-orange-500 transition-all resize-none shadow-inner"
                                    value={Array.isArray(tc.expectedOutput) ? tc.expectedOutput.join('\n') : tc.expectedOutput}
                                    onChange={(e) => updateTestCaseField(tcIndex, "expectedOutput", e.target.value, true)}
                                    placeholder="Enter expected secret result..."
                                  />
                                </div>
                               </div>
                             </div>
                          ))}
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[600px] animate-in slide-in-from-left-4 duration-300">
                       <PracticalCoding 
                          testInput={questions[currentIdx]?.testCases?.[0]?.input?.join('\n') || ""}
                          testOutput={questions[currentIdx]?.testCases?.[0]?.expectedOutput?.join('\n') || ""}
                        />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
              <p className="text-xs text-gray-500 font-medium">Auto-saving drafted changes...</p>
              <div className="flex gap-4">
                <button
                  onClick={closeModal}
                  className="px-8 py-3 rounded-2xl text-[13px] font-black text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all uppercase tracking-widest text-l"
                >
                  Discard
                </button>
                <button
                  onClick={handleAddOrUpdate}
                  disabled={!questions.every(isQuestionValid)}
                  className={`px-10 py-4 rounded-2xl text-[13px] font-black transition-all shadow-2xl uppercase tracking-widest flex items-center gap-2 ${
                    questions.every(isQuestionValid)
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30 hover:scale-[1.02] active:scale-95"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Finalize & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ql-container.ql-snow { border: none !important; }
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid rgba(156, 163, 175, 0.2) !important; background: #f9fafb; }
        .dark .ql-toolbar.ql-snow { background: #111827; }
        .dark .ql-editor.ql-blank::before { color: #4b5563 !important; }
      `}</style>
    </div>
  );
}
