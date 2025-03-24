"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, AreaChart, Area } from 'recharts';
import { Download, Upload, BarChart3, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const [habits, setHabits] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [streakData, setStreakData] = useState([]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [habitStats, setHabitStats] = useState([]);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    processChartData();
    processStreakData();
    calculateHabitStats();
  }, [habits, selectedTimeframe, customStartDate, customEndDate, isCustomRange]);

  const fetchHabits = async () => {
    const response = await fetch('/api/habits');
    const data = await response.json();
    setHabits(data);
    
    // Set default custom dates when habits are loaded
    if (data.length > 0 && !customStartDate) {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      setCustomStartDate(oneMonthAgo.toISOString().split('T')[0]);
      setCustomEndDate(today.toISOString().split('T')[0]);
    }
  };

  const calculateHabitStats = () => {
    if (!habits.length) return;

    let stats = habits.map(habit => {
      let dateRange = [];
      
      if (isCustomRange && customStartDate && customEndDate) {
        // Generate dates for custom range
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dateRange.push(d.toISOString().split('T')[0]);
        }
      } else {
        // Use predefined timeframe
        const days = {
          week: 7,
          month: 30,
          year: 365
        }[selectedTimeframe];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dateRange.push(date.toISOString().split('T')[0]);
        }
      }

      // Calculate completions in date range
      const completions = habit.completedDates?.filter(date => 
        dateRange.includes(date)
      ).length || 0;
      
      // Calculate completion rate
      const totalPossibleCompletions = dateRange.length * (habit.maxCheckOffs || 1);
      const completionRate = totalPossibleCompletions > 0 
        ? (completions / totalPossibleCompletions) * 100 
        : 0;

      // Calculate longest streak
      let currentStreak = 0;
      let longestStreak = 0;
      let lastDate = null;

      const sortedDates = [...(habit.completedDates || [])]
        .filter(date => dateRange.includes(date))
        .sort();
      
      sortedDates.forEach(date => {
        if (!lastDate) {
          currentStreak = 1;
        } else {
          const lastDateObj = new Date(lastDate);
          const currentDateObj = new Date(date);
          lastDateObj.setDate(lastDateObj.getDate() + 1);
          
          if (lastDateObj.toISOString().split('T')[0] === date) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }
        
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        
        lastDate = date;
      });

      return {
        id: habit.id,
        name: habit.name,
        category: habit.category,
        completions,
        completionRate: completionRate.toFixed(1),
        longestStreak
      };
    });

    setHabitStats(stats);
  };

  const processChartData = () => {
    let dateRange = [];
    
    if (isCustomRange && customStartDate && customEndDate) {
      // Generate dates for custom range
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      // Safety check to prevent excessive ranges
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        alert("Date range is too large. Please select a range of 365 days or less.");
        return;
      }
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateRange.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Use predefined timeframe
      const days = {
        week: 7,
        month: 30,
        year: 365
      }[selectedTimeframe];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateRange.push(date.toISOString().split('T')[0]);
      }
    }

    const data = dateRange.map(dateStr => {
      const completions = habits.reduce((acc, habit) => {
        const dayCompletions = habit.completedDates?.filter(d => d === dateStr).length || 0;
        return acc + dayCompletions;
      }, 0);

      return {
        date: dateStr,
        completions
      };
    });
    
    setChartData(data);
  };

  const processStreakData = () => {
    let dateRange = [];
    
    if (isCustomRange && customStartDate && customEndDate) {
      // Generate dates for custom range
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateRange.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Use most recent 30 days for streak data regardless of timeframe
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dateRange.push(date.toISOString().split('T')[0]);
      }
    }

    const data = dateRange.map(date => {
      const streaks = habits.filter(habit => {
        const completionsForDate = habit.completedDates?.filter(d => d === date).length || 0;
        return completionsForDate >= (habit.maxCheckOffs || 1);
      }).length;

      return {
        date,
        streaks,
        totalHabits: habits.length,
        completionRate: habits.length > 0 ? (streaks / habits.length) * 100 : 0
      };
    });

    setStreakData(data);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(habits, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'habits-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        await fetch('/api/habits/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importedData),
        });
        fetchHabits();
      } catch (error) {
        console.error('Error importing data:', error);
      }
    };
    reader.readAsText(file);
  };

  const getCategoryData = () => {
    const categoryCount = habits.reduce((acc, habit) => {
      acc[habit.category] = (acc[habit.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const toggleCustomRange = () => {
    setIsCustomRange(!isCustomRange);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-100">Analytics</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-white">Data Export/Import</CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={exportData}
                    className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-5 w-5 text-white" />
                  </button>
                  <label className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      onChange={importData}
                      accept=".json"
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Timeframe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['week', 'month', 'year'].map(timeframe => (
                  <button
                    key={timeframe}
                    onClick={() => {
                      setSelectedTimeframe(timeframe);
                      setIsCustomRange(false);
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedTimeframe === timeframe && !isCustomRange
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </button>
                ))}
                <button
                  onClick={toggleCustomRange}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                    isCustomRange
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Custom
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gray-800 border-gray-700 ${!isCustomRange ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg text-white">Custom Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    disabled={!isCustomRange}
                    className="px-3 py-2 bg-gray-700 rounded-lg text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    disabled={!isCustomRange}
                    className="px-3 py-2 bg-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Summary for {isCustomRange 
                  ? `${customStartDate} to ${customEndDate}` 
                  : selectedTimeframe}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Total Completions</p>
                  <p className="text-2xl font-bold text-white">
                    {chartData.reduce((sum, day) => sum + day.completions, 0)}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Avg. Daily Completions</p>
                  <p className="text-2xl font-bold text-white">
                    {chartData.length > 0 
                      ? (chartData.reduce((sum, day) => sum + day.completions, 0) / chartData.length).toFixed(1) 
                      : '0'}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Best Performing Habit</p>
                  <p className="text-2xl font-bold text-white">
                    {habitStats.length > 0 
                      ? habitStats.sort((a, b) => b.completionRate - a.completionRate)[0]?.name || 'None'
                      : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Completion Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        // Simplify date format for readability
                        if (chartData.length > 30) {
                          return value.slice(5); // MM-DD
                        }
                        return value;
                      }}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                    <Line type="monotone" dataKey="completions" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#3B82F6"
                      label
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Completion Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        // Simplify date format for readability
                        if (chartData.length > 30) {
                          return value.slice(5); // MM-DD
                        }
                        return value;
                      }}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                    <Bar dataKey="completions" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Streak Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={streakData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        // Simplify date format for readability
                        if (streakData.length > 30) {
                          return value.slice(5); // MM-DD
                        }
                        return value;
                      }}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937' }}
                      formatter={(value, name) => {
                        if (name === 'completionRate') return `${value.toFixed(1)}%`;
                        return value;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="streaks" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3}
                      name="Completed Habits"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completionRate" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                      name="Completion Rate (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Habit Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-gray-200">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left">Habit</th>
                      <th className="py-3 px-4 text-left">Category</th>
                      <th className="py-3 px-4 text-center">Completions</th>
                      <th className="py-3 px-4 text-center">Completion Rate</th>
                      <th className="py-3 px-4 text-center">Longest Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {habitStats.map(habit => (
                      <tr key={habit.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">{habit.name}</td>
                        <td className="py-3 px-4">{habit.category}</td>
                        <td className="py-3 px-4 text-center">{habit.completions}</td>
                        <td className="py-3 px-4 text-center">{habit.completionRate}%</td>
                        <td className="py-3 px-4 text-center">{habit.longestStreak} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}