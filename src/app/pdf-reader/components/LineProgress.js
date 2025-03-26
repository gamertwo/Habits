"use client";
import React from 'react';

const LineProgress = ({
  currentLineIndex,
  pageText,
  getCardClasses
}) => {
  return (
    <div className={`${getCardClasses()} rounded-lg p-4 mb-4`}>
      <div className="flex justify-between items-center text-sm mb-2">
        <span>Line Progress</span>
        <span>{currentLineIndex + 1} / {pageText.length}</span>
      </div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${((currentLineIndex + 1) / pageText.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LineProgress;