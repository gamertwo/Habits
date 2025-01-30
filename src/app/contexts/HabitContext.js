"use client"
import { createContext, useContext, useEffect, useState } from 'react';

const HabitContext = createContext();

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [storageType, setStorageType] = useState('local');

  useEffect(() => {
    const loadHabits = () => {
      if (storageType === 'local') {
        const savedHabits = localStorage.getItem('habits');
        if (savedHabits) setHabits(JSON.parse(savedHabits));
      }
    };
    loadHabits();
  }, [storageType]);

  return (
    <HabitContext.Provider value={{ habits, setHabits, storageType, setStorageType }}>
      {children}
    </HabitContext.Provider>
  );
}

export const useHabits = () => useContext(HabitContext);
