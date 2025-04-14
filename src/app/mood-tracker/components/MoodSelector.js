"use client"
import { useState } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  Flame, 
  AlertTriangle, 
  X, 
  Plus,
  Tag 
} from 'lucide-react';

const moodOptions = [
  { type: 'happy', icon: <Smile className="h-6 w-6" />, color: 'text-green-400' },
  { type: 'neutral', icon: <Meh className="h-6 w-6" />, color: 'text-blue-400' },
  { type: 'sad', icon: <Frown className="h-6 w-6" />, color: 'text-red-400' },
  { type: 'angry', icon: <Flame className="h-6 w-6" />, color: 'text-orange-400' },
  { type: 'anxious', icon: <AlertTriangle className="h-6 w-6" />, color: 'text-yellow-400' },
];

export default function MoodSelector({ onSave }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedMood) return;
    
    const moodData = {
      type: selectedMood,
      intensity: intensity,
      note: note,
      tags: tags,
      date: new Date().toISOString()
    };
    
    onSave(moodData);
    
    // Reset form
    setSelectedMood(null);
    setIntensity(3);
    setNote('');
    setTags([]);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleIntensityChange = (value) => {
    setIntensity(Math.max(1, Math.min(5, value)));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          How are you feeling today?
        </label>
        <div className="flex justify-between">
          {moodOptions.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => setSelectedMood(option.type)}
              className={`p-3 rounded-full transition-colors ${
                selectedMood === option.type 
                  ? `bg-gray-700 ${option.color}`
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              title={option.type}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Intensity (1-5): {intensity}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={intensity}
          onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Mild</span>
          <span>Strong</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Add a note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200"
          rows="2"
          placeholder="How are you feeling..."
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Tags (optional)
        </label>
        <div className="flex mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-l-lg text-gray-200"
            placeholder="Add tag..."
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div 
              key={index} 
              className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-full"
            >
              <Tag className="h-3 w-3 text-blue-400" />
              <span className="text-sm text-gray-300">{tag}</span>
              <button 
                type="button"
                onClick={() => removeTag(tag)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!selectedMood}
        className={`w-full py-2 rounded-lg transition-colors ${
          selectedMood
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        Save Mood
      </button>
    </form>
  );
}