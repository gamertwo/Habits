"use client";
import React, { useState, useEffect } from 'react';
import PDFContainer from './components/PDFContainer';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SearchBar from './components/SearchBar';
import MainContent from './components/MainContent';
import ThumbnailsRow from './components/ThumbnailsRow';
import StatsDisplay from './components/StatsDisplay';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import BookmarkModal from './components/BookmarkModal';
import useLocalStorage from './hooks/useLocalStorage';
import usePDFDocument from './hooks/usePDFDocument';
import * as pdfjs from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';

// Properly configure PDF.js worker - Fixed for production deployment
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFReaderPage() {
  // Theme state
  const [theme, setTheme] = useLocalStorage('pdfReaderTheme', 'dark');
  const [fontScale, setFontScale] = useLocalStorage('pdfReaderFontScale', 1);
  const [recentPdfs, setRecentPdfs] = useLocalStorage('recentPdfs', []);
  
  // PDF document state
  const {
    pdfDocument, 
    numPages, 
    currentPage,
    fileName,
    isLoading,
    pageText,
    currentLineIndex,
    fullPageText,
    readingStats,
    thumbnails,
    pdfOutline,
    loadPDF,
    jumpToPage,
    loadPageText,
    goToNextLine,
    goToPreviousLine,
    setCurrentLineIndex,
    downloadAsText,
    downloadStats,
    formatTime,
    generateThumbnails,
    renderPageThumbnail
  } = usePDFDocument(setRecentPdfs, recentPdfs);
  
  // UI state
  const [viewMode, setViewMode] = useState('line'); // line or page
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(1000);
  const [autoplayIntervalId, setAutoplayIntervalId] = useState(null);
  
  // Search state
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  // Bookmarks state
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkName, setBookmarkName] = useState('');
  
  // Notes state
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');
  
  // Utility functions for theme
  const getBackgroundClasses = () => {
    return theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
  };
  
  const getCardClasses = () => {
    return theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200';
  };
  
  const getPrimaryButtonClasses = () => {
    return theme === 'dark' 
      ? 'bg-blue-700 hover:bg-blue-600 text-white' 
      : 'bg-blue-600 hover:bg-blue-500 text-white';
  };

  const getSecondaryButtonClasses = () => {
    return theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300';
  };
  
  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    const newMode = viewMode === 'line' ? 'page' : 'line';
    setViewMode(newMode);
  };
  
  // Toggle autoplay
  const toggleAutoplay = () => {
    setAutoplayEnabled(!autoplayEnabled);
  };

  // Change autoplay speed
  const handleSpeedChange = (e) => {
    setAutoplaySpeed(parseInt(e.target.value));
  };

  // Toggle text size
  const changeTextSize = (scale) => {
    setFontScale(scale);
  };
  
  // Search functionality
  const searchInDocument = async () => {
    if (!searchText.trim() || !pdfDocument) return;
    
    setIsSearching(true);
    const results = [];
    
    try {
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        let startIndex = 0;
        let index;
        
        // Find all occurrences in this page
        while ((index = pageText.toLowerCase().indexOf(searchText.toLowerCase(), startIndex)) !== -1) {
          results.push({
            page: i,
            index: index,
            context: pageText.substr(Math.max(0, index - 40), searchText.length + 80)
          });
          startIndex = index + searchText.length;
        }
      }
      
      setSearchResults(results);
      if (results.length > 0) {
        setCurrentSearchIndex(0);
        // Jump to first result
        jumpToPage(results[0].page);
      }
    } catch (error) {
      console.error('Error searching document:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    jumpToPage(searchResults[nextIndex].page);
  };
  
  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    jumpToPage(searchResults[prevIndex].page);
  };
  
  // Bookmarks functionality
  const addBookmark = () => {
    if (!pdfDocument) return;
    
    const newBookmark = {
      id: Date.now(),
      name: bookmarkName || `Page ${currentPage}, Line ${currentLineIndex + 1}`,
      page: currentPage,
      lineIndex: currentLineIndex,
      pdfName: fileName,
      createdAt: new Date().toISOString()
    };
    
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    
    // Save to localStorage
    const allBookmarks = JSON.parse(localStorage.getItem('pdfBookmarks') || '{}');
    allBookmarks[fileName] = updatedBookmarks;
    localStorage.setItem('pdfBookmarks', JSON.stringify(allBookmarks));
    
    setBookmarkName('');
    setShowBookmarkModal(false);
  };
  
  const removeBookmark = (bookmarkId) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    setBookmarks(updatedBookmarks);
    
    // Update localStorage
    const allBookmarks = JSON.parse(localStorage.getItem('pdfBookmarks') || '{}');
    allBookmarks[fileName] = updatedBookmarks;
    localStorage.setItem('pdfBookmarks', JSON.stringify(allBookmarks));
  };
  
  const loadBookmarks = (pdfName) => {
    const allBookmarks = JSON.parse(localStorage.getItem('pdfBookmarks') || '{}');
    const pdfBookmarks = allBookmarks[pdfName] || [];
    setBookmarks(pdfBookmarks);
  };
  
  const goToBookmark = (bookmark) => {
    jumpToPage(bookmark.page);
    // We need to wait for the page to load before setting line index
    setTimeout(() => {
      setCurrentLineIndex(bookmark.lineIndex);
    }, 500);
  };
  
  // Notes functionality
  const saveNote = () => {
    if (!currentNote.trim() || !pdfDocument) return;
    
    const pageNotes = {...notes};
    if (!pageNotes[currentPage]) {
      pageNotes[currentPage] = [];
    }
    
    const newNote = {
      id: Date.now(),
      text: currentNote,
      lineIndex: currentLineIndex,
      createdAt: new Date().toISOString()
    };
    
    pageNotes[currentPage].push(newNote);
    setNotes(pageNotes);
    setCurrentNote('');
    
    // Save to localStorage
    const allNotes = JSON.parse(localStorage.getItem('pdfNotes') || '{}');
    if (!allNotes[fileName]) {
      allNotes[fileName] = {};
    }
    allNotes[fileName] = pageNotes;
    localStorage.setItem('pdfNotes', JSON.stringify(allNotes));
  };
  
  const deleteNote = (noteId) => {
    const pageNotes = {...notes};
    if (!pageNotes[currentPage]) return;
    
    pageNotes[currentPage] = pageNotes[currentPage].filter(note => note.id !== noteId);
    setNotes(pageNotes);
    
    // Update localStorage
    const allNotes = JSON.parse(localStorage.getItem('pdfNotes') || '{}');
    if (allNotes[fileName]) {
      allNotes[fileName] = pageNotes;
      localStorage.setItem('pdfNotes', JSON.stringify(allNotes));
    }
  };
  
  const loadNotes = (pdfName) => {
    const allNotes = JSON.parse(localStorage.getItem('pdfNotes') || '{}');
    const pdfNotes = allNotes[pdfName] || {};
    setNotes(pdfNotes);
  };
  
  // Autoplay functionality
  useEffect(() => {
    if (autoplayEnabled) {
      const interval = setInterval(() => {
        goToNextLine();
      }, autoplaySpeed);
      setAutoplayIntervalId(interval);
      
      return () => clearInterval(interval);
    } else if (autoplayIntervalId) {
      clearInterval(autoplayIntervalId);
      setAutoplayIntervalId(null);
    }
  }, [autoplayEnabled, autoplaySpeed, currentLineIndex, currentPage, pageText]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        goToNextLine();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousLine();
      } else if (e.key === ' ') {
        toggleAutoplay();
        e.preventDefault();
      } else if (e.key === 'b' && e.ctrlKey) {
        // Ctrl+B to add bookmark
        setShowBookmarkModal(true);
        e.preventDefault();
      } else if (e.key === 'f' && e.ctrlKey) {
        // Ctrl+F to focus search
        document.getElementById('search-input')?.focus();
        e.preventDefault();
      } else if (e.key === 'n' && e.ctrlKey) {
        // Ctrl+N to toggle notes
        setShowNotes(!showNotes);
        e.preventDefault();
      } else if (e.key === 't' && e.ctrlKey) {
        // Ctrl+T to toggle theme
        toggleTheme();
        e.preventDefault();
      } else if (e.key === 'v' && e.ctrlKey) {
        // Ctrl+V to toggle view mode
        toggleViewMode();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLineIndex, currentPage, pageText, showNotes, theme, viewMode]);
  
  return (
    <PDFContainer 
      backgroundClasses={getBackgroundClasses()}
      cardClasses={getCardClasses()}
    >
      <Header 
        title="Enhanced PDF Line Reader"
        toggleTheme={toggleTheme}
        toggleViewMode={toggleViewMode}
        viewMode={viewMode}
        theme={theme}
        getSecondaryButtonClasses={getSecondaryButtonClasses}
      />
      
      <FileUpload 
        theme={theme}
        pdfDocument={pdfDocument}
        fileName={fileName}
        numPages={numPages}
        readingStats={readingStats}
        formatTime={formatTime}
        recentPdfs={recentPdfs}
        loadPDF={loadPDF}
        loadBookmarks={loadBookmarks}
        loadNotes={loadNotes}
        getPrimaryButtonClasses={getPrimaryButtonClasses}
      />
      
      {pdfDocument && (
        <SearchBar 
          theme={theme}
          searchText={searchText}
          setSearchText={setSearchText}
          searchInDocument={searchInDocument}
          isSearching={isSearching}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          goToNextSearchResult={goToNextSearchResult}
          goToPrevSearchResult={goToPrevSearchResult}
          getPrimaryButtonClasses={getPrimaryButtonClasses}
          getSecondaryButtonClasses={getSecondaryButtonClasses}
        />
      )}
      
      {pdfDocument && (
        <MainContent 
          theme={theme}
          pdfDocument={pdfDocument}
          isLoading={isLoading}
          viewMode={viewMode}
          pageText={pageText}
          currentLineIndex={currentLineIndex}
          fullPageText={fullPageText}
          fontScale={fontScale}
          currentPage={currentPage}
          numPages={numPages}
          autoplayEnabled={autoplayEnabled}
          autoplaySpeed={autoplaySpeed}
          jumpToPage={jumpToPage}
          toggleAutoplay={toggleAutoplay}
          handleSpeedChange={handleSpeedChange}
          changeTextSize={changeTextSize}
          goToNextLine={goToNextLine}
          goToPreviousLine={goToPreviousLine}
          setShowThumbnails={setShowThumbnails}
          showThumbnails={showThumbnails}
          setShowNotes={setShowNotes}
          showNotes={showNotes}
          downloadStats={downloadStats}
          downloadAsText={downloadAsText}
          bookmarks={bookmarks}
          setShowBookmarkModal={setShowBookmarkModal}
          goToBookmark={goToBookmark}
          removeBookmark={removeBookmark}
          pdfOutline={pdfOutline}
          notes={notes}
          currentNote={currentNote}
          setCurrentNote={setCurrentNote}
          saveNote={saveNote}
          deleteNote={deleteNote}
          getCardClasses={getCardClasses}
          getPrimaryButtonClasses={getPrimaryButtonClasses}
          getSecondaryButtonClasses={getSecondaryButtonClasses}
        />
      )}
      
      {showThumbnails && thumbnails.length > 0 && (
        <ThumbnailsRow 
          thumbnails={thumbnails}
          currentPage={currentPage}
          theme={theme}
          jumpToPage={jumpToPage}
          getCardClasses={getCardClasses}
        />
      )}
      
      {pdfDocument && (
        <StatsDisplay 
          readingStats={readingStats}
          numPages={numPages}
          bookmarks={bookmarks}
          formatTime={formatTime}
          getCardClasses={getCardClasses}
        />
      )}
      
      <KeyboardShortcutsHelp 
        getCardClasses={getCardClasses}
      />
      
      {showBookmarkModal && (
        <BookmarkModal 
          theme={theme}
          bookmarkName={bookmarkName}
          setBookmarkName={setBookmarkName}
          currentPage={currentPage}
          currentLineIndex={currentLineIndex}
          addBookmark={addBookmark}
          setShowBookmarkModal={setShowBookmarkModal}
          getCardClasses={getCardClasses}
          getPrimaryButtonClasses={getPrimaryButtonClasses}
          getSecondaryButtonClasses={getSecondaryButtonClasses}
        />
      )}
    </PDFContainer>
  );
}