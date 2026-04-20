import { useEffect, useState } from 'react';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to check if token is structurally valid and not expired
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired (with 5 minute buffer)
      return payload.exp && payload.exp > (currentTime + 300);
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');

    // Clear localStorage first to prevent loops
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('email');

    if (token) {
      try {
        await axios.post(`${import.meta.env.VITE_LOGIN_API}/auth/logout`, null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Logout request failed:", err.message);
      }
    }
    
    window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      // Basic checks first
      if (!token || !role) {
        console.log("No token or role found");
        setIsAuthenticated(false);
        setCheckingAuth(false);
        window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
        return;
      }

      // Check if user has correct role
      if (role !== 'superadmin') {
        console.log("Invalid role for superadmin app:", role);
        await logout();
        return;
      }

      // Validate token structure and expiry
      if (!isTokenValid(token)) {
        console.log("Token is invalid or expired");
        await logout();
        return;
      }

      // Try API verification, but don't fail if API is down
      try {
        const response = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000 // 5 second timeout
        });

        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          throw new Error("Invalid response from verify endpoint");
        }
      } catch (err) {
        console.error("Token verification failed:", err.message);
        
        // If it's a network error, allow access with valid token
        if (err.code === 'ECONNABORTED' || err.code === 'NETWORK_ERROR') {
          console.log("Network error during verification, allowing access with valid token");
          setIsAuthenticated(true);
        } else {
          // If it's an authentication error, logout
          await logout();
          return;
        }
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyToken();
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default PrivateRoute;
