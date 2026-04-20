import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaPaperclip, FaSmile, FaPaperPlane, FaInfoCircle, FaBellSlash, FaTimes } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { encryptMessage, decryptMessage } from "../../../utils/crypto";
import axios from 'axios';
import API from '../api'; // Adjust the import path as necessary

const socket = io(`${import.meta.env.VITE_CHAT_API}`);

const NewAdminChat = () => {
  const { batchId } = useParams();
  const [sender, setSender] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [chatType, setChatType] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatAreaRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [activeModule, setActiveModule] = useState("");
  const [modules, setModules] = useState([]);

  const room =
    chatType === "forum"
      ? `forum/specialisation/${(activeModule || "General").toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      : chatType === "student" && selectedTarget
      ? `${course}/${batch}/admins/${encodeURIComponent(sender.trim())}/students/${encodeURIComponent(selectedTarget.trim())}`
      : null;

  useEffect(() => {
    const fetchMyBatch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/admin-batches/my-batches", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const myId = JSON.parse(atob(token.split('.')[1])).id;
        const matchingBatch = res.data.find(b => b._id === batchId);

        if (!matchingBatch) return;

        setCourse(matchingBatch.course.courseName);
        setBatch(matchingBatch.batchName);

        const adminInfo = matchingBatch.admins.find(a => a.admin._id === myId);
        if (adminInfo) setSender(adminInfo.admin.name);

        const uniqueModules = [...new Set(matchingBatch.admins.map(a => a.module).filter(Boolean))];
        setModules(uniqueModules);
        if (uniqueModules.length > 0) setActiveModule(uniqueModules[0]);
      } catch (err) {
        console.error("Error fetching admin batches:", err);
      }
    };

    fetchMyBatch();
  }, []);

  useEffect(() => {
    if (!batchId) return;
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/api/students/my-students?batchId=${batchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Return names of students
        const studentNames = res.data.students.map(s => s.name);
        setStudents(studentNames);
      } catch (err) {
        console.error("Error loading students info from batch:", err);
      }
    };
    fetchStudents();
  }, [batchId]);

  useEffect(() => {
    if (!room) return;

    socket.emit("joinRoom", { name: sender, room });

    socket.on("chatHistory", (history) => setMessages(history));
    socket.on("message", (msgObj) => setMessages((prev) => [...prev, msgObj]));
    socket.on("messageEdited", ({ messageId, newMessage }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, message: newMessage, edited: true } : m))
      );
    });

    return () => {
      socket.emit("leaveRoom", { room });
      socket.off("chatHistory");
      socket.off("message");
      socket.off("messageEdited");
    };
  }, [room]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-select forum chat once required values are set
  useEffect(() => {
    if (course && batch && sender && !chatType) {
      selectChat("forum");
    }
  }, [course, batch, sender]);

  const sendMessage = () => {
    if (!msg.trim()) return;
    const encryptedMsg = encryptMessage(msg);
    socket.emit("message", { name: sender, room, message: encryptedMsg, role: "admin" });
    setMsg("");
  };

  const handleEdit = (m) => {
    setEditingId(m._id);
    setEditValue(decryptMessage(m.message));
  };

  const saveEdit = () => {
    if (!editValue.trim()) return;
    socket.emit("editMessage", { 
      messageId: editingId, 
      newMessage: encryptMessage(editValue), 
      room 
    });
    setEditingId(null);
    setEditValue("");
  };

  const selectChat = (type, target = null, moduleName = "") => {
    setChatType(type);
    setSelectedTarget(target);
    if (moduleName) setActiveModule(moduleName);
    setMessages([]);
  };

  const getInitials = (name) =>
    decodeURIComponent(name || "")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-800 dark:text-white">
            <h3>{course} - {chatType === "forum" ? `${activeModule} Forum` : `Chat with ${decodeURIComponent(selectedTarget || "")}`}</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4" ref={chatAreaRef}>
          {messages.map((m, i) => {
            const isSender = m.name === sender;
            const timeSince = (new Date() - new Date(m.timestamp)) / 1000 / 60;
            const canEdit = isSender && timeSince < 2;

            return (
              <div key={m._id || i} className={`flex flex-col mb-4 ${isSender ? 'items-end' : 'items-start'}`}>
                <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-2">
                  {m.name === sender ? "You" : m.name}
                  {canEdit && !editingId && (
                    <button onClick={() => handleEdit(m)} className="text-blue-500 hover:underline">Edit</button>
                  )}
                  {m.edited && <span className="text-[10px] text-gray-400 italic">(edited)</span>}
                </div>
                
                {editingId === m._id ? (
                  <div className="flex flex-col gap-2 w-full max-w-sm">
                    <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="text-xs text-red-500">Cancel</button>
                      <button onClick={saveEdit} className="text-xs text-green-500 font-bold">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-xl px-4 py-2 max-w-lg shadow-sm ${isSender ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'}`}>
                    <p className="text-sm">{decryptMessage(m.message)}</p>
                    <div className="text-[10px] opacity-70 text-right mt-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <FaPaperclip className="text-gray-500 dark:text-gray-400 cursor-pointer" />
            <FaSmile className="text-gray-500 dark:text-gray-400 cursor-pointer mx-2" />
            <input type="text" placeholder="Type a message..." value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white" />
            <button className="bg-blue-500 text-white rounded-full p-2" onClick={sendMessage}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-lg text-gray-800 dark:text-white">People</h4>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Cohort Participants</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-6 px-2">
            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 mt-4">Admin-Student Group Chat</h5>
            <div className="space-y-1">
              {modules.map((mod) => (
                <div
                  key={mod}
                  onClick={() => selectChat("forum", null, mod)}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    chatType === 'forum' && activeModule === mod 
                      ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 shadow-sm' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-transform ${
                    chatType === 'forum' && activeModule === mod
                      ? 'bg-blue-600 scale-105'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {mod[0].toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="font-bold text-sm text-gray-800 dark:text-white leading-tight">{mod}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium opacity-70">Specialisation</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 mb-3 mt-4">Classmates</h5>
          <div className="space-y-1 px-2">
            {students.map((student) => (
              <div
                key={student}
                onClick={() => selectChat("student", student)}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedTarget === student && chatType === 'student' 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold">{getInitials(student)}</div>
                  <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm"></span>
                </div>
                <div className="ml-3 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 dark:text-white truncate">{decodeURIComponent(student)}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Student</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAdminChat;