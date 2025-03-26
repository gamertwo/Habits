"use client";
import React from 'react';

const ReadingSettings = ({
  autoplayEnabled,
  autoplaySpeed,
  fontScale,
  showThumbnails,
  showNotes,
  toggleAutoplay,
  handleSpeedChange,
  changeTextSize,
  setShowThumbnails,
  setShowNotes,
  downloadStats,
  downloadAsText,
  getSecondaryButtonClasses
}) => {
  return (
    <div>
      <h3 className="font-medium mb-2">Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoplayEnabled}
              onChange={toggleAutoplay}
              className="mr-2"
            />
            <span className="text-sm">Auto-advance</span>
          </label>
          
          {autoplayEnabled && (
            <div className="mt-2">
              <label className="text-sm block mb-1">Speed (ms)</label>
              <input
                type="range"
                min="300"
                max="5000"
                step="100"
                value={autoplaySpeed}
                onChange={handleSpeedChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs">
                <span>Fast</span>
                <span>{autoplaySpeed}ms</span>
                <span>Slow</span>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <label className="text-sm block mb-1">Text Size</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeTextSize(Math.max(0.8, fontScale - 0.2))}
              className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()}`}
            >
              A-
            </button>
            <input
              type="range"
              min="0.8"
              max="2"
              step="0.1"
              value={fontScale}
              onChange={(e) => changeTextSize(parseFloat(e.target.value))}
              className="w-full"
            />
            <button
              onClick={() => changeTextSize(Math.min(2, fontScale + 0.2))}
              className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()}`}
            >
              A+
            </button>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`px-2 py-1 text-sm rounded-md ${getSecondaryButtonClasses()}`}
          >
            {showThumbnails ? 'Hide Thumbnails' : 'Show Thumbnails'}
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2 py-1 text-sm rounded-md ${getSecondaryButtonClasses()}`}
          >
            {showNotes ? 'Hide Notes' : 'Show Notes'}
          </button>
          <button
            onClick={downloadStats}
            className={`px-2 py-1 text-sm rounded-md ${getSecondaryButtonClasses()}`}
          >
            Export Stats
          </button>
          <button
            onClick={downloadAsText}
            className={`px-2 py-1 text-sm rounded-md ${getSecondaryButtonClasses()}`}
          >
            Download Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadingSettings;