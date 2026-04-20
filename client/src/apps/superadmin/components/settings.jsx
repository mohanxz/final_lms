import { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { toast } from 'react-toastify';
import { 
  FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, 
  FaShieldAlt, FaKey, FaSave, FaArrowLeft, FaCheckCircle,
  FaUserShield, FaIdCard, FaCalendarAlt, FaGlobe, FaCog,
  FaSpinner
} from "react-icons/fa";
import { MdOutlineSecurity, MdOutlinePassword } from "react-icons/md";

const Settings = () => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [details, setDetails] = useState({
    name: "",
    email: "",
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isChanging, setIsChanging] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/settings/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetails(res.data);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    // Calculate password strength
    const password = passwordForm.newPassword;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  }, [passwordForm.newPassword]);

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const submitPasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsChanging(true);
    const token = localStorage.getItem("token");
    try {
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
      setIsChanging(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
              <FaCog className="text-white text-lg" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-2 ml-14">
            Manage your account details and security preferences
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 px-8 pt-8 pb-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center text-4xl font-bold text-white shadow-xl border-2 border-white/30">
                  {details.name?.charAt(0) || "A"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">{details.name || "Admin User"}</h2>
                <p className="text-blue-50 flex items-center justify-center md:justify-start gap-2 mt-1">
                  <FaEnvelope className="text-sm" />
                  {details.email || "admin@example.com"}
                </p>
                <span className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/30">
                  <FaUserShield className="text-xs" />
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Security Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                <MdOutlineSecurity className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Security Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your password and enhance account security</p>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="space-y-6 max-w-2xl">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 group-focus-within:text-blue-500 dark:group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword.currentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition-all"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("currentPassword")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    <FaKey className="text-gray-400 group-focus-within:text-blue-500 dark:group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword.newPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition-all"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("newPassword")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                      <span className={`text-xs font-medium ${getStrengthColor().replace("bg-", "text-")}`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Password must be at least 6 characters with a mix of letters, numbers, and symbols
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
                    <MdOutlinePassword className="text-gray-400 group-focus-within:text-blue-500 dark:group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword.confirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-cyan-500 transition-all"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("confirmPassword")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-cyan-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                    <FaShieldAlt className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-cyan-300 mb-1">Security Tips</p>
                    <ul className="text-xs text-blue-700 dark:text-cyan-400 space-y-1">
                      <li>• Use a strong, unique password that you don't use elsewhere</li>
                      <li>• Enable two-factor authentication for added security</li>
                      <li>• Never share your password with anyone</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitPasswordChange}
                disabled={isChanging}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChanging ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <FaSave className="group-hover/btn:scale-110 transition-transform" />
                    Update Password
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Last login: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;