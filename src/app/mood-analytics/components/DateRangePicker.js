"use client"
import { useState } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';

export default function DateRangePicker({ dateRange, setDateRange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(dateRange.start);
  const [localEndDate, setLocalEndDate] = useState(dateRange.end);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selecting, setSelecting] = useState('start'); // 'start' or 'end'

  const toggleCalendar = () => {
    if (!isOpen) {
      // Reset local dates to current range when opening
      setLocalStartDate(dateRange.start);
      setLocalEndDate(dateRange.end);
      
      // Reset to current month/year of start date
      setCurrentMonth(dateRange.start.getMonth());
      setCurrentYear(dateRange.start.getFullYear());
      
      setSelecting('start');
    }
    
    setIsOpen(!isOpen);
  };

  const applyDateRange = () => {
    if (localStartDate && localEndDate) {
      // Ensure start date is before end date
      if (localStartDate > localEndDate) {
        const temp = localStartDate;
        setLocalStartDate(localEndDate);
        setLocalEndDate(temp);
      }
      
      setDateRange({
        start: localStartDate,
        end: localEndDate
      });
    }
    
    setIsOpen(false);
  };

  const handleDateClick = (date) => {
    if (selecting === 'start') {
      setLocalStartDate(date);
      setSelecting('end');
    } else {
      setLocalEndDate(date);
      setSelecting('start');
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(prevYear => prevYear - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(prevYear => prevYear + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDateInRange = (date) => {
    if (!localStartDate || !localEndDate) return false;
    return date >= localStartDate && date <= localEndDate;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!localStartDate || !localEndDate) return false;
    
    return (
      (date.getDate() === localStartDate.getDate() &&
       date.getMonth() === localStartDate.getMonth() &&
       date.getFullYear() === localStartDate.getFullYear()) ||
      (date.getDate() === localEndDate.getDate() &&
       date.getMonth() === localEndDate.getMonth() &&
       date.getFullYear() === localEndDate.getFullYear())
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      
      days.push(
        <button
          key={`day-${day}`}
          onClick={() => handleDateClick(date)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm
            ${isSelected(date) ? 'bg-blue-600 text-white' : ''}
            ${!isSelected(date) && isDateInRange(date) ? 'bg-blue-600 bg-opacity-40 text-white' : ''}
            ${!isSelected(date) && !isDateInRange(date) && isToday(date) ? 'border border-blue-400 text-blue-400' : ''}
            ${!isSelected(date) && !isDateInRange(date) && !isToday(date) ? 'text-gray-300 hover:bg-gray-700' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  // Quick select options
  const quickSelectOptions = [
    { label: 'Last 7 days', action: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      setLocalStartDate(start);
      setLocalEndDate(end);
    }},
    { label: 'Last 30 days', action: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      setLocalStartDate(start);
      setLocalEndDate(end);
    }},
    { label: 'This month', action: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date();
      setLocalStartDate(start);
      setLocalEndDate(end);
    }},
    { label: 'Last month', action: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setLocalStartDate(start);
      setLocalEndDate(end);
    }},
    { label: 'Last 3 months', action: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(end.getMonth() - 3);
      setLocalStartDate(start);
      setLocalEndDate(end);
    }},
    { label: 'This year', action: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date();
      setLocalStartDate(start);
      setLocalEndDate(end);
    }}
  ];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="relative">
      <button
        onClick={toggleCalendar}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
      >
        <CalendarRange className="h-4 w-4" />
        <span className="whitespace-nowrap">
          {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 z-10 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-300 font-medium">Select Date Range</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <button 
                onClick={() => setSelecting('start')}
                className={`w-full p-2 rounded text-sm ${
                  selecting === 'start' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Start: {formatDate(localStartDate)}
              </button>
            </div>
            <div className="flex-1">
              <button 
                onClick={() => setSelecting('end')}
                className={`w-full p-2 rounded text-sm ${
                  selecting === 'end' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                End: {formatDate(localEndDate)}
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <button onClick={goToPreviousMonth} className="p-1 text-gray-400 hover:text-gray-200">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-gray-200">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button onClick={goToNextMonth} className="p-1 text-gray-400 hover:text-gray-200">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-gray-400 text-xs mb-2">Quick Select</h4>
            <div className="grid grid-cols-2 gap-2">
              {quickSelectOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className="p-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={applyDateRange}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}