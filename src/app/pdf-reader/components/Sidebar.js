"use client";
import React from 'react';
import NavigationControls from './NavigationControls';
import BookmarksList from './BookmarksList';
import DocumentOutline from './DocumentOutline';
import ReadingSettings from './ReadingSettings';

const Sidebar = ({
  currentPage,
  numPages,
  autoplayEnabled,
  autoplaySpeed,
  fontScale,
  showThumbnails,
  showNotes,
  bookmarks,
  pdfOutline,
  jumpToPage,
  toggleAutoplay,
  handleSpeedChange,
  changeTextSize,
  setShowThumbnails,
  setShowNotes,
  downloadStats,
  downloadAsText,
  setShowBookmarkModal,
  goToBookmark,
  removeBookmark,
  getCardClasses,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses
}) => {
  return (
    <div className={`w-full md:w-64 flex-shrink-0 ${getCardClasses()} rounded-lg p-4 mb-4 md:mb-0`}>
      <div className="space-y-4">
        {/* Navigation Controls */}
        <NavigationControls 
          currentPage={currentPage}
          numPages={numPages}
          jumpToPage={jumpToPage}
          getSecondaryButtonClasses={getSecondaryButtonClasses}
        />
        
        {/* Bookmarks */}
        <BookmarksList 
          bookmarks={bookmarks}
          setShowBookmarkModal={setShowBookmarkModal}
          goToBookmark={goToBookmark}
          removeBookmark={removeBookmark}
          getPrimaryButtonClasses={getPrimaryButtonClasses}
          getSecondaryButtonClasses={getSecondaryButtonClasses}
        />
        
        {/* Document Outline */}
        {pdfOutline && pdfOutline.length > 0 && (
          <DocumentOutline 
            pdfOutline={pdfOutline}
            jumpToPage={jumpToPage}
          />
        )}
        
        {/* Reading Settings */}
        <ReadingSettings 
          autoplayEnabled={autoplayEnabled}
          autoplaySpeed={autoplaySpeed}
          fontScale={fontScale}
          showThumbnails={showThumbnails}
          showNotes={showNotes}
          toggleAutoplay={toggleAutoplay}
          handleSpeedChange={handleSpeedChange}
          changeTextSize={changeTextSize}
          setShowThumbnails={setShowThumbnails}
          setShowNotes={setShowNotes}
          downloadStats={downloadStats}
          downloadAsText={downloadAsText}
          getSecondaryButtonClasses={getSecondaryButtonClasses}
        />
      </div>
    </div>
  );
};

export default Sidebar;