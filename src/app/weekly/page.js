"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Check, ChevronLeft, ChevronRight } from "lucide-react";

export default function WeeklyView() {
  const [habits, setHabits] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = (offset = 0) => {
    const week = [];
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay() + (offset * 7));

    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const currentWeek = getWeekDates(weekOffset);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const response = await fetch('/api/habits');
    const data = await response.json();
    setHabits(data);
  };

  const navigateWeek = (direction) => {
    setWeekOffset(prev => prev + direction);
  };

  const isHabitCompleted = (habit, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
    return completionsForDate >= (habit.maxCheckOffs || 1);
  };

  const getCompletionRatio = (habit, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
    return `${completionsForDate}/${habit.maxCheckOffs || 1}`;
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate()
    };
  };

  const toggleHabit = async (habit, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completionsForDate = habit.completedDates?.filter(d => d === dateStr).length || 0;
    let newCompletedDates = [...(habit.completedDates || [])];
    
    if (completionsForDate >= (habit.maxCheckOffs || 1)) {
      newCompletedDates = newCompletedDates.filter(d => d !== dateStr);
    } else {
      newCompletedDates.push(dateStr);
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

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-gray-100">Weekly Calendar</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-300"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Previous Week</span>
            </button>
            <span className="text-gray-300 whitespace-nowrap">
              {currentWeek[0].toLocaleDateString()} - {currentWeek[6].toLocaleDateString()}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-300"
            >
              <span className="hidden sm:inline">Next Week</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700 overflow-x-auto">
          <CardContent className="p-4">
            <div className="min-w-[768px]">
              <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 mb-4">
                <div className="text-gray-400 font-medium">Habit</div>
                {currentWeek.map(date => (
                  <div key={date.toISOString()} className="text-center">
                    <div className="text-gray-400 font-medium">{formatDate(date).day}</div>
                    <div className="text-sm text-gray-500">{formatDate(date).date}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {habits.map(habit => (
                  <div key={habit._id} className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 items-center">
                    <div className="flex items-center gap-2">
                      {habit.emoji && <span className="text-xl">{habit.emoji}</span>}
                      <span className="text-gray-200">{habit.name}</span>
                    </div>
                    {currentWeek.map(date => (
                      <div
                        key={date.toISOString()}
                        className="flex items-center justify-center"
                      >
                        <button
                          onClick={() => toggleHabit(habit, date)}
                          className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            transition-colors duration-200
                            ${isHabitCompleted(habit, date) 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-400'}
                          `}
                        >
                          {isHabitCompleted(habit, date) 
                            ? <Check className="h-5 w-5" />
                            : getCompletionRatio(habit, date)}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
