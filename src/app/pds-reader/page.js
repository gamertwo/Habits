// pages/pdf-reader.js
"use client";
import React, { useState, useRef, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';

// Ensure the PDF.js worker is properly set up
const pdfjsVersion = '3.4.120';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

export default function PDFReader() {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageText, setPageText] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(1000); // Faster default speed - 1 second
  const [autoplayIntervalId, setAutoplayIntervalId] = useState(null);
  const [fontScale, setFontScale] = useState(1);
  const fileInputRef = useRef(null);
  const lineDisplayRef = useRef(null);

  // Enhanced text extraction with better positioning information
  const extractPageText = async (pageNum) => {
    if (!pdfDocument || pageNum < 1 || pageNum > numPages) return [];
    
    try {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Sort text items by their vertical position first, then by horizontal position
      const items = [...textContent.items];
      
      // Group items by lines based on y-position (with a tolerance for small differences)
      const yPositionGroups = {};
      const tolerance = 5; // pixels tolerance for considering items on the same line
      
      items.forEach(item => {
        const y = Math.round(viewport.height - item.transform[5] / tolerance) * tolerance;
        if (!yPositionGroups[y]) {
          yPositionGroups[y] = [];
        }
        yPositionGroups[y].push(item);
      });
      
      // Sort each group by x-position and concatenate the text
      const lines = Object.keys(yPositionGroups)
        .sort((a, b) => a - b) // Sort lines by y-position (top to bottom)
        .map(y => {
          const lineItems = yPositionGroups[y].sort((a, b) => a.transform[4] - b.transform[4]);
          // Join items with appropriate spacing based on positions
          let lineText = '';
          let lastEndX = 0;
          
          lineItems.forEach((item, idx) => {
            const itemStartX = item.transform[4];
            if (idx > 0 && itemStartX - lastEndX > 10) {
              // Add space if there's a gap between items
              lineText += ' ';
            }
            lineText += item.str;
            lastEndX = itemStartX + (item.width || 0);
          });
          
          return lineText.trim();
        })
        .filter(line => line.length > 0); // Remove empty lines
      
      return lines;
    } catch (error) {
      console.error(`Error extracting text from page ${pageNum}:`, error);
      return [];
    }
  };

  // Load page text and manage state
  const loadPageText = async (pageNum) => {
    if (!pdfDocument || pageNum < 1 || pageNum > numPages) return;
    
    setIsLoading(true);
    try {
      const lines = await extractPageText(pageNum);
      setPageText(lines);
      setCurrentLineIndex(0);
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Error loading page text:', error);
      alert('Error extracting text from this page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle line navigation with auto-progression to next page
  const goToNextLine = async () => {
    if (currentLineIndex < pageText.length - 1) {
      // Move to next line on current page
      setCurrentLineIndex(currentLineIndex + 1);
    } else if (currentPage < numPages) {
      // Reached the end of the page, move to the next page
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const nextPageLines = await extractPageText(nextPage);
      setPageText(nextPageLines);
      setCurrentLineIndex(0);
      setCurrentPage(nextPage);
      setIsLoading(false);
    }
  };

  const goToPreviousLine = async () => {
    if (currentLineIndex > 0) {
      // Move to previous line on current page
      setCurrentLineIndex(currentLineIndex - 1);
    } else if (currentPage > 1) {
      // Reached the start of the page, move to the previous page
      setIsLoading(true);
      const prevPage = currentPage - 1;
      const prevPageLines = await extractPageText(prevPage);
      setPageText(prevPageLines);
      setCurrentLineIndex(Math.max(0, prevPageLines.length - 1));
      setCurrentPage(prevPage);
      setIsLoading(false);
    }
  };

  // Handle PDF upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    
    try {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        const typedArray = new Uint8Array(this.result);
        const loadingTask = pdfjs.getDocument(typedArray);
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        
        // Automatically load the first page
        const firstPageLines = await extractPageText(1);
        setPageText(firstPageLines);
        setCurrentPage(1);
        setCurrentLineIndex(0);
        
        setIsLoading(false);
      };
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
      alert('Error loading PDF. Please try again.');
    }
  };

  // Jump to specific page
  const jumpToPage = async (pageNum) => {
    if (!pdfDocument || pageNum < 1 || pageNum > numPages) return;
    
    setIsLoading(true);
    try {
      await loadPageText(pageNum);
    } finally {
      setIsLoading(false);
    }
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

  // Function to download current text as TXT
  const downloadAsText = () => {
    if (!pdfDocument || pageText.length === 0) return;
    
    const textContent = pageText.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.pdf', '')}_page${currentPage}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get button classes
  const getPrimaryButtonClasses = () => {
    return 'bg-blue-700 hover:bg-blue-600 text-white';
  };

  const getSecondaryButtonClasses = () => {
    return 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600';
  };

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLineIndex, currentPage, pageText]);

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto rounded-lg shadow-lg p-6 bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">PDF Line Reader</h1>
        </div>
        
        {/* File Upload Section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-700 bg-opacity-40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <label className="block text-sm font-medium mb-2">Upload PDF Document</label>
            <div className="flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className={`px-4 py-2 rounded-md ${getPrimaryButtonClasses()} mr-2`}
              >
                Select PDF
              </button>
            </div>
          </div>
          
          {pdfDocument && (
            <div className="mt-3">
              <p className="text-sm">
                <span className="font-medium">File:</span> {fileName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Pages:</span> {numPages}
              </p>
            </div>
          )}
        </div>
        
        {/* Navigation Controls */}
        {pdfDocument && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-gray-700 bg-opacity-40">
              <h3 className="font-medium mb-3">Page Navigation</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => jumpToPage(1)}
                  disabled={currentPage === 1 || isLoading}
                  className={`px-3 py-1 rounded-md ${getSecondaryButtonClasses()} disabled:opacity-50`}
                >
                  First
                </button>
                <button
                  onClick={() => jumpToPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className={`px-3 py-1 rounded-md ${getSecondaryButtonClasses()} disabled:opacity-50`}
                >
                  Prev Page
                </button>
                <div className="flex items-center mx-2">
                  <input
                    type="number"
                    min="1"
                    max={numPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page > 0 && page <= numPages) {
                        jumpToPage(page);
                      }
                    }}
                    className="w-16 px-2 py-1 border rounded-md text-center bg-gray-700 border-gray-600"
                  />
                  <span className="mx-1">/ {numPages}</span>
                </div>
                <button
                  onClick={() => jumpToPage(currentPage + 1)}
                  disabled={currentPage === numPages || isLoading}
                  className={`px-3 py-1 rounded-md ${getSecondaryButtonClasses()} disabled:opacity-50`}
                >
                  Next Page
                </button>
                <button
                  onClick={() => jumpToPage(numPages)}
                  disabled={currentPage === numPages || isLoading}
                  className={`px-3 py-1 rounded-md ${getSecondaryButtonClasses()} disabled:opacity-50`}
                >
                  Last
                </button>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-700 bg-opacity-40">
              <h3 className="font-medium mb-3">Reading Options</h3>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Autoplay:</span>
                  <button
                    onClick={toggleAutoplay}
                    className={`px-3 py-1 rounded-md ${autoplayEnabled ? 'bg-green-600 hover:bg-green-700 text-white' : getSecondaryButtonClasses()}`}
                  >
                    {autoplayEnabled ? 'Pause' : 'Play'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Speed:</span>
                  <div className="flex items-center w-2/3">
                    <span className="text-xs mr-2">Fast</span>
                    <input
                      type="range"
                      min="200"  // Faster minimum speed (200ms)
                      max="2000" // Lower maximum for faster speed overall
                      step="100"
                      value={autoplaySpeed}
                      onChange={handleSpeedChange}
                      className="w-full"
                    />
                    <span className="text-xs ml-2">Slow</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Text Size:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => changeTextSize(Math.max(0.8, fontScale - 0.2))}
                      className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()}`}
                    >
                      A-
                    </button>
                    <button
                      onClick={() => changeTextSize(1)}
                      className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()}`}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => changeTextSize(Math.min(2, fontScale + 0.2))}
                      className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()}`}
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Text Display Section */}
        {pdfDocument && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <div className="flex items-center">
                <span className="mr-2">Line:</span>
                <span className="font-medium">{currentLineIndex + 1}</span>
                <span className="mx-1">of</span>
                <span className="font-medium">{pageText.length}</span>
              </div>
              
              <div className="flex items-center">
                <span className="mr-2">Page:</span>
                <span className="font-medium">{currentPage}</span>
                <span className="mx-1">of</span>
                <span className="font-medium">{numPages}</span>
              </div>
            </div>
            
            {/* Line navigation controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={goToPreviousLine}
                  disabled={currentPage === 1 && currentLineIndex === 0}
                  className={`px-4 py-2 rounded-md ${getPrimaryButtonClasses()} disabled:opacity-50 mr-2`}
                >
                  ← Previous Line
                </button>
                <button
                  onClick={goToNextLine}
                  disabled={currentPage === numPages && currentLineIndex === pageText.length - 1}
                  className={`px-4 py-2 rounded-md ${getPrimaryButtonClasses()} disabled:opacity-50`}
                >
                  Next Line →
                </button>
              </div>
              
              <button
                onClick={downloadAsText}
                disabled={pageText.length === 0}
                className={`px-3 py-1 rounded-md ${getSecondaryButtonClasses()} disabled:opacity-50`}
              >
                Download Text
              </button>
            </div>
            
            {/* Current line display */}
            <div 
              ref={lineDisplayRef}
              className="p-6 border rounded-lg min-h-16 flex items-center justify-center bg-gray-700 border-gray-600"
              style={{
                fontSize: `${Math.max(1, 1.2 * fontScale)}rem`,
                lineHeight: '1.6'
              }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p>Loading content...</p>
                </div>
              ) : pageText.length > 0 ? (
                <p className="text-center">{pageText[currentLineIndex]}</p>
              ) : (
                <p className="text-center text-gray-500">No text content found on this page</p>
              )}
            </div>
            
            {/* Keyboard shortcuts info */}
            <div className="mt-4 text-sm text-center text-gray-400">
              <p>Keyboard shortcuts: <span className="font-medium">← →</span> arrows to navigate, <span className="font-medium">Space</span> to toggle autoplay</p>
            </div>
          </div>
        )}
        
        {/* Initial instructions */}
        {!pdfDocument && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 2v5a2 2 0 002 2h5" />
            </svg>
            <h2 className="text-xl font-medium mb-2">Upload a PDF to get started</h2>
            <p className="text-gray-400 max-w-md">
              Upload a PDF document to read it line by line. Navigate using arrow keys or buttons.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}