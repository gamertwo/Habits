"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  BarChart3,
  ArrowUpDown,
  RefreshCw,
  ListFilter,
  Layers
} from "lucide-react";

export default function WeeklyView() {
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // name, category, completion
  const [sortDirection, setSortDirection] = useState('asc');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [weekStats, setWeekStats] = useState({
    totalCompletions: 0,
    completionRate: 0,
    bestDay: '',
    worstDay: ''
  });

  const getWeekDates = (offset = 0) => {
    const week = [];
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay() + (offset * 7));

    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const currentWeek = getWeekDates(weekOffset);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...habits];
    
    // Apply category filters
    if (selectedCategories.length > 0) {
      result = result.filter(habit => selectedCategories.includes(habit.category));
    }
    
    // Apply sorting
    result = sortHabits(result);
    
    setFilteredHabits(result);
    calculateWeekStats(result);
  }, [habits, selectedCategories, sortBy, sortDirection, weekOffset]);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      const data = await response.json();
      setHabits(data);
      
      // Extract unique categories
      const categories = [...new Set(data.map(habit => habit.category))];
      setCategoryFilters(categories);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const calculateWeekStats = (habitsList) => {
    if (!habitsList.length) {
      setWeekStats({
        totalCompletions: 0,
        completionRate: 0,
        bestDay: '',
        worstDay: ''
      });
      return;
    }

    // Calculate completions per day
    const dayStats = currentWeek.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayCompletions = habitsList.reduce((acc, habit) => {
        const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
        const isCompleted = completionsForDate >= (habit.maxCheckOffs || 1);
        return isCompleted ? acc + 1 : acc;
      }, 0);
      
      const possibleCompletions = habitsList.length;
      const completionRate = possibleCompletions > 0 ? (dayCompletions / possibleCompletions) * 100 : 0;
      
      return { 
        date: dateStr, 
        dayName: formatDate(date).day,
        completions: dayCompletions,
        completionRate
      };
    });

    // Find best and worst days
    const sortedDays = [...dayStats].sort((a, b) => b.completionRate - a.completionRate);
    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];

    // Calculate total stats
    const totalPossibleCompletions = habitsList.length * 7;
    const totalCompletions = dayStats.reduce((acc, day) => acc + day.completions, 0);
    const overallCompletionRate = totalPossibleCompletions > 0 
      ? (totalCompletions / totalPossibleCompletions) * 100 
      : 0;

    setWeekStats({
      totalCompletions,
      completionRate: overallCompletionRate.toFixed(1),
      bestDay: bestDay ? `${bestDay.dayName} (${bestDay.completionRate.toFixed(1)}%)` : 'N/A',
      worstDay: worstDay ? `${worstDay.dayName} (${worstDay.completionRate.toFixed(1)}%)` : 'N/A',
      dayStats
    });
  };

  const sortHabits = (habitsList) => {
    return [...habitsList].sort((a, b) => {
      let compareResult = 0;
      
      if (sortBy === 'name') {
        compareResult = a.name.localeCompare(b.name);
      } else if (sortBy === 'category') {
        compareResult = a.category.localeCompare(b.category);
      } else if (sortBy === 'completion') {
        const aCompletions = currentWeek.filter(date => 
          isHabitCompleted(a, date)).length;
        const bCompletions = currentWeek.filter(date => 
          isHabitCompleted(b, date)).length;
        compareResult = aCompletions - bCompletions;
      }
      
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  };

  const navigateWeek = (direction) => {
    setWeekOffset(prev => prev + direction);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const toggleCategoryFilter = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const isHabitCompleted = (habit, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
    return completionsForDate >= (habit.maxCheckOffs || 1);
  };

  const getCompletionRatio = (habit, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
    return `${completionsForDate}/${habit.maxCheckOffs || 1}`;
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate()
    };
  };

  const toggleHabit = async (habit, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
    let newCompletedDates = [...(habit.completedDates || [])];
    
    if (completionsForDate >= (habit.maxCheckOffs || 1)) {
      // Remove all completions for this date
      newCompletedDates = newCompletedDates.filter(d => d !== dateStr);
    } else {
      // Add one more completion
      newCompletedDates.push(dateStr);
    }

    try {
      await fetch('/api/habits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: habit._id,
          completedDates: newCompletedDates,
        }),
      });

      setHabits(habits.map(h =>
        h._id === habit._id
          ? { ...h, completedDates: newCompletedDates }
          : h
      ));
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const calculateCompletionStatusClass = (habit, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;
    const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
    const maxCheckOffs = habit.maxCheckOffs || 1;
    
    // Calculate completion percentage
    const completionPercentage = Math.min((completionsForDate / maxCheckOffs) * 100, 100);
    
    if (completionPercentage >= 100) {
      return 'bg-green-600 hover:bg-green-700 text-white';
    } else if (completionPercentage > 0) {
      return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    } else if (isToday) {
      return 'bg-blue-600 hover:bg-blue-700 text-gray-200';
    } else {
      return 'bg-gray-700 hover:bg-gray-600 text-gray-400';
    }
  };

  const resetWeek = () => {
    setWeekOffset(0); // Return to current week
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isCurrentWeek = currentWeek.some(date => date.toISOString().split('T')[0] === todayStr);

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-gray-100">Weekly Calendar</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-300"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            <span className="text-gray-300 whitespace-nowrap px-2 py-1 bg-gray-800 rounded-lg">
              {currentWeek[0].toLocaleDateString()} - {currentWeek[6].toLocaleDateString()}
            </span>
            
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-300"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
            
            {!isCurrentWeek && (
              <button
                onClick={resetWeek}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 text-white"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline">Today</span>
              </button>
            )}
            
            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-gray-300
                ${isFilterVisible ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {isFilterVisible && (
          <Card className="bg-gray-800 border-gray-700 mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                    <ListFilter className="h-4 w-4" /> Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleCategoryFilter(category)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors
                          ${selectedCategories.includes(category) 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        {category}
                      </button>
                    ))}
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="px-3 py-1 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" /> Sort By
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'name', label: 'Name' },
                      { id: 'category', label: 'Category' },
                      { id: 'completion', label: 'Completion' }
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => toggleSort(option.id)}
                        className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors
                          ${sortBy === option.id
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        {option.label}
                        {sortBy === option.id && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Total Completions</h3>
              <p className="text-2xl font-bold text-white">{weekStats.totalCompletions}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Completion Rate</h3>
              <p className="text-2xl font-bold text-white">{weekStats.completionRate}%</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Best Day</h3>
              <p className="text-2xl font-bold text-white">{weekStats.bestDay}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Worst Day</h3>
              <p className="text-2xl font-bold text-white">{weekStats.worstDay}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700 overflow-x-auto">
          <CardContent className="p-4">
            <div className="min-w-[768px]">
              <div className="grid grid-cols-[minmax(200px,1fr)_repeat(7,minmax(80px,1fr))] gap-2 mb-4">
                <div className="text-gray-400 font-medium flex items-center">
                  <span className="flex-1">Habit</span>
                  <span className="text-sm text-gray-500">
                    {filteredHabits.length} of {habits.length}
                  </span>
                </div>
                {currentWeek.map(date => {
                  const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                  return (
                    <div key={date.toISOString()} className={`text-center p-1 rounded ${isToday ? 'bg-gray-700' : ''}`}>
                      <div className={`font-medium ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                        {formatDate(date).day}
                      </div>
                      <div className={`text-sm ${isToday ? 'text-gray-300' : 'text-gray-500'}`}>
                        {formatDate(date).date}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {filteredHabits.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {habits.length === 0 
                      ? "No habits found. Create your first habit to get started!"
                      : "No habits match your current filters."}
                  </div>
                ) : (
                  filteredHabits.map(habit => (
                    <div key={habit._id} className="grid grid-cols-[minmax(200px,1fr)_repeat(7,minmax(80px,1fr))] gap-2 items-center py-2 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        {habit.emoji && <span className="text-xl">{habit.emoji}</span>}
                        <div className="flex flex-col">
                          <span className="text-gray-200">{habit.name}</span>
                          <span className="text-xs text-gray-500">{habit.category}</span>
                        </div>
                      </div>
                      {currentWeek.map(date => {
                        const isCompleted = isHabitCompleted(habit, date);
                        return (
                          <div
                            key={date.toISOString()}
                            className="flex items-center justify-center"
                          >
                            <button
                              onClick={() => toggleHabit(habit, date)}
                              className={`
                                w-12 h-12 rounded-lg flex items-center justify-center
                                transition-colors duration-200
                                ${calculateCompletionStatusClass(habit, date)}
                              `}
                              title={`${habit.name}: ${getCompletionRatio(habit, date)} completed`}
                            >
                              {isCompleted 
                                ? <Check className="h-6 w-6" />
                                : getCompletionRatio(habit, date)}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-4 flex justify-between items-center">
          <a href="/analytics" className="text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
            <BarChart3 className="h-5 w-5" />
            <span>View Full Analytics</span>
          </a>
          
          <a href="/habits" className="text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
            <Layers className="h-5 w-5" />
            <span>Manage Habits</span>
          </a>
        </div>
      </div>
    </div>
  );
}