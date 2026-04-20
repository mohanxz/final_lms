// components/PublicRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api"; // Your axios instance with interceptor

const PublicRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        // You can hit a lightweight protected endpoint to verify
        await API.get("/auth/verify"); // Create this route in your backend
        setIsAuthenticated(true);
      } catch (err) {
        // Token is invalid or expired
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyToken();
  }, []);

  if (checkingAuth) return null; // Or a loader

  return isAuthenticated ? <Navigate to="/" /> : children;
};

export default PublicRoute;

