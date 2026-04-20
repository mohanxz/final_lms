import { useEffect, useState, useRef } from "react";
import axios from "axios";
import API from "../api";
import { io } from "socket.io-client";
import { FaBars, FaPaperPlane, FaPaperclip, FaSmile, FaComments, FaUser } from "react-icons/fa";
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
  const [isMenuOpen, setMenuOpen] = useState(false);

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
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
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
    if (activeChat.type === "forum") return `${batchInfo?.courseName || 'Course'} - Course Chat`;
    if (activeChat.type === "admin") return `Chat with ${activeChat.adminName}`;
    return "Chat";
  };

  function Sidebar({ activeChat, batchInfo, setMessages, setActiveChat, setMenuOpen, sender }) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-2">
            <FaComments className="mr-2 text-blue-600" />
            Chat Rooms
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Select a conversation</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2 uppercase tracking-widest text-[10px]">Student-Admin Group Chat</h4>
            <div className="space-y-2">
              {batchInfo.admins?.filter(a => a.module).map((admin, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessages([]);
                    setActiveChat({ type: "forum", module: admin.module });
                    if (window.innerWidth < 768) setMenuOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    activeChat?.type === "forum" && activeChat?.module === admin.module
                      ? "bg-blue-100 border-blue-300 shadow-sm"
                      : "bg-white border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <FaComments className="text-white text-xs" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-800">{admin.module}</div>
                      <div className="text-[10px] text-gray-500 italic">Discussion Room</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Teachers</h4>
            <div className="space-y-2">
              {Object.entries(
                batchInfo.admins.reduce((acc, admin) => {
                  const name = admin.name;
                  if (!acc[name]) acc[name] = [];
                  acc[name].push(admin.module);
                  return acc;
                }, {})
              ).map(([adminName, modules], i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessages([]);
                    setActiveChat({ type: "admin", adminName });
                    if (window.innerWidth < 768) setMenuOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    activeChat?.type === "admin" && activeChat?.adminName === adminName
                      ? "bg-green-100 border-green-300 text-green-800"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3 text-xs font-bold text-white">
                      {adminName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{adminName}</div>
                      <div className="text-xs text-gray-600 flex items-center">
                        <span className="bg-gray-200 px-2 py-1 rounded-full mr-2">Teacher</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Online
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {batchInfo.students && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Classmates</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batchInfo.students.map((student, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3 text-xs font-bold text-white">
                          {student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                        </div>
                        <div className={`absolute bottom-0 right-2 w-3 h-3 rounded-full border-2 border-white ${
                          student.name === sender ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {student.name || 'Student'}
                          {student.name === sender && (
                            <span className="text-blue-600 ml-1">(You)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            student.name === sender ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          {student.name === sender ? 'Online' : 'Student'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!batchInfo) return <p className="text-center mt-6 text-gray-500 dark:text-gray-400">Loading chat...</p>;

  return (
    <div className="flex h-[92vh] bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="bg-blue-600 text-white px-6 py-4 border-b border-blue-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {activeChat?.type === "forum" ? <FaComments /> : <FaUser />}
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">{getHeaderTitle()}</h1>
              </div>
              <div className="md:hidden">
                <div>
                  <h1 className="text-lg font-semibold">{batchInfo?.courseName || 'Course'}</h1>
                  <p className="text-sm text-blue-200">Course Chat</p>
                </div>
              </div>
              {activeChat?.type === "forum" && (
                <div className="text-sm text-blue-200 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  {batchInfo.students?.length || 6} participants online
                </div>
              )}
              {activeChat?.type === "admin" && (
                <div className="text-sm text-blue-200 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Active now
                </div>
              )}
            </div>
            <button 
              onClick={() => setMenuOpen(!isMenuOpen)} 
              className="text-white md:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <FaBars size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900" ref={chatRef}>
          <div className="flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaComments className="text-gray-500 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start the conversation</h3>
                <p className="text-gray-600 dark:text-gray-400">Send a message to begin chatting</p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isSender = m.name === sender;
                const timeSince = (new Date() - new Date(m.timestamp)) / 1000 / 60;
                const canEdit = isSender && timeSince < 2;

                return (
                  <div
                    key={m._id || i}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isSender && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(m.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`flex flex-col max-w-xs lg:max-w-md`}>
                      {!isSender && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">{m.name}</span>
                      )}
                      
                      {editingId === m._id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="p-2 border rounded-xl text-sm dark:bg-gray-700 dark:text-white"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="text-xs text-red-500">Cancel</button>
                            <button onClick={saveEdit} className="text-xs text-green-500 font-bold">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm relative ${
                            isSender 
                              ? 'bg-blue-600 text-white rounded-br-md' 
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{decryptMessage(m.message)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {m.edited && <span className="text-[10px] opacity-70 italic">(edited)</span>}
                            {canEdit && !editingId && (
                               <button onClick={() => handleEdit(m)} className="text-[10px] underline opacity-70">Edit</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {isSender && (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(m.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {activeChat && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            <div className="flex items-end gap-3">
              <button className="text-gray-500 hover:text-gray-700 p-2">
                <FaPaperclip />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows="1"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  <FaSmile />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!msg.trim()}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  msg.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <Sidebar 
          activeChat={activeChat} 
          batchInfo={batchInfo} 
          setMessages={setMessages} 
          setActiveChat={setActiveChat} 
          setMenuOpen={setMenuOpen} 
          sender={sender} 
        />
      </div>

      {/* Mobile Sidebar */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800">
            <Sidebar 
              activeChat={activeChat} 
              batchInfo={batchInfo} 
              setMessages={setMessages} 
              setActiveChat={setActiveChat} 
              setMenuOpen={setMenuOpen} 
              sender={sender} 
            />
          </div>
        </div>
      )}
    </div>
  );
}