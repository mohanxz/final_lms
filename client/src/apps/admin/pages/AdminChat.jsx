import { useEffect, useState, useRef } from "react";
import axios from "axios";
import API from "../api"; // Adjust the import based on your API setup
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { encryptMessage, decryptMessage } from "../../../utils/crypto";

const socket = io(`${import.meta.env.VITE_CHAT_API}`);

export default function AdminChat() {
  const { batchId } = useParams();
  const [sender, setSender] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [chatType, setChatType] = useState("");
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [activeModule, setActiveModule] = useState("");
  const [modules, setModules] = useState([]);

  const room =
    chatType === "forum"
      ? `forum/specialisation/${(activeModule || "General").toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      : chatType === "student" && selectedTarget
      ? `${course}/${batch}/admins/${encodeURIComponent(
          sender.trim()
        )}/students/${encodeURIComponent(selectedTarget.trim())}`
      : null;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchMyBatch = async () => {
      try {
        const token = localStorage.getItem("token");
      const res = await API.get(
        "/api/admin-batches/my-batches",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

        const myId = JSON.parse(atob(token.split(".")[1])).id;
        const matchingBatch = res.data.find((b) => b._id === batchId);
        if (!matchingBatch) return;

        setCourse(matchingBatch.course.courseName);
        setBatch(matchingBatch.batchName);

        const adminInfo = matchingBatch.admins.find(
          (a) => a.admin._id === myId
        );
        if (adminInfo) setSender(adminInfo.admin.name);

        const uniqueModules = [...new Set(matchingBatch.admins.map(a => a.module).filter(Boolean))];
        setModules(uniqueModules);
        if (uniqueModules.length > 0) setActiveModule(uniqueModules[0]);
      } catch (err) {
        console.error("Error fetching admin batches:", err);
      }
    };

    fetchMyBatch();
  }, [batchId]);

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
  }, [room, sender]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (course && batch && sender && !chatType) {
      selectChat("forum");
    }
  }, [course, batch, sender, chatType]);

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
    <div className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden bg-white dark:bg-gray-900">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col border-b border-gray-300 dark:border-gray-700 md:border-b-0 md:border-r bg-white dark:bg-gray-900 min-h-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4 text-lg font-semibold text-blue-700 dark:text-blue-400 flex justify-between items-center">
          <div className="truncate max-w-[60vw] md:max-w-full">
            {course} -{" "}
            {chatType === "forum"
              ? `${activeModule} Forum`
              : `Chat with ${decodeURIComponent(selectedTarget || "")}`}
          </div>

          {isMobile && (
            <select
              className="ml-2 md:ml-4 p-2 w-full max-w-xs border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={chatType === "forum" ? "forum" : selectedTarget || ""}
              onChange={(e) => {
                if (e.target.value.startsWith("forum:")) {
                  const mod = e.target.value.split(":")[1];
                  selectChat("forum", null, mod);
                }
                else selectChat("student", e.target.value);
              }}
              aria-label="Select chat"
            >
              {modules.map(mod => (
                <option key={mod} value={`forum:${mod}`}>{mod} Forum</option>
              ))}
              {students.map((student) => (
                <option key={student} value={student}>
                  {decodeURIComponent(student)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 px-4 md:px-6 py-3 md:py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 min-h-0"
          style={{ flexGrow: 1 }}
        >
          {messages.map((m, i) => {
            const isSender = m.name === sender;
            const timeSince = (new Date() - new Date(m.timestamp)) / 1000 / 60;
            const canEdit = isSender && timeSince < 2;

            return (
              <div
                key={m._id || i}
                className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3`}
              >
                {!isSender && (
                  <div className="flex items-start space-x-2 max-w-[75%]">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-sm flex items-center justify-center font-semibold text-gray-700 dark:text-white flex-shrink-0">
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-300 font-medium mb-1 flex items-center gap-2">
                        {m.name}
                        {m.edited && <span className="text-[10px] text-gray-400 italic">(edited)</span>}
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words shadow">
                        {decryptMessage(m.message)}
                      </div>
                    </div>
                  </div>
                )}
                {isSender && (
                  <div className="flex flex-col items-end max-w-[75%]">
                    <div className="text-xs text-gray-500 dark:text-gray-300 font-medium mb-1 flex items-center gap-2">
                      You
                      {canEdit && !editingId && (
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
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words shadow max-w-full">
                        {decryptMessage(m.message)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            placeholder="Type your message..."
            aria-label="Message input"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-5 py-2 rounded-r-md hover:bg-blue-700 text-sm"
          >
            Send
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop only) */}
      {!isMobile && (
        <div className="w-80 border-l border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-y-auto min-h-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Participants
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-6">
            {1 + students.length} people in this batch
          </p>

          <div className="space-y-1 mb-8">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-3">Module Forums</h3>
            {modules.map((mod) => (
              <div
                key={mod}
                onClick={() => selectChat("forum", null, mod)}
                className={`flex gap-3 items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  chatType === "forum" && activeModule === mod
                    ? "bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform ${
                  chatType === "forum" && activeModule === mod
                    ? "bg-blue-600 text-white scale-105"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}>
                  {mod[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white leading-none">
                    {mod}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-medium opacity-70">
                    Specialisation Room
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-3">Participants</h3>

          {students.map((student) => (
            <div
              key={student}
              onClick={() => selectChat("student", student)}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer mb-2 ${
                selectedTarget === student && chatType === "student"
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="relative w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-sm flex items-center justify-center font-semibold text-gray-700 dark:text-white">
                {getInitials(student)}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">
                  {decodeURIComponent(student)}
                </div>
                <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded w-fit">
                  student
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
