import { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { toast } from "react-toastify";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaBuilding, 
  FaCode, 
  FaPlus, 
  FaSave, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaArrowLeft,
  FaFire,
  FaChartLine,
  FaCheckCircle,
  FaSpinner,
  FaUserGraduate,
  FaGraduationCap,
  FaBriefcase,
  FaShieldAlt,
  FaKey,
  FaUserCircle
} from "react-icons/fa";
import { MdOutlineEmail, MdOutlinePhone, MdOutlineWork } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    skill: false
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    specialisation: [],
  });
  const [newSkill, setNewSkill] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/settings/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm(res.data);
      } catch (err) {
        toast.error("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const token = localStorage.getItem("token");
      await API.put("/api/settings/me", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;

    setLoading(prev => ({ ...prev, skill: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/api/settings/add-skill",
        { skill: newSkill.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setForm((prev) => ({
        ...prev,
        specialisation: res.data.specialisation,
      }));
      setNewSkill("");
      toast.success("Skill added successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add skill");
    } finally {
      setLoading(prev => ({ ...prev, skill: false }));
    }
  };

  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const toggleVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const submitPasswordChange = async () => {
    const { newPassword, confirmPassword, currentPassword } = passwordForm;

    if (!currentPassword) {
      return toast.error("Please enter your current password");
    }
    if (newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }

    setLoading(prev => ({ ...prev, password: true }));
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_LOGIN_API}/auth/change-password`,
        passwordForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const skillCount = form.specialisation?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 group"
        >
          <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Header Section */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/30">
                      <FaUser className="text-xs" />
                      Account Settings
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                      <FaChartLine className="text-xs" />
                      Profile Management
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-sm">
                    Profile & Settings
                  </h1>
                  <p className="text-blue-50 text-sm">
                    Manage your account settings and preferences
                  </p>
                </div>
                
                {/* Role Badge */}
                <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-4 text-center min-w-[140px] border border-white/30 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaUserGraduate className="text-yellow-300 text-xl" />
                    <span className="text-white text-sm font-medium">Role</span>
                  </div>
                  <p className="text-lg font-bold text-white">Lecturer</p>
                  <p className="text-blue-100 text-xs">Faculty Member</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          
          {/* Profile Header with Avatar */}
          <div className="relative bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                  {form.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{form.name || "Your Name"}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center sm:justify-start">
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <FaEnvelope className="text-blue-400 dark:text-cyan-400 text-xs" />
                    {form.email}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <FaUserGraduate className="text-blue-400 dark:text-cyan-400 text-xs" />
                    Lecturer
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 text-xs rounded-lg border border-green-200 dark:border-green-800">
                    <FaCheckCircle size={10} />
                    Active Account
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['profile', 'password'].map((key) => (
              <button
                key={key}
                className={`flex-1 py-4 text-center font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  tab === key
                    ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20'
                }`}
                onClick={() => setTab(key)}
              >
                {key === 'profile' ? (
                  <>
                    <FaUser size={14} />
                    Profile Information
                  </>
                ) : (
                  <>
                    <FaLock size={14} />
                    Security & Password
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === "profile" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaUser className="inline mr-2 text-blue-500 dark:text-cyan-400" size={12} />
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaEnvelope className="inline mr-2 text-blue-500 dark:text-cyan-400" size={12} />
                    Email Address
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaPhone className="inline mr-2 text-blue-500 dark:text-cyan-400" size={12} />
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                    placeholder="Your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaBuilding className="inline mr-2 text-blue-500 dark:text-cyan-400" size={12} />
                    Department
                  </label>
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                    placeholder="Your department"
                  />
                </div>
              </div>

              {/* Skills Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <FaCode className="text-white text-xs" />
                    </div>
                    Skills & Expertise
                    <span className="text-xs text-gray-400 ml-1">({skillCount} skills)</span>
                  </label>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.specialisation?.length > 0 ? (
                    form.specialisation.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-cyan-300 text-sm rounded-full border border-blue-200 dark:border-cyan-800 shadow-sm"
                      >
                        <FaCode size={10} className="text-blue-500 dark:text-cyan-400" />
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No skills added yet</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                      placeholder="Add new skill (e.g., React, Python, Data Science)..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                  </div>
                  <button
                    onClick={addSkill}
                    disabled={loading.skill}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn disabled:opacity-50 sm:w-auto"
                  >
                    {loading.skill ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaPlus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                    )}
                    Add Skill
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  disabled={loading.profile}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg group/btn disabled:opacity-50 sm:w-auto"
                >
                  {loading.profile ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaSave size={16} className="group-hover/btn:scale-110 transition-transform" />
                  )}
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {tab === "password" && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                    <FaShieldAlt className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update your password to keep your account secure
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaKey className="inline mr-2 text-blue-500 dark:text-cyan-400" size={12} />
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.currentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                      placeholder="Enter your current password"
                    />
                    <button
                      onClick={() => toggleVisibility("currentPassword")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword.currentPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaLock className="inline mr-2 text-green-500" size={12} />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.newPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    <button
                      onClick={() => toggleVisibility("newPassword")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword.newPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaCheckCircle className="inline mr-2 text-blue-500 dark:text-cyan-400" size={12} />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition"
                      placeholder="Confirm your new password"
                    />
                    <button
                      onClick={() => toggleVisibility("confirmPassword")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword.confirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-cyan-800">
                <p className="text-sm font-semibold text-blue-800 dark:text-cyan-300 mb-2 flex items-center gap-2">
                  <FaShieldAlt size={12} />
                  Password Requirements:
                </p>
                <ul className="text-xs text-blue-700 dark:text-cyan-400 space-y-1">
                  <li className="flex items-center gap-2">• Minimum 6 characters long</li>
                  <li className="flex items-center gap-2">• Should be different from your current password</li>
                  <li className="flex items-center gap-2">• Keep it secure and don't share with anyone</li>
                </ul>
              </div>

              <button
                onClick={submitPasswordChange}
                disabled={loading.password}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn disabled:opacity-50 sm:w-auto mt-6"
              >
                {loading.password ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaLock size={16} className="group-hover/btn:scale-110 transition-transform" />
                )}
                Update Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;