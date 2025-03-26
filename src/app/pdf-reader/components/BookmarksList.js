"use client";
import React from 'react';

const BookmarksList = ({
  bookmarks,
  setShowBookmarkModal,
  goToBookmark,
  removeBookmark,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Bookmarks</h3>
        <button
          onClick={() => setShowBookmarkModal(true)}
          className={`px-2 py-1 text-xs rounded-md ${getPrimaryButtonClasses()}`}
        >
          + Add
        </button>
      </div>
      
      {bookmarks.length > 0 ? (
        <div className="max-h-48 overflow-y-auto">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className={`my-1 p-2 rounded-md text-sm cursor-pointer hover:bg-gray-700`}
              onClick={() => goToBookmark(bookmark)}
            >
              <div className="flex justify-between">
                <span className="truncate">{bookmark.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmark(bookmark.id);
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs opacity-70">
                Page {bookmark.page}, Line {bookmark.lineIndex + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-70">No bookmarks added</p>
      )}
    </div>
  );
};

export default BookmarksList;