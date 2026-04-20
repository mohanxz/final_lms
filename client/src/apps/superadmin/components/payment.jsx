import React, { useEffect, useState, useCallback, useMemo } from "react";
import API from "../api";
import {
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaSync,
  FaSearch,
  FaTimes,
  FaRupeeSign,
  FaUserGraduate,
  FaWallet,
  FaMoneyBillWave,
  FaChartLine,
  FaFilter,
  FaDownload,
  FaPrint,
  FaEye,
  FaCheck,
  FaBan,
  FaUniversity,
  FaCreditCard,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const Payment = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    paidCount: 0,
    pendingCount: 0,
    totalAdmins: 0,
    totalPendingAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingRow, setUpdatingRow] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  /* ---------------------------- */
  /* LOAD DATA */
  /* ---------------------------- */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    filterRows();
  }, [rows, searchTerm, statusFilter]);

  /* ---------------------------- */
  /* FETCH DATA */
  /* ---------------------------- */

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [salaryRes, statsRes] = await Promise.all([
        API.get("/api/salary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("/api/salary/stats/payments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const data = salaryRes.data || [];
      setRows(data);

      const pendingAmount = data
        .filter(row => row.salaryStatus === "pending")
        .reduce((sum, row) => sum + (row.salary || 0), 0);

      setStats({
        totalSpent: statsRes.data.totalSpent || 0,
        paidCount: statsRes.data.paidCount || 0,
        pendingCount: statsRes.data.pendingCount || 0,
        totalAdmins: data.length,
        totalPendingAmount: pendingAmount,
      });

    } catch (err) {
      console.error("Fetch error:", err);
      if (err.code === "ERR_NETWORK") {
        setConnectionError(true);
        toast.error("Network error - Unable to connect to server");
      }
      if (err.response?.status === 401) {
        setAuthError(true);
        toast.error("Session expired - Please login again");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------- */
  /* FILTER */
  /* ---------------------------- */

  const filterRows = () => {
    let filtered = [...rows];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.name?.toLowerCase().includes(term) ||
          row.batchName?.toLowerCase().includes(term) ||
          row.module?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (row) => row.salaryStatus === statusFilter
      );
    }

    setFilteredRows(filtered);
  };

  /* ---------------------------- */
  /* UPDATE MODULE PAYMENT */
  /* ---------------------------- */

  const updateSalaryStatus = async (row, newStatus) => {
    const rowKey = `${row.adminId}-${row.batchId}-${row.module}`;
    setUpdatingRow(rowKey);

    try {
      const token = localStorage.getItem("token");
      await API.patch(
        "/api/salary/payment",
        {
          adminId: row.adminId,
          batchId: row.batchId,
          module: row.module,
          status: newStatus === "credited" ? "paid" : "pending",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Payment ${newStatus === "credited" ? "completed" : "reverted"} successfully`);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Payment update failed");
    } finally {
      setUpdatingRow(null);
    }
  };

  /* ---------------------------- */
  /* BULK UPDATE */
  /* ---------------------------- */

  const handleBulkUpdate = async (status) => {
    if (selectedRows.size === 0) {
      toast.error("Please select at least one row");
      return;
    }

    setBulkUpdating(true);
    const selectedItems = rows.filter((_, index) => selectedRows.has(index));

    try {
      const token = localStorage.getItem("token");
      const promises = selectedItems.map((row) =>
        API.patch(
          "/api/salary/payment",
          {
            adminId: row.adminId,
            batchId: row.batchId,
            module: row.module,
            status: status === "credited" ? "paid" : "pending",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(promises);
      toast.success(`Bulk update completed for ${selectedRows.size} items`);
      setSelectedRows(new Set());
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Bulk update failed");
    } finally {
      setBulkUpdating(false);
    }
  };

  /* ---------------------------- */
  /* TOGGLE SELECTION */
  /* ---------------------------- */

  const toggleRowSelection = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set());
    } else {
      const newSelected = new Set();
      filteredRows.forEach((_, index) => newSelected.add(index));
      setSelectedRows(newSelected);
    }
  };

  /* ---------------------------- */
  /* BADGES */
  /* ---------------------------- */

  const salaryBadge = (status) => {
    if (status === "paid") {
      return (
        <motion.span
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex gap-1.5 items-center shadow-md"
        >
          <FaCheckCircle className="text-sm" /> Paid
        </motion.span>
      );
    }
    return (
      <motion.span
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full flex gap-1.5 items-center shadow-md"
      >
        <FaClock className="text-sm" /> Pending
      </motion.span>
    );
  };

  /* ---------------------------- */
  /* LOADING STATES */
  /* ---------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading salary data...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center items-center">
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md border border-gray-200/50 dark:border-gray-700/50">
          <FaBan className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Unable to connect to the server</p>
          <button
            onClick={fetchData}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center items-center">
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md border border-gray-200/50 dark:border-gray-700/50">
          <FaBan className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Authentication Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Please login again to continue</p>
          <button
            onClick={() => window.location.href = "/login"}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------- */
  /* MAIN UI */
  /* ---------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <Toaster position="top-right" />

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/30">
                      <FaMoneyBillWave className="text-xs" />
                      Salary Management
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                      <FaChartLine className="text-xs" />
                      Payment Overview
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    Lecturer Payments
                  </h1>
                  <p className="text-blue-50 text-sm">
                    Manage and track salary payments across all modules
                  </p>
                </div>
                
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30"
                >
                  <FaSync className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Modules"
              value={stats.totalAdmins}
              icon={<FaUserGraduate />}
              color="blue"
            />
            <StatCard
              title="Total Spent"
              value={`₹${stats.totalSpent.toLocaleString()}`}
              icon={<FaWallet />}
              color="cyan"
            />
            <StatCard
              title="Paid Modules"
              value={stats.paidCount}
              icon={<FaCheckCircle />}
              color="green"
            />
            <StatCard
              title="Pending Modules"
              value={stats.pendingCount}
              icon={<FaClock />}
              color="orange"
            />
            <StatCard
              title="Pending Amount"
              value={`₹${stats.totalPendingAmount.toLocaleString()}`}
              icon={<FaMoneyBillWave />}
              color="red"
            />
          </div>
        </div>

        {/* FILTERS AND ACTIONS */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 dark:text-cyan-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by admin, batch, or module..."
                className="w-full pl-11 pr-11 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition bg-white"
              />
              {searchTerm && (
                <FaTimes
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                />
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 dark:text-cyan-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-11 pr-8 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white cursor-pointer appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedRows.size > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  {selectedRows.size} selected
                </span>
                <button
                  onClick={() => handleBulkUpdate("credited")}
                  disabled={bulkUpdating}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  <FaCheck /> Bulk Pay
                </button>
                <button
                  onClick={() => handleBulkUpdate("pending")}
                  disabled={bulkUpdating}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  <FaBan /> Bulk Revert
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <tr>
                  <th className="p-4 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded cursor-pointer accent-white"
                    />
                  </th>
                  <th className="p-4 text-left font-semibold">Admin</th>
                  <th className="p-4 text-left font-semibold">Batch</th>
                  <th className="p-4 text-left font-semibold">Module</th>
                  <th className="p-4 text-left font-semibold">Salary</th>
                  <th className="p-4 text-left font-semibold">Payment Status</th>
                  <th className="p-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence>
                  {filteredRows.map((row, index) => {
                    const rowKey = `${row.adminId}-${row.batchId}-${row.module}`;
                    const updating = updatingRow === rowKey;

                    return (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(index)}
                            onChange={() => toggleRowSelection(index)}
                            className="w-4 h-4 rounded cursor-pointer text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                              {row.name?.charAt(0) || "A"}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-white">{row.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">ID: {row.adminId?.slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-cyan-300 rounded-lg text-xs font-medium border border-blue-200 dark:border-cyan-800">
                            {row.batchName}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{row.module}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 font-bold text-gray-800 dark:text-white">
                            <FaRupeeSign className="text-green-500" />
                            {row.salary?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td className="p-4">{salaryBadge(row.salaryStatus)}</td>
                        <td className="p-4">
                          <div className="flex gap-2 items-center">
                            <select
                              value={row.salaryStatus === "paid" ? "credited" : "pending"}
                              onChange={(e) => updateSalaryStatus(row, e.target.value)}
                              disabled={updating}
                              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 disabled:opacity-50 cursor-pointer transition"
                            >
                              <option value="pending">Mark Pending</option>
                              <option value="credited">Mark Paid</option>
                            </select>
                            {updating && <FaSpinner className="animate-spin text-blue-500" />}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredRows.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mb-4">
                <FaMoneyBillWave className="text-3xl text-blue-500 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No salary records found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    cyan: "from-cyan-500 to-teal-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-amber-500 to-orange-500",
    red: "from-red-500 to-rose-500",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl shadow-lg p-5 text-white`}
    >
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm opacity-90 font-medium">{title}</p>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
      <p className="text-2xl lg:text-3xl font-bold">{value}</p>
    </motion.div>
  );
};

export default Payment;