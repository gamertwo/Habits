"use client"
import { useState } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  Heart, 
  Coffee, 
  Edit,
  Trash2,
  X,
  Tag,
  Save,
  Loader2
} from 'lucide-react';

const moodIcons = {
  happy: <Smile className="h-5 w-5" />,
  neutral: <Meh className="h-5 w-5" />,
  sad: <Frown className="h-5 w-5" />,
  love: <Heart className="h-5 w-5" />,
  tired: <Coffee className="h-5 w-5" />
};

const moodColors = {
  happy: 'text-green-400',
  neutral: 'text-blue-400',
  sad: 'text-red-400',
  love: 'text-pink-400',
  tired: 'text-yellow-400'
};

const intensityBackgrounds = {
  1: 'bg-opacity-20',
  2: 'bg-opacity-40',
  3: 'bg-opacity-60',
  4: 'bg-opacity-80',
  5: 'bg-opacity-100'
};

export default function MoodCalendar({ moods, week, onDelete, onUpdate, onAddMood, isLoading }) {
  const [editingMood, setEditingMood] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  const [addingMoodForDate, setAddingMoodForDate] = useState(null);
  const [newMoodType, setNewMoodType] = useState('happy');
  const [newMoodIntensity, setNewMoodIntensity] = useState(3);
  const [newMoodNote, setNewMoodNote] = useState('');
  const [newMoodTags, setNewMoodTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate()
    };
  };

  const getMoodsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return moods.filter(mood => 
      new Date(mood.date).toISOString().split('T')[0] === dateStr
    );
  };

  const handleEdit = (mood) => {
    setEditingMood(mood);
    setEditNote(mood.note || '');
    setEditTags(mood.tags || []);
    setAddingMoodForDate(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMood) return;
    
    await onUpdate(editingMood._id, {
      note: editNote,
      tags: editTags
    });
    
    setEditingMood(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
      setEditTags([...editTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };
  
  const handleStartAddMood = (date) => {
    // Reset form values
    setNewMoodType('happy');
    setNewMoodIntensity(3);
    setNewMoodNote('');
    setNewMoodTags([]);
    setNewTagInput('');
    
    // Set the date we're adding mood for
    setAddingMoodForDate(date);
    
    // Make sure we're not editing any mood
    setEditingMood(null);
  };

  const handleSaveNewMood = async () => {
    if (!addingMoodForDate) return;
    
    const dateStr = addingMoodForDate.toISOString();
    
    // Create new mood data
    const newMood = {
      type: newMoodType,
      intensity: newMoodIntensity,
      note: newMoodNote,
      tags: newMoodTags,
      date: dateStr
    };
    
    // Call the passed-in handler to save the mood
    try {
      await onAddMood(newMood);
      setAddingMoodForDate(null);
    } catch (error) {
      console.error("Error saving mood:", error);
    }
  };

  const addNewMoodTag = () => {
    if (newTagInput.trim() && !newMoodTags.includes(newTagInput.trim())) {
      setNewMoodTags([...newMoodTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const removeNewMoodTag = (tagToRemove) => {
    setNewMoodTags(newMoodTags.filter(tag => tag !== tagToRemove));
  };

  const getMoodBackground = (mood) => {
    const moodType = mood.type || 'neutral';
    const intensity = mood.intensity || 3;
    
    let bgColor = '';
    
    switch (moodType) {
      case 'happy':
        bgColor = 'bg-green-500';
        break;
      case 'neutral':
        bgColor = 'bg-blue-500';
        break;
      case 'sad':
        bgColor = 'bg-red-500';
        break;
      case 'love':
        bgColor = 'bg-pink-500';
        break;
      case 'tired':
        bgColor = 'bg-yellow-500';
        break;
      default:
        bgColor = 'bg-gray-500';
    }
    
    return `${bgColor} ${intensityBackgrounds[intensity]}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {week.map(date => {
          const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
          return (
            <div 
              key={date.toISOString()} 
              className={`text-center p-2 rounded ${isToday ? 'bg-gray-700' : ''}`}
            >
              <div className={`font-medium ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                {formatDate(date).day}
              </div>
              <div className={`text-sm ${isToday ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatDate(date).date}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {week.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const dayMoods = getMoodsForDate(date);
          
          return (
            <div 
              key={dateStr} 
              className={`p-3 rounded-lg ${isToday ? 'bg-gray-700' : 'bg-gray-800'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 
                  onClick={() => handleStartAddMood(date)}
                  className={`text-sm font-medium cursor-pointer hover:underline ${isToday ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </h3>
                {!addingMoodForDate || addingMoodForDate.toISOString().split('T')[0] !== dateStr ? (
                  <button
                    onClick={() => handleStartAddMood(date)}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    + Add Mood
                  </button>
                ) : null}
              </div>

              {addingMoodForDate && addingMoodForDate.toISOString().split('T')[0] === dateStr && (
                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Mood</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Mood Type</label>
                      <div className="flex justify-between">
                        {Object.entries(moodIcons).map(([type, icon]) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewMoodType(type)}
                            className={`p-2 rounded-full transition-colors ${
                              newMoodType === type 
                                ? `bg-gray-600 ${moodColors[type]}`
                                : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                            }`}
                            title={type}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Intensity: {newMoodIntensity}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={newMoodIntensity}
                        onChange={(e) => setNewMoodIntensity(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Note (optional)</label>
                      <textarea
                        value={newMoodNote}
                        onChange={(e) => setNewMoodNote(e.target.value)}
                        className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                        rows="2"
                        placeholder="How are you feeling..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tags (optional)</label>
                      <div className="flex mb-2">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewMoodTag())}
                          className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded-l-lg text-gray-200"
                          placeholder="Add tag..."
                        />
                        <button
                          type="button"
                          onClick={addNewMoodTag}
                          className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                        >
                          <Tag className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {newMoodTags.map((tag, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-1 bg-gray-600 px-2 py-1 rounded-full"
                          >
                            <span className="text-xs text-gray-300">{tag}</span>
                            <button 
                              type="button"
                              onClick={() => removeNewMoodTag(tag)}
                              className="text-gray-400 hover:text-gray-200"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingMoodForDate(null)}
                        className="px-3 py-1.5 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNewMood}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Mood
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {dayMoods.length === 0 && (!addingMoodForDate || addingMoodForDate.toISOString().split('T')[0] !== dateStr) ? (
                <div className="text-center py-2 text-sm text-gray-500">
                  No moods recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {dayMoods.map(mood => (
                    <div 
                      key={mood._id} 
                      className={`rounded-lg p-3 ${
                        editingMood && editingMood._id === mood._id 
                          ? 'bg-gray-700'
                          : getMoodBackground(mood)
                      }`}
                    >
                      {editingMood && editingMood._id === mood._id ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`${moodColors[mood.type]}`}>
                                {moodIcons[mood.type]}
                              </span>
                              <span className="text-gray-200">
                                {mood.type} (Intensity: {mood.intensity})
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(mood.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                            rows="2"
                            placeholder="Add a note..."
                          ></textarea>

                          <div>
                            <div className="flex mb-2">
                              <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded-l-lg text-gray-200"
                                placeholder="Add tag..."
                              />
                              <button
                                type="button"
                                onClick={addTag}
                                className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                              >
                                <Tag className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {editTags.map((tag, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center gap-1 bg-gray-600 px-2 py-1 rounded-full"
                                >
                                  <span className="text-xs text-gray-300">{tag}</span>
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

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingMood(null)}
                              className="p-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-white`}>
                                {moodIcons[mood.type]}
                              </span>
                              <span className="text-white font-medium">
                                {mood.type} (Intensity: {mood.intensity})
                              </span>
                            </div>
                            <span className="text-xs text-white text-opacity-80">
                              {new Date(mood.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {mood.note && (
                            <p className="mt-2 text-sm text-white text-opacity-90">
                              {mood.note}
                            </p>
                          )}

                          {mood.tags && mood.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mood.tags.map((tag, index) => (
                                <div 
                                  key={index} 
                                  className="bg-black bg-opacity-20 px-2 py-0.5 rounded-full"
                                >
                                  <span className="text-xs text-white">{tag}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 mt-2">
                            <button
                              onClick={() => handleEdit(mood)}
                              className="p-1.5 bg-black bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDelete(mood._id)}
                              className="p-1.5 bg-black bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}