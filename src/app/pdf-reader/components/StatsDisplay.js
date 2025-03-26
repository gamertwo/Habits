"use client";
import React from 'react';

const StatsDisplay = ({
  readingStats,
  numPages,
  bookmarks,
  formatTime,
  getCardClasses
}) => {
  return (
    <div className={`mt-6 ${getCardClasses()} rounded-lg p-4`}>
      <h3 className="font-medium mb-2">Reading Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xs uppercase opacity-70">Pages Read</p>
          <p className="text-xl font-bold">
            {readingStats.pagesRead.split(',').filter(Boolean).length} / {numPages}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase opacity-70">Lines Read</p>
          <p className="text-xl font-bold">{readingStats.linesRead}</p>
        </div>
        <div>
          <p className="text-xs uppercase opacity-70">Time Spent</p>
          <p className="text-xl font-bold">{formatTime(readingStats.timeSpent)}</p>
        </div>
        <div>
          <p className="text-xs uppercase opacity-70">Bookmarks</p>
          <p className="text-xl font-bold">{bookmarks.length}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;