"use client"
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2, Smile, Meh, Frown, Heart, Coffee } from 'lucide-react';

export default function MoodDistributionChart({ moods, isLoading, isFullView = false }) {
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('type'); // type or intensity

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
      // Group by mood type
      const moodCounts = moods.reduce((counts, mood) => {
        counts[mood.type] = (counts[mood.type] || 0) + 1;
        return counts;
      }, {});
      
      const data = Object.entries(moodCounts).map(([type, count]) => ({
        name: type,
        value: count,
        percentage: ((count / moods.length) * 100).toFixed(1)
      }));
      
      setChartData(data);
    } else {
      // Group by intensity
      const intensityCounts = moods.reduce((counts, mood) => {
        counts[mood.intensity] = (counts[mood.intensity] || 0) + 1;
        return counts;
      }, {});
      
      const data = Object.entries(intensityCounts).map(([intensity, count]) => ({
        name: `Intensity ${intensity}`,
        value: count,
        intensity: parseInt(intensity),
        percentage: ((count / moods.length) * 100).toFixed(1)
      }));
      
      setChartData(data.sort((a, b) => a.intensity - b.intensity));
    }
  };

  const getTypeColors = () => {
    return {
      happy: '#22c55e',    // green-500
      sad: '#ef4444',      // red-500
      neutral: '#6b7280',  // gray-500
      love: '#ec4899',     // pink-500
      tired: '#f59e0b'     // amber-500
    };
  };

  const getIntensityColors = () => {
    return [
      '#475569', // slate-600
      '#3b82f6', // blue-500
      '#8b5cf6', // violet-500
      '#f97316', // orange-500
      '#dc2626'  // red-600
    ];
  };

  const getMoodIcon = (type) => {
    switch (type) {
      case 'happy':
        return <Smile className="h-5 w-5" />;
      case 'neutral':
        return <Meh className="h-5 w-5" />;
      case 'sad':
        return <Frown className="h-5 w-5" />;
      case 'love':
        return <Heart className="h-5 w-5" />;
      case 'tired':
        return <Coffee className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-sm">
          <p className="font-medium text-gray-200 capitalize flex items-center gap-1.5 mb-1">
            {viewMode === 'type' && getMoodIcon(data.name)}
            {data.name}
          </p>
          <p className="text-gray-300">
            Count: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-gray-300">
            Percentage: <span className="font-medium">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegendText = (value) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
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
          Distribution of your moods
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
            onClick={() => setViewMode('intensity')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'intensity' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            By Intensity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={isFullView ? "col-span-1" : "col-span-2 md:col-span-1"}>
          <ResponsiveContainer width="100%" height={isFullView ? 400 : 300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={isFullView ? 120 : 80}
                innerRadius={isFullView ? 60 : 40}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${percentage}%`}
              >
                {chartData.map((entry, index) => {
                  const colors = viewMode === 'type' ? getTypeColors() : getIntensityColors();
                  const colorKey = viewMode === 'type' ? entry.name : entry.intensity - 1;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={viewMode === 'type' ? colors[entry.name] : colors[colorKey]}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={renderLegendText}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ paddingLeft: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {isFullView && (
          <div className="col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 h-full">
              <h3 className="text-gray-300 text-sm font-medium mb-3">Mood Distribution Details</h3>
              
              <div className="space-y-3">
                {chartData.map((item, index) => {
                  const colors = viewMode === 'type' ? getTypeColors() : getIntensityColors();
                  const colorKey = viewMode === 'type' ? item.name : item.intensity - 1;
                  const color = viewMode === 'type' ? colors[item.name] : colors[colorKey];
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-gray-300 capitalize flex items-center gap-1.5">
                          {viewMode === 'type' && getMoodIcon(item.name)}
                          {renderLegendText(item.name)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-200">{item.value}</div>
                        <div className="text-xs text-gray-400">{item.percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Entries:</span>
                  <span className="font-medium text-gray-300">{moods.length}</span>
                </div>
                {viewMode === 'type' && (
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Unique Mood Types:</span>
                    <span className="font-medium text-gray-300">{chartData.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}