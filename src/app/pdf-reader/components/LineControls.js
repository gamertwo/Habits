"use client";
import React from 'react';

const LineControls = ({
  currentPage,
  numPages,
  currentLineIndex,
  pageText,
  autoplayEnabled,
  goToPreviousLine,
  toggleAutoplay,
  goToNextLine,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses
}) => {
  return (
    <div className="flex justify-center space-x-4 mb-4">
      <button
        onClick={goToPreviousLine}
        className={`px-4 py-2 rounded-md ${getSecondaryButtonClasses()}`}
        disabled={currentPage === 1 && currentLineIndex === 0}
      >
        ← Previous Line
      </button>
      <button
        onClick={toggleAutoplay}
        className={`px-4 py-2 rounded-md ${getPrimaryButtonClasses()}`}
      >
        {autoplayEnabled ? 'Pause' : 'Play'}
      </button>
      <button
        onClick={goToNextLine}
        className={`px-4 py-2 rounded-md ${getSecondaryButtonClasses()}`}
        disabled={currentPage === numPages && currentLineIndex === pageText.length - 1}
      >
        Next Line →
      </button>
    </div>
  );
};

export default LineControls;