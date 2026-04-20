import React, { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import api from "../api"; // ✅ USE THIS

const typeLabels = ["Coding", "Quiz", "Assignment"];

function NotesWidget({ studentId }) {
  const [missingNotes, setMissingNotes] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!studentId) return;

        // ✅ token automatically added via interceptor
        const res = await api.get(`/api/reports/${studentId}`);
        const reports = res.data || [];

        const missing = [];

        for (const report of reports) {
          report.marksObtained?.forEach((mark, index) => {
            if (mark === -2) {
              missing.push({
                id: `${report._id}-${index}`,
                text: `Day ${report.day} - ${report.module} - ${typeLabels[index]} not submitted`,
              });
            }
          });
        }

        setMissingNotes(missing);
      } catch (err) {
        console.error("❌ Error fetching reports:", err);
      }
    };

    fetchReports();
  }, [studentId]);

  const deleteNote = (id) => {
    setMissingNotes((prev) => prev.filter((note) => note.id !== id));
  };

  return (
    <div className="w-full">
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {missingNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              All caught up!
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              No pending work
            </p>
          </div>
        ) : (
          missingNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium break-words">
                  {note.text}
                </p>
              </div>

              <button
                onClick={() => deleteNote(note.id)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition-colors flex-shrink-0"
                title="Dismiss"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotesWidget;