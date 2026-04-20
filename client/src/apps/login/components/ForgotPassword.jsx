import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import logo from "../assets/logo.JPG";
import sideImage from "../assets/login-side.JPG";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await API.post("/auth/send-reset-code", { email });
      localStorage.setItem("resetEmail", email);
      navigate("/verify-code");
    } catch (err) {
      setError(err.response?.data?.error || "Error sending code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-white to-white p-6">
      <div className="bg-white shadow-2xl rounded-3xl flex w-full max-w-4xl overflow-hidden">
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-12" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Forgot Password</h2>
          <p className="text-sm text-center text-gray-500 mb-4">Enter your email to receive a verification code.</p>

          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center mb-2">{message}</p>}

          <form onSubmit={handleSendCode} className="space-y-5">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Send Code
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

export default ForgotPassword;
