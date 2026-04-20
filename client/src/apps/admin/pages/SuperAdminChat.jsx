import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { encryptMessage, decryptMessage } from "../../../utils/crypto";
import { FaUsers, FaUserShield, FaComments, FaChevronRight, FaSearch, FaTimes, FaEnvelope, FaPhone } from "react-icons/fa";

const socket = io(`${import.meta.env.VITE_CHAT_API}`);

import API from "../api";

export default function SuperAdminChat() {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [sender, setSender] = useState("");
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatRef = useRef();

  const [activeChatType, setActiveChatType] = useState("superadmin"); // "superadmin" or "forum"
  const [specialisations, setSpecialisations] = useState([]);
  const [activeForum, setActiveForum] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showMemberList, setShowMemberList] = useState(false);
  const [allAdminDetails, setAllAdminDetails] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 1. Fetch profile for base specialisations
        const profileRes = await API.get("/api/settings/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // 2. Fetch dashboard data for modules currently being handled in batches
        const dashboardRes = await API.get("/api/dashboard/lecturer", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileSpecs = profileRes.data.specialisation || [];
        const dashboardModules = (dashboardRes.data.batches || []).flatMap(b => b.modulesHandled || []);
        
        // Merge and unique
        const combinedSpecs = [...new Set([...profileSpecs, ...dashboardModules])]
          .filter(s => s && s.trim() !== "");

        const name = profileRes.data.name || profileRes.data.user?.name;
        setSender(name);
        
        // Add 'All Admins' as a default global group
        setSpecialisations(["All Admins", ...combinedSpecs]);
        
        // Initial room selection
        if (name) {
          setRoom(`admins/${encodeURIComponent(name.trim())}`);
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      }
    };
    fetchAdminData();
  }, []);

  // Fetch all admins for member list
  useEffect(() => {
    const fetchAllAdmins = async () => {
      try {
        const res = await API.get("/api/settings");
        setAllAdminDetails(res.data);
      } catch (e) {
        console.error("Failed to fetch staff directory", e);
      }
    };
    if (showMemberList) fetchAllAdmins();
  }, [showMemberList]);

  useEffect(() => {
    if (activeChatType === "superadmin") {
      setRoom(`admins/${encodeURIComponent(sender.trim())}`);
    } else if (activeChatType === "forum" && activeForum) {
      setRoom(`admin/forum/specialisation/${activeForum.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    }
  }, [activeChatType, activeForum, sender]);

  useEffect(() => {
    if (!room || !sender) return;

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
  }, [room, sender]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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

  const selectForum = (spec) => {
    setActiveChatType("forum");
    setActiveForum(spec);
    setMessages([]);
  };

  const selectSuperAdmin = () => {
    setActiveChatType("superadmin");
    setActiveForum("");
    setMessages([]);
  };

  if (!sender) return null;

  return (
    <>
    <div className="flex h-[calc(100vh-6rem)] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
      
      {/* Sidebar */}
      <div className={`w-full lg:w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col ${isMobile && activeChatType !== "" ? "hidden" : "flex"}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaComments className="text-blue-500" />
            Communications
          </h2>
          <div className="mt-4 relative">
             <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
             <input 
               type="text" 
               placeholder="Search chats..." 
               className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="px-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Support</div>
          <button
            onClick={selectSuperAdmin}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              activeChatType === "superadmin"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800"
                : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${activeChatType === "superadmin" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
              <FaUserShield />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-sm">Super Admin</div>
              <div className="text-[10px] opacity-70">Private Support Chat</div>
            </div>
          </button>

          <div className="px-2 mt-6 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Specialisations</div>
          {specialisations.length > 0 ? (
            specialisations.map((spec) => (
              <button
                key={spec}
                onClick={() => selectForum(spec)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  activeChatType === "forum" && activeForum === spec
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800"
                    : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${activeChatType === "forum" && activeForum === spec ? "bg-indigo-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                  <FaUsers />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm truncate">{spec === "All Admins" ? "All Admins Group" : `${spec} Forum`}</div>
                  <div className="text-[10px] opacity-70">Group Discussion</div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-500 italic">No specialisations assigned</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${activeChatType === "superadmin" ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-purple-500 to-pink-600"}`}>
              {activeChatType === "superadmin" ? <FaUserShield /> : activeForum[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                {activeChatType === "superadmin" ? "Super Admin Support" : 
                 activeForum === "All Admins" ? "All Admins Group Chat" : 
                 `${activeForum} Specialisation Forum`}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                  {activeChatType === "superadmin" ? "Private Channel" : "Group Channel"}
                </span>
                {activeForum === "All Admins" && (
                  <button 
                    onClick={() => setShowMemberList(true)}
                    className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors font-bold uppercase"
                  >
                    View Members
                  </button>
                )}
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
          {messages.length > 0 ? (
            messages.map((m, i) => {
              const isSender = m.name === sender;
              const displayName = isSender ? "You" : (activeChatType === "superadmin" ? "Super Admin" : m.name);
              const timeSince = (new Date() - new Date(m.timestamp)) / 1000 / 60;
              const canEdit = isSender && timeSince < 2;

              return (
                <div
                  key={m._id || i}
                  className={`flex flex-col ${isSender ? "items-end" : "items-start"}`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                      {displayName}
                    </div>
                    <div className="text-[9px] text-gray-400 px-1">
                       {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {canEdit && !editingId && (
                      <button onClick={() => handleEdit(m)} className="text-[10px] text-blue-500 hover:text-blue-600 font-bold transition-colors">Edit</button>
                    )}
                    {m.edited && <span className="text-[10px] text-gray-400 italic font-medium">(modified)</span>}
                  </div>
                  
                  {editingId === m._id ? (
                    <div className="flex flex-col gap-3 w-full max-w-md bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-900">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[80px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-xs text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                        <button onClick={saveEdit} className="px-4 py-1.5 text-xs bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 shadow-md transition-all">Save Changes</button>
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
                      <div className="whitespace-pre-wrap break-words">{decryptMessage(m.message)}</div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
               <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl mb-4">
                  <FaComments />
               </div>
               <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto relative flex items-center gap-3 bg-gray-100 dark:bg-gray-900 p-2 rounded-2xl border border-transparent focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-gray-950 transition-all duration-300">
            <input
              value={msg}
              onFocus={() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder={`Message ${activeChatType === "superadmin" ? "Super Admin" : activeForum + " Forum"}...`}
            />
            <button
              onClick={sendMessage}
              disabled={!msg.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
            >
              <FaChevronRight className="translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Staff Member Modal */}
    {showMemberList && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">Staff Directory</h3>
              <p className="text-blue-100 text-sm mt-1">All administrative colleagues</p>
            </div>
            <button onClick={() => setShowMemberList(false)} className="text-white/80 hover:text-white text-2xl transition-colors">
              <FaTimes />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {allAdminDetails.map((admin, idx) => (
              <div key={admin._id || idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {admin.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{admin.name}</h4>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <FaEnvelope className="text-blue-400" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <FaPhone className="text-green-400" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-600 flex justify-end">
            <button onClick={() => setShowMemberList(false)} className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}