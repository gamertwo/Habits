"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Trash2 } from "lucide-react";

export default function TrackHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const response = await fetch('/api/habits');
    const data = await response.json();
    setHabits(data);
    setLoading(false);
  };

  const deleteHabit = async (habitId) => {
    try {
      await fetch(`/api/habits?id=${habitId}`, {
        method: 'DELETE',
      });
      setHabits(habits.filter(h => h._id !== habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const toggleHabit = async (habit) => {
    const completionsForDate = getCompletionsForDate(habit, selectedDate);
    let newCompletedDates = [...(habit.completedDates || [])];
    
    if (completionsForDate >= (habit.maxCheckOffs || 1)) {
      newCompletedDates = newCompletedDates.filter(date => date !== selectedDate);
    } else {
      newCompletedDates.push(selectedDate);
    }

    try {
      await fetch('/api/habits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: habit._id,
          completedDates: newCompletedDates,
        }),
      });

      setHabits(habits.map(h =>
        h._id === habit._id
          ? { ...h, completedDates: newCompletedDates }
          : h
      ));
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const getCompletionsForDate = (habit, date) => {
    return habit.completedDates?.filter(d => d === date).length || 0;
  };

  const getCompletionRatio = (habit) => {
    const completions = getCompletionsForDate(habit, selectedDate);
    const maxCheckOffs = habit.maxCheckOffs || 1;
    return `${completions}/${maxCheckOffs}`;
  };

  const getProgressColor = (habit) => {
    const completions = getCompletionsForDate(habit, selectedDate);
    const maxCheckOffs = habit.maxCheckOffs || 1;
    const ratio = completions / maxCheckOffs;

    if (ratio === 0) return 'bg-gray-700 hover:bg-gray-600';
    if (ratio < 1) return 'bg-yellow-600 hover:bg-yellow-700';
    return 'bg-green-600 hover:bg-green-700';
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 p-4">Loading habits...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 md:gap-3 mb-6">
          <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
          <h1 className="text-xl md:text-3xl font-bold text-gray-100">Track Habits</h1>
        </div>

        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4 md:p-6">
            <label className="block text-sm font-medium mb-2 text-gray-200">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-400">
              {formatDate(selectedDate)}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {habits.map(habit => (
            <Card key={habit._id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {habit.emoji && <span className="text-xl">{habit.emoji}</span>}
                      <span className="text-lg text-white font-medium">{habit.name}</span>
                      {habit.category && (
                        <span className="text-sm text-gray-400">({habit.category})</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400 mt-1">
                      Progress: {getCompletionRatio(habit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleHabit(habit)}
                      className={`px-4 py-2 rounded-lg transition-colors ${getProgressColor(habit)}`}
                    >
                      {getCompletionsForDate(habit, selectedDate) >= (habit.maxCheckOffs || 1)
                        ? 'Completed'
                        : `${getCompletionRatio(habit)}`}
                    </button>
                    <button
                      onClick={() => deleteHabit(habit._id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-700"
                      aria-label="Delete habit"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
