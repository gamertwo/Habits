"use client";
import React from 'react';

const Header = ({ 
  title, 
  toggleTheme, 
  toggleViewMode, 
  viewMode, 
  theme,
  getSecondaryButtonClasses 
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex space-x-2">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-md ${getSecondaryButtonClasses()}`}
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={toggleViewMode}
          className={`p-2 rounded-md ${getSecondaryButtonClasses()}`}
          title={`Switch to ${viewMode === 'line' ? 'Page' : 'Line'} View`}
        >
          {viewMode === 'line' ? '📄' : '📝'}
        </button>
      </div>
    </div>
  );
};

export default Header;