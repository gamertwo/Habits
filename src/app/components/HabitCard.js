"use client"
import { motion } from 'framer-motion';

export default function HabitCard({ habit, onComplete }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-6 rounded-xl backdrop-blur-lg bg-black/30 border border-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{habit.icon}</span>
          <h3 className="font-semibold text-gray-200">{habit.name}</h3>
        </div>
        <button
          onClick={() => onComplete(habit._id)}
          className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        >
          Complete
        </button>
      </div>
      {/* Grid tracker implementation here */}
    </motion.div>
  );
}
