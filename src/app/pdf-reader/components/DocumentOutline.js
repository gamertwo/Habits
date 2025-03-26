"use client";
import React from 'react';

const DocumentOutline = ({ pdfOutline, jumpToPage }) => {
  return (
    <div>
      <h3 className="font-medium mb-2">Table of Contents</h3>
      <div className="max-h-48 overflow-y-auto">
        {pdfOutline.map((item, index) => (
          <div 
            key={index}
            className="my-1 p-2 rounded-md text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => item.dest && jumpToPage(item.dest[0].num)}
          >
            <span className="truncate">{item.title}</span>
            {item.dest && (
              <div className="text-xs opacity-70">
                Page {item.dest[0].num}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentOutline;