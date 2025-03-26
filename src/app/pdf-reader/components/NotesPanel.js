"use client";
import React from 'react';

const NotesPanel = ({
  currentPage,
  notes,
  currentNote,
  setCurrentNote,
  saveNote,
  deleteNote,
  theme,
  getCardClasses,
  getPrimaryButtonClasses
}) => {
  return (
    <div className={`w-full md:w-64 flex-shrink-0 ${getCardClasses()} rounded-lg p-4 h-fit`}>
      <h3 className="font-medium mb-2">Notes for Page {currentPage}</h3>
      
      <div className="mb-4">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="Add a note for this page..."
          className={`w-full p-2 border rounded-md ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}
          rows={3}
        ></textarea>
        <button
          onClick={saveNote}
          disabled={!currentNote.trim()}
          className={`mt-2 px-3 py-1 rounded-md w-full ${getPrimaryButtonClasses()} disabled:opacity-50`}
        >
          Save Note
        </button>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {notes[currentPage] && notes[currentPage].length > 0 ? (
          notes[currentPage].map((note) => (
            <div
              key={note.id}
              className={`my-2 p-2 rounded-md text-sm ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs opacity-70">
                  Line {note.lineIndex + 1}
                </span>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              <p className="whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        ) : (
          <p className="text-sm opacity-70">No notes for this page</p>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;