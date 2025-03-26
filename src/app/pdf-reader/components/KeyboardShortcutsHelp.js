"use client";
import React from 'react';

const KeyboardShortcutsHelp = ({ getCardClasses }) => {
  return (
    <div className={`mt-6 ${getCardClasses()} rounded-lg p-4`}>
      <details>
        <summary className="font-medium cursor-pointer">Keyboard Shortcuts</summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Next Line</span>
            <span className="font-mono">Right Arrow</span>
          </div>
          <div className="flex justify-between">
            <span>Previous Line</span>
            <span className="font-mono">Left Arrow</span>
          </div>
          <div className="flex justify-between">
            <span>Play/Pause</span>
            <span className="font-mono">Space</span>
          </div>
          <div className="flex justify-between">
            <span>Add Bookmark</span>
            <span className="font-mono">Ctrl+B</span>
          </div>
          <div className="flex justify-between">
            <span>Search</span>
            <span className="font-mono">Ctrl+F</span>
          </div>
          <div className="flex justify-between">
            <span>Toggle Notes</span>
            <span className="font-mono">Ctrl+N</span>
          </div>
          <div className="flex justify-between">
            <span>Toggle Theme</span>
            <span className="font-mono">Ctrl+T</span>
          </div>
          <div className="flex justify-between">
            <span>Toggle View Mode</span>
            <span className="font-mono">Ctrl+V</span>
          </div>
        </div>
      </details>
    </div>
  );
};

export default KeyboardShortcutsHelp;