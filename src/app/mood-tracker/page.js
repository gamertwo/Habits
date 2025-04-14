"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  BarChart3,
  Layers,
  Smile,
  Filter,
  ArrowUpDown
} from "lucide-react";
import MoodSelector from './components/MoodSelector';
import MoodCalendar from './components/MoodCalendar';
import MoodStats from './components/MoodStats';
import MoodFilters from './components/MoodFilters';
import DataExportImport from './components/DataExportImport';

export default function MoodTracker() {
  const [moods, setMoods] = useState([]);
  const [filteredMoods, setFilteredMoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    moodTypes: [], // happy, sad, etc.
    intensities: [], // 1-5
    tags: [], // custom tags
    sortBy: 'date',
    sortDirection: 'desc'
  });
  const [moodStats, setMoodStats] = useState({
    averageMood: 0,
    moodCounts: {},
    topTags: [],
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
    
    return {
      start: week[0],
      end: week[6],
      days: week
    };
  };

  // Initialize date range on component mount
  useEffect(() => {
    const { start, end } = getWeekDates(weekOffset);
    setDateRange({ start, end });
  }, [weekOffset]);

  // Fetch moods when date range changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchMoods();
    }
  }, [dateRange]);

  // Apply filters when moods or filters change
  useEffect(() => {
    if (moods.length > 0) {
      applyFilters();
      calculateStats(filteredMoods);
    }
  }, [moods, filters]);

  const fetchMoods = async () => {
    if (!dateRange.start || !dateRange.end) return;
    
    setIsLoading(true);
    try {
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      
      const response = await fetch(`/api/moods?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      
      // Convert string dates to Date objects for easier manipulation
      const processedData = data.map(mood => ({
        ...mood,
        date: new Date(mood.date)
      }));
      
      setMoods(processedData);
      setFilteredMoods(processedData);
    } catch (error) {
      console.error("Error fetching moods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWeek = (direction) => {
    setWeekOffset(prev => {
      const newOffset = prev + direction;
      const { start, end } = getWeekDates(newOffset);
      setDateRange({ start, end });
      return newOffset;
    });
  };

  const resetWeek = () => {
    setWeekOffset(0);
    const { start, end } = getWeekDates(0);
    setDateRange({ start, end });
  };

  const applyFilters = () => {
    let result = [...moods];
    
    // Filter by mood types
    if (filters.moodTypes.length > 0) {
      result = result.filter(mood => filters.moodTypes.includes(mood.type));
    }
    
    // Filter by intensity
    if (filters.intensities.length > 0) {
      result = result.filter(mood => filters.intensities.includes(mood.intensity));
    }
    
    // Filter by tags
    if (filters.tags.length > 0) {
      result = result.filter(mood => 
        mood.tags && mood.tags.some(tag => filters.tags.includes(tag))
      );
    }
    
    // Sort
    result = sortMoods(result);
    
    setFilteredMoods(result);
  };

  const sortMoods = (moodList) => {
    return [...moodList].sort((a, b) => {
      let compareResult = 0;
      
      if (filters.sortBy === 'date') {
        compareResult = a.date - b.date;
      } else if (filters.sortBy === 'intensity') {
        compareResult = a.intensity - b.intensity;
      } else if (filters.sortBy === 'type') {
        compareResult = a.type.localeCompare(b.type);
      }
      
      return filters.sortDirection === 'asc' ? compareResult : -compareResult;
    });
  };

  const calculateStats = (moodsList) => {
    if (!moodsList.length) {
      setMoodStats({
        averageMood: 0,
        moodCounts: {},
        topTags: [],
        bestDay: '',
        worstDay: ''
      });
      return;
    }

    // Calculate average mood intensity
    const totalIntensity = moodsList.reduce((sum, mood) => sum + mood.intensity, 0);
    const averageMood = totalIntensity / moodsList.length;
    
    // Count moods by type
    const moodCounts = moodsList.reduce((counts, mood) => {
      counts[mood.type] = (counts[mood.type] || 0) + 1;
      return counts;
    }, {});
    
    // Count tags
    const tagCounts = {};
    moodsList.forEach(mood => {
      if (mood.tags && mood.tags.length) {
        mood.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Get top 3 tags
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));
    
    // Find best and worst days based on average mood per day
    const moodsByDay = moodsList.reduce((days, mood) => {
      const dayStr = mood.date.toISOString().split('T')[0];
      if (!days[dayStr]) {
        days[dayStr] = { total: 0, count: 0 };
      }
      days[dayStr].total += mood.intensity;
      days[dayStr].count++;
      days[dayStr].average = days[dayStr].total / days[dayStr].count;
      return days;
    }, {});
    
    const dayEntries = Object.entries(moodsByDay);
    if (dayEntries.length > 0) {
      const sortedDays = dayEntries.sort((a, b) => b[1].average - a[1].average);
      
      const formatDayStr = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      };
      
      const bestDay = sortedDays[0];
      const worstDay = sortedDays[sortedDays.length - 1];
      
      setMoodStats({
        averageMood: averageMood.toFixed(1),
        moodCounts,
        topTags,
        bestDay: `${formatDayStr(bestDay[0])} (${bestDay[1].average.toFixed(1)})`,
        worstDay: `${formatDayStr(worstDay[0])} (${worstDay[1].average.toFixed(1)})`
      });
    }
  };

  const saveMood = async (moodData) => {
    try {
      const response = await fetch('/api/moods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moodData),
      });
      
      if (response.ok) {
        // Refresh the mood list
        fetchMoods();
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  const deleteMood = async (moodId) => {
    try {
      const response = await fetch(`/api/moods?id=${moodId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh the mood list
        fetchMoods();
      }
    } catch (error) {
      console.error('Error deleting mood:', error);
    }
  };

  const updateMood = async (moodId, updatedData) => {
    try {
      const response = await fetch('/api/moods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: moodId,
          ...updatedData
        }),
      });
      
      if (response.ok) {
        // Refresh the mood list
        fetchMoods();
      }
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isCurrentWeek = dateRange.start && 
    dateRange.end && 
    new Date(todayStr) >= dateRange.start && 
    new Date(todayStr) <= dateRange.end;

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Smile className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-gray-100">Mood Tracker</h1>
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
              {dateRange.start && dateRange.start.toLocaleDateString()} - {dateRange.end && dateRange.end.toLocaleDateString()}
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
              <MoodFilters 
                filters={filters} 
                updateFilters={updateFilters} 
                moods={moods}
              />
            </CardContent>
          </Card>
        )}

        <MoodStats stats={moodStats} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <div className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">Record Mood</CardTitle>
                </CardHeader>
                <CardContent>
                  <MoodSelector onSave={saveMood} />
                </CardContent>
              </Card>
              
              <DataExportImport 
                onImportSuccess={fetchMoods} 
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Your Mood Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodCalendar 
                  moods={filteredMoods} 
                  week={getWeekDates(weekOffset).days}
                  onDelete={deleteMood}
                  onUpdate={updateMood}
                  onAddMood={saveMood}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <a href="/mood-analytics" className="text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
            <BarChart3 className="h-5 w-5" />
            <span>View Full Analytics</span>
          </a>
          
          <a href="/" className="text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
            <Layers className="h-5 w-5" />
            <span>Habit Tracker</span>
          </a>
        </div>
      </div>
    </div>
  );
}