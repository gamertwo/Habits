"use client";
import { useState, useEffect } from "react";
import { Plus, Trash, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateHabit() {
  const router = useRouter();
  const [habitData, setHabitData] = useState({
    name: "",
    category: "",
    emoji: "",
    maxCheckOffs: 1,
    color: "#10B981",
    completedDates: [],
  });

  const [habits, setHabits] = useState([]); // State to store habits
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // Track habit being edited

  const categories = [
    "Health & Fitness",
    "Mind & Soul",
    "Work & Study",
    "Hobbies",
    "Social",
    "Other",
  ];

  const commonEmojis = [
    "💪", "🏃", "🧘", "📚", "💻", "🎨",
    "🎵", "🌱", "💭", "💡", "✍️", "🎯",
  ];

  const predefinedColors = [
    "#10B981", // Green
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F59E0B", // Yellow
    "#EF4444", // Red
  ];

  // Fetch habits on component mount
  useEffect(() => {
    fetchHabits();
  }, []);

  // Fetch habits from the API
  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits", {
        credentials: "include", // Include cookies
      });
      const data = await response.json();
      if (response.ok) {
        setHabits(data);
      } else {
        console.error("Error fetching habits:", data.error);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  // Handle form submission (create or update habit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/habits", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          ...habitData,
          id: isEditing, // Include habit ID if editing
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form and fetch updated habits
        setHabitData({
          name: "",
          category: "",
          emoji: "",
          maxCheckOffs: 1,
          color: "#10B981",
          completedDates: [],
        });
        setIsEditing(null);
        await fetchHabits();
        router.push("/progress"); // Redirect to progress page
      } else {
        console.error("Error saving habit:", data.error);
        alert("Failed to save habit. Please try again.");
      }
    } catch (error) {
      console.error("Error saving habit:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle editing a habit
  const handleEdit = (habit) => {
    setHabitData({
      name: habit.name,
      category: habit.category,
      emoji: habit.emoji,
      maxCheckOffs: habit.maxCheckOffs,
      color: habit.color,
      completedDates: habit.completedDates,
    });
    setIsEditing(habit._id); // Set the habit ID being edited
  };

  // Handle deleting a habit
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/habits?id=${id}`, {
        method: "DELETE",
        credentials: "include", // Include cookies
      });

      const data = await response.json();

      if (response.ok) {
        await fetchHabits(); // Fetch updated habits
        alert("Habit deleted successfully!");
      } else {
        console.error("Error deleting habit:", data.error);
        alert("Failed to delete habit. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-100">
            {isEditing ? "Edit Habit" : "Create New Habit"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  maxCheckOffs: parseInt(e.target.value),
                })
              }
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
              required
            />
          </div>

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
                    habitData.color === color ? "border-white" : "border-transparent"
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

        {/* List of Habits */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Your Habits</h2>
          {habits.map((habit) => (
            <div
              key={habit._id}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-2"
            >
              <div className="flex items-center gap-2">
                <span>{habit.emoji}</span>
                <span className="text-gray-100">{habit.name}</span>
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