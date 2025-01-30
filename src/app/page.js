"use client"
import { useState } from 'react';
import { Calendar, Plus } from "lucide-react";

export default function CreateHabit() {
  const [habitData, setHabitData] = useState({
    name: '',
    category: '',
    emoji: '',
    maxCheckOffs: 1,
    color: '#10B981', // Default green color
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
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Yellow
    '#EF4444'  // Red
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...habitData,
          createdAt: new Date(),
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
        alert('Habit created successfully!');
      }
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-100">Create New Habit</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Habit Name & Emoji */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Habit Name & Icon
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
              >
                {habitData.emoji || '😀'}
              </button>
              <input
                type="text"
                value={habitData.name}
                onChange={(e) => setHabitData({...habitData, name: e.target.value})}
                className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Enter habit name"
                required
              />
            </div>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="grid grid-cols-6 gap-2 p-2 bg-gray-800 rounded-lg border border-gray-700 mt-2">
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setHabitData({...habitData, emoji});
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Category
            </label>
            <select
              value={habitData.category}
              onChange={(e) => setHabitData({...habitData, category: e.target.value})}
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Check-offs */}
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
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              required
            />
          </div>

          {/* Color Selection */}
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

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Habit
          </button>
        </form>
      </div>
    </div>
  );
}