"use client";
import React from 'react';

const SearchBar = ({ 
  theme, 
  searchText, 
  setSearchText, 
  searchInDocument, 
  isSearching, 
  searchResults, 
  currentSearchIndex, 
  goToNextSearchResult, 
  goToPrevSearchResult,
  getPrimaryButtonClasses,
  getSecondaryButtonClasses
}) => {
  return (
    <div className={`mb-6 p-4 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 bg-opacity-40 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center space-x-2">
        <input
          id="search-input"
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search in document..."
          className={`flex-1 p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
          onKeyDown={(e) => e.key === 'Enter' && searchInDocument()}
        />
        <button
          onClick={searchInDocument}
          disabled={isSearching || !searchText.trim()}
          className={`px-3 py-2 rounded-md ${getPrimaryButtonClasses()} disabled:opacity-50`}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              <span className="font-medium">Results:</span> {currentSearchIndex + 1} of {searchResults.length}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={goToPrevSearchResult}
                className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()}`}
              >
                ← Previous
              </button>
              <button
                onClick={goToNextSearchResult}
                className={`px-2 py-1 rounded-md ${getSecondaryButtonClasses()}`}
              >
                Next →
              </button>
            </div>
          </div>
          <div className={`mt-2 p-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p>
              <span className="font-medium">Context:</span> ...{searchResults[currentSearchIndex].context}...
            </p>
            <p className="text-xs mt-1 opacity-70">
              Page {searchResults[currentSearchIndex].page}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;