// src/api.js
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = axios.create({
  baseURL: import.meta.env.VITE_STUDENT_API, // your backend URL
});

// Add token to headers
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Handle token errors globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && [401, 403].includes(err.response.status)) {
      localStorage.removeItem("token");

      window.location.href = "/login"; // works outside React
    }
    return Promise.reject(err);
  },
);

export default API;
