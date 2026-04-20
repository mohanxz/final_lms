import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Make sure path is correct
import './index.css'; // optional if you have styling
import { initializeTheme } from '@shared/theme';

initializeTheme(); // 🟢 Apply dark mode class BEFORE React renders
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
