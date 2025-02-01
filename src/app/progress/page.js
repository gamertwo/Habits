"use client"
import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ProgressPage() {
  const [habits, setHabits] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const response = await fetch('/api/habits');
        
        const data = await response.json();
        console.log('Fetched habits:', data);
        
        if (Array.isArray(data)) {
          setHabits(data);
        }
      } catch (error) {
        console.error('Error loading habits:', error);
      }
    };
  
    loadHabits();
  }, []);
  
  const handleYearChange = (direction) => {
    setCurrentYear(prev => prev + direction);
  };

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
            <span className="text-lg font-semibold">{currentYear}</span>
            <button
              onClick={() => handleYearChange(1)}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Next Year"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6">
          {habits.map(habit => (
            <HabitGrid key={habit._id} habit={habit} year={currentYear} />
          ))}
        </div>
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

  const getColorIntensity = (date) => {
    const completionsForDate = habit.completedDates?.filter(
      completedDate => new Date(completedDate).toDateString() === date.toDateString()
    ).length || 0;
    const intensity = completionsForDate / (habit.maxCheckOffs || 1);

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
  };

  const days = getDaysInYear(year);
  const daysByMonth = days.reduce((acc, day) => {
    const month = day.getMonth();
    if (!acc[month]) acc[month] = [];
    acc[month].push(day);
    return acc;
  }, {});

  // Touch and mouse event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Calculate stats
  const completedCount = days.filter(day => 
    habit.completedDates?.some(date => 
      new Date(date).toDateString() === day.toDateString()
    )
  ).length;
  const completionPercentage = ((completedCount / days.length) * 100).toFixed(1);

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

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg md:text-xl font-semibold text-gray-100 flex items-center gap-2">
            {habit.emoji && <span className="text-xl">{habit.emoji}</span>}
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full" 
                 style={{ backgroundColor: habit.color || '#10B981' }} />
            <span>{habit.name}</span>
            {habit.category && <span className="text-sm text-gray-400">({habit.category})</span>}
          </CardTitle>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Streak: {getCurrentStreak()} days</span>
            <span>Completion: {completionPercentage}%</span>
            {habit.maxCheckOffs && <span>Daily Goal: {habit.maxCheckOffs}×</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className="p-2 md:p-6 overflow-hidden"
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
          overscrollBehavior: 'none'
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 mb-1">
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
                {monthDays.map(day => (
                  <div
                    key={day.toISOString()}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-sm transition-all duration-200 hover:scale-150 cursor-pointer group relative"
                    style={{ backgroundColor: getColorIntensity(day) }}
                  >
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-100 bg-gray-900 rounded whitespace-nowrap z-10">
                      {day.toLocaleDateString()}: {
                        habit.completedDates?.filter(
                          date => new Date(date).toDateString() === day.toDateString()
                        ).length || 0
                      }/{habit.maxCheckOffs || 1} completed
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


