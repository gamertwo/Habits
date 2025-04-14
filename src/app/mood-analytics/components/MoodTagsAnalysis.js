"use client"
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Tag, Filter, ArrowUpDown } from 'lucide-react';

export default function MoodTagsAnalysis({ moods, isLoading }) {
  const [chartData, setChartData] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagMoodCorrelations, setTagMoodCorrelations] = useState([]);
  const [tagIntensityData, setTagIntensityData] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [sortBy, setSortBy] = useState('count'); // count, correlation, intensity

  useEffect(() => {
    if (moods.length > 0) {
      analyzeTagsData();
    }
  }, [moods, sortBy, displayLimit]);

  const analyzeTagsData = () => {
    if (!moods.length) {
      setChartData([]);
      setAllTags([]);
      setTagMoodCorrelations([]);
      setTagIntensityData([]);
      return;
    }

    // Extract all unique tags
    const tagsSet = new Set();
    const tagStats = {};
    
    // Get initial tag counts
    moods.forEach(mood => {
      if (mood.tags && mood.tags.length) {
        mood.tags.forEach(tag => {
          tagsSet.add(tag);
          
          if (!tagStats[tag]) {
            tagStats[tag] = {
              count: 0,
              totalIntensity: 0,
              moodTypes: {
                happy: 0,
                neutral: 0,
                sad: 0,
                love: 0,
                tired: 0
              }
            };
          }
          
          tagStats[tag].count++;
          tagStats[tag].totalIntensity += mood.intensity;
          tagStats[tag].moodTypes[mood.type]++;
        });
      }
    });
    
    const uniqueTags = Array.from(tagsSet);
    setAllTags(uniqueTags);
    
    // Calculate average intensity for each tag
    const tagIntensity = uniqueTags.map(tag => {
      return {
        name: tag,
        avgIntensity: parseFloat((tagStats[tag].totalIntensity / tagStats[tag].count).toFixed(1))
      };
    });
    
    setTagIntensityData(tagIntensity);
    
    // Calculate mood correlations for each tag
    const correlations = uniqueTags.map(tag => {
      const stats = tagStats[tag];
      const dominantMood = Object.entries(stats.moodTypes)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      const dominantPercentage = stats.count > 0 
        ? (stats.moodTypes[dominantMood] / stats.count) * 100 
        : 0;
      
      return {
        name: tag,
        dominantMood,
        dominantPercentage: parseFloat(dominantPercentage.toFixed(1)),
        count: stats.count
      };
    });
    
    setTagMoodCorrelations(correlations);
    
    // Prepare chart data based on sort option
    let data = uniqueTags.map(tag => {
      const stats = tagStats[tag];
      const correlation = correlations.find(c => c.name === tag);
      
      return {
        name: tag,
        count: stats.count,
        avgIntensity: parseFloat((stats.totalIntensity / stats.count).toFixed(1)),
        dominantMood: correlation.dominantMood,
        dominantPercentage: correlation.dominantPercentage
      };
    });
    
    // Sort data
    if (sortBy === 'count') {
      data = data.sort((a, b) => b.count - a.count);
    } else if (sortBy === 'correlation') {
      data = data.sort((a, b) => b.dominantPercentage - a.dominantPercentage);
    } else if (sortBy === 'intensity') {
      data = data.sort((a, b) => b.avgIntensity - a.avgIntensity);
    }
    
    // Limit the number of tags to display
    data = data.slice(0, displayLimit);
    
    setChartData(data);
  };

  const getMoodColor = (moodType) => {
    const colors = {
      happy: '#22c55e',   // green-500
      sad: '#ef4444',     // red-500
      neutral: '#6b7280', // gray-500
      love: '#ec4899',    // pink-500
      tired: '#f59e0b'    // amber-500
    };
    
    return colors[moodType] || '#6b7280';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-sm">
          <p className="font-medium text-gray-200 mb-1">
            <Tag className="h-3 w-3 inline mr-1" />
            {label}
          </p>
          <p className="text-gray-300">
            Count: <span className="font-medium">{data.count}</span>
          </p>
          <p className="text-gray-300">
            Average Intensity: <span className="font-medium">{data.avgIntensity}</span>
          </p>
          <p className="text-gray-300">
            Most Common Mood: <span className="font-medium capitalize" style={{ color: getMoodColor(data.dominantMood) }}>
              {data.dominantMood}
            </span> ({data.dominantPercentage}%)
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

  if (moods.length === 0 || allTags.length === 0) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-400">
        No tag data available for the selected date range
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="text-sm text-gray-400">
          Analyzing {allTags.length} unique tags from your moods
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg">
            <Filter className="h-4 w-4 text-gray-400 ml-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs py-1.5 pr-2 pl-1 text-gray-300 focus:outline-none"
            >
              <option value="count">Sort by Frequency</option>
              <option value="correlation">Sort by Correlation</option>
              <option value="intensity">Sort by Intensity</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg">
            <ArrowUpDown className="h-4 w-4 text-gray-400 ml-2" />
            <select
              value={displayLimit}
              onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
              className="bg-transparent text-xs py-1.5 pr-2 pl-1 text-gray-300 focus:outline-none"
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="15">Top 15</option>
              <option value="20">Top 20</option>
              <option value="100">All Tags</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 80,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span style={{ color: '#d1d5db' }}>{value === 'count' ? 'Frequency' : value}</span>} />
              <Bar
                dataKey="count"
                name="count"
                fill="#3b82f6"  // blue-500
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 h-full">
            <h3 className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-blue-400" />
              Tag Insights
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-gray-400 text-xs mb-2">Top Tag Correlations with Moods</h4>
                <div className="space-y-2">
                  {tagMoodCorrelations
                    .sort((a, b) => b.dominantPercentage - a.dominantPercentage)
                    .slice(0, 5)
                    .map((tag, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-300 truncate max-w-[120px]">{tag.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs capitalize" style={{ color: getMoodColor(tag.dominantMood) }}>
                            {tag.dominantMood}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            ({tag.dominantPercentage}%)
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div>
                <h4 className="text-gray-400 text-xs mb-2">Tags with Highest Intensity</h4>
                <div className="space-y-2">
                  {tagIntensityData
                    .sort((a, b) => b.avgIntensity - a.avgIntensity)
                    .slice(0, 5)
                    .map((tag, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-300 truncate max-w-[120px]">{tag.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-blue-400">
                            {tag.avgIntensity}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">/ 5</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-700">
                <h4 className="text-gray-400 text-xs mb-2">Summary</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>• {allTags.length} unique tags across your mood entries</p>
                  <p>• Most used tag: <span className="font-medium">{chartData[0]?.name || 'N/A'}</span> ({chartData[0]?.count || 0} times)</p>
                  <p>• Tags appear in {moods.filter(m => m.tags && m.tags.length > 0).length} of {moods.length} entries ({Math.round((moods.filter(m => m.tags && m.tags.length > 0).length / moods.length) * 100)}%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}