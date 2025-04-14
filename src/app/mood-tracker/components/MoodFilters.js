"use client"
import { 
  ArrowUpDown, 
  ListFilter, 
  Tag as TagIcon,
  Smile, 
  Meh, 
  Frown, 
  Heart, 
  Coffee 
} from 'lucide-react';

const moodOptions = [
  { type: 'happy', icon: <Smile className="h-4 w-4" />, color: 'text-green-400' },
  { type: 'neutral', icon: <Meh className="h-4 w-4" />, color: 'text-blue-400' },
  { type: 'sad', icon: <Frown className="h-4 w-4" />, color: 'text-red-400' },
  { type: 'love', icon: <Heart className="h-4 w-4" />, color: 'text-pink-400' },
  { type: 'tired', icon: <Coffee className="h-4 w-4" />, color: 'text-yellow-400' },
];

export default function MoodFilters({ filters, updateFilters, moods }) {
  // Extract all unique tags from moods
  const allTags = [...new Set(
    moods
      .filter(mood => mood.tags && mood.tags.length)
      .flatMap(mood => mood.tags)
  )];
  
  // Toggle a mood type filter
  const toggleMoodType = (type) => {
    const newMoodTypes = filters.moodTypes.includes(type)
      ? filters.moodTypes.filter(t => t !== type)
      : [...filters.moodTypes, type];
    
    updateFilters({ moodTypes: newMoodTypes });
  };
  
  // Toggle an intensity filter
  const toggleIntensity = (intensity) => {
    const newIntensities = filters.intensities.includes(intensity)
      ? filters.intensities.filter(i => i !== intensity)
      : [...filters.intensities, intensity];
    
    updateFilters({ intensities: newIntensities });
  };
  
  // Toggle a tag filter
  const toggleTag = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    updateFilters({ tags: newTags });
  };
  
  // Update sort settings
  const toggleSort = (field) => {
    if (filters.sortBy === field) {
      updateFilters({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sortBy: field, sortDirection: 'asc' });
    }
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    updateFilters({
      moodTypes: [],
      intensities: [],
      tags: []
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
          <ListFilter className="h-4 w-4" /> Mood Types
        </h3>
        <div className="flex flex-wrap gap-2">
          {moodOptions.map(mood => (
            <button
              key={mood.type}
              onClick={() => toggleMoodType(mood.type)}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 transition-colors
                ${filters.moodTypes.includes(mood.type) 
                  ? `bg-blue-600 text-white` 
                  : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <span className={filters.moodTypes.includes(mood.type) ? 'text-white' : mood.color}>
                {mood.icon}
              </span>
              <span className={filters.moodTypes.includes(mood.type) ? 'text-white' : 'text-gray-300'}>
                {mood.type}
              </span>
            </button>
          ))}
        </div>
        
        <h3 className="text-gray-300 font-medium mt-4 mb-2 flex items-center gap-2">
          <ListFilter className="h-4 w-4" /> Intensity
        </h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(intensity => (
            <button
              key={intensity}
              onClick={() => toggleIntensity(intensity)}
              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors
                ${filters.intensities.includes(intensity) 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {intensity}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
          <TagIcon className="h-4 w-4" /> Tags
        </h3>
        {allTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors
                  ${filters.tags.includes(tag) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                <TagIcon className="h-3 w-3" />
                {tag}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tags available</p>
        )}
      </div>
      
      <div>
        <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4" /> Sort By
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'date', label: 'Date' },
            { id: 'intensity', label: 'Intensity' },
            { id: 'type', label: 'Mood Type' }
          ].map(option => (
            <button
              key={option.id}
              onClick={() => toggleSort(option.id)}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors
                ${filters.sortBy === option.id
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {option.label}
              {filters.sortBy === option.id && (
                <span className="text-xs">
                  {filters.sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {(filters.moodTypes.length > 0 || filters.intensities.length > 0 || filters.tags.length > 0) && (
          <button
            onClick={clearAllFilters}
            className="mt-4 px-3 py-1 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}