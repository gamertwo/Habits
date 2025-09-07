// components/TaskPopup.js
'use client';

import React, { useEffect, useState } from 'react';

const TaskPopup = () => {
  const [timerData, setTimerData] = useState({
    time: '00:00',
    taskName: 'No Active Task',
    isRunning: false,
    isBreak: false
  });

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'UPDATE_TIMER') {
        setTimerData(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const toggleTimer = () => {
    if (window.opener) {
      window.opener.postMessage({ type: 'TOGGLE_TIMER' }, '*');
    }
  };

  const completeTask = () => {
    if (window.opener) {
      window.opener.postMessage({ type: 'COMPLETE_TASK' }, '*');
    }
  };

  const stopTask = () => {
    if (window.opener) {
      window.opener.postMessage({ type: 'STOP_TASK' }, '*');
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        completeTask();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopTask();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 flex flex-col">
      {/* Task Name */}
      <div className="text-center mb-3">
        <h2 className="text-sm font-medium text-gray-300 truncate">
          {timerData.taskName}
        </h2>
      </div>

      {/* Timer Display */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl font-mono font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
          {timerData.time}
        </div>
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        <span className={`text-xs px-2 py-1 rounded-full ${
          timerData.isBreak ? 'bg-orange-600/20 text-orange-300' :
          timerData.isRunning ? 'bg-green-600/20 text-green-300' : 
          'bg-gray-600/20 text-gray-300'
        }`}>
          {timerData.isBreak ? 'Break Time' : 
           timerData.isRunning ? 'Running' : 'Paused'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={toggleTimer}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
        >
          {timerData.isRunning ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={completeTask}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition-colors"
        >
          Complete
        </button>
        <button
          onClick={stopTask}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
        >
          Stop
        </button>
      </div>

      {/* Shortcuts */}
      <div className="text-center text-xs text-gray-400 border-t border-gray-700 pt-2">
        Space: Pause • Enter: Complete • Esc: Stop
      </div>
    </div>
  );
};

export default TaskPopup;