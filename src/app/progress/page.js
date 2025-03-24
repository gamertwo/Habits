"use client"
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressPage() {
  const [habits, setHabits] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHabits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/habits');
        
        if (!response.ok) {
          throw new Error(`Error fetching habits: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setHabits(data);
        } else {
          throw new Error('Invalid data format received');
        }
      } catch (error) {
        console.error('Error loading habits:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadHabits();
  }, []);
  
  const handleYearChange = useCallback((direction) => {
    setCurrentYear(prev => prev + direction);
  }, []);

  const navigateToCurrentYear = useCallback(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Group habits by category for better organization
  const habitsByCategory = useMemo(() => {
    const grouped = habits.reduce((acc, habit) => {
      const category = habit.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(habit);
      return acc;
    }, {});
    
    // Sort categories alphabetically, but keep "Uncategorized" at the end
    return Object.entries(grouped).sort((a, b) => {
      if (a[0] === 'Uncategorized') return 1;
      if (b[0] === 'Uncategorized') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [habits]);

  // Calculate if we have future years available
  const canGoForward = currentYear < new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
            <h1 className="text-xl md:text-3xl font-bold text-gray-100">Habit Tracker</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-100">
            <button
              onClick={() => handleYearChange(-1)}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Previous Year"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={navigateToCurrentYear}
              className="px-2 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              <span className="text-lg font-semibold">{currentYear}</span>
            </button>
            <button
              onClick={() => handleYearChange(1)}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next Year"
              disabled={!canGoForward}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-gray-700" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="bg-red-900/20 border-red-800 text-red-200 p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              <p>Failed to load habits: {error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm"
            >
              Retry
            </button>
          </Card>
        )}

        {!isLoading && !error && habits.length === 0 && (
          <Card className="bg-gray-800 border-gray-700 p-6 text-center">
            <p className="text-gray-400 mb-3">No habits found. Start tracking new habits to see your progress.</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium">
              Create Your First Habit
            </button>
          </Card>
        )}

        {!isLoading && !error && habits.length > 0 && (
          <div className="space-y-8">
            {habitsByCategory.map(([category, categoryHabits]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2 px-2">
                  {category}
                  <span className="text-sm text-gray-400">({categoryHabits.length})</span>
                </h2>
                <div className="grid gap-4 md:gap-6">
                  {categoryHabits.map(habit => (
                    <HabitGrid key={habit._id} habit={habit} year={currentYear} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const HabitGrid = ({ habit, year }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize days calculation for performance
  const { days, daysByMonth } = useMemo(() => {
    const getDaysInYear = (year) => {
      const days = [];
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      const currentDate = new Date();
      
      while (startOfYear <= endOfYear && startOfYear <= currentDate) {
        days.push(new Date(startOfYear));
        startOfYear.setDate(startOfYear.getDate() + 1);
      }
      return days;
    };

    const days = getDaysInYear(year);
    const daysByMonth = days.reduce((acc, day) => {
      const month = day.getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(day);
      return acc;
    }, {});

    return { days, daysByMonth };
  }, [year]);

  const getColorIntensity = useCallback((date) => {
    const completionsForDate = habit.completedDates?.filter(
      completedDate => new Date(completedDate).toDateString() === date.toDateString()
    ).length || 0;
    
    // Handle the case when no completions are needed (simple checkbox habit)
    const maxCheckOffs = habit.maxCheckOffs || 1;
    const intensity = Math.min(completionsForDate / maxCheckOffs, 1); // Cap at 100%

    // Default color if not specified in habit
    const defaultColor = '#10B981'; // green-500
    const habitColor = habit.color || defaultColor;

    // Convert hex to RGB for interpolation
    const hex = habitColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Interpolate between dark gray (rgb(52, 52, 52)) and the selected color
    return `rgb(${Math.round(r * intensity + 52 * (1 - intensity))}, 
               ${Math.round(g * intensity + 52 * (1 - intensity))}, 
               ${Math.round(b * intensity + 52 * (1 - intensity))})`;
  }, [habit.color, habit.completedDates, habit.maxCheckOffs]);

  // Touch and mouse event handlers
  const handleMouseDown = useCallback((e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleTouchStart = useCallback((e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  // Memoize statistics calculations
  const { completedCount, completionPercentage, currentStreak, bestStreak, averagePerWeek } = useMemo(() => {
    // Calculate completions
    const completedCount = days.filter(day => 
      habit.completedDates?.some(date => 
        new Date(date).toDateString() === day.toDateString()
      )
    ).length;
    
    const completionPercentage = days.length > 0 
      ? ((completedCount / days.length) * 100).toFixed(1) 
      : "0.0";

    // Calculate current streak
    const getCurrentStreak = () => {
      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);
      
      while (habit.completedDates?.some(date => 
        new Date(date).toDateString() === currentDate.toDateString()
      )) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      return streak;
    };

    // Calculate best streak
    const getBestStreak = () => {
      let bestStreak = 0;
      let currentStreak = 0;
      
      // Sort dates in ascending order
      const sortedDates = habit.completedDates
        ? [...habit.completedDates].map(d => new Date(d).toDateString()).sort()
        : [];
      
      // Remove duplicates
      const uniqueDates = [...new Set(sortedDates)];
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const previousDate = i > 0 ? new Date(uniqueDates[i-1]) : null;
        
        // Check if the current date is the day after the previous date
        if (previousDate && 
            currentDate.getTime() - previousDate.getTime() === 86400000) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        
        bestStreak = Math.max(bestStreak, currentStreak);
      }
      
      return bestStreak;
    };

    // Calculate average completions per week
    const getAveragePerWeek = () => {
      // Get number of weeks
      const oldestDate = days[0];
      const newestDate = days[days.length - 1];
      const diffTime = Math.abs(newestDate - oldestDate);
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) || 1; // At least 1 to avoid division by zero
      
      return (completedCount / diffWeeks).toFixed(1);
    };

    return {
      completedCount,
      completionPercentage,
      currentStreak: getCurrentStreak(),
      bestStreak: getBestStreak(),
      averagePerWeek: getAveragePerWeek()
    };
  }, [days, habit.completedDates]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Auto-scroll to current month if viewing current year
  useEffect(() => {
    if (scrollRef.current && year === new Date().getFullYear()) {
      const currentMonth = new Date().getMonth();
      const monthWidth = scrollRef.current.scrollWidth / 12;
      scrollRef.current.scrollLeft = monthWidth * currentMonth;
    }
  }, [year]);

  return (
    <Card className="bg-gray-800 border-gray-700 transition-all">
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle 
            className="text-lg md:text-xl font-semibold text-gray-100 flex items-center gap-2 cursor-pointer"
            onClick={toggleExpanded}
          >
            {habit.emoji && <span className="text-xl" role="img" aria-label={`Emoji: ${habit.emoji}`}>{habit.emoji}</span>}
            <div 
              className="w-2 h-2 md:w-3 md:h-3 rounded-full" 
              style={{ backgroundColor: habit.color || '#10B981' }}
              aria-hidden="true"
            />
            <span>{habit.name}</span>
          </CardTitle>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Streak: <strong className="text-gray-200">{currentStreak}</strong> days</span>
            <span>Completion: <strong className="text-gray-200">{completionPercentage}%</strong></span>
            {habit.maxCheckOffs && <span>Daily Goal: <strong className="text-gray-200">{habit.maxCheckOffs}×</strong></span>}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className="p-2 md:p-6 overflow-hidden transition-all"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
        style={{
          userSelect: 'none',
          overscrollBehavior: 'none',
          maxHeight: isExpanded ? '1000px' : '150px',
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="sticky top-0 grid grid-cols-12 gap-1 text-xs text-gray-400 mb-1 bg-gray-800 py-1 z-10">
            {monthNames.map(month => (
              <div key={month} className="text-center hidden sm:block">{month}</div>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-1">
            {Object.entries(daysByMonth).map(([month, monthDays]) => (
              <div key={month} className="flex flex-wrap gap-0.5">
                <div className="text-xs text-gray-400 w-full text-center mb-1 sm:hidden">
                  {monthNames[month]}
                </div>
                {monthDays.map(day => {
                  const completionsForDate = habit.completedDates?.filter(
                    date => new Date(date).toDateString() === day.toDateString()
                  ).length || 0;
                  
                  const isToday = new Date().toDateString() === day.toDateString();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-sm transition-all duration-200 hover:scale-150 cursor-pointer group relative ${
                        isToday ? 'ring-1 ring-blue-400' : ''
                      } ${isWeekend ? 'opacity-70' : ''}`}
                      style={{ backgroundColor: getColorIntensity(day) }}
                      aria-label={`${day.toLocaleDateString()}: ${completionsForDate}/${habit.maxCheckOffs || 1} completed`}
                      role="gridcell"
                    >
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-100 bg-gray-900 rounded whitespace-nowrap z-10 shadow-lg">
                        <div className="font-medium">
                          {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div>
                          {completionsForDate}/{habit.maxCheckOffs || 1} completed
                          {isWeekend && ' (Weekend)'}
                          {isToday && ' (Today)'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      {isExpanded && (
        <CardFooter className="px-4 py-3 bg-gray-700/20 border-t border-gray-700 text-gray-300 text-sm flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <strong>Best Streak:</strong> {bestStreak} days
          </div>
          <div>
            <strong>Total Completions:</strong> {completedCount} days
          </div>
          <div>
            <strong>Average:</strong> {averagePerWeek} times/week
          </div>
          <div>
            <strong>Started:</strong> {days[0]?.toLocaleDateString() || 'N/A'}
          </div>
          {habit.description && (
            <div className="w-full mt-2 text-gray-400 italic">
              {habit.description}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};