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
  

  const room =
    chatType === "forum" && selectedTarget
      ? selectedTarget
      : chatType === "admin" && selectedTarget
      ? `admins/${encodeURIComponent(selectedTarget.trim())}`
      : null;

    const [socket, setSocket] = useState(null);

useEffect(() => {
  const newSocket = io(import.meta.env.VITE_CHAT_API); // or your API URL
  setSocket(newSocket);

  return () => {
    newSocket.disconnect();
  };
}, []);


  // Fetch Forum Rooms based on Specialisations (Modules) from Course Management
  useEffect(() => {
    const fetchSpecialisationForums = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch all courses to extract unique specialisations (modules) from SuperAdmin API
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

        // Auto-select first forum chat if nothing is selected yet
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

        // Default selection
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

  // Fetch Full Admin Details for Staff List
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

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

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
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
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
    }, 20000); // 20 seconds

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
    if (window.innerWidth < 768) {
      setChatListVisible(false);
    }
  };

  

  const filteredChats = () => {
    if (filterType === "admins") return admins.map((a) => ({ name: a, type: "admin" }));
    if (filterType === "forums")
      return forumRooms
        .map((r) => ({ name: r.name, path: r.roomPath, type: "forum" }));

    return [
      ...admins.map((a) => ({ name: a, type: "admin" })),
      ...forumRooms
        .map((r) => ({ name: r.name, path: r.roomPath, type: "forum" })),
    ];
  };

  return (
    <>
      <div className="p-0 m-0 flex h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
        {/* Chat List Sidebar */}
        <div className={`${isChatListVisible ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-lg flex-col`}>
          {/* Search Bar */}
          <div className="relative mb-6">
            <FaSearch className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {["All", "Groups", "Admins"].map((filter) => (
              <button
                key={filter}
                onClick={() => setCourseFilter(filter)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  courseFilter === filter
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Scrollable Chat List */}
          <div className="flex-1 overflow-y-auto">
            {/* Forum Chats */}
            {["All", "Groups"].includes(courseFilter) && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Forum Groups</h3>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                    {forumRooms.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {forumRooms.map((r) => (
                    <button
                      key={r.roomPath}
                      onClick={() => selectChat("forum", r.roomPath)}
                      className={`flex items-center space-x-3 w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                        chatType === "forum" && selectedTarget === r.roomPath
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 shadow-sm"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        chatType === "forum" && selectedTarget === r.roomPath
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                      }`}>
                        <FaUsers className="text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">{r.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">Specialisation Forum</div>
                      </div>
                      {chatType === "forum" && selectedTarget === r.roomPath && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Admin Chats */}
            {["All", "Admins"].includes(courseFilter) && (
              <>
                <div className="flex items-center justify-between mt-8 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Admins</h3>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                    {admins.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <button
                      key={admin}
                      onClick={() => selectChat("admin", admin)}
                      className={`flex items-center space-x-3 w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                        chatType === "admin" && selectedTarget === admin
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 shadow-sm"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                          chatType === "admin" && selectedTarget === admin
                            ? "bg-gradient-to-br from-green-500 to-emerald-600"
                            : "bg-gradient-to-br from-gray-500 to-gray-600 group-hover:from-green-500 group-hover:to-emerald-600"
                        }`}>
                          {admin[0].toUpperCase()}
                        </div>
                        {adminStatus[admin] && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">{admin}</div>
                        <div className={`text-sm font-medium ${adminStatus[admin] ? "text-green-500 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                          {adminStatus[admin] ? "Online" : "Offline"}
                        </div>
                      </div>
                      {chatType === "admin" && selectedTarget === admin && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        

        {/* Chat Section */}
        <div className={`${isChatListVisible ? 'hidden' : 'flex'} md:flex w-full md:w-2/3 flex-col bg-white dark:bg-gray-800`}>
          {room ? (
            <div className="flex flex-col h-full">
              <div className="px-4 md:px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setChatListVisible(true)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white md:hidden"
                  >
                    <FaArrowLeft className="w-6 h-6" />
                  </button>
                  <div className="flex items-center space-x-3">
                    {chatType === "forum" ? (
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FaUsers className="text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {selectedTarget[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {chatType === "forum" ? forumRooms.find(f => f.roomPath === selectedTarget)?.name || "Forum" : selectedTarget}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {chatType === "forum" ? "Forum Group" : `Admin • ${adminStatus[selectedTarget] ? "Online" : "Offline"}`}
                      </p>
                    </div>
                  </div>

                  {/* Top Right Context Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                      <FaEllipsisV />
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear Conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 space-y-4 flex flex-col" ref={chatRef}>
                {messages.map((m, i) => {
                  const isSender = m.name === sender;
                  const timeSince = (new Date() - new Date(m.timestamp)) / 1000 / 60;
                  const canEdit = isSender && timeSince < 2;

                  return (
                    <div
                      key={m._id || i}
                      className={`flex ${
                        isSender ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className={`flex flex-col max-w-xs lg:max-w-md ${isSender ? "items-end" : "items-start"}`}>
                        {!isSender && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 ml-3">
                            {m.name}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                           {isSender && canEdit && !editingId && (
                             <button onClick={() => handleEdit(m)} className="text-blue-500 text-[10px] hover:underline">Edit</button>
                           )}
                           {m.edited && <span className="text-[10px] text-gray-400 italic">(edited)</span>}
                        </div>
                        
                        {editingId === m._id ? (
                           <div className="flex flex-col gap-2 w-full">
                             <textarea
                               value={editValue}
                               onChange={(e) => setEditValue(e.target.value)}
                               className="w-full p-2 bg-white dark:bg-gray-700 border rounded text-sm"
                             />
                             <div className="flex gap-2 justify-end">
                               <button onClick={() => setEditingId(null)} className="text-xs text-red-500">Cancel</button>
                               <button onClick={saveEdit} className="text-xs text-green-500 font-bold">Save</button>
                             </div>
                           </div>
                        ) : (
                          <div
                            className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${
                              isSender
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md"
                            }`}
                          >
                            {decryptMessage(m.message)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 mx-3">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 rounded-2xl p-2">
                  <input
                    className="flex-1 bg-transparent text-gray-900 dark:text-white px-4 py-3 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Type your message..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!msg.trim()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white p-3 rounded-xl transition-all duration-200 shadow-sm disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6">
                <FaComments className="text-4xl text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to SuperAdmin Chat</h3>
              <p className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                Select a conversation from the sidebar to start chatting with admins or join forum discussions.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Staff List Modal */}
      {showStaffList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Staff Specialists</h3>
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
                  
                  // If global "All Admins" group, show everyone
                  if (currentMod === "All Admins") return true;
                  
                  // Helper to normalize strings (remove spaces around slashes, lowercase)
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
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <FaPhone className="text-green-400" />
                          <span>{admin.phone}</span>
                        </div>
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
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUsers className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No specialists assigned to this module yet.</p>
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
    </>
  );
};

export default SuperAdminChat;