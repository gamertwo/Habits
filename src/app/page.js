"use client"
import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, LogOut } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function CreateHabit() {
  const router = useRouter();
  const [habits, setHabits] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [habitData, setHabitData] = useState({
    name: '',
    category: '',
    emoji: '',
    maxCheckOffs: 1,
    color: '#10B981',
    completedDates: [],
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const categories = [
    'Health & Fitness',
    'Mind & Soul',
    'Work & Study',
    'Hobbies',
    'Social',
    'Other'
  ];

  const commonEmojis = [
    '💪', '🏃', '🧘', '📚', '💻', '🎨',
    '🎵', '🌱', '💭', '💡', '✍️', '🎯'
  ];

  const predefinedColors = [
    '#10B981', '#3B82F6', '#8B5CF6', 
    '#EC4899', '#F59E0B', '#EF4444'
  ];

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const handleLogout = () => {
    document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = document.cookie
      .split('; ')
      .find(row => row.startsWith('userId='))
      ?.split('=')[1];

    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/habits', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...habitData,
          id: isEditing,
          userId
        }),
      });

      if (response.ok) {
        setHabitData({
          name: '',
          category: '',
          emoji: '',
          maxCheckOffs: 1,
          color: '#10B981',
          completedDates: [],
        });
        setIsEditing(null);
        fetchHabits();
      }
    } catch (error) {
      console.error('Error saving habit:', error);
    }
  };

  const handleEdit = (habit) => {
    setHabitData({
      name: habit.name,
      category: habit.category,
      emoji: habit.emoji,
      maxCheckOffs: habit.maxCheckOffs,
      color: habit.color,
      completedDates: habit.completedDates,
    });
    setIsEditing(habit._id);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      try {
        await fetch(`/api/habits?id=${id}`, { method: 'DELETE' });
        fetchHabits();
      } catch (error) {
        console.error('Error deleting habit:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-100">Manage Habits</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Habit Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 mb-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Habit Name & Icon
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600"
                >
                  {habitData.emoji || '😀'}
                </button>
                <input
                  type="text"
                  value={habitData.name}
                  onChange={(e) => setHabitData({...habitData, name: e.target.value})}
                  className="flex-1 p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                  placeholder="Enter habit name"
                  required
                />
              </div>
              
              {showEmojiPicker && (
                <div className="grid grid-cols-6 gap-2 p-2 bg-gray-700 rounded-lg border border-gray-600 mt-2">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setHabitData({...habitData, emoji});
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 hover:bg-gray-600 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Category
              </label>
              <select
                value={habitData.category}
                onChange={(e) => setHabitData({...habitData, category: e.target.value})}
                className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Daily Check-offs Required
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={habitData.maxCheckOffs}
                onChange={(e) => setHabitData({...habitData, maxCheckOffs: parseInt(e.target.value)})}
                className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Color Theme
              </label>
              <div className="grid grid-cols-6 gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setHabitData({...habitData, color})}
                    className={`w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110 ${
                      habitData.color === color ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Update Habit' : 'Create Habit'}
          </button>
        </form>

        {/* Habits List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Your Habits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map(habit => (
              <div
                key={habit._id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{habit.emoji}</span>
                    <span className="text-gray-100 font-medium">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(habit)}
                      className="p-1 text-gray-400 hover:text-blue-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(habit._id)}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <p>Category: {habit.category}</p>
                  <p>Daily Goal: {habit.maxCheckOffs}×</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
