import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaSearch, FaUserCircle, FaUsers, FaComments, FaBars, FaArrowLeft, FaEllipsisV, FaTimes, FaEnvelope, FaPhone } from "react-icons/fa";
import { encryptMessage, decryptMessage } from "../../../utils/crypto";

const SuperAdminChat = () => {
  const sender = "superadmin";
  const [courseFilter, setCourseFilter] = useState("All");
  const [filterType, setFilterType] = useState("all");
  const [forumRooms, setForumRooms] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [chatType, setChatType] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatRef = useRef();
  const [adminStatus, setAdminStatus] = useState({});
  const [isChatListVisible, setChatListVisible] = useState(true);
  const [showStaffList, setShowStaffList] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allAdminDetails, setAllAdminDetails] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const room =
    chatType === "forum" && selectedTarget
      ? selectedTarget
      : chatType === "admin" && selectedTarget
      ? `admins/${encodeURIComponent(selectedTarget.trim())}`
      : null;

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_CHAT_API);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch Forum Rooms
  useEffect(() => {
    const fetchSpecialisationForums = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data: courses } = await axios.get(`${import.meta.env.VITE_SUPERADMIN_API}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const uniqueModules = new Set();
        courses.forEach(course => {
          if (course.modules && Array.isArray(course.modules)) {
            course.modules.forEach(mod => uniqueModules.add(mod.trim()));
          }
        });

        const allRooms = [
          {
            name: "All Admins (Group)",
            roomPath: "admin/forum/specialisation/all-admins",
            moduleName: "All Admins"
          },
          ...Array.from(uniqueModules).map(mod => ({
            name: `${mod} (Group/Team)`,
            roomPath: `admin/forum/specialisation/${mod.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            moduleName: mod
          }))
        ];

        setForumRooms(allRooms);

        if (!selectedTarget && allRooms.length > 0) {
          setChatType("forum");
          setSelectedTarget(allRooms[0].roomPath);
        }
      } catch (err) {
        console.error("❌ Failed to fetch specialisation forum rooms", err);
      }
    };

    fetchSpecialisationForums();
  }, []);

  // Fetch Admins
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const token = localStorage.getItem("token");
        const statusRes = await axios.get(`${import.meta.env.VITE_CHAT_API}/chatrooms/admins/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const allAdmins = statusRes.data.map(a => a.name);
        setAdmins(allAdmins);

        const statusMap = {};
        statusRes.data.forEach(({ name, online }) => {
          statusMap[name] = online;
        });
        setAdminStatus(statusMap);

        if (!selectedTarget && allAdmins.length > 0) {
          setChatType("admin");
          setSelectedTarget(allAdmins[0]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch admins or statuses", err);
      }
    };
    fetchAdmins();
  }, []);

  // Fetch Full Admin Details
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_SUPERADMIN_API}/api/admins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllAdminDetails(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch admin details", err);
      }
    };
    fetchAdminDetails();
  }, []);

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
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const statusRes = await axios.get(`${import.meta.env.VITE_CHAT_API}/chatrooms/admins/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statusMap = {};
        statusRes.data.forEach(({ name, online }) => {
          statusMap[name] = online;
        });
        setAdminStatus(statusMap);
      } catch (e) {
        console.error("Status polling failed:", e);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (!msg.trim()) return;
    const encryptedMsg = encryptMessage(msg);
    socket.emit("message", { name: sender, room, message: encryptedMsg, role: "superadmin" });
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

  const selectChat = (type, target) => {
    setChatType(type);
    setSelectedTarget(target);
    setMessages([]);
    setShowDropdown(false);
    setShowStaffList(false);
    if (window.innerWidth < 1024) {
      setChatListVisible(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
      {/* Sidebar */}
      <div className={`w-full lg:w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col ${!isChatListVisible && window.innerWidth < 1024 ? "hidden" : "flex"}`}>
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

        {/* Filter Tabs */}
        <div className="px-4 py-3">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            {["All", "Groups", "Admins"].map((filter) => (
              <button
                key={filter}
                onClick={() => setCourseFilter(filter)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  courseFilter === filter
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Forum Groups */}
          {["All", "Groups"].includes(courseFilter) && (
            <>
              <div className="px-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Forum Groups
              </div>
              {forumRooms.map((r) => (
                <button
                  key={r.roomPath}
                  onClick={() => selectChat("forum", r.roomPath)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    chatType === "forum" && selectedTarget === r.roomPath
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800"
                      : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    chatType === "forum" && selectedTarget === r.roomPath
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}>
                    <FaUsers />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm truncate">{r.name}</div>
                    <div className="text-[10px] opacity-70">Group Discussion</div>
                  </div>
                  {chatType === "forum" && selectedTarget === r.roomPath && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Admin Chats */}
          {["All", "Admins"].includes(courseFilter) && (
            <>
              <div className="px-2 mt-6 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Direct Messages
              </div>
              {admins.map((admin) => (
                <button
                  key={admin}
                  onClick={() => selectChat("admin", admin)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    chatType === "admin" && selectedTarget === admin
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800"
                      : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                      chatType === "admin" && selectedTarget === admin
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                        : "bg-gradient-to-br from-gray-500 to-gray-600"
                    }`}>
                      {admin[0].toUpperCase()}
                    </div>
                    {adminStatus[admin] && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm truncate">{admin}</div>
                    <div className={`text-[10px] font-medium ${
                      adminStatus[admin] ? "text-green-500" : "text-gray-400"
                    }`}>
                      {adminStatus[admin] ? "Online" : "Offline"}
                    </div>
                  </div>
                  {chatType === "admin" && selectedTarget === admin && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            {/* Mobile back button */}
            <button
              onClick={() => setChatListVisible(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden"
            >
              <FaArrowLeft />
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              chatType === "forum"
                ? "bg-gradient-to-br from-purple-500 to-pink-600"
                : "bg-gradient-to-br from-blue-500 to-indigo-600"
            }`}>
              {chatType === "forum" ? <FaUsers /> : selectedTarget?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                {chatType === "forum"
                  ? forumRooms.find(f => f.roomPath === selectedTarget)?.name || "Forum"
                  : selectedTarget}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${chatType === "forum" ? "bg-purple-500" : "bg-green-500"} animate-pulse`}></span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                  {chatType === "forum" ? "Group Channel" : adminStatus[selectedTarget] ? "Online" : "Offline"}
                </span>
                {chatType === "forum" && (
                  <button 
                    onClick={() => setShowStaffList(true)}
                    className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors font-bold uppercase"
                  >
                    View Members
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
            >
              <FaEllipsisV />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                {chatType === "forum" && (
                  <button
                    onClick={() => {
                      setShowStaffList(true);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 flex items-center gap-3 transition-colors"
                  >
                    <FaUsers className="text-blue-500" />
                    View Staff List
                  </button>
                )}
                <button
                  onClick={() => {
                    setMessages([]);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-3 transition-colors"
                >
                  <FaTimes className="text-red-500" />
                  Clear Conversation
                </button>
              </div>
            )}
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
              const timeSince = (new Date() - new Date(m.timestamp)) / 1000 / 60;
              const canEdit = isSender && timeSince < 2;

              return (
                <div
                  key={m._id || i}
                  className={`flex flex-col ${isSender ? "items-end" : "items-start"}`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                      {isSender ? "You" : m.name}
                    </div>
                    <div className="text-[9px] text-gray-400 px-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {canEdit && !editingId && (
                      <button onClick={() => handleEdit(m)} className="text-[10px] text-blue-500 hover:text-blue-600 font-bold transition-colors">
                        Edit
                      </button>
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
              placeholder={`Message ${chatType === "forum" ? "forum" : selectedTarget}...`}
            />
            <button
              onClick={sendMessage}
              disabled={!msg.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Staff List Modal */}
      {showStaffList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Staff Directory</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {forumRooms.find(f => f.roomPath === selectedTarget)?.moduleName} specialists
                </p>
              </div>
              <button
                onClick={() => setShowStaffList(false)}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {allAdminDetails
                .filter(admin => {
                  const currentMod = forumRooms.find(f => f.roomPath === selectedTarget)?.moduleName;
                  if (!currentMod) return false;
                  if (currentMod === "All Admins") return true;
                  
                  const normalize = (str) => (str || "").toLowerCase().replace(/\s+/g, '').trim();
                  const targetNorm = normalize(currentMod);
                  return admin.specialisation?.some(s => normalize(s) === targetNorm);
                })
                .map((admin, idx) => (
                  <div 
                    key={admin._id || idx}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {admin.name?.[0].toUpperCase()}
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
              
              {allAdminDetails.filter(admin => {
                const currentMod = forumRooms.find(f => f.roomPath === selectedTarget)?.moduleName;
                if (currentMod === "All Admins") return true;
                return admin.specialisation?.some(s => s.trim().toLowerCase() === currentMod?.trim().toLowerCase());
              }).length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUsers className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No specialists assigned yet.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-600 flex justify-end">
              <button
                onClick={() => setShowStaffList(false)}
                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminChat;