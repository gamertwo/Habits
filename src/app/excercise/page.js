"use client"
// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ExerciseTracker() {
  const [completedWorkouts, setCompletedWorkouts] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [streakData, setStreakData] = useState({ current: 0, longest: 0 });
  const [workoutNotes, setWorkoutNotes] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [workoutTypes, setWorkoutTypes] = useState({});
  const [personalBest, setPersonalBest] = useState({ date: null, count: 0 });
  const [motivationalQuote, setMotivationalQuote] = useState('');

  const quotes = [
    "The only bad workout is the one that didn't happen! 💪",
    "Progress, not perfection! 🌟",
    "Your future self will thank you! 🚀",
    "Stronger every day! 💯",
    "Consistency is everything! ⭐",
    "You're building a better you! 🏆",
    "Small steps, big results! 🎯",
    "Keep pushing forward! 🔥"
  ];

  useEffect(() => {
    // Load data from localStorage
    const savedWorkouts = localStorage.getItem('exerciseTracker');
    const savedNotes = localStorage.getItem('workoutNotes');
    const savedStreak = localStorage.getItem('streakData');
    const savedTypes = localStorage.getItem('workoutTypes');
    const savedBest = localStorage.getItem('personalBest');

    if (savedWorkouts) {
      setCompletedWorkouts(JSON.parse(savedWorkouts));
    }
    if (savedNotes) {
      setWorkoutNotes(JSON.parse(savedNotes));
    }
    if (savedStreak) {
      setStreakData(JSON.parse(savedStreak));
    }
    if (savedTypes) {
      setWorkoutTypes(JSON.parse(savedTypes));
    }
    if (savedBest) {
      setPersonalBest(JSON.parse(savedBest));
    }

    // Set random motivational quote
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  useEffect(() => {
    // Save to localStorage whenever data changes
    localStorage.setItem('exerciseTracker', JSON.stringify(completedWorkouts));
    localStorage.setItem('workoutNotes', JSON.stringify(workoutNotes));
    localStorage.setItem('streakData', JSON.stringify(streakData));
    localStorage.setItem('workoutTypes', JSON.stringify(workoutTypes));
    localStorage.setItem('personalBest', JSON.stringify(personalBest));
    
    // Recalculate streaks
    calculateStreaks();
  }, [completedWorkouts]);

  const calculateStreaks = () => {
    const weeks = getAllWeeksFromData();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort weeks by date (most recent first)
    const sortedWeeks = weeks.sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
    
    for (let i = 0; i < sortedWeeks.length; i++) {
      const weekKey = sortedWeeks[i].key;
      const completedCount = getCompletedCount(weekKey);
      
      if (completedCount === 3) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak; // Current streak from most recent week
      } else {
        if (i === 0) currentStreak = 0; // Break current streak if latest week incomplete
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    setStreakData({ current: currentStreak, longest: longestStreak });
  };

  const getAllWeeksFromData = () => {
    const weeks = [];
    Object.keys(completedWorkouts).forEach(weekKey => {
      // Parse week key to get actual week start date
      const [year, weekNum, month] = weekKey.split('-W')[1] ? 
        [weekKey.split('-W')[0], weekKey.split('-W')[1].split('-')[0], weekKey.split('-W')[1].split('-')[1]] :
        [null, null, null];
      
      if (year && weekNum && month !== null) {
        const weekStart = new Date(parseInt(year), parseInt(month), (parseInt(weekNum) - 1) * 7 + 1);
        weeks.push({ key: weekKey, weekStart });
      }
    });
    return weeks;
  };

  const toggleWorkout = (weekKey, workoutIndex, workoutType = 'General') => {
    const isCompleting = !completedWorkouts[weekKey]?.[workoutIndex];
    
    setCompletedWorkouts(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [workoutIndex]: isCompleting
      }
    }));

    // Track workout type
    if (isCompleting) {
      setWorkoutTypes(prev => ({
        ...prev,
        [`${weekKey}-${workoutIndex}`]: workoutType
      }));
    } else {
      setWorkoutTypes(prev => {
        const newTypes = { ...prev };
        delete newTypes[`${weekKey}-${workoutIndex}`];
        return newTypes;
      });
    }

    // Update personal best
    setTimeout(() => {
      updatePersonalBest();
    }, 100);
  };

  const updatePersonalBest = () => {
    const weeks = getAllWeeksFromData();
    let bestWeek = { date: null, count: 0 };
    
    weeks.forEach(week => {
      const count = getCompletedCount(week.key);
      if (count > bestWeek.count) {
        bestWeek = { date: week.weekStart.toISOString(), count };
      }
    });
    
    setPersonalBest(bestWeek);
  };

  const addWorkoutNote = (weekKey, workoutIndex, note) => {
    setWorkoutNotes(prev => ({
      ...prev,
      [`${weekKey}-${workoutIndex}`]: note
    }));
  };

  const getWeeksInMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeek = [];
    let currentDate = new Date(firstDay);
    
    // Start from the beginning of the week
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    
    while (currentDate <= lastDay || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      
      currentWeek.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (currentDate > lastDay && currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        break;
      }
    }
    
    return weeks;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = getWeeksInMonth(year, month);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekKey = (week) => {
    const monday = week.find(day => day.getDay() === 1) || week[0];
    const weekOfMonth = Math.ceil(monday.getDate() / 7);
    return `${monday.getFullYear()}-W${weekOfMonth}-${monday.getMonth()}-${monday.getTime()}`;
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === month;
  };

  const getCompletedCount = (weekKey) => {
    const week = completedWorkouts[weekKey] || {};
    return Object.values(week).filter(Boolean).length;
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setCompletedWorkouts({});
      setWorkoutNotes({});
      setWorkoutTypes({});
      setStreakData({ current: 0, longest: 0 });
      setPersonalBest({ date: null, count: 0 });
      localStorage.clear();
    }
  };

  const exportData = () => {
    const data = {
      completedWorkouts,
      workoutNotes,
      workoutTypes,
      streakData,
      personalBest,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exercise-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (confirm('This will replace all current data. Continue?')) {
            setCompletedWorkouts(data.completedWorkouts || {});
            setWorkoutNotes(data.workoutNotes || {});
            setWorkoutTypes(data.workoutTypes || {});
            setStreakData(data.streakData || { current: 0, longest: 0 });
            setPersonalBest(data.personalBest || { date: null, count: 0 });
          }
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const WorkoutTypeSelector = ({ weekKey, workoutIndex, currentType, onSelect }) => {
    const types = ['Cardio', 'Strength', 'Yoga', 'HIIT', 'Sports', 'Other'];
    
    return (
      <select
        value={currentType || 'General'}
        onChange={(e) => onSelect(e.target.value)}
        className="text-xs px-2 py-1 border rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <option value="General">General</option>
        {types.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    );
  };

  const NoteInput = ({ weekKey, workoutIndex, currentNote, onSave }) => {
    const [note, setNote] = useState(currentNote || '');
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
      onSave(note);
      setIsEditing(false);
    };

    if (!isEditing) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          {currentNote ? '📝 Edit note' : '📝 Add note'}
        </button>
      );
    }

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-10">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add workout notes..."
          className="w-full px-2 py-1 border rounded text-xs"
          rows="2"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex justify-end space-x-2 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(false);
            }}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Enhanced Exercise Tracker - 3x Per Week</title>
        <meta name="description" content="Enhanced exercise tracker for 3 workouts per week with statistics and notes" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-black mb-2">
              💪 Enhanced Exercise Tracker
            </h1>
            <p className="text-black text-lg mb-2">
              3 workouts per week - Track, analyze, and improve!
            </p>
            <p className="text-black font-medium italic">
              {motivationalQuote}
            </p>
          </div>

          {/* Quick Stats Bar */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{streakData.current}</div>
                <div className="text-sm text-black">Current Streak</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{streakData.longest}</div>
                <div className="text-sm text-black">Best Streak</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(completedWorkouts).reduce((total, week) => 
                    total + getCompletedCount(week), 0
                  )}
                </div>
                <div className="text-sm text-black">Total Workouts</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">{personalBest.count}</div>
                <div className="text-sm text-black">Weekly Best</div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={goToPreviousMonth}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>
                
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Today
                </button>
                
                <button
                  onClick={goToNextMonth}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              </div>

              <h2 className="text-2xl font-bold text-black">
                {monthNames[month]} {year}
              </h2>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  📊 Stats
                </button>
                
                <button
                  onClick={exportData}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  📤 Export
                </button>
                
                <label className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm cursor-pointer">
                  📥 Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={clearAllData}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Stats Panel */}
          {showStats && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">📈 Detailed Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Workout Types</h4>
                  <div className="space-y-2">
                    {Object.values(workoutTypes).reduce((acc, type) => {
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {}) && 
                      Object.entries(
                        Object.values(workoutTypes).reduce((acc, type) => {
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span>{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Recent Activity</h4>
                  <div className="text-sm space-y-1">
                    {Object.keys(completedWorkouts)
                      .slice(-5)
                      .reverse()
                      .map(weekKey => (
                        <div key={weekKey} className="flex justify-between">
                          <span>Week:</span>
                          <span>{getCompletedCount(weekKey)}/3</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Achievements</h4>
                  <div className="space-y-2 text-sm">
                    {streakData.current >= 4 && (
                      <div className="text-gold-600">🏆 Month Master!</div>
                    )}
                    {streakData.longest >= 8 && (
                      <div className="text-purple-600">👑 Consistency King!</div>
                    )}
                    {Object.keys(completedWorkouts).length >= 12 && (
                      <div className="text-blue-600">📅 Year Warrior!</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="space-y-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-black py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, weekIndex) => {
                const weekKey = getWeekKey(week);
                const completedThisWeek = getCompletedCount(weekKey);
                
                return (
                  <div key={weekIndex} className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                    {/* Week dates */}
                    <div className="grid grid-cols-7 gap-4 mb-4">
                      {week.map((date, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`text-center py-2 rounded-lg ${
                            isCurrentMonth(date)
                              ? 'text-black font-medium'
                              : 'text-gray-400'
                          } ${
                            date.toDateString() === new Date().toDateString()
                              ? 'bg-blue-100 border-2 border-blue-400'
                              : ''
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      ))}
                    </div>

                    {/* Week progress indicator */}
                    <div className="text-center mb-4">
                      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                        completedThisWeek === 3 
                          ? 'bg-green-100 text-green-800' 
                          : completedThisWeek > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span>
                          {completedThisWeek === 3 ? '🎉' : completedThisWeek > 0 ? '💪' : '⏳'}
                        </span>
                        <span>
                          {completedThisWeek}/3 workouts completed
                        </span>
                      </div>
                    </div>

                    {/* Three workout boxes */}
                    <div className="flex justify-center space-x-8">
                      {[0, 1, 2].map(workoutIndex => {
                        const isCompleted = completedWorkouts[weekKey]?.[workoutIndex];
                        const workoutType = workoutTypes[`${weekKey}-${workoutIndex}`] || 'General';
                        const note = workoutNotes[`${weekKey}-${workoutIndex}`];
                        
                        return (
                          <div key={workoutIndex} className="relative">
                            <button
                              onClick={() => toggleWorkout(weekKey, workoutIndex, workoutType)}
                              className={`w-24 h-24 rounded-2xl border-4 transition-all duration-200 flex items-center justify-center text-4xl ${
                                isCompleted
                                  ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                                  : 'bg-white border-gray-300 text-gray-400 hover:border-green-400 hover:bg-green-50'
                              }`}
                            >
                              {isCompleted ? '✓' : ''}
                            </button>
                            
                            {/* Workout controls */}
                            <div className="mt-2 space-y-1 w-24">
                              <div className="text-center text-xs text-black">
                                Workout {workoutIndex + 1}
                              </div>
                              
                              <WorkoutTypeSelector
                                weekKey={weekKey}
                                workoutIndex={workoutIndex}
                                currentType={workoutType}
                                onSelect={(type) => setWorkoutTypes(prev => ({
                                  ...prev,
                                  [`${weekKey}-${workoutIndex}`]: type
                                }))}
                              />
                              
                              <div className="relative">
                                <NoteInput
                                  weekKey={weekKey}
                                  workoutIndex={workoutIndex}
                                  currentNote={note}
                                  onSave={(note) => addWorkoutNote(weekKey, workoutIndex, note)}
                                />
                              </div>
                              
                              {note && (
                                <div className="text-xs text-gray-500 truncate" title={note}>
                                  💭 {note}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              📊 Monthly Summary
            </h3>
            
            {(() => {
              const monthWeeks = weeks.filter(week => 
                week.some(date => isCurrentMonth(date))
              );
              
              const totalPossible = monthWeeks.length * 3;
              const totalCompleted = monthWeeks.reduce((sum, week) => {
                return sum + getCompletedCount(getWeekKey(week));
              }, 0);
              
              const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
              
              return (
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold text-blue-600">
                    {totalCompleted}/{totalPossible}
                  </div>
                  <div className="text-lg text-black">
                    workouts completed this month
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-black">
                    {percentage}% Complete
                  </div>
                  
                  {percentage === 100 && (
                    <div className="text-green-600 font-semibold text-lg">
                      🏆 Perfect month! You are unstoppable!
                    </div>
                  )}
                  {percentage >= 75 && percentage < 100 && (
                    <div className="text-blue-600 font-semibold">
                      🌟 Outstanding! You are almost there!
                    </div>
                  )}
                  {percentage >= 50 && percentage < 75 && (
                    <div className="text-yellow-600 font-semibold">
                      💪 Great progress! Keep the momentum!
                    </div>
                  )}
                  {percentage < 50 && percentage > 0 && (
                    <div className="text-orange-600 font-semibold">
                      🚀 Every step counts! You happenve got this!
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}