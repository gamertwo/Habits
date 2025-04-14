"use client"
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function MoodTrendsChart({ moods, dateRange, isLoading, isFullView = false }) {
  const [chartData, setChartData] = useState([]);
  const [timeGrouping, setTimeGrouping] = useState('day'); // day, week, month

  useEffect(() => {
    if (moods.length > 0) {
      generateChartData();
    }
  }, [moods, timeGrouping]);

  const generateChartData = () => {
    // If no moods, return empty array
    if (!moods.length) {
      setChartData([]);
      return;
    }

    // Sort moods by date
    const sortedMoods = [...moods].sort((a, b) => a.date - b.date);
    
    // Determine time grouping based on date range or manual selection
    const daysDiff = Math.round((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    const autoTimeGrouping = daysDiff > 60 ? 'month' : daysDiff > 14 ? 'week' : 'day';
    
    const grouping = timeGrouping || autoTimeGrouping;
    
    // Group moods by selected time period
    const groupedMoods = {};
    const moodTypes = new Set();
    
    sortedMoods.forEach(mood => {
      let groupKey;
      const date = new Date(mood.date);
      
      if (grouping === 'day') {
        groupKey = date.toISOString().split('T')[0];
      } else if (grouping === 'week') {
        // Find the sunday of the week
        const day = date.getDay();
        const diff = date.getDate() - day;
        const sunday = new Date(date);
        sunday.setDate(diff);
        groupKey = sunday.toISOString().split('T')[0];
      } else if (grouping === 'month') {
        groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      if (!groupedMoods[groupKey]) {
        groupedMoods[groupKey] = {
          date: date,
          totalIntensity: 0,
          count: 0
        };
      }
      
      // Count occurrences of each mood type
      moodTypes.add(mood.type);
      if (!groupedMoods[groupKey][mood.type]) {
        groupedMoods[groupKey][mood.type] = 0;
      }
      groupedMoods[groupKey][mood.type]++;
      
      // Calculate average intensity
      groupedMoods[groupKey].totalIntensity += mood.intensity;
      groupedMoods[groupKey].count++;
    });
    
    // Convert to array and calculate averages
    const result = Object.entries(groupedMoods).map(([key, data]) => {
      const avgIntensity = data.count > 0 ? data.totalIntensity / data.count : 0;
      
      // Format date labels based on grouping
      let dateLabel;
      if (grouping === 'day') {
        dateLabel = data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (grouping === 'week') {
        const endOfWeek = new Date(data.date);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        dateLabel = `${data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { day: 'numeric' })}`;
      } else if (grouping === 'month') {
        dateLabel = data.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      return {
        key,
        dateLabel,
        date: data.date,
        avgIntensity: parseFloat(avgIntensity.toFixed(1)),
        ...Array.from(moodTypes).reduce((acc, type) => {
          acc[type] = data[type] || 0;
          return acc;
        }, {})
      };
    });
    
    // Sort by date
    result.sort((a, b) => a.date - b.date);
    
    setChartData(result);
  };

  const getLineColors = () => {
    return {
      avgIntensity: '#3b82f6', // blue-500
      happy: '#22c55e',       // green-500
      sad: '#ef4444',         // red-500
      neutral: '#6b7280',     // gray-500
      love: '#ec4899',        // pink-500
      tired: '#f59e0b'        // amber-500
    };
  };

  const colors = getLineColors();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (moods.length === 0) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-400">
        No mood data available for the selected date range
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Mood trends over time
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeGrouping('day')}
            className={`px-2 py-1 text-xs rounded ${
              timeGrouping === 'day' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeGrouping('week')}
            className={`px-2 py-1 text-xs rounded ${
              timeGrouping === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeGrouping('month')}
            className={`px-2 py-1 text-xs rounded ${
              timeGrouping === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={isFullView ? 400 : 300}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 5,
            bottom: 25,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="dateLabel" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              borderColor: '#374151',
              color: '#e5e7eb' 
            }} 
            labelStyle={{ color: '#e5e7eb' }}
            itemStyle={{ color: '#e5e7eb' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => <span style={{ color: '#d1d5db', textTransform: 'capitalize' }}>{value}</span>}
          />
          
          {/* Intensity line */}
          <Line
            type="monotone"
            dataKey="avgIntensity"
            name="Average Intensity"
            stroke={colors.avgIntensity}
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          
          {/* Only show mood type lines in full view */}
          {isFullView && Object.keys(colors)
            .filter(key => key !== 'avgIntensity' && chartData.some(item => item[key] > 0))
            .map(moodType => (
              <Line
                key={moodType}
                type="monotone"
                dataKey={moodType}
                name={moodType.charAt(0).toUpperCase() + moodType.slice(1)}
                stroke={colors[moodType]}
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            ))
          }
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}