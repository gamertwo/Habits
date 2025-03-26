"use client";
import React from 'react';

const BookmarkModal = ({
  theme,
  bookmarkName,
  setBookmarkName,
  currentPage,
  currentLineIndex,
  addBookmark,
  setShowBookmarkModal,
  getCardClasses,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${getCardClasses()} rounded-lg p-6 max-w-md w-full`}>
        <h3 className="text-lg font-medium mb-4">Add Bookmark</h3>
        <input
          type="text"
          value={bookmarkName}
          onChange={(e) => setBookmarkName(e.target.value)}
          placeholder={`Page ${currentPage}, Line ${currentLineIndex + 1}`}
          className={`w-full p-2 mb-4 border rounded-md ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowBookmarkModal(false)}
            className={`px-4 py-2 rounded-md ${getSecondaryButtonClasses()}`}
          >
            Cancel
          </button>
          <button
            onClick={addBookmark}
            className={`px-4 py-2 rounded-md ${getPrimaryButtonClasses()}`}
          >
            Add Bookmark
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookmarkModal;