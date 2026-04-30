import { useEffect, useState, useRef } from "react";
import axios from "axios";
import API from "../api";
import { io } from "socket.io-client";
import { FaBars, FaPaperPlane, FaPaperclip, FaSmile, FaComments, FaUser, FaUsers, FaChevronRight, FaArrowLeft, FaUserCircle } from "react-icons/fa";
import { encryptMessage, decryptMessage } from "../../../utils/crypto";

const socket = io(`${import.meta.env.VITE_CHAT_API}`);

export default function StudentChat() {
  const [sender, setSender] = useState("");
  const [batchInfo, setBatchInfo] = useState(null);
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const chatRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const studentRes = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSender(studentRes.data.user.name);

        const batchId = new URLSearchParams(window.location.search).get("batch");
        const batchRes = await API.get(`/student/batch/by-id/${batchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBatchInfo(batchRes.data);
        setActiveChat({ type: "forum" });
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!activeChat || !batchInfo || !sender) return;

    const course = batchInfo.courseName;
    const batch = batchInfo.batchName;
    const encodedStudent = encodeURIComponent(sender.trim());

    let newRoom = "";

    if (activeChat.type === "forum") {
      const moduleName = activeChat.module || "General";
      newRoom = `forum/specialisation/${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    } else if (activeChat.type === "admin") {
      const adminName = encodeURIComponent(activeChat.adminName.trim());
      newRoom = `${course}/${batch}/admins/${adminName}/students/${encodedStudent}`;
    }

    setRoom(newRoom);
  }, [activeChat, batchInfo, sender]);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!room || !sender) return;

    socket.emit("joinRoom", { name: sender, room });

    socket.on("chatHistory", history => setMessages(history));
    socket.on("message", msgObj => setMessages(prev => [...prev, msgObj]));
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
  }, [room, sender]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!msg.trim()) return;
    const encryptedMsg = encryptMessage(msg);
    socket.emit("message", { name: sender, room, message: encryptedMsg, role: "student" });
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

  const getHeaderTitle = () => {
    if (!activeChat) return "Select a chat to begin";
    if (activeChat.type === "forum") return `${activeChat.module || 'Course'} Discussion`;
    if (activeChat.type === "admin") return activeChat.adminName;
    return "Chat";
  };

  const getHeaderSubtitle = () => {
    if (!activeChat) return "";
    if (activeChat.type === "forum") return `${batchInfo?.courseName || 'Course'} • Group Channel`;
    if (activeChat.type === "admin") return "Private Chat • Teacher";
    return "";
  };

  const selectChat = (type, data) => {
    setMessages([]);
    if (type === "forum") {
      setActiveChat({ type: "forum", module: data.module });
    } else if (type === "admin") {
      setActiveChat({ type: "admin", adminName: data.adminName });
    }
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  if (!batchInfo) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaComments className="text-gray-400 text-3xl" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading chat...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
      {/* Sidebar - Left Side */}
      <div className={`w-full lg:w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col ${isMobile && !showSidebar ? "hidden" : "flex"}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaComments className="text-blue-500" />
            Chat Rooms
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{batchInfo?.courseName} • {batchInfo?.batchName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Forum Groups */}
          <div className="px-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Discussion Rooms
          </div>
          {batchInfo?.admins?.filter(a => a.module).map((admin, i) => (
            <button
              key={i}
              onClick={() => selectChat("forum", { module: admin.module })}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                activeChat?.type === "forum" && activeChat?.module === admin.module
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800"
                  : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                activeChat?.type === "forum" && activeChat?.module === admin.module
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}>
                <FaComments />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-sm truncate">{admin.module}</div>
                <div className="text-[10px] opacity-70">Group Discussion</div>
              </div>
              {activeChat?.type === "forum" && activeChat?.module === admin.module && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              )}
            </button>
          ))}

          {/* Teachers */}
          <div className="px-2 mt-6 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Direct Messages
          </div>
          {Object.entries(
            batchInfo?.admins?.reduce((acc, admin) => {
              const name = admin.name;
              if (!acc[name]) acc[name] = [];
              acc[name].push(admin.module);
              return acc;
            }, {}) || {}
          ).map(([adminName, modules], i) => (
            <button
              key={i}
              onClick={() => selectChat("admin", { adminName })}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                activeChat?.type === "admin" && activeChat?.adminName === adminName
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800"
                  : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                activeChat?.type === "admin" && activeChat?.adminName === adminName
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                  : "bg-gradient-to-br from-gray-500 to-gray-600"
              }`}>
                {adminName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-sm truncate">{adminName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                    Teacher
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] text-green-500 font-medium">Online</span>
                </div>
              </div>
              {activeChat?.type === "admin" && activeChat?.adminName === adminName && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              )}
            </button>
          ))}

          {/* Classmates */}
          {batchInfo?.students && (
            <>
              <div className="px-2 mt-6 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Classmates
              </div>
              <div className="space-y-1">
                {batchInfo.students.map((student, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                        {student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-950 ${
                        student.name === sender ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {student.name || 'Student'}
                        {student.name === sender && (
                          <span className="text-blue-500 ml-1">(You)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {student.name === sender ? 'Online' : 'Classmate'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Area - Right Side */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            {/* Mobile back button */}
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden"
            >
              <FaArrowLeft />
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              activeChat?.type === "forum"
                ? "bg-gradient-to-br from-purple-500 to-pink-600"
                : "bg-gradient-to-br from-blue-500 to-indigo-600"
            }`}>
              {activeChat?.type === "forum" ? <FaComments /> : <FaUser />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                {getHeaderTitle()}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                  {getHeaderSubtitle()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:opacity-40"
          style={{ backgroundSize: '100px' }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl mb-4">
                <FaComments />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start the conversation</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Send a message to begin chatting</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isSender = m.name === sender;
              const timeSince = (new Date() - new Date(m.timestamp)) / 1000 / 60;
              const canEdit = isSender && timeSince < 2;

              return (
                <div
                  key={m._id || i}
                  className={`flex flex-col ${isSender ? "items-end" : "items-start"}`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
                    {!isSender && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {(m.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                      {isSender ? "You" : m.name}
                    </div>
                    <div className="text-[9px] text-gray-400 px-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {canEdit && !editingId && (
                      <button
                        onClick={() => handleEdit(m)}
                        className="text-[10px] text-blue-500 hover:text-blue-600 font-bold transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {m.edited && (
                      <span className="text-[10px] text-gray-400 italic font-medium">(modified)</span>
                    )}
                  </div>
                  
                  {editingId === m._id ? (
                    <div className="flex flex-col gap-3 w-full max-w-md bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-900">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[80px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-1.5 text-xs text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-4 py-1.5 text-xs bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 shadow-md transition-all"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`relative max-w-[85%] lg:max-w-xl px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md ${
                        isSender
                          ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {decryptMessage(m.message)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        {activeChat && (
          <div className="p-6 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-4xl mx-auto relative flex items-center gap-3 bg-gray-100 dark:bg-gray-900 p-2 rounded-2xl border border-transparent focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-gray-950 transition-all duration-300">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <FaPaperclip />
              </button>
              <input
                value={msg}
                onFocus={() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                placeholder="Type your message..."
              />
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <FaSmile />
              </button>
              <button
                onClick={sendMessage}
                disabled={!msg.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
              >
                <FaChevronRight className="translate-x-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}