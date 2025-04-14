"use client"
import { useState } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  Heart, 
  Coffee, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Tag,
  Loader2,
  Search
} from 'lucide-react';

export default function MoodDetailedTable({ moods, isLoading, filters, updateFilters }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodsPerPage, setMoodsPerPage] = useState(10);
  
  const getMoodIcon = (type) => {
    switch (type) {
      case 'happy':
        return <Smile className="h-5 w-5 text-green-400" />;
      case 'neutral':
        return <Meh className="h-5 w-5 text-blue-400" />;
      case 'sad':
        return <Frown className="h-5 w-5 text-red-400" />;
      case 'love':
        return <Heart className="h-5 w-5 text-pink-400" />;
      case 'tired':
        return <Coffee className="h-5 w-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getMoodColorClass = (type) => {
    switch (type) {
      case 'happy':
        return 'text-green-400';
      case 'neutral':
        return 'text-blue-400';
      case 'sad':
        return 'text-red-400';
      case 'love':
        return 'text-pink-400';
      case 'tired':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleSort = (field) => {
    if (filters.sortBy === field) {
      updateFilters({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sortBy: field, sortDirection: 'asc' });
    }
  };

  // Apply search filter
  const filteredMoods = searchQuery.trim() === '' 
    ? moods 
    : moods.filter(mood => {
        const searchLower = searchQuery.toLowerCase();
        return (
          mood.type.toLowerCase().includes(searchLower) ||
          (mood.note && mood.note.toLowerCase().includes(searchLower)) ||
          (mood.tags && mood.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      });

  // Pagination
  const indexOfLastMood = currentPage * moodsPerPage;
  const indexOfFirstMood = indexOfLastMood - moodsPerPage;
  const currentMoods = filteredMoods.slice(indexOfFirstMood, indexOfLastMood);
  const totalPages = Math.ceil(filteredMoods.length / moodsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle page changes
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (moods.length === 0) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-400">
        No mood data available for the selected date range
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="text-sm text-gray-400">
          {filteredMoods.length} mood entries found
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search moods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-gray-700 rounded-lg text-sm text-gray-300 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={moodsPerPage}
            onChange={(e) => {
              setMoodsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
            className="bg-gray-700 text-gray-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleToggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {filters.sortBy === 'date' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleToggleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Mood
                  {filters.sortBy === 'type' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleToggleSort('intensity')}
              >
                <div className="flex items-center gap-1">
                  Intensity
                  {filters.sortBy === 'intensity' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Note
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Tags
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {currentMoods.map((mood, index) => (
              <tr key={mood._id || index} className="hover:bg-gray-750">
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-300">
                    {formatDate(mood.date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(mood.date)}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {getMoodIcon(mood.type)}
                    <span className={`text-sm capitalize ${getMoodColorClass(mood.type)}`}>
                      {mood.type}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-6 rounded-sm ${
                            i < mood.intensity ? getMoodColorClass(mood.type) : 'bg-gray-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-300 ml-1">
                      {mood.intensity}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-300 max-w-xs truncate">
                    {mood.note || <span className="text-gray-500 italic">No note</span>}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {mood.tags && mood.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {mood.tags.map((tag, tagIndex) => (
                        <div
                          key={tagIndex}
                          className="bg-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-gray-300">{tag}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 italic text-sm">No tags</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-400">
            Showing {indexOfFirstMood + 1}-{Math.min(indexOfLastMood, filteredMoods.length)} of {filteredMoods.length}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-1 rounded bg-gray-700 text-gray-300 disabled:bg-gray-800 disabled:text-gray-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate the actual page number to display
                let pageNum;
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all pages
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  // If on pages 1-3, show pages 1-5
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // If on last 3 pages, show last 5 pages
                  pageNum = totalPages - 4 + i;
                } else {
                  // Otherwise show current page and 2 on each side
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => paginate(pageNum)}
                    className={`h-7 w-7 flex items-center justify-center rounded text-sm
                      ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-gray-500">...</span>
                  <button
                    onClick={() => paginate(totalPages)}
                    className="h-7 w-7 flex items-center justify-center rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-gray-700 text-gray-300 disabled:bg-gray-800 disabled:text-gray-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}