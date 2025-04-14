"use client"
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, 
  Calendar,
  Activity,
  ArrowUp,
  ArrowDown,
  Smile,
  Frown,
  BarChart
} from 'lucide-react';

export default function MoodSummaryCards({ moods, dateRange }) {
  // Calculate summary statistics
  const calculateStats = () => {
    if (!moods || moods.length === 0) {
      return {
        totalEntries: 0,
        avgIntensity: 0,
        mostCommonMood: 'N/A',
        moodChange: 0,
        positivePercentage: 0,
        mostFrequentTime: 'N/A',
        avgEntriesPerDay: 0
      };
    }

    // Total entries
    const totalEntries = moods.length;
    
    // Average intensity
    const avgIntensity = (moods.reduce((sum, mood) => sum + mood.intensity, 0) / totalEntries).toFixed(1);
    
    // Most common mood
    const moodCounts = moods.reduce((counts, mood) => {
      counts[mood.type] = (counts[mood.type] || 0) + 1;
      return counts;
    }, {});
    const mostCommonMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Mood change (trend)
    let moodChange = 0;
    if (moods.length >= 2) {
      // Sort by date first
      const sortedMoods = [...moods].sort((a, b) => a.date - b.date);
      
      // Get average intensity of first week and last week
      const firstWeekMoods = sortedMoods.slice(0, Math.min(7, Math.ceil(sortedMoods.length / 3)));
      const lastWeekMoods = sortedMoods.slice(Math.max(0, sortedMoods.length - Math.ceil(sortedMoods.length / 3)));
      
      const firstWeekAvg = firstWeekMoods.reduce((sum, mood) => sum + mood.intensity, 0) / firstWeekMoods.length;
      const lastWeekAvg = lastWeekMoods.reduce((sum, mood) => sum + mood.intensity, 0) / lastWeekMoods.length;
      
      moodChange = (((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100).toFixed(1);
    }
    
    // Positive mood percentage
    const positiveMoods = moods.filter(mood => ['happy', 'love'].includes(mood.type)).length;
    const positivePercentage = ((positiveMoods / totalEntries) * 100).toFixed(1);
    
    // Most frequent time of day
    const timeOfDayCounts = moods.reduce((counts, mood) => {
      const hour = new Date(mood.date).getHours();
      let timeOfDay;
      
      if (hour >= 5 && hour < 12) timeOfDay = 'Morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
      else timeOfDay = 'Night';
      
      counts[timeOfDay] = (counts[timeOfDay] || 0) + 1;
      return counts;
    }, {});
    
    const mostFrequentTime = Object.entries(timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Average entries per day
    const daysDiff = Math.max(1, Math.round((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)));
    const avgEntriesPerDay = (totalEntries / daysDiff).toFixed(1);
    
    return {
      totalEntries,
      avgIntensity,
      mostCommonMood,
      moodChange,
      positivePercentage,
      mostFrequentTime,
      avgEntriesPerDay
    };
  };

  const stats = calculateStats();

  const getMoodChangeColor = () => {
    const change = parseFloat(stats.moodChange);
    if (change > 5) return 'text-green-400';
    if (change < -5) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Mood Entries</p>
              <p className="text-2xl font-bold text-white">{stats.totalEntries}</p>
              <p className="text-xs text-gray-500 mt-1">Avg {stats.avgEntriesPerDay} per day</p>
            </div>
            <Calendar className="h-6 w-6 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Average Intensity</p>
              <p className="text-2xl font-bold text-white">{stats.avgIntensity}/5</p>
              <div className="flex items-center text-xs mt-1">
                <span className={getMoodChangeColor()}>
                  {stats.moodChange > 0 ? (
                    <ArrowUp className="h-3 w-3 inline mr-1" />
                  ) : stats.moodChange < 0 ? (
                    <ArrowDown className="h-3 w-3 inline mr-1" />
                  ) : null}
                  {Math.abs(stats.moodChange)}%
                </span>
                <span className="text-gray-500 ml-1">change</span>
              </div>
            </div>
            <Activity className="h-6 w-6 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Most Common Mood</p>
              <p className="text-2xl font-bold text-white capitalize">{stats.mostCommonMood}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.positivePercentage}% positive moods
              </p>
            </div>
            {stats.positivePercentage >= 50 ? (
              <Smile className="h-6 w-6 text-green-400" />
            ) : (
              <Frown className="h-6 w-6 text-red-400" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">Most Active Time</p>
              <p className="text-2xl font-bold text-white">{stats.mostFrequentTime}</p>
              <p className="text-xs text-gray-500 mt-1">When you record moods</p>
            </div>
            <BarChart className="h-6 w-6 text-blue-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}