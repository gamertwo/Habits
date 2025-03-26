"use client";
import React, { useRef } from 'react';
import Sidebar from './Sidebar';
import ReadingArea from './ReadingArea';
import NotesPanel from './NotesPanel';

const MainContent = ({
  theme,
  pdfDocument,
  isLoading,
  viewMode,
  pageText,
  currentLineIndex,
  fullPageText,
  fontScale,
  currentPage,
  numPages,
  autoplayEnabled,
  autoplaySpeed,
  jumpToPage,
  toggleAutoplay,
  handleSpeedChange,
  changeTextSize,
  goToNextLine,
  goToPreviousLine,
  setShowThumbnails,
  showThumbnails,
  setShowNotes,
  showNotes,
  downloadStats,
  downloadAsText,
  bookmarks,
  setShowBookmarkModal,
  goToBookmark,
  removeBookmark,
  pdfOutline,
  notes,
  currentNote,
  setCurrentNote,
  saveNote,
  deleteNote,
  getCardClasses,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses
}) => {
  const lineDisplayRef = useRef(null);
  const canvasRef = useRef(null);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Left sidebar */}
      <Sidebar
        currentPage={currentPage}
        numPages={numPages}
        autoplayEnabled={autoplayEnabled}
        autoplaySpeed={autoplaySpeed}
        fontScale={fontScale}
        showThumbnails={showThumbnails}
        showNotes={showNotes}
        bookmarks={bookmarks}
        pdfOutline={pdfOutline}
        jumpToPage={jumpToPage}
        toggleAutoplay={toggleAutoplay}
        handleSpeedChange={handleSpeedChange}
        changeTextSize={changeTextSize}
        setShowThumbnails={setShowThumbnails}
        setShowNotes={setShowNotes}
        downloadStats={downloadStats}
        downloadAsText={downloadAsText}
        setShowBookmarkModal={setShowBookmarkModal}
        goToBookmark={goToBookmark}
        removeBookmark={removeBookmark}
        getCardClasses={getCardClasses}
        getPrimaryButtonClasses={getPrimaryButtonClasses}
        getSecondaryButtonClasses={getSecondaryButtonClasses}
      />
      
      {/* Main reading area */}
      <ReadingArea 
        isLoading={isLoading}
        viewMode={viewMode}
        pageText={pageText}
        currentLineIndex={currentLineIndex}
        fullPageText={fullPageText}
        fontScale={fontScale}
        currentPage={currentPage}
        numPages={numPages}
        autoplayEnabled={autoplayEnabled}
        lineDisplayRef={lineDisplayRef}
        canvasRef={canvasRef}
        toggleAutoplay={toggleAutoplay}
        goToNextLine={goToNextLine}
        goToPreviousLine={goToPreviousLine}
        getCardClasses={getCardClasses}
        getPrimaryButtonClasses={getPrimaryButtonClasses}
        getSecondaryButtonClasses={getSecondaryButtonClasses}
      />
      
      {/* Notes panel (right sidebar) */}
      {showNotes && (
        <NotesPanel
          currentPage={currentPage}
          notes={notes}
          currentNote={currentNote}
          setCurrentNote={setCurrentNote}
          saveNote={saveNote}
          deleteNote={deleteNote}
          theme={theme}
          getCardClasses={getCardClasses}
          getPrimaryButtonClasses={getPrimaryButtonClasses}
        />
      )}
    </div>
  );
};

export default MainContent;