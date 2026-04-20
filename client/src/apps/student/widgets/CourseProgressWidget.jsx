import React from 'react';

function CourseProgressWidget({ progress = 60 }) {
  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center">
        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
      </div>

      {/* Enhanced progress bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div 
          className="absolute top-0 transform -translate-y-8 transition-all duration-700"
          style={{ left: `${Math.max(0, Math.min(progress - 5, 90))}%` }}
        >
          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg">
            {progress}%
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600 mx-auto"></div>
        </div>
      </div>

      {/* Progress milestones */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-4">
        <span>Beginner</span>
        <span>Intermediate</span>
        <span>Advanced</span>
        <span>Expert</span>
      </div>
    </div>
  );
}

export default CourseProgressWidget;
