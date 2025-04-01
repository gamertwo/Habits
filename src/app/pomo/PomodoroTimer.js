'use client';

import { useState, useEffect } from 'react';

export default function PomodoroTimer({ onPhaseChange, onPomodoroComplete, currentPhase }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [timerType, setTimerType] = useState('focus'); // focus, shortBreak, longBreak
  
  // Define timer durations (in seconds)
  const timerDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    planning: 10 * 60,
    review: 10 * 60
  };
  
  // Timer colors
  const timerColors = {
    focus: 'from-red-500 to-orange-500',
    shortBreak: 'from-green-500 to-teal-500',
    longBreak: 'from-blue-500 to-indigo-500',
    planning: 'from-purple-500 to-pink-500',
    review: 'from-yellow-500 to-amber-500'
  };
  
  // Timer messages
  const timerMessages = {
    focus: 'Deep work mode activated. Eliminate all distractions.',
    shortBreak: 'Brief respite. Reflect on progress.',
    longBreak: 'Extended recovery. Recharge your mental resources.',
    planning: 'Strategic planning phase. Map your approach.',
    review: 'Analysis phase. Evaluate system effectiveness.'
  };

  // Sound effects
  const playSoundEffect = (sound) => {
    // Would implement actual sound effect here
    console.log(`Playing ${sound} sound effect`);
  };

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      
      // Play completion sound
      playSoundEffect('timerComplete');
      
      // Handle timer completion
      if (timerType === 'focus') {
        onPomodoroComplete();
        setTimerType('shortBreak');
        setTimeLeft(timerDurations.shortBreak);
        onPhaseChange('break');
      } else if (timerType === 'shortBreak') {
        setTimerType('focus');
        setTimeLeft(timerDurations.focus);
        onPhaseChange('focus');
      } else if (timerType === 'longBreak') {
        setTimerType('planning');
        setTimeLeft(timerDurations.planning);
        onPhaseChange('planning');
      } else if (timerType === 'planning') {
        setTimerType('focus');
        setTimeLeft(timerDurations.focus);
        onPhaseChange('focus');
      } else if (timerType === 'review') {
        setTimerType('focus');
        setTimeLeft(timerDurations.focus);
        onPhaseChange('focus');
      }
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerType, onPomodoroComplete, onPhaseChange]);
  
  useEffect(() => {
    // Sync timer type with the current phase from parent
    if (currentPhase !== timerType) {
      setTimerType(currentPhase === 'break' ? 'shortBreak' : currentPhase);
      setTimeLeft(timerDurations[currentPhase === 'break' ? 'shortBreak' : currentPhase]);
    }
  }, [currentPhase]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartStop = () => {
    playSoundEffect('buttonClick');
    setIsActive(!isActive);
  };
  
  const handleReset = () => {
    playSoundEffect('buttonClick');
    setIsActive(false);
    setTimeLeft(timerDurations[timerType]);
  };
  
  const handleChangeTimerType = (type) => {
    playSoundEffect('buttonClick');
    setIsActive(false);
    setTimerType(type);
    setTimeLeft(timerDurations[type]);
    onPhaseChange(type === 'shortBreak' || type === 'longBreak' ? 'break' : type);
  };
  
  const progressPercentage = (timeLeft / timerDurations[timerType]) * 100;
  
  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Tactical Execution Timer</h2>
      
      <div className="mb-6">
        <div className="flex justify-center mb-3">
          <div className="relative w-60 h-60">
            {/* Timer circle */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#374151"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={`url(#${timerType}Gradient)`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progressPercentage) / 100}
                transform="rotate(-90 50 50)"
              />
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
                <linearGradient id="shortBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
                <linearGradient id="longBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
                <linearGradient id="planningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <linearGradient id="reviewGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
              
              {/* Timer text */}
              <text x="50" y="45" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                {formatTime(timeLeft)}
              </text>
              <text x="50" y="65" textAnchor="middle" fill="white" fontSize="10">
                {timerType.charAt(0).toUpperCase() + timerType.slice(1)}
              </text>
            </svg>
          </div>
        </div>
        
        <p className="text-center text-gray-300 text-sm mb-4">
          {timerMessages[timerType]}
        </p>
      </div>
      
      <div className="flex justify-center space-x-2 mb-6">
        <button
          onClick={handleStartStop}
          className={`px-4 py-2 rounded-md ${
            isActive 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } transition-colors`}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        <button
          onClick={() => handleChangeTimerType('planning')}
          className={`p-2 rounded-md text-xs font-medium transition-colors ${
            timerType === 'planning' 
              ? 'bg-purple-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Planning
        </button>
        <button
          onClick={() => handleChangeTimerType('focus')}
          className={`p-2 rounded-md text-xs font-medium transition-colors ${
            timerType === 'focus' 
              ? 'bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => handleChangeTimerType('shortBreak')}
          className={`p-2 rounded-md text-xs font-medium transition-colors ${
            timerType === 'shortBreak' 
              ? 'bg-green-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => handleChangeTimerType('longBreak')}
          className={`p-2 rounded-md text-xs font-medium transition-colors ${
            timerType === 'longBreak' 
              ? 'bg-blue-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Long Break
        </button>
        <button
          onClick={() => handleChangeTimerType('review')}
          className={`p-2 rounded-md text-xs font-medium transition-colors ${
            timerType === 'review' 
              ? 'bg-yellow-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Review
        </button>
      </div>
    </div>
  );
}