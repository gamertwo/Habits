"use client"
import { useState, useEffect } from 'react';
import { Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const HabitSelector = ({ habits, selected, onSelect }) => {
  return (
    <div className="mb-6">
      <select
        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
        value={selected?._id || ''}
        onChange={(e) => {
          const habit = habits.find(h => h._id === e.target.value);
          onSelect(habit);
        }}
      >
        {habits.map(habit => (
          <option key={habit._id} value={habit._id}>
            {habit.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const GridTracker = ({ habit }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const getDaysInYear = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = [];
    
    while (startOfYear <= now) {
      days.push(new Date(startOfYear));
      startOfYear.setDate(startOfYear.getDate() + 1);
    }
    return days;
  };

  const isDateCompleted = (date) => {
    return habit.completedDates?.some(completedDate => 
      new Date(completedDate).toDateString() === date.toDateString()
    );
  };

  const days = getDaysInYear();
  const daysByMonth = days.reduce((acc, day) => {
    const month = day.getMonth();
    if (!acc[month]) acc[month] = [];
    acc[month].push(day);
    return acc;
  }, {});

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-600"></div>
          {habit.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 mb-1">
            {monthNames.map(month => (
              <div key={month} className="text-center">{month}</div>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-1">
            {Object.entries(daysByMonth).map(([month, monthDays]) => (
              <div key={month} className="flex flex-wrap gap-0.5">
                {monthDays.map(day => (
                  <div
                    key={day.toISOString()}
                    className={`
                      w-2 h-2 md:w-3 md:h-3 rounded-sm transition-all duration-200
                      ${isDateCompleted(day) ? 'bg-green-600' : 'bg-gray-800'}
                      hover:scale-150 cursor-pointer
                      group relative
                    `}
                    title={`${day.toLocaleDateString()} - ${isDateCompleted(day) ? 'Completed' : 'Not Completed'}`}
                  >
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-10">
                      {day.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProgressPage() {
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    const loadHabits = async () => {
      const response = await fetch('/api/habits');
      const data = await response.json();
      setHabits(data);
      if (data.length > 0) setSelectedHabit(data[0]);
    };
    loadHabits();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-full mx-auto">
        <div className="flex items-center mb-4 md:mb-8 gap-2 md:gap-3">
          <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">Yearly Progress</h1>
        </div>
        
        <HabitSelector 
          habits={habits} 
          selected={selectedHabit} 
          onSelect={setSelectedHabit} 
        />
        
        {selectedHabit && (
          <GridTracker habit={selectedHabit} />
        )}
      </div>
    </div>
  );
}