"use client"
import { Card, CardContent } from "@/components/ui/card";
import { 
  Smile, 
  Meh, 
  Frown, 
  Flame, 
  Coffee, 
  BarChart3,
  Tag,
  AlertTriangle
} from 'lucide-react';

const moodIcons = {
  happy: <Smile className="h-5 w-5" />,
  neutral: <Meh className="h-5 w-5" />,
  sad: <Frown className="h-5 w-5" />,
  love: <Flame className="h-5 w-5" />,
  tired: <AlertTriangle className="h-5 w-5" />
};

const moodColors = {
  happy: 'text-green-400',
  neutral: 'text-blue-400',
  sad: 'text-red-400',
  love: 'text-pink-400',
  tired: 'text-yellow-400'
};

export default function MoodStats({ stats }) {
  const { averageMood, moodCounts, topTags, bestDay, worstDay } = stats;
  
  // Format mood counts for display
  const formattedMoodCounts = Object.entries(moodCounts || {}).map(([type, count]) => ({
    type,
    count,
    icon: moodIcons[type] || <Meh className="h-5 w-5" />,
    color: moodColors[type] || 'text-gray-400'
  }));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <h3 className="text-gray-400 text-sm mb-1">Average Mood</h3>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <p className="text-2xl font-bold text-white">{averageMood || '0.0'}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <h3 className="text-gray-400 text-sm mb-1">Mood Types</h3>
          {formattedMoodCounts.length > 0 ? (
            <div className="space-y-1">
              {formattedMoodCounts.map(mood => (
                <div key={mood.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={mood.color}>{mood.icon}</span>
                    <span className="text-sm text-gray-300 capitalize">{mood.type}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{mood.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <h3 className="text-gray-400 text-sm mb-1">Best & Worst Days</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Best:</span>
              <span className="text-sm font-medium text-green-400">{bestDay || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Worst:</span>
              <span className="text-sm font-medium text-red-400">{worstDay || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <h3 className="text-gray-400 text-sm mb-1">Top Tags</h3>
          {topTags && topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTags.map((tagInfo, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-full"
                >
                  <Tag className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-gray-300">{tagInfo.tag}</span>
                  <span className="text-xs font-medium text-gray-400">({tagInfo.count})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tags</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}