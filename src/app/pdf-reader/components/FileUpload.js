"use client";
import React, { useRef } from 'react';

const FileUpload = ({ 
  theme, 
  pdfDocument, 
  fileName, 
  numPages, 
  readingStats, 
  formatTime, 
  recentPdfs, 
  loadPDF,
  loadBookmarks,
  loadNotes,
  getPrimaryButtonClasses 
}) => {
  const fileInputRef = useRef(null);
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }
    
    await loadPDF(file);
    loadBookmarks(file.name);
    loadNotes(file.name);
  };

  return (
    <div className={`mb-6 p-4 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 bg-opacity-40 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
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
          {readingStats.timeSpent > 0 && (
            <p className="text-sm">
              <span className="font-medium">Reading time:</span> {formatTime(readingStats.timeSpent)}
            </p>
          )}
        </div>
      )}
      
      {!pdfDocument && recentPdfs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Recent Documents:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentPdfs.map((pdf, index) => (
              <div 
                key={index} 
                className={`p-2 rounded cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                onClick={() => alert('To open a recent PDF, please upload the file again')}
              >
                <p className="text-sm font-medium truncate">{pdf.name}</p>
                <p className="text-xs opacity-70">
                  {pdf.pageCount} pages • Last opened: {new Date(pdf.lastOpened).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;