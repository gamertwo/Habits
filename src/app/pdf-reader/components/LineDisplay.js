"use client";
import React from 'react';

const LineDisplay = ({
  isLoading,
  viewMode,
  pageText,
  currentLineIndex,
  fullPageText,
  fontScale,
  lineDisplayRef,
  getCardClasses
}) => {
  return (
    <div 
      className={`${getCardClasses()} rounded-lg shadow-sm mb-4 overflow-hidden`}
      ref={lineDisplayRef}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-t-transparent border-blue-500 rounded-full mb-2"></div>
            <p className="text-sm">Loading content...</p>
          </div>
        </div>
      ) : viewMode === 'line' ? (
        <div 
          className={`p-6 min-h-64 flex items-center justify-center text-center`}
          style={{ fontSize: `${1.5 * fontScale}rem` }}
        >
          {pageText.length > 0 && currentLineIndex < pageText.length ? (
            <p>{pageText[currentLineIndex]}</p>
          ) : (
            <p className="opacity-70">[No text content on this page]</p>
          )}
        </div>
      ) : (
        <div 
          className={`p-6 min-h-64 max-h-[calc(100vh-400px)] overflow-y-auto whitespace-pre-line`}
          style={{ fontSize: `${1 * fontScale}rem` }}
        >
          {fullPageText || '[No text content on this page]'}
        </div>
      )}
    </div>
  );
};

export default LineDisplay;