"use client";
import { useState, useEffect } from 'react';
import InfiniteMenu from '@/components/InfiniteMenu';

export default function ProgressPage() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch('/api/habits', {
          credentials: 'include',
        });
        const data = await response.json();
        
        // Transform habits data to only include title and description
        const formattedHabits = data.map(habit => {
          const streak = calculateStreak(habit.completedDates);
          const completion = calculateCompletion(habit.completedDates);
          
          return {
            title: `${habit.emoji} ${habit.name}`,
            description: `${streak} day streak • ${completion}% completed • ${habit.maxCheckOffs}× daily`
          };
        });

        setHabits(formattedHabits);
      } catch (error) {
        console.error('Error fetching habits:', error);
      }
    };

    fetchHabits();
  }, []);

  // Helper functions remain the same
  const calculateStreak = (completedDates) => {
    if (!completedDates || !completedDates.length) return 0;
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    while (completedDates.some(date => 
      new Date(date).toDateString() === currentDate.toDateString()
    )) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const calculateCompletion = (completedDates) => {
    if (!completedDates) return 0;
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const completedInLast30Days = completedDates.filter(date => 
      new Date(date) >= thirtyDaysAgo && new Date(date) <= today
    ).length;
    
    return Math.round((completedInLast30Days / 30) * 100);
  };

  return (
    <div className="h-screen w-full bg-gray-900">
      <InfiniteMenu items={habits} />
    </div>
  );
}