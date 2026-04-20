import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import logo from "../assets/logo.JPG";
import sideImage from "../assets/login-side.JPG";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    try {
      await API.post("/auth/reset-password", { email, password });
      localStorage.removeItem("resetEmail");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-white to-white p-6">
      <div className="bg-white shadow-2xl rounded-3xl flex w-full max-w-4xl overflow-hidden">
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-12" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Reset Password</h2>

          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

          <form onSubmit={handleReset} className="space-y-5">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reset Password
            </button>
          </form>
        </div>
        <div className="hidden md:block md:w-1/2">
          <img src={sideImage} className="h-full w-full object-cover" alt="Visual" />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
