import React, { useState, useEffect, useRef } from "react";
import {
  FaBell,
  FaUserCircle,
  FaBars,
  FaSearch,
  FaCog,
  FaGraduationCap,
  FaRocket,
} from "react-icons/fa";
import lightLogo from "../assets/cybernautLogo.webp";
import darkLogo from "../assets/cybernautEdTechDarkLogo.webp";
import ThemeToggle from "../../../shared/ThemeToggle";

export default function Topbar({
  pageTitle = "Dashboard",
  darkMode,
  setDarkMode,
  toggleSidebar,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [flashState, setFlashState] = useState("idle"); // idle, flashing, complete
  const [flashCount, setFlashCount] = useState(0);
  const flashIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const currentLogo = darkMode ? darkLogo : lightLogo;

  // Start flash sequence on mount
  useEffect(() => {
    startFlashSequence();

    return () => {
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startFlashSequence = () => {
    setFlashState("flashing");
    setFlashCount(0);

    // Flash 8 times with smooth intervals
    const flashSequence = () => {
      setFlashCount((prev) => {
        const next = prev + 1;
        if (next >= 8) {
          setFlashState("complete");
          if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
          return next;
        }
        return next;
      });
    };

    flashIntervalRef.current = setInterval(flashSequence, 1200);
  };

  const getFlashStyles = () => {
    if (flashState === "idle") return {};

    const isActive = flashState === "flashing" && flashCount < 8;

    return {
      primaryShine: {
        transform: isActive ? "translateX(200%)" : "translateX(-200%)",
        opacity: isActive ? 0.7 : 0,
        transition:
          "transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease-in-out",
      },
      secondaryShine: {
        transform: isActive ? "translateX(-200%)" : "translateX(200%)",
        opacity: isActive ? 0.5 : 0,
        transition:
          "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s, opacity 0.8s ease-in-out",
      },
      glowPulse: {
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.5s ease-in-out",
      },
      sparkleTop: {
        opacity: isActive ? [1, 0, 1, 0, 1, 0, 1, 0][flashCount % 8] || 0 : 0,
        scale: isActive ? 1.3 : 0.8,
        transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
      },
      sparkleBottom: {
        opacity: isActive ? [0, 1, 0, 1, 0, 1, 0, 1][flashCount % 8] || 0 : 0,
        scale: isActive ? 1.3 : 0.8,
        transition: "opacity 0.3s ease-in-out 0.1s, transform 0.3s ease-in-out",
      },
    };
  };

  const styles = getFlashStyles();

  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex justify-between items-center border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      {/* Left Section - Fixed Width */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Logo Container with Fixed Size */}
          <div
            className="relative overflow-hidden rounded-lg"
            style={{ width: "auto", minWidth: "120px" }}
          >
            {/* Primary Chill Shine */}
            <div
              className="absolute inset-0 w-[60%] bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
              style={{
                transform: styles.primaryShine?.transform,
                opacity: styles.primaryShine?.opacity,
                transition: styles.primaryShine?.transition,
              }}
            ></div>

            {/* Secondary Cool Shine - Reverse */}
            <div
              className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent -skew-x-12"
              style={{
                transform: styles.secondaryShine?.transform,
                opacity: styles.secondaryShine?.opacity,
                transition: styles.secondaryShine?.transition,
              }}
            ></div>

            {/* Soft Glow Pulse */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                boxShadow:
                  "0 0 30px rgba(6, 182, 212, 0.4), 0 0 15px rgba(59, 130, 246, 0.2)",
                opacity: styles.glowPulse?.opacity,
                transition: styles.glowPulse?.transition,
              }}
            ></div>

            {/* Chill Sparkles */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-1 right-2 w-1.5 h-1.5 bg-white rounded-full blur-[0.5px]"
                style={{
                  opacity: styles.sparkleTop?.opacity,
                  transform: `scale(${styles.sparkleTop?.scale})`,
                  transition: styles.sparkleTop?.transition,
                }}
              ></div>
              <div
                className="absolute bottom-1 left-2 w-1 h-1 bg-cyan-300 rounded-full blur-[0.5px]"
                style={{
                  opacity: styles.sparkleBottom?.opacity,
                  transform: `scale(${styles.sparkleBottom?.scale})`,
                  transition: styles.sparkleBottom?.transition,
                }}
              ></div>
              {/* Additional sparkles for more visual interest */}
              <div
                className="absolute top-2 left-3 w-0.5 h-0.5 bg-blue-300 rounded-full"
                style={{
                  opacity: styles.sparkleTop?.opacity ? 0.6 : 0,
                  transition: "opacity 0.3s ease-in-out",
                }}
              ></div>
              <div
                className="absolute bottom-2 right-3 w-0.5 h-0.5 bg-cyan-200 rounded-full"
                style={{
                  opacity: styles.sparkleBottom?.opacity ? 0.6 : 0,
                  transition: "opacity 0.3s ease-in-out 0.15s",
                }}
              ></div>
            </div>

            {/* Logo Image - Fixed Size */}
            <div className="relative h-10 w-auto">
              <img
                src={currentLogo}
                alt="Cybernaut EdTech"
                className="h-10 w-auto object-contain"
                style={{ minWidth: "100px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

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

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
          >
            <div className="relative overflow-hidden rounded-full">
              <div
                className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                style={{
                  transform: styles.primaryShine?.transform,
                  opacity: styles.primaryShine?.opacity ? 0.5 : 0,
                  transition: styles.primaryShine?.transition,
                }}
              ></div>

              <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-sm">
                <FaUserCircle className="text-sm" />
              </div>
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
              Super Admin
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
                    Super Admin
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    admin@lms.com
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
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-10deg);
          }
          75% {
            transform: rotate(10deg);
          }
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
