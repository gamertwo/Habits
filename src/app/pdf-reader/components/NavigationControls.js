"use client";
import React from 'react';

const NavigationControls = ({
  currentPage,
  numPages,
  jumpToPage,
  getSecondaryButtonClasses
}) => {
  return (
    <div>
      <h3 className="font-medium mb-2">Navigation</h3>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm">Page</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => jumpToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()} disabled:opacity-50`}
            >
              ←
            </button>
            <span className="text-sm font-medium">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => jumpToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()} disabled:opacity-50`}
            >
              →
            </button>
          </div>
        </div>
        
        <input
          type="range"
          min="1"
          max={numPages}
          value={currentPage}
          onChange={(e) => jumpToPage(parseInt(e.target.value))}
          className="w-full"
        />
        
        <div className="flex justify-between">
          <button
            onClick={() => jumpToPage(1)}
            className={`px-2 py-1 text-xs rounded-md ${getSecondaryButtonClasses()}`}
          >
            First
          </button>
          <button
            onClick={() => jumpToPage(numPages)}
            className={`px-2 py-1 text-xs rounded-md ${getSecondaryButtonClasses()}`}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationControls;