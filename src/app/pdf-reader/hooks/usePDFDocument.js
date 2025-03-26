"use client";
import { useState, useRef, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';

const usePDFDocument = (setRecentPdfs, recentPdfs) => {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageText, setPageText] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fullPageText, setFullPageText] = useState('');
  const [readingStats, setReadingStats] = useState({ pagesRead: 0, linesRead: 0, timeSpent: 0 });
  const [thumbnails, setThumbnails] = useState([]);
  const [pdfOutline, setPdfOutline] = useState([]);
  
  const timerRef = useRef(null);

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
      
      // Also extract full page text for page view mode
      const fullText = lines.join('\n\n');
      setFullPageText(fullText);
      
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
      
      // Update reading stats
      setReadingStats(prev => ({
        ...prev,
        pagesRead: [...new Set([...prev.pagesRead.split(','), pageNum].filter(Boolean))].join(',')
      }));
      
      // Render page thumbnail
      renderPageThumbnail(pageNum);

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
      
      // Update reading stats
      setReadingStats(prev => ({
        ...prev,
        linesRead: prev.linesRead + 1
      }));
    } else if (currentPage < numPages) {
      // Reached the end of the page, move to the next page
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const nextPageLines = await extractPageText(nextPage);
      setPageText(nextPageLines);
      setCurrentLineIndex(0);
      setCurrentPage(nextPage);
      
      // Update reading stats
      setReadingStats(prev => ({
        ...prev,
        pagesRead: [...new Set([...prev.pagesRead.split(','), nextPage].filter(Boolean))].join(','),
        linesRead: prev.linesRead + 1
      }));
      
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

  // Load PDF file
  const loadPDF = async (file) => {
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
        
        // Reset and start new reading session stats
        setReadingStats({
          pagesRead: '1',
          linesRead: 0,
          timeSpent: 0,
          startTime: new Date().getTime()
        });
        
        // Start timer for reading time tracking
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setReadingStats(prev => ({
            ...prev,
            timeSpent: Math.floor((new Date().getTime() - prev.startTime) / 1000)
          }));
        }, 1000);
        
        // Add to recent PDFs
        const newRecentPdf = {
          name: file.name,
          lastOpened: new Date().toISOString(),
          pageCount: pdf.numPages
        };
        
        const updatedRecentPdfs = [
          newRecentPdf,
          ...recentPdfs.filter(p => p.name !== file.name).slice(0, 4)
        ];
        
        setRecentPdfs(updatedRecentPdfs);
        
        // Load document outline/table of contents if available
        try {
          const outline = await pdf.getOutline();
          if (outline && outline.length > 0) {
            setPdfOutline(outline);
          }
        } catch (error) {
          console.log('No outline available or error loading outline');
        }
        
        // Generate thumbnails
        generateThumbnails(pdf);
        
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

  // Thumbnail generation
  const generateThumbnails = async (pdf) => {
    const thumbs = [];
    const totalPages = Math.min(pdf.numPages, 20); // Limit to first 20 pages for performance
    
    for (let i = 1; i <= totalPages; i++) {
      try {
        const thumb = await renderPageThumbnail(i);
        thumbs.push({ page: i, src: thumb });
      } catch (error) {
        console.error(`Error generating thumbnail for page ${i}:`, error);
      }
    }
    
    setThumbnails(thumbs);
  };
  
  const renderPageThumbnail = async (pageNum) => {
    if (!pdfDocument) return null;
    
    try {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnails
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.5);
      return thumbnail;
    } catch (error) {
      console.error(`Error rendering thumbnail for page ${pageNum}:`, error);
      return null;
    }
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

  // Download reading stats as JSON
  const downloadStats = () => {
    if (!pdfDocument) return;
    
    const stats = {
      fileName,
      numPages,
      pagesRead: readingStats.pagesRead.split(',').filter(Boolean).length,
      linesRead: readingStats.linesRead,
      timeSpentSeconds: readingStats.timeSpent,
      timeSpentFormatted: formatTime(readingStats.timeSpent),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.pdf', '')}_reading_stats.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
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
  };
};

export default usePDFDocument;