"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Layers,
  Smile
} from "lucide-react";
import DateRangePicker from './components/DateRangePicker';
import MoodTrendsChart from './components/MoodTrendsChart';
import MoodDistributionChart from './components/MoodDistributionChart';
import MoodIntensityChart from './components/MoodIntensityChart';
import MoodTagsAnalysis from './components/MoodTagsAnalysis';
import MoodDetailedTable from './components/MoodDetailedTable';
import MoodSummaryCards from './components/MoodSummaryCards';

export default function MoodAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [moods, setMoods] = useState([]);
  const [filteredMoods, setFilteredMoods] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days by default
    end: new Date()
  });
  const [filters, setFilters] = useState({
    moodTypes: [], // happy, sad, etc.
    intensities: [], // 1-5
    tags: [], // custom tags
    sortBy: 'date',
    sortDirection: 'desc'
  });
  const [activeTab, setActiveTab] = useState('overview'); // overview, trends, distribution, tags, table

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
    }
  }, [moods, filters]);

  const fetchMoods = async () => {
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

  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'trends', label: 'Trends', icon: <LineChart className="h-4 w-4" /> },
    { id: 'distribution', label: 'Distribution', icon: <PieChart className="h-4 w-4" /> },
    { id: 'tags', label: 'Tags Analysis', icon: <Filter className="h-4 w-4" /> },
    { id: 'table', label: 'Detailed View', icon: <Layers className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-gray-100">Mood Analytics</h1>
          </div>
          
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto mb-6 pb-2">
          <div className="flex space-x-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="space-y-6">
          {/* Summary Cards (always visible) */}
          {!isLoading && (
            <MoodSummaryCards moods={filteredMoods} dateRange={dateRange} />
          )}

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">Mood Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <MoodDistributionChart moods={filteredMoods} isLoading={isLoading} />
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">Mood Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <MoodTrendsChart 
                    moods={filteredMoods} 
                    dateRange={dateRange}
                    isLoading={isLoading} 
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">Mood Intensity</CardTitle>
                </CardHeader>
                <CardContent>
                  <MoodIntensityChart 
                    moods={filteredMoods}
                    dateRange={dateRange}
                    isLoading={isLoading} 
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'trends' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Mood Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodTrendsChart 
                  moods={filteredMoods} 
                  dateRange={dateRange}
                  isLoading={isLoading}
                  isFullView={true} 
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'distribution' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Mood Distribution Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodDistributionChart 
                  moods={filteredMoods}
                  isLoading={isLoading}
                  isFullView={true} 
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'tags' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Tags Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodTagsAnalysis 
                  moods={filteredMoods}
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'table' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Detailed Mood Data</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodDetailedTable 
                  moods={filteredMoods}
                  isLoading={isLoading}
                  updateFilters={updateFilters}
                  filters={filters} 
                />
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="mt-8 flex justify-between items-center">
          <a href="/mood-tracker" className="text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
            <Smile className="h-5 w-5" />
            <span>Back to Mood Tracker</span>
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