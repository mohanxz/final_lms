import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { 
  FaTrophy, 
  FaMedal, 
  FaChartLine, 
  FaCrown,
  FaStar,
  FaFire,
  FaChevronRight,
  FaUser
} from "react-icons/fa";
import { MdLeaderboard } from "react-icons/md";

export default function AdminLeaderboard() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const token = localStorage.getItem("token");
  const defaultProfile =
    "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  useEffect(() => {
    API
      .get("/api/dashboard/lecturer", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
      .then((res) => {
        const myBatches = res.data.batches;
        setBatches(myBatches);
        if (myBatches.length > 0) {
          setSelectedBatch(myBatches[0]._id);
          const firstModules = myBatches[0].modulesHandled || [];
          setModules(firstModules);
          setSelectedModule(firstModules[0] || "");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin batches", err);
      });
  }, []);

  useEffect(() => {
    const batch = batches.find((b) => b._id === selectedBatch);
    const mods = batch?.modulesHandled || [];
    setModules(mods);
    if (!mods.includes(selectedModule)) {
      setSelectedModule(mods[0] || "");
    }
  }, [selectedBatch, batches, selectedModule]);

  useEffect(() => {
    if (!selectedBatch || !selectedModule) return;

    API
      .get("/statistics/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
        params: { batchId: selectedBatch, module: selectedModule },
        withCredentials: true,
      })
      .then((res) => {
        setLeaderboard(res.data);
      })
      .catch((err) => {
        console.error("Leaderboard fetch error", err);
      });
  }, [selectedBatch, selectedModule, token]);

  const podium = [leaderboard[1], leaderboard[0], leaderboard[2]];
  const topPerformer = leaderboard[0]?.name || "—";

  return (
    <div className="relative">
      {/* Clean Header */}
      <div className="relative mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-md">
              <MdLeaderboard className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                Leaderboard
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-medium rounded-full">
                  <FaFire className="text-orange-500 text-[8px]" />
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Top: {topPerformer} · {leaderboard.length} Students
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Updated live
          </div>
        </div>
      </div>

      {/* Filters - Clean & Minimal */}
      <div className="bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 mb-5 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent transition-all"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batchName} ({b.courseName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <select
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent transition-all"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              {modules.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Podium Section - Clean Design */}
      {leaderboard.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <FaCrown className="text-gray-600 dark:text-gray-400 text-[10px]" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Top 3</span>
          </div>
          
          {/* Desktop Podium */}
          <div className="hidden md:flex justify-center items-end gap-4 h-52">
            {podium.map((stu, idx) => {
              const heights = ["h-40", "h-48", "h-32"];
              const ranks = [2, 1, 3];
              const colors = [
                "from-gray-200 to-gray-300",
                "from-gray-800 to-gray-900",
                "from-gray-400 to-gray-500"
              ];
              return (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-end w-28 ${heights[idx]} transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className={`absolute bottom-0 w-full ${heights[idx]} bg-gradient-to-b ${colors[idx]} rounded-t-lg shadow-lg`}>
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="text-white/40 font-bold text-2xl">#{ranks[idx]}</span>
                    </div>
                  </div>
                  
                  {stu ? (
                    <div className="relative z-10 flex flex-col items-center pb-2">
                      <div className="relative -mt-6">
                        <img
                          src={defaultProfile}
                          className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover bg-gray-100"
                          alt="profile"
                        />
                        {ranks[idx] === 1 && (
                          <FaCrown className="absolute -top-2 -right-2 text-gray-800 dark:text-gray-200 text-lg drop-shadow" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-white text-center truncate w-full mt-1">
                        {stu.name.split(' ')[0]}
                      </p>
                      <p className={`text-base font-bold ${
                        idx === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {stu.avg}
                      </p>
                    </div>
                  ) : (
                    <div className="relative z-10 text-gray-400 text-xs">—</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Podium */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
            {podium.map((stu, idx) => {
              const ranks = [2, 1, 3];
              const colors = [
                "from-gray-200 to-gray-300",
                "from-gray-800 to-gray-900",
                "from-gray-400 to-gray-500"
              ];
              return (
                <div
                  key={idx}
                  className={`flex-shrink-0 w-24 bg-gradient-to-b ${colors[idx]} rounded-lg p-3 text-center shadow-md`}
                >
                  {stu ? (
                    <>
                      <img
                        src={defaultProfile}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm mx-auto mb-1"
                        alt="profile"
                      />
                      <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{stu.name.split(' ')[0]}</p>
                      <p className="text-base font-bold text-gray-800 dark:text-white">{stu.avg}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-full text-[10px] font-medium text-gray-700 dark:text-gray-300">#{ranks[idx]}</span>
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm py-4">—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard List - Clean Table Style */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <div className="col-span-2">#</div>
          <div className="col-span-6">Student</div>
          <div className="col-span-4 text-right">Score</div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <FaTrophy className="text-xl text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {leaderboard.slice(0, 8).map((entry) => (
              <div
                key={entry.rank}
                className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center transition-all duration-200 ${
                  entry.rank <= 3
                    ? 'bg-gray-50/80 dark:bg-gray-700/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                }`}
              >
                <div className="col-span-2 flex items-center">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-semibold text-xs ${
                    entry.rank === 1 ? 'bg-gray-800 text-white' :
                    entry.rank === 2 ? 'bg-gray-400 text-white' :
                    entry.rank === 3 ? 'bg-gray-500 text-white' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {entry.rank}
                  </div>
                </div>

                <div className="col-span-6">
                  <div className="flex items-center gap-2">
                    {entry.rank <= 3 ? (
                      <FaMedal className={`text-xs ${
                        entry.rank === 1 ? 'text-gray-800 dark:text-gray-200' :
                        entry.rank === 2 ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    )}
                    <span className={`text-sm font-medium truncate ${
                      entry.rank <= 3 ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {entry.name}
                    </span>
                    {entry.rank === 1 && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-800 dark:bg-gray-600 rounded-full text-[9px] font-medium text-white">
                        <FaFire className="text-[8px]" />
                        TOP
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-span-4 text-right">
                  <span className={`text-base font-bold ${
                    entry.rank === 1 ? 'text-gray-900 dark:text-white' :
                    entry.rank === 2 ? 'text-gray-600 dark:text-gray-400' :
                    entry.rank === 3 ? 'text-gray-500 dark:text-gray-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {entry.avg}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {leaderboard.length > 8 && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button className="w-full text-center text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1">
              View Full Leaderboard
              <FaChevronRight className="text-[10px]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}