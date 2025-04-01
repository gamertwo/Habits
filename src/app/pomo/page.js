'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, BarChart } from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function Home() {
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [timerType, setTimerType] = useState('focus'); // focus, shortBreak, longBreak
  
  // Background states
  const [backgroundType, setBackgroundType] = useState('gradient'); // gradient, image, gif
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const fileInputRef = useRef(null);
  
  // Progress tracking states
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [todayPomodoros, setTodayPomodoros] = useState(0);
  const [weeklyPomodoros, setWeeklyPomodoros] = useState(0);
  const [monthlyPomodoros, setMonthlyPomodoros] = useState(0);
  const [showStats, setShowStats] = useState(false);
  
  // Timer settings
  const [showSettings, setShowSettings] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  });
  
  // Timer durations in seconds (dynamic based on settings)
  const timerDurations = {
    focus: timerSettings.focus * 60,
    shortBreak: timerSettings.shortBreak * 60,
    longBreak: timerSettings.longBreak * 60
  };
  
  // Quotes for different timer types
  const quotes = {
    focus: [
      "Deep work is the superpower of the 21st century.",
      "Focus on the process, not the outcome.",
      "Your focus determines your reality.",
      "Where attention goes, energy flows.",
      "Stay focused on your journey."
    ],
    shortBreak: [
      "Take a breath, recharge, return stronger.",
      "Rest is not a luxury, it's a necessity.",
      "Brief pauses lead to sustained productivity.",
      "Moments of rest are moments of growth.",
      "Take a moment to appreciate your progress."
    ],
    longBreak: [
      "Extended rest is essential for deep recovery.",
      "Celebrate your accomplishments with genuine rest.",
      "Recovery is when transformation happens.",
      "Your mind needs space to reorganize and consolidate.",
      "Rest is the foundation of sustained excellence."
    ]
  };
  
  // Get a random quote based on timer type
  const getRandomQuote = () => {
    const quoteArray = quotes[timerType];
    return quoteArray[Math.floor(Math.random() * quoteArray.length)];
  };
  
  // Current quote state
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote());
  
  // Load progress data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('pomodoroStats');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Check if today's data exists
        const today = new Date().toLocaleDateString();
        if (data.lastDay === today) {
          setTodayPomodoros(data.todayPomodoros);
        } else {
          // Reset today's count for a new day
          setTodayPomodoros(0);
        }
        
        // Check if current week's data exists
        const currentWeek = getWeekNumber(new Date());
        if (data.lastWeek === currentWeek) {
          setWeeklyPomodoros(data.weeklyPomodoros);
        } else {
          // Reset weekly count for a new week
          setWeeklyPomodoros(0);
        }
        
        // Check if current month's data exists
        const currentMonth = new Date().getMonth();
        if (data.lastMonth === currentMonth) {
          setMonthlyPomodoros(data.monthlyPomodoros);
        } else {
          // Reset monthly count for a new month
          setMonthlyPomodoros(0);
        }
        
        setCompletedPomodoros(data.totalPomodoros || 0);
      }
    } catch (error) {
      console.error('Error loading pomodoro stats:', error);
    }
  }, []);
  
  // Save progress data to localStorage whenever it changes
  useEffect(() => {
    try {
      const today = new Date().toLocaleDateString();
      const currentWeek = getWeekNumber(new Date());
      const currentMonth = new Date().getMonth();
      
      const statsData = {
        totalPomodoros: completedPomodoros,
        todayPomodoros: todayPomodoros,
        weeklyPomodoros: weeklyPomodoros,
        monthlyPomodoros: monthlyPomodoros,
        lastDay: today,
        lastWeek: currentWeek,
        lastMonth: currentMonth
      };
      
      localStorage.setItem('pomodoroStats', JSON.stringify(statsData));
    } catch (error) {
      console.error('Error saving pomodoro stats:', error);
    }
  }, [completedPomodoros, todayPomodoros, weeklyPomodoros, monthlyPomodoros]);
  
  // Load timer settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('pomodoroSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setTimerSettings(settings);
        
        // If timer is not active, update the current timeLeft based on loaded settings
        if (!isActive) {
          setTimeLeft(settings[timerType] * 60);
        }
      }
    } catch (error) {
      console.error('Error loading timer settings:', error);
    }
  }, []);
  
  // Helper function to get the week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  // Update quote when timer type changes
  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, [timerType]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
      
      // Handle timer completion - cycle between focus and breaks
      if (timerType === 'focus') {
        // Increment completed pomodoros only when focus session completes
        setCompletedPomodoros(prev => prev + 1);
        setTodayPomodoros(prev => prev + 1);
        setWeeklyPomodoros(prev => prev + 1);
        setMonthlyPomodoros(prev => prev + 1);
        
        setTimerType('shortBreak');
        setTimeLeft(timerDurations.shortBreak);
      } else if (timerType === 'shortBreak') {
        setTimerType('focus');
        setTimeLeft(timerDurations.focus);
      } else if (timerType === 'longBreak') {
        setTimerType('focus');
        setTimeLeft(timerDurations.focus);
      }
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerType, timerDurations]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Timer control functions
  const handleStartStop = () => {
    setIsActive(!isActive);
  };
  
  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(timerDurations[timerType]);
  };
  
  const handleTimerTypeChange = (type) => {
    setIsActive(false);
    setTimerType(type);
    setTimeLeft(timerDurations[type]);
    setCurrentQuote(quotes[type][Math.floor(Math.random() * quotes[type].length)]);
  };
  
  // Background change functions
  const handleBackgroundChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundUrl(url);
      setBackgroundType(file.type.startsWith('image/gif') ? 'gif' : 'image');
    }
  };
  
  // Save timer settings
  const saveTimerSettings = () => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(timerSettings));
    
    // Update current timer if not active
    if (!isActive) {
      setTimeLeft(timerSettings[timerType] * 60);
    }
    
    setShowSettings(false);
  };
  
  // Handle timer duration changes
  const handleTimerSettingChange = (setting, value) => {
    // Parse input to integer and ensure it's within reasonable bounds
    const intValue = parseInt(value, 10) || 1;
    const boundedValue = Math.min(Math.max(intValue, 1), 60);
    
    setTimerSettings({
      ...timerSettings,
      [setting]: boundedValue
    });
  };
  
  // Background styles based on type
  const getBackgroundStyle = () => {
    if (backgroundType === 'gradient') {
      const gradients = {
        focus: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        shortBreak: 'linear-gradient(135deg, #234e52 0%, #1a4145 100%)',
        longBreak: 'linear-gradient(135deg, #2a4365 0%, #1e3a8a 100%)'
      };
      return {
        background: gradients[timerType],
      };
    } else {
      return {
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden" style={getBackgroundStyle()}>
      {/* Semi-transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Timer container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Timer type indicator */}
        <div className="mb-4">
          <div className="flex space-x-3">
            <button
              onClick={() => handleTimerTypeChange('focus')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                timerType === 'focus'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => handleTimerTypeChange('shortBreak')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                timerType === 'shortBreak'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => handleTimerTypeChange('longBreak')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                timerType === 'longBreak'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Long Break
            </button>
          </div>
        </div>
        
        {/* Big timer display */}
        <div className="text-center mb-8">
          <h1 className="text-9xl font-extrabold text-white tracking-tighter">
            {formatTime(timeLeft)}
          </h1>
        </div>
        
        {/* Quote */}
        <div className="mb-12 max-w-md text-center">
          <p className="text-white text-lg italic opacity-80">{currentQuote}</p>
        </div>
        
        {/* Timer controls */}
        <div className="flex space-x-4">
          <button
            onClick={handleStartStop}
            className={`px-8 py-3 rounded-lg text-white font-bold transition-all ${
              isActive
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-all"
          >
            Reset
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-8 flex items-center">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-lg text-white text-sm transition-all"
          >
            <BarChart className="h-4 w-4" />
            <span>{showStats ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
        </div>
        
        {/* Stats panel */}
        {showStats && (
          <div className="mt-4 bg-gray-800 bg-opacity-80 rounded-lg p-4 w-80">
            <h3 className="text-white font-bold mb-3 text-center">Pomodoro Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs">Today</p>
                <p className="text-white font-bold text-2xl">{todayPomodoros}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs">This Week</p>
                <p className="text-white font-bold text-2xl">{weeklyPomodoros}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs">This Month</p>
                <p className="text-white font-bold text-2xl">{monthlyPomodoros}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-xs">All Time</p>
                <p className="text-white font-bold text-2xl">{completedPomodoros}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Settings and background buttons */}
        <div className="absolute bottom-24 right-8 flex space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-1 px-4 py-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-lg text-white text-sm transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-lg text-white text-sm transition-all"
          >
            Change Background
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBackgroundChange}
          />
          
          {backgroundType !== 'gradient' && (
            <button
              onClick={() => {
                setBackgroundType('gradient');
                setBackgroundUrl('');
              }}
              className="px-4 py-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 rounded-lg text-white text-sm transition-all"
            >
              Reset Background
            </button>
          )}
        </div>
      </div>
      
      {/* Settings modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
          <div className="bg-gray-800 rounded-lg p-6 w-80 max-w-md">
            <h3 className="text-white font-bold mb-4 text-lg">Timer Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Focus Duration (minutes)</label>
                <input
                  type="number"
                  value={timerSettings.focus}
                  onChange={(e) => handleTimerSettingChange('focus', e.target.value)}
                  min="1"
                  max="60"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Short Break Duration (minutes)</label>
                <input
                  type="number"
                  value={timerSettings.shortBreak}
                  onChange={(e) => handleTimerSettingChange('shortBreak', e.target.value)}
                  min="1"
                  max="60"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Long Break Duration (minutes)</label>
                <input
                  type="number"
                  value={timerSettings.longBreak}
                  onChange={(e) => handleTimerSettingChange('longBreak', e.target.value)}
                  min="1"
                  max="60"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveTimerSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar at bottom */}
      <Navbar />
    </div>
  );
}