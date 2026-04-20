import React from "react";
import {
  FaCalendarAlt,
  FaArrowRight,
  FaBookOpen,
  FaFire,
} from "react-icons/fa";

/**
 * Utility: Format date safely
 */
const formatDate = (date) => {
  if (!date) return "Starting soon";

  const parsed = new Date(date);
  if (isNaN(parsed)) return "Invalid date";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * CourseCard Component
 */
function CourseCard({
  image,
  name,
  startDate,
  batch,
  onClick,
}) {
  // Determine course status
  const isActive = startDate && new Date(startDate) <= new Date();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 cursor-pointer transform hover:-translate-y-2"
    >
      {/* Image Section */}
      <div className="relative overflow-hidden h-48">
        <img
          src={image || "/Course.webp"} // fallback if no image
          alt={name || "Course Image"}
          loading="lazy"
          onError={(e) => {
            e.target.src = "/default-course.jpg"; // fallback if broken
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${
              isActive
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-yellow-500 to-orange-500"
            }`}
          >
            <FaFire size={10} />
            <span>{isActive ? "Active" : "Upcoming"}</span>
          </div>
        </div>

        {/* Batch Badge */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 dark:text-white shadow-md">
            <FaBookOpen size={10} />
            <span>{batch || "Batch"}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300">
          {name?.trim() || "Untitled Course"}
        </h3>

        <div className="space-y-2 mb-4">
          {/* Date - Only */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FaCalendarAlt size={10} className="text-blue-500" />
            </div>
            <span>{formatDate(startDate)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent parent click
            onClick?.();
          }}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg group/btn"
        >
          <span>Access Lesson Plan</span>
          <FaArrowRight
            size={14}
            className="group-hover/btn:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}

// Prevent unnecessary re-renders
export default React.memo(CourseCard);