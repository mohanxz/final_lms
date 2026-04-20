import { useEffect, useState } from "react";
import api from "../api";
import { toast } from "react-toastify";
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake,
  FaGithub, FaLinkedin, FaLock, FaEye, FaEyeSlash, FaSave,
  FaUserCircle, FaShieldAlt, FaKey, FaCheckCircle, FaSpinner,
  FaArrowLeft, FaIdCard, FaGlobe, FaCalendarAlt
} from "react-icons/fa";
import { MdOutlineSecurity, MdOutlinePassword, MdOutlineEmail } from "react-icons/md";

// Brand colors
const brandColor = "#0099cc";
const brandGradient = "from-[#0099cc] to-[#0077aa]";
const brandGradientFull = "from-[#0099cc] via-[#0088bb] to-[#0077aa]";

const SettingsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
        <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  dob: "",
  github: "",
  linkedin: "",
};

const Settings = () => {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  const normalizeUrl = (value) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (trimmed === "") return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await api.get("/api/settings/me", { headers: { Authorization: `Bearer ${token}` } });
        setForm({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          dob: res.data.dob ? res.data.dob.substring(0, 10) : "",
          github: res.data.github || "",
          linkedin: res.data.linkedin || "",
        });
      } catch (e) {
        toast.error("Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const password = passwordForm.newPassword;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  }, [passwordForm.newPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = { ...form, github: normalizeUrl(form.github), linkedin: normalizeUrl(form.linkedin) };
      await api.put("/api/settings/me", payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Profile updated successfully!");
    } catch (e) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = (field) => setShowPassword((p) => ({ ...p, [field]: !p[field] }));

  const submitPasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await api.put("/auth/change-password", passwordForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to change password");
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Good";
    return "Strong";
  };

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0099cc]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0099cc]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0099cc]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">
            Profile & Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          
          {/* Profile Header */}
          <div className={`relative bg-gradient-to-r ${brandGradientFull} px-8 pt-8 pb-20`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center text-4xl font-bold text-white shadow-xl border-2 border-white/30`}>
                  {form.name?.charAt(0) || "U"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white">{form.name || "User Name"}</h2>
                <p className="text-cyan-100 flex items-center justify-center md:justify-start gap-2 mt-1">
                  <MdOutlineEmail className="text-sm" />
                  {form.email || "user@example.com"}
                </p>
                <span className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/30">
                  <FaUserCircle className="text-xs" />
                  Student
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
            <button
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-200 relative ${
                tab === "profile"
                  ? "text-[#0099cc] dark:text-cyan-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("profile")}
            >
              <FaUser className="text-sm" />
              Profile Information
              {tab === "profile" && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${brandGradient} rounded-full`}></div>
              )}
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-200 relative ${
                tab === "password"
                  ? "text-[#0099cc] dark:text-cyan-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("password")}
            >
              <FaLock className="text-sm" />
              Security & Password
              {tab === "password" && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${brandGradient} rounded-full`}></div>
              )}
            </button>
          </div>

          {/* Profile Tab Content */}
          {tab === "profile" && (
            <div className="p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${brandGradient} flex items-center justify-center shadow-md`}>
                  <FaUserCircle className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Personal Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your personal details and social links</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaUser className="inline mr-2 text-[#0099cc] dark:text-cyan-400 text-xs" />
                    Full Name
                  </label>
                  <input
                    disabled
                    name="name"
                    value={form.name}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <MdOutlineEmail className="inline mr-2 text-[#0099cc] dark:text-cyan-400 text-sm" />
                    Email Address
                  </label>
                  <input
                    disabled
                    name="email"
                    value={form.email}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaPhone className="inline mr-2 text-[#0099cc] dark:text-cyan-400 text-xs" />
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaBirthdayCake className="inline mr-2 text-[#0099cc] dark:text-cyan-400 text-xs" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaMapMarkerAlt className="inline mr-2 text-[#0099cc] dark:text-cyan-400 text-xs" />
                    Address
                  </label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaGithub className="inline mr-2 text-[#0099cc] dark:text-cyan-400 text-sm" />
                    GitHub Profile
                  </label>
                  <input
                    name="github"
                    value={form.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaLinkedin className="inline mr-2 text-[#0099cc] dark:text-cyan-400 text-sm" />
                    LinkedIn Profile
                  </label>
                  <input
                    name="linkedin"
                    value={form.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                disabled={saving}
                onClick={handleSave}
                className={`mt-8 w-full md:w-auto px-8 py-3 bg-gradient-to-r ${brandGradient} hover:from-[#0088bb] hover:to-[#006699] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Password Tab Content */}
          {tab === "password" && (
            <div className="p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${brandGradient} flex items-center justify-center shadow-md`}>
                  <MdOutlineSecurity className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Change Password</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your password to keep your account secure</p>
                </div>
              </div>

              <div className="space-y-5 max-w-2xl">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-500 dark:text-gray-400 group-focus-within:text-[#0099cc] transition-colors" />
                    </div>
                    <input
                      type={showPassword.currentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility("currentPassword")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword.currentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaKey className="text-gray-500 dark:text-gray-400 group-focus-within:text-[#0099cc] transition-colors" />
                    </div>
                    <input
                      type={showPassword.newPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility("newPassword")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword.newPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {passwordForm.newPassword && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-1 mr-3">
                          <div className={`h-1.5 flex-1 rounded-full transition-all ${passwordStrength >= 1 ? getStrengthColor() : "bg-gray-200 dark:bg-gray-600"}`}></div>
                          <div className={`h-1.5 flex-1 rounded-full transition-all ${passwordStrength >= 2 ? getStrengthColor() : "bg-gray-200 dark:bg-gray-600"}`}></div>
                          <div className={`h-1.5 flex-1 rounded-full transition-all ${passwordStrength >= 3 ? getStrengthColor() : "bg-gray-200 dark:bg-gray-600"}`}></div>
                          <div className={`h-1.5 flex-1 rounded-full transition-all ${passwordStrength >= 4 ? getStrengthColor() : "bg-gray-200 dark:bg-gray-600"}`}></div>
                        </div>
                        <span className={`text-xs font-medium ${getStrengthColor().replace("bg-", "text-").replace("500", "600")}`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Use 8+ characters with a mix of letters, numbers & symbols
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdOutlinePassword className="text-gray-500 dark:text-gray-400 group-focus-within:text-[#0099cc] transition-colors" />
                    </div>
                    <input
                      type={showPassword.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility("confirmPassword")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {passwordForm.confirmPassword && passwordForm.newPassword && (
                    <div className={`mt-2 flex items-center gap-2 text-sm ${passwordForm.newPassword === passwordForm.confirmPassword ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <>
                          <FaCheckCircle />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <FaEyeSlash />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Security Tips */}
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-start gap-3">
                    <FaShieldAlt className="text-[#0099cc] dark:text-cyan-400 text-lg mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-300 mb-1">Security Tips</p>
                      <ul className="text-xs text-cyan-700 dark:text-cyan-400 space-y-1">
                        <li>• Use a strong, unique password that you don't use elsewhere</li>
                        <li>• Never share your password with anyone</li>
                        <li>• Update your password regularly for better security</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={submitPasswordChange}
                  className={`w-full md:w-auto px-8 py-3 bg-gradient-to-r ${brandGradient} hover:from-[#0088bb] hover:to-[#006699] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2`}
                >
                  <FaLock />
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;