"use client";
import React from 'react';

const PDFContainer = ({ children, backgroundClasses, cardClasses }) => {
  return (
    <div className={`min-h-screen p-6 ${backgroundClasses} transition-colors duration-300`}>
      <div className={`max-w-6xl mx-auto rounded-lg shadow-lg p-6 ${cardClasses} transition-colors duration-300`}>
        {children}
      </div>
    </div>
  );
};

export default PDFContainer;