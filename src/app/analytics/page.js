"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie } from 'recharts';
import { Download, Upload, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [habits, setHabits] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    processChartData();
  }, [habits, selectedTimeframe]);

  const fetchHabits = async () => {
    const response = await fetch('/api/habits');
    const data = await response.json();
    setHabits(data);
  };

  const processChartData = () => {
    const timeframes = {
      week: 7,
      month: 30,
      year: 365
    };

    const days = timeframes[selectedTimeframe];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const completions = habits.reduce((acc, habit) => {
        const dayCompletions = habit.completedDates?.filter(d => d === dateStr).length || 0;
        return acc + dayCompletions;
      }, 0);

      data.push({
        date: dateStr,
        completions
      });
    }
    setChartData(data);
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

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-100">Analytics</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              <div className="flex gap-2">
                {['week', 'month', 'year'].map(timeframe => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </button>
                ))}
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
                    <XAxis dataKey="date" stroke="#9CA3AF" />
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
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                    <Bar dataKey="completions" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}