"use client";
import { useState, useEffect, useRef } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";
import { Shield, Sword, Brain, Heart, Coins, Star, Trophy } from 'lucide-react';

// Dynamic level threshold generation
const generateLevelThresholds = (maxLevel = 100) => {
  const thresholds = { 1: 0 };
  let baseXP = 100;
  let multiplier = 1.5;

  for (let level = 2; level <= maxLevel; level++) {
    thresholds[level] = Math.round(baseXP * Math.pow(multiplier, level - 1));
  }
  return thresholds;
};

const LEVEL_THRESHOLDS = generateLevelThresholds();

const calculateLevel = (totalXp) => {
  let level = 1;
  for (const [lvl, threshold] of Object.entries(LEVEL_THRESHOLDS)) {
    if (totalXp >= threshold) {
      level = parseInt(lvl);
    } else {
      break;
    }
  }
  return level;
};

export default function RPGProgress() {
  const [habits, setHabits] = useState([]);
  const [userData, setUserData] = useState({
    name: 'Adventurer',
    totalXp: 0,
    level: 1,
    nextLevelXp: LEVEL_THRESHOLDS[2],
    coins: 0,
    hp: 100,
    maxHp: 100,
    stats: {
      strength: 1,
      intelligence: 1,
      discipline: 1,
      creativity: 1
    }
  });

  const categories = [
    "Health & Fitness",
    "Mind & Soul",
    "Work & Study",
    "Hobbies",
    "Social",
    "Other",
  ];

  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevel = useRef(userData.level);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    calculateUserStats();
  }, [habits]);

  useEffect(() => {
    if (userData.level > prevLevel.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    prevLevel.current = userData.level;
  }, [userData.level]);

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits", {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setHabits(data);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const calculateUserStats = () => {
    const totalXp = habits.reduce((sum, habit) => {
      const completions = habit.completedDates?.length || 0;
      return sum + (completions * (habit.xpPerCompletion || 50));
    }, 0);

    const level = calculateLevel(totalXp);
    const nextLevelXp = LEVEL_THRESHOLDS[level + 1] || Infinity;

    // Calculate normalized category-based stats
    const categoryStats = habits.reduce((stats, habit) => {
      const completions = habit.completedDates?.length || 0;
      const xp = completions * (habit.xpPerCompletion || 50);
      const normalizedXP = Math.min(xp / 1000, 10); // Cap at level 10

      switch(habit.category) {
        case "Health & Fitness":
          stats.strength += normalizedXP;
          break;
        case "Mind & Soul":
        case "Work & Study":
          stats.intelligence += normalizedXP;
          break;
        case "Social":
          stats.discipline += normalizedXP;
          break;
        case "Hobbies":
          stats.creativity += normalizedXP;
          break;
      }
      return stats;
    }, {
      strength: 1,
      intelligence: 1,
      discipline: 1,
      creativity: 1
    });

    setUserData(prev => ({
      ...prev,
      totalXp,
      level,
      nextLevelXp,
      coins: Math.floor(totalXp / 10),
      stats: categoryStats
    }));
  };

  const getRadarData = () => {
    return Object.entries(userData.stats).map(([stat, value]) => ({
      stat,
      value: Math.min(Math.floor(value), 10) // Cap at 10
    }));
  };

  const getCategoryProgress = (category) => {
    const categoryHabits = habits.filter(h => h.category === category);
    if (!categoryHabits.length) return 0;

    const totalCompletions = categoryHabits.reduce((sum, habit) => 
      sum + (habit.completedDates?.length || 0), 0);
    
    // Calculate progress based on last 30 days
    const maxPossibleCompletions = categoryHabits.reduce((sum, habit) => 
      sum + (habit.maxCheckOffs * 30), 0);

    return Math.min((totalCompletions / maxPossibleCompletions) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {showLevelUp && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg animate-bounce">
          🎉 Level Up! You reached level {userData.level}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Stats Section */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Level {userData.level} {userData.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-200">XP: {userData.totalXp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-200">{userData.coins} coins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-gray-200">{userData.hp}/{userData.maxHp} HP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Level {userData.level}</span>
              <span>Level {userData.level + 1}</span>
            </div>
            <Progress 
              value={(userData.totalXp - LEVEL_THRESHOLDS[userData.level]) / 
                     (userData.nextLevelXp - LEVEL_THRESHOLDS[userData.level]) * 100} 
            />
            <p className="text-sm text-gray-400 mt-1">
              {userData.totalXp - LEVEL_THRESHOLDS[userData.level]} / 
              {userData.nextLevelXp - LEVEL_THRESHOLDS[userData.level]} XP to next level
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Stats Chart */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Character Stats (Max Level 10)</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: '#9CA3AF' }} />
                  <Radar
                    name="Stats"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Progress */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Category Mastery</h2>
            <div className="space-y-4">
              {categories.map(category => (
                <div key={category}>
                  <div className="flex justify-between text-sm text-gray-200 mb-1">
                    <span>{category}</span>
                    <span>{Math.floor(getCategoryProgress(category))}%</span>
                  </div>
                  <Progress value={getCategoryProgress(category)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Habits */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Active Quests</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.map(habit => (
              <div
                key={habit._id}
                className="bg-gray-700 rounded-lg p-4 border-l-4"
                style={{ borderLeftColor: habit.color || '#10B981' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{habit.emoji}</span>
                  <span className="font-medium text-white">{habit.name}</span>
                </div>
                <div className="text-sm text-gray-400">
                  <p>Category: {habit.category}</p>
                  <p>XP per completion: {habit.xpPerCompletion || 50}</p>
                  <p>Total XP earned: {(habit.completedDates?.length || 0) * (habit.xpPerCompletion || 50)}</p>
                </div>
                <Progress 
                  className="mt-2"
                  value={((habit.completedDates?.length || 0) / 30) * 100}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
