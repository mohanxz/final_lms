import React, { useState, useCallback } from "react";
import {
  FaCalendarAlt,
  FaArrowRight,
  FaBookOpen,
  FaFire,
  FaUsers,
  FaCheckCircle,
  FaStar,
  FaGraduationCap,
  FaClock,
  FaMapMarkerAlt,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";

/**
 * Utility: Format date safely with fallback
 */
const formatDate = (date) => {
  if (!date) return "Starting soon";

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Utility: Calculate days remaining or days since start
 */
const getDaysInfo = (startDate) => {
  if (!startDate) return null;

  const now = new Date();
  const start = new Date(startDate);
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { text: `${diffDays} days to start`, isUpcoming: true };
  } else if (diffDays === 0) {
    return { text: "Starts today!", isUpcoming: false };
  } else {
    return { text: `${Math.abs(diffDays)} days running`, isUpcoming: false };
  }
};

/**
 * Utility: Truncate text with ellipsis
 */
const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * CourseCard Component - Production Ready
 */
function CourseCard({
  image,
  name,
  startDate,
  batch,
  batchId,
  onClick,
  studentsCount,
  instructor,
  location,
  progress,
  isCompleted,
  className = "",
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = startDate && new Date(startDate) <= new Date();
  const daysInfo = getDaysInfo(startDate);
  const courseName = name?.trim() || "Untitled Course";
  const courseImage = imageError ? "/default-course.jpg" : image || "/Course.webp";

  // Handlers
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    },
    [onClick]
  );

  const handleActionClick = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick?.();
    },
    [onClick]
  );

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hover: { scale: 1.1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
      transition: { duration: 0.2 } 
    },
    tap: { scale: 0.98 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Course: ${courseName}, Batch: ${batch}`}
      onKeyDown={handleKeyDown}
      className={`group relative bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:ring-blue-400/30 transition-shadow ${className}`}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden h-48 sm:h-52">
        {/* Skeleton Loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Course Image */}
        <motion.img
          src={courseImage}
          alt={courseName}
          loading="lazy"
          variants={imageVariants}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Type Badge */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-lg backdrop-blur-sm ${
              isCompleted
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : isActive
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gradient-to-r from-amber-500 to-orange-600"
            }`}
          >
            {isCompleted ? (
              <FaCheckCircle size={10} />
            ) : isActive ? (
              <FaFire size={10} />
            ) : (
              <FaClock size={10} />
            )}
            <span>
              {isCompleted ? "Completed" : isActive ? "Active" : "Upcoming"}
            </span>
          </motion.div>

          {/* Students Count Badge */}
          {studentsCount !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 dark:text-white shadow-md"
            >
              <FaUsers size={10} className="text-blue-500" />
              <span>{studentsCount}</span>
            </motion.div>
          )}
        </div>

        {/* Bottom Overlay Info */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          {/* Batch Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-lg"
          >
            <FaBookOpen size={10} className="text-blue-500" />
            <span>{batch || "Batch"}</span>
          </motion.div>

          {/* Progress Indicator */}
          {progress !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full text-xs font-semibold shadow-lg"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
              </div>
              <span className="text-blue-600 dark:text-cyan-400">{progress}%</span>
            </motion.div>
          )}
        </div>

        {/* Days Info Badge */}
        {daysInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-1/2 right-3 transform -translate-y-1/2"
          >
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm shadow-lg ${
              daysInfo.isUpcoming
                ? "bg-amber-500/90 text-white"
                : "bg-green-500/90 text-white"
            }`}>
              {daysInfo.text}
            </div>
          </motion.div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <motion.h3
          layout
          className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300"
          title={courseName}
        >
          {courseName}
        </motion.h3>

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <FaRegCalendarAlt size={10} className="text-blue-500 dark:text-cyan-400" />
            </div>
            <span className="truncate">{formatDate(startDate)}</span>
          </div>

          {/* Instructor (if provided) */}
          {instructor && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <FaGraduationCap size={10} className="text-purple-500 dark:text-purple-400" />
              </div>
              <span className="truncate">{instructor}</span>
            </div>
          )}

          {/* Location (if provided) */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <FaMapMarkerAlt size={10} className="text-green-500 dark:text-green-400" />
              </div>
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={handleActionClick}
          aria-label={isCompleted ? "View Completed Course" : isActive ? "Access Active Course" : "View Upcoming Course"}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <span>
            {isCompleted 
              ? "View Details" 
              : isActive 
              ? "Access Lesson Plan" 
              : "View Course"}
          </span>
          <motion.div
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaArrowRight size={14} />
          </motion.div>
        </motion.button>

        {/* Completed Star Badge */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-1 -right-1"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 shadow-lg">
              <FaStar size={14} className="text-white" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Memoize for performance
export default React.memo(CourseCard);

// Also export as named export for flexibility
export { CourseCard };