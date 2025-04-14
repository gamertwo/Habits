"use client"
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function MoodIntensityChart({ moods, dateRange, isLoading }) {
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('type'); // type, weekday, time
  
  useEffect(() => {
    if (moods.length > 0) {
      generateChartData();
    }
  }, [moods, viewMode]);

  const generateChartData = () => {
    if (!moods.length) {
      setChartData([]);
      return;
    }

    if (viewMode === 'type') {
      // Average intensity by mood type
      const moodTypeData = {};
      
      moods.forEach(mood => {
        if (!moodTypeData[mood.type]) {
          moodTypeData[mood.type] = { 
            totalIntensity: 0, 
            count: 0 
          };
        }
        
        moodTypeData[mood.type].totalIntensity += mood.intensity;
        moodTypeData[mood.type].count++;
      });
      
      const data = Object.entries(moodTypeData).map(([type, stats]) => ({
        name: type,
        avgIntensity: parseFloat((stats.totalIntensity / stats.count).toFixed(1)),
        count: stats.count
      }));
      
      setChartData(data);
    } 
    else if (viewMode === 'weekday') {
      // Average intensity by day of week
      const weekdayData = {
        'Sunday': { totalIntensity: 0, count: 0 },
        'Monday': { totalIntensity: 0, count: 0 },
        'Tuesday': { totalIntensity: 0, count: 0 },
        'Wednesday': { totalIntensity: 0, count: 0 },
        'Thursday': { totalIntensity: 0, count: 0 },
        'Friday': { totalIntensity: 0, count: 0 },
        'Saturday': { totalIntensity: 0, count: 0 }
      };
      
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      moods.forEach(mood => {
        const date = new Date(mood.date);
        const weekday = weekdays[date.getDay()];
        
        weekdayData[weekday].totalIntensity += mood.intensity;
        weekdayData[weekday].count++;
      });
      
      const data = weekdays.map(day => ({
        name: day,
        avgIntensity: weekdayData[day].count > 0 
          ? parseFloat((weekdayData[day].totalIntensity / weekdayData[day].count).toFixed(1))
          : 0,
        count: weekdayData[day].count
      }));
      
      setChartData(data);
    }
    else if (viewMode === 'time') {
      // Average intensity by time of day
      const timeData = {
        'Morning': { totalIntensity: 0, count: 0 },   // 5-11
        'Afternoon': { totalIntensity: 0, count: 0 }, // 12-16
        'Evening': { totalIntensity: 0, count: 0 },   // 17-20
        'Night': { totalIntensity: 0, count: 0 }      // 21-4
      };
      
      moods.forEach(mood => {
        const date = new Date(mood.date);
        const hour = date.getHours();
        let timeOfDay;
        
        if (hour >= 5 && hour < 12) timeOfDay = 'Morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
        else timeOfDay = 'Night';
        
        timeData[timeOfDay].totalIntensity += mood.intensity;
        timeData[timeOfDay].count++;
      });
      
      const timeOrder = ['Morning', 'Afternoon', 'Evening', 'Night'];
      
      const data = timeOrder.map(time => ({
        name: time,
        avgIntensity: timeData[time].count > 0 
          ? parseFloat((timeData[time].totalIntensity / timeData[time].count).toFixed(1))
          : 0,
        count: timeData[time].count
      }));
      
      setChartData(data);
    }
  };

  const getTypeColors = () => {
    return {
      avgIntensity: '#3b82f6', // blue-500
      count: '#9ca3af'         // gray-400
    };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-sm">
          <p className="font-medium text-gray-200 capitalize mb-1">{label}</p>
          <p className="text-gray-300">
            Average Intensity: <span className="font-medium">{payload[0].value}</span>
          </p>
          <p className="text-gray-300">
            Entry Count: <span className="font-medium">{payload[1].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

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
          Average mood intensity analysis
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('type')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'type' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            By Type
          </button>
          <button
            onClick={() => setViewMode('weekday')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'weekday' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            By Weekday
          </button>
          <button
            onClick={() => setViewMode('time')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'time' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            By Time
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
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
            dataKey="name" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            tickMargin={10}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            domain={[0, 5]}
            label={{ 
              value: 'Intensity', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: 12 } 
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ 
              value: 'Count', 
              angle: 90, 
              position: 'insideRight',
              style: { fill: '#9ca3af', fontSize: 12 } 
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => <span style={{ color: '#d1d5db' }}>{value === 'avgIntensity' ? 'Average Intensity' : 'Entry Count'}</span>}
          />
          <Bar 
            yAxisId="left"
            dataKey="avgIntensity" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="count" 
            fill="#9ca3af" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}