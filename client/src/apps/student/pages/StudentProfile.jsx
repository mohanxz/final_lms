import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';
import axios from 'axios';
import { 
  FaUserCircle, FaLock, FaEnvelope, FaGraduationCap, 
  FaEye, FaEyeSlash, FaSignOutAlt, FaArrowLeft, 
  FaShieldAlt, FaCheckCircle, FaKey, FaUser,
  FaCalendarAlt, FaIdCard, FaPhone, FaMapMarkerAlt,
  FaSave, FaSpinner, FaUserShield, FaStar, FaAward
} from 'react-icons/fa';
import { MdOutlineSecurity, MdOutlinePassword, MdOutlineEmail } from 'react-icons/md';
import { toast } from 'react-toastify';

function StudentProfile() {
  const { userData, setUserData } = useContext(UserContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    setUserData(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const changePassword = async () => {
    if (!newPassword) {
      toast.warn('Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.warn('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_LOGIN_API}/auth/change-password`,
        {
          username: userData.username,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(0);
    } catch (err) {
      toast.error('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Calculate password strength
  const calculateStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    calculateStrength(value);
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

  // Get user initials for avatar
  const getInitials = () => {
    if (userData?.name) {
      return userData.name.charAt(0).toUpperCase();
    }
    return 'S';
  };

  // Get gradient color based on name
  const getAvatarGradient = () => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-purple-600',
      'from-emerald-500 to-green-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600',
      'from-orange-500 to-orange-600',
    ];
    const index = (userData?.name?.length || 0) % gradients.length;
    return gradients[index];
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
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/home')}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FaArrowLeft className="text-sm" />
          Back to Dashboard
        </button>

        {/* Main Profile Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          
          {/* Profile Header with Cover Image */}
          <div className="relative">
            {/* Cover Image with Animated Gradient */}
            <div className="h-32 md:h-40 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            </div>
            
            {/* Profile Avatar */}
            <div className="absolute -bottom-12 left-6 md:left-8">
              <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-xl border-4 border-white dark:border-gray-800 transform transition-transform hover:scale-105 duration-300`}>
                {getInitials()}
              </div>
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/30">
                <FaGraduationCap className="text-xs" />
                Student
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-full text-yellow-100 text-xs font-semibold border border-yellow-400/50">
                <FaStar className="text-xs" />
                Active
              </span>
            </div>
          </div>

          {/* User Info Section */}
          <div className="pt-16 pb-6 px-6 md:px-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {userData?.name || 'Student Name'}
                </h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <MdOutlineEmail className="text-blue-500 dark:text-cyan-400 text-sm" />
                    {userData?.email || 'student@example.com'}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <FaIdCard className="text-purple-500 text-xs" />
                    ID: {userData?.username || 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Quick Stats Cards */}
              <div className="flex gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 text-center hover:shadow-md transition-shadow border border-blue-200/50 dark:border-cyan-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-cyan-400">Student</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2 text-center hover:shadow-md transition-shadow border border-green-200/50 dark:border-green-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">Active</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl px-4 py-2 text-center hover:shadow-md transition-shadow border border-purple-200/50 dark:border-purple-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Beginner</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 md:px-8">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('password')}
                className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                  activeTab === 'password'
                    ? 'text-blue-600 dark:text-cyan-400 border-b-2 border-blue-600 dark:border-cyan-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }`}
              >
                <FaLock className="text-sm" />
                Password & Security
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                  activeTab === 'info'
                    ? 'text-blue-600 dark:text-cyan-400 border-b-2 border-blue-600 dark:border-cyan-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }`}
              >
                <FaUser className="text-sm" />
                Personal Info
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Password Settings</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm ml-4">
                    Update your password to keep your account secure
                  </p>
                </div>

                {/* Security Tips */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-cyan-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                      <MdOutlineSecurity className="text-white text-base" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-cyan-300 mb-1">Security Tips</p>
                      <ul className="text-xs text-blue-700 dark:text-cyan-400 space-y-1">
                        <li>• Use at least 8 characters with a mix of letters, numbers, and symbols</li>
                        <li>• Avoid using common words or personal information</li>
                        <li>• Don't reuse passwords from other accounts</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="max-w-md space-y-5">
                  {/* New Password Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaKey className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 flex-1">
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
                          Use 8+ characters with letters, numbers & symbols
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaShieldAlt className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* Password Match Indicator */}
                  {newPassword && confirmPassword && (
                    <div className={`flex items-center gap-2 text-sm ${newPassword === confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {newPassword === confirmPassword ? (
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

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={changePassword}
                      disabled={isChangingPassword}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Update Password
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={logout}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'info' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Personal Information</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm ml-4">
                    Your personal details and account information
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUser className="text-blue-500 dark:text-cyan-400 text-sm" />
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                    </div>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">{userData?.name || 'Not provided'}</p>
                  </div>
                  
                  <div className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <MdOutlineEmail className="text-blue-500 dark:text-cyan-400 text-sm" />
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                    </div>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">{userData?.email || 'Not provided'}</p>
                  </div>
                  
                  <div className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FaIdCard className="text-purple-500 text-sm" />
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</label>
                    </div>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">{userData?.username || 'Not provided'}</p>
                  </div>
                  
                  <div className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FaGraduationCap className="text-green-500 text-sm" />
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</label>
                    </div>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 rounded-lg text-sm">
                        Student
                      </span>
                    </p>
                  </div>

                  <div className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheckCircle className="text-green-500 text-sm" />
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Status</label>
                    </div>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">
                      <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        Active
                      </span>
                    </p>
                  </div>

                  <div className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCalendarAlt className="text-orange-500 text-sm" />
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member Since</label>
                    </div>
                    <p className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                      {new Date().getFullYear()}
                    </p>
                  </div>
                </div>

                {/* Note about updates */}
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-md">
                      <FaShieldAlt className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Information Note</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        For changes to your personal information (name, email, etc.), please contact your course administrator.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Achievement Badge */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <FaAward className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">Learning Journey</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Keep learning to unlock achievements!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Learning Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;