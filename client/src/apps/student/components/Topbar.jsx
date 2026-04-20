import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaBars, FaUserCircle, FaCog } from 'react-icons/fa';
import lightLogo from "../assets/cybernautLogo.webp";
import darkLogo from "../assets/cybernautEdTechDarkLogo.webp";

export default function Topbar({ pageTitle = "Dashboard", userName = "Student", darkMode, setDarkMode, toggleSidebar }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [flashState, setFlashState] = useState('idle');
  const [flashCount, setFlashCount] = useState(0);
  const [flashIntensity, setFlashIntensity] = useState(0);
  const flashIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const [logoKey, setLogoKey] = useState(0);

  // When darkMode is true (dark theme), use darkLogo
  // When darkMode is false (light theme), use lightLogo
  const currentLogo = darkMode ? darkLogo : lightLogo;

  // Force logo to re-render when darkMode changes
  useEffect(() => {
    setLogoKey(prev => prev + 1);
  }, [darkMode]);

  // Start flash sequence on mount
  useEffect(() => {
    startFlashSequence();
    
    return () => {
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Restart flash sequence when logo changes
  useEffect(() => {
    if (logoKey > 0) {
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      startFlashSequence();
    }
  }, [logoKey]);

  const startFlashSequence = () => {
    setFlashState('flashing');
    setFlashCount(0);
    setFlashIntensity(0);
    
    // Flash 10 times with smooth intervals (changed from 8 to 10)
    const flashSequence = () => {
      setFlashCount(prev => {
        const next = prev + 1;
        
        if (next <= 10) {
          setFlashIntensity(next);
        }
        
        if (next >= 10) {
          setFlashState('complete');
          setFlashIntensity(0);
          if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
          return next;
        }
        return next;
      });
    };
    
    flashIntervalRef.current = setInterval(flashSequence, 900); // Slightly faster for 10 times
  };

  const getFlashStyles = () => {
    if (flashState === 'idle') return {};
    
    const isActive = flashState === 'flashing' && flashCount < 10;
    const intensity = flashIntensity / 10;
    const isPeak = flashCount === 4 || flashCount === 7; // Peaks at 4th and 7th flash

    return {
      // Main Shine
      primaryShine: {
        transform: isActive ? 'translateX(250%)' : 'translateX(-250%)',
        opacity: isActive ? 0.9 + intensity * 0.2 : 0,
        transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-in-out',
      },
      // Reverse Shine
      secondaryShine: {
        transform: isActive ? 'translateX(-250%)' : 'translateX(250%)',
        opacity: isActive ? 0.7 + intensity * 0.15 : 0,
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s, opacity 0.5s ease-in-out',
      },
      // Diagonal Shine
      diagonalShine: {
        transform: isActive ? 'translateX(200%) translateY(-50%) rotate(45deg)' : 'translateX(-200%) translateY(-50%) rotate(45deg)',
        opacity: isActive && flashCount % 2 === 0 ? 0.5 : 0,
        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-in-out',
      },
      // Epic Glow
      glowPulse: {
        opacity: isActive ? 0.9 + intensity * 0.3 : 0,
        boxShadow: isPeak 
          ? '0 0 60px rgba(6, 182, 212, 0.9), 0 0 100px rgba(59, 130, 246, 0.6)'
          : '0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(59, 130, 246, 0.4)',
        transition: 'opacity 0.4s ease-in-out, box-shadow 0.5s ease-in-out',
      },
      // Edge Top
      edgeTop: {
        opacity: isActive ? 0.9 : 0,
        background: isPeak 
          ? 'linear-gradient(90deg, transparent, #06b6d4, #3b82f6, #06b6d4, transparent)'
          : 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
        transition: 'opacity 0.4s ease-in-out, background 0.3s ease-in-out',
      },
      // Edge Bottom
      edgeBottom: {
        opacity: isActive ? 0.7 : 0,
        background: isPeak 
          ? 'linear-gradient(90deg, transparent, #3b82f6, #06b6d4, #3b82f6, transparent)'
          : 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
        transition: 'opacity 0.4s ease-in-out, background 0.3s ease-in-out',
      },
    };
  };

  const styles = getFlashStyles();

  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex justify-between items-center border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar} 
          className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
        >
          <FaBars className="text-xl" />
        </button>

        {/* Logo with Shiny Effect - No Diamonds or Stars */}
        <div className="flex items-center gap-2">
          <div className="relative overflow-hidden rounded-lg" style={{ width: 'auto', minWidth: '120px' }}>
            {/* Primary Shine */}
            <div 
              className="absolute inset-0 w-[70%] bg-gradient-to-r from-transparent via-white to-transparent skew-x-12"
              style={{
                transform: styles.primaryShine?.transform,
                opacity: styles.primaryShine?.opacity,
                transition: styles.primaryShine?.transition,
              }}
            ></div>
            
            {/* Secondary Shine */}
            <div 
              className="absolute inset-0 w-[60%] bg-gradient-to-r from-transparent via-cyan-200 to-transparent -skew-x-12"
              style={{
                transform: styles.secondaryShine?.transform,
                opacity: styles.secondaryShine?.opacity,
                transition: styles.secondaryShine?.transition,
              }}
            ></div>

            {/* Diagonal Shine */}
            <div 
              className="absolute top-1/2 left-0 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-blue-300 to-transparent"
              style={{
                transform: styles.diagonalShine?.transform,
                opacity: styles.diagonalShine?.opacity,
                transition: styles.diagonalShine?.transition,
              }}
            ></div>

            {/* Glow Pulse */}
            <div 
              className="absolute inset-0 rounded-lg"
              style={{
                opacity: styles.glowPulse?.opacity,
                boxShadow: styles.glowPulse?.boxShadow,
                transition: styles.glowPulse?.transition,
              }}
            ></div>

            {/* Edge Light Lines */}
            <div 
              className="absolute top-0 left-0 w-full h-[2px]"
              style={{
                opacity: styles.edgeTop?.opacity,
                background: styles.edgeTop?.background,
                transition: styles.edgeTop?.transition,
              }}
            ></div>
            <div 
              className="absolute bottom-0 left-0 w-full h-[1.5px]"
              style={{
                opacity: styles.edgeBottom?.opacity,
                background: styles.edgeBottom?.background,
                transition: styles.edgeBottom?.transition,
              }}
            ></div>
            
            {/* Logo Image */}
            <div className="relative h-10 w-auto">
              <img
                key={logoKey}
                src={currentLogo}
                alt="Cybernaut EdTech"
                className="h-10 w-auto object-contain"
                style={{ minWidth: '100px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
          >
            <FaBell className="text-lg group-hover:animate-wiggle" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800 animate-pulse"></span>
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50 animate-slideDown">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No new notifications
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Welcome Message & Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
          >
            <div className="relative overflow-hidden rounded-full">
              <div 
                className="absolute inset-0 w-[60%] bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                style={{
                  transform: styles.primaryShine?.transform,
                  opacity: styles.primaryShine?.opacity ? 0.6 : 0,
                  transition: styles.primaryShine?.transition,
                }}
              ></div>
              
              <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-sm">
                <FaUserCircle className="text-sm" />
              </div>
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
              {userName}
            </span>
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50 animate-slideDown">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    student@lms.com
                  </p>
                </div>
                <div className="p-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 rounded-lg transition-all duration-200 group/item">
                    <FaUserCircle className="text-sm group-hover/item:text-blue-500 transition-colors" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 rounded-lg transition-all duration-200 group/item">
                    <FaCog className="text-sm group-hover/item:text-blue-500 group-hover/item:rotate-90 transition-all duration-500" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/20 dark:hover:to-rose-900/20 rounded-lg transition-all duration-200 group/item">
                    <FaBars className="text-sm group-hover/item:translate-x-1 transition-transform" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out;
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}