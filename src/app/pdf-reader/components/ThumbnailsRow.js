"use client";
import React from 'react';

const ThumbnailsRow = ({
  thumbnails,
  currentPage,
  theme,
  jumpToPage,
  getCardClasses
}) => {
  return (
    <div className={`mt-6 ${getCardClasses()} rounded-lg p-4`}>
      <h3 className="font-medium mb-2">Page Thumbnails</h3>
      <div className="flex overflow-x-auto space-x-2 pb-2">
        {thumbnails.map((thumb) => (
          <div
            key={thumb.page}
            className={`flex-shrink-0 cursor-pointer ${
              currentPage === thumb.page ? (
                theme === 'dark' ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-500'
              ) : ''
            }`}
            onClick={() => jumpToPage(thumb.page)}
          >
            <div className="relative">
              <img
                src={thumb.src}
                alt={`Page ${thumb.page}`}
                className="h-32 border border-gray-300 dark:border-gray-700"
              />
              <div
                className={`absolute bottom-0 left-0 right-0 text-center text-xs py-1 ${
                  theme === 'dark' ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-70'
                }`}
              >
                Page {thumb.page}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThumbnailsRow;