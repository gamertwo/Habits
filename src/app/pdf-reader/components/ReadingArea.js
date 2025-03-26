"use client";
import React from 'react';
import LineDisplay from './LineDisplay';
import LineControls from './LineControls';
import LineProgress from './LineProgress';

const ReadingArea = ({
  isLoading,
  viewMode,
  pageText,
  currentLineIndex,
  fullPageText,
  fontScale,
  currentPage,
  numPages,
  autoplayEnabled,
  lineDisplayRef,
  canvasRef,
  toggleAutoplay,
  goToNextLine,
  goToPreviousLine,
  getCardClasses,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses
}) => {
  return (
    <div className="flex-1">
      {/* Line Display Area */}
      <LineDisplay 
        isLoading={isLoading}
        viewMode={viewMode}
        pageText={pageText}
        currentLineIndex={currentLineIndex}
        fullPageText={fullPageText}
        fontScale={fontScale}
        lineDisplayRef={lineDisplayRef}
        getCardClasses={getCardClasses}
      />
      
      {/* Line Controls */}
      {viewMode === 'line' && (
        <LineControls 
          currentPage={currentPage}
          numPages={numPages}
          currentLineIndex={currentLineIndex}
          pageText={pageText}
          autoplayEnabled={autoplayEnabled}
          goToPreviousLine={goToPreviousLine}
          toggleAutoplay={toggleAutoplay}
          goToNextLine={goToNextLine}
          getPrimaryButtonClasses={getPrimaryButtonClasses}
          getSecondaryButtonClasses={getSecondaryButtonClasses}
        />
      )}
      
      {/* Line Progress */}
      {viewMode === 'line' && pageText.length > 0 && (
        <LineProgress 
          currentLineIndex={currentLineIndex}
          pageText={pageText}
          getCardClasses={getCardClasses}
        />
      )}
      
      {/* Page Canvas (to show visual reference if needed) */}
      {canvasRef.current && (
        <canvas ref={canvasRef} className="hidden" />
      )}
    </div>
  );
};

export default ReadingArea;