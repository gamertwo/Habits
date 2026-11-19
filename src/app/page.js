// app/habits/page.js
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Edit, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import HabitImportExport from "@/components/HabitImportExport";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitsPage() {
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [habitData, setHabitData] = useState({
    name: "",
    category: "",
    emoji: "",
    maxCheckOffs: 1,
    color: "#10B981",
    completedDates: [],
    xpPerCompletion: 50,
    daysOfWeek: [true, true, true, true, true, true, true],
  });

  const [habits, setHabits] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(null);

  const categories = [
    "Health & Fitness",
    "Mind & Soul",
    "Work & Study",
    "Hobbies",
    "Social",
    "Other",
  ];

  const commonEmojis = [
    "💪",
    "🏃",
    "🧘",
    "📚",
    "💻",
    "🎨",
    "🎵",
    "🌱",
    "💭",
    "💡",
    "✍️",
    "🎯",
  ];

  const predefinedColors = [
    "#10B981", // Green
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F59E0B", // Yellow
    "#EF4444", // Red
  ];

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits", { credentials: "include" });
      const data = await response.json();
      if (response.ok) {
        setHabits(data);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/habits", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...habitData,
          id: isEditing,
        }),
      });

      await response.json();

      if (response.ok) {
        setHabitData({
          name: "",
          category: "",
          emoji: "",
          maxCheckOffs: 1,
          color: "#10B981",
          completedDates: [],
          xpPerCompletion: 50,
          daysOfWeek: [true, true, true, true, true, true, true],
        });
        setIsEditing(null);
        await fetchHabits();
        router.push("/progress");
      }
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const handleEdit = (habit) => {
    setHabitData({
      name: habit.name,
      category: habit.category,
      emoji: habit.emoji,
      maxCheckOffs: habit.maxCheckOffs,
      color: habit.color || "#10B981",
      completedDates: habit.completedDates || [],
      xpPerCompletion: habit.xpPerCompletion || 50,
      daysOfWeek:
        Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.length === 7
          ? habit.daysOfWeek
          : [true, true, true, true, true, true, true],
    });
    setIsEditing(habit._id);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/habits?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        await fetchHabits();
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-100">
              {isEditing ? "Edit Habit" : "Create New Habit"}
            </h1>
          </div>

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>

        </div>


        <div className="mb-6"><HabitImportExport onChange={() => fetchHabits()} /></div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name + Emoji */}
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
                {habitData.emoji || "😀"}
              </button>
              <input
                type="text"
                value={habitData.name}
                onChange={(e) =>
                  setHabitData({ ...habitData, name: e.target.value })
                }
                className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Enter habit name"
                required
              />
            </div>

            {showEmojiPicker && (
              <div className="grid grid-cols-6 gap-2 p-2 bg-gray-800 rounded-lg border border-gray-700 mt-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setHabitData({ ...habitData, emoji });
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
              onChange={(e) =>
                setHabitData({ ...habitData, category: e.target.value })
              }
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Daily check-offs */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Daily Check-offs Required
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={habitData.maxCheckOffs}
              onChange={(e) =>
                setHabitData({
                  ...habitData,
                  maxCheckOffs: parseInt(e.target.value, 10),
                })
              }
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              required
            />
          </div>

          {/* XP per completion */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              XP Per Completion
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={habitData.xpPerCompletion}
              onChange={(e) =>
                setHabitData({
                  ...habitData,
                  xpPerCompletion: parseInt(e.target.value, 10),
                })
              }
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              required
            />
            <p className="text-xs text-gray-400">
              Amount of XP earned each time this habit is completed
            </p>
          </div>

          {/* Days of week selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Days to Show This Habit
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setHabitData((prev) => {
                      const nextDays = [...prev.daysOfWeek];
                      nextDays[idx] = !nextDays[idx];
                      return { ...prev, daysOfWeek: nextDays };
                    })
                  }
                  className={`py-2 rounded-lg text-xs border transition-all ${
                    habitData.daysOfWeek[idx]
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-gray-800 text-gray-300 border-gray-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Only these days will show this habit in your weekly view.
            </p>
          </div>

          {/* Color theme */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Color Theme
            </label>
            <div className="grid grid-cols-6 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setHabitData({ ...habitData, color })}
                  className={`w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110 ${
                    habitData.color === color
                      ? "border-white"
                      : "border-transparent"
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
            {isEditing ? "Update Habit" : "Create Habit"}
          </button>
        </form>

        {/* List of habits */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Your Habits</h2>
          {habits.map((habit) => (
            <div
              key={habit._id}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-2"
              style={{
                borderLeft: `4px solid ${habit.color || "#10B981"}`,
              }}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{habit.emoji}</span>
                  <span className="text-gray-100 font-medium">
                    {habit.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                  {(Array.isArray(habit.daysOfWeek) &&
                  habit.daysOfWeek.length === 7
                    ? habit.daysOfWeek
                    : [true, true, true, true, true, true, true]
                  ).map(
                    (on, idx) =>
                      on && (
                        <span
                          key={DAYS[idx]}
                          className="px-2 py-0.5 rounded-full bg-gray-900 text-gray-200 border border-gray-700"
                        >
                          {DAYS[idx]}
                        </span>
                      )
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(habit)}
                  className="p-2 text-blue-400 hover:text-blue-300"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(habit._id)}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
