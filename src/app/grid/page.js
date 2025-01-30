"use client"
import { useState, useEffect } from 'react';

export default function GridPage() {
  const [habits, setHabits] = useState([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      const data = await response.json();
      setHabits(data);
      if (data.length > 0) {
        setSelectedHabitId(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const selectedHabit = habits.find(h => h._id === selectedHabitId);

  const getDaysInYear = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date(startOfYear);
      date.setDate(startOfYear.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isDateCompleted = (date) => {
    return selectedHabit?.completedDates?.some(completedDate => 
      new Date(completedDate).toDateString() === date.toDateString()
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Habit Grid</h1>
      
      <select
        value={selectedHabitId}
        onChange={(e) => setSelectedHabitId(e.target.value)}
        className="w-full p-2 mb-6 rounded-lg bg-gray-800 border border-gray-700 text-white"
      >
        {habits.map(habit => (
          <option key={habit._id} value={habit._id}>
            {habit.name}
          </option>
        ))}
      </select>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1">
          {getDaysInYear().map((date, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-sm ${
                isDateCompleted(date) ? 'bg-green-600' : 'bg-gray-800'
              }`}
              title={date.toDateString()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
