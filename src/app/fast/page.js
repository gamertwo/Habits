'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Download, Upload, TrendingUp, Clock, Award, BarChart3, Zap, Target, ChevronLeft, ChevronRight } from 'lucide-react';

// ============= DRAGGABLE COMPONENTS =============
const SimpleDraggable = ({ id, children, disabled = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    disabled: disabled,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? 'z-50' : ''}>
      {children}
    </div>
  );
};

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? 'z-50' : ''}>
      {children}
    </div>
  );
};

const DroppableZone = ({ id, children, className = '' }) => {
  const { isOver, setNodeRef } = useDroppable({ id: id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'ring-2 ring-cyan-400/60 bg-cyan-400/10' : ''} transition-all duration-200`}
    >
      {children}
    </div>
  );
};

// ============= CALENDAR PAGE =============
const CalendarPage = ({ calendarBlocks, onUpdateBlocks, onBack, dailyHabits, newTasks }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [blockForm, setBlockForm] = useState({ startHour: 9, duration: 1, title: '', description: '' });

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  
  const getWeekDates = () => {
    const week = [];
    const curr = new Date(currentWeek);
    const first = curr.getDate() - curr.getDay();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(curr.setDate(first + i));
      week.push(date);
    }
    return week;
  };

  const weekDates = getWeekDates();

  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const getBlocksForSlot = (date, hour) => {
    const dateStr = formatDate(date);
    return (calendarBlocks[dateStr] || []).filter(block => {
      const blockStart = block.startHour;
      const blockEnd = block.startHour + block.duration;
      return hour >= blockStart && hour < blockEnd;
    });
  };

  const addBlock = () => {
    if (!selectedSlot || !blockForm.title.trim()) return;
    
    const dateStr = formatDate(selectedSlot.date);
    const newBlock = {
      id: `block_${Date.now()}`,
      ...blockForm,
      startHour: selectedSlot.hour,
      createdAt: new Date().toISOString(),
      tasks: []
    };

    const updated = { ...calendarBlocks };
    if (!updated[dateStr]) updated[dateStr] = [];
    updated[dateStr].push(newBlock);
    
    onUpdateBlocks(updated);
    setShowBlockModal(false);
    setBlockForm({ startHour: 9, duration: 1, title: '', description: '' });
    setSelectedSlot(null);
  };

  const deleteBlock = (date, blockId) => {
    const dateStr = formatDate(date);
    const updated = { ...calendarBlocks };
    if (updated[dateStr]) {
      updated[dateStr] = updated[dateStr].filter(b => b.id !== blockId);
      if (updated[dateStr].length === 0) delete updated[dateStr];
    }
    onUpdateBlocks(updated);
  };

  const removeTaskFromBlock = (date, blockId, taskId) => {
    const dateStr = formatDate(date);
    const updated = { ...calendarBlocks };
    if (updated[dateStr]) {
      updated[dateStr] = updated[dateStr].map(b => {
        if (b.id === blockId) {
          return { ...b, tasks: (b.tasks || []).filter(t => t.id !== taskId) };
        }
        return b;
      });
    }
    onUpdateBlocks(updated);
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  return (
    <div className="min-h-screen bg-[#0a132e] text-white p-6 overflow-x-auto">
      <style jsx>{`
        .blueprint-bg {
          background-image:
            repeating-linear-gradient(0deg, rgba(56,189,248,0.08) 0px, rgba(56,189,248,0.08) 1px, transparent 1px, transparent 22px),
            repeating-linear-gradient(90deg, rgba(56,189,248,0.08) 0px, rgba(56,189,248,0.08) 1px, transparent 1px, transparent 22px);
        }
      `}</style>

      <div className="absolute inset-0 blueprint-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_-10%,rgba(56,189,248,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-200">
              ← Back
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/40" />
                <span className="text-[10px] tracking-widest text-cyan-300/70 uppercase">Time Block Planning</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-100">Calendar View</h1>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => navigateWeek(-1)} className="p-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-slate-300 font-medium">
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button onClick={() => navigateWeek(1)} className="p-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="min-w-[1400px]">
          <div className="grid grid-cols-8 gap-2 mb-6">
            <div className="border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-3">Time</h3>
            </div>
            {weekDates.map((date, idx) => (
              <div key={idx} className={`border border-white/10 bg-white/5 p-4 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-cyan-400/5' : ''}`}>
                <div className="text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-lg font-black text-slate-100">{date.getDate()}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8 gap-2 auto-rows-auto">
            {timeSlots.map((hour) => (
              <React.Fragment key={hour}>
                <div className="border border-white/10 bg-white/5 p-2 flex items-center justify-center h-[80px]">
                  <span className="text-xs text-slate-400 font-mono">{hour.toString().padStart(2, '0')}:00</span>
                </div>
                {weekDates.map((date, dayIdx) => {
                  const blocks = getBlocksForSlot(date, hour);
                  const isFirstSlot = blocks.length > 0 && blocks[0].startHour === hour;
                  const dateStr = formatDate(date);
                  
                  return (
                    <DroppableZone
                      key={`${dateStr}-${hour}`}
                      id={`slot-${dateStr}-${hour}`}
                      className={`border border-white/10 h-[80px] relative ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-cyan-400/5' : 'bg-white/5'} hover:bg-cyan-400/10 transition-all cursor-pointer`}
                    >
                      {blocks.length === 0 ? (
                        <div 
                          onClick={() => {
                            setSelectedSlot({ date, hour });
                            setShowBlockModal(true);
                          }}
                          className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <span className="text-cyan-400 text-xs">+</span>
                        </div>
                      ) : isFirstSlot ? (
                        <div
                          className="absolute inset-0 border-2 border-cyan-400/60 bg-cyan-400/10 p-2 z-10 overflow-hidden"
                          style={{ height: `${blocks[0].duration * 80}px` }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-xs text-slate-100 truncate pr-2">{blocks[0].title}</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(date, blocks[0].id);
                              }}
                              className="text-slate-400 hover:text-cyan-300 text-sm flex-shrink-0"
                            >
                              ×
                            </button>
                          </div>
                          {blocks[0].description && (
                            <p className="text-[10px] text-slate-400 mb-2 line-clamp-2">{blocks[0].description}</p>
                          )}
                          <div className="space-y-1 mt-2 max-h-[calc(100%-50px)] overflow-y-auto">
                            {(blocks[0].tasks || []).map((task) => (
                              <div key={task.id} className="flex items-center justify-between bg-white/5 px-2 py-1 rounded text-[10px]">
                                <span className="text-slate-300 truncate flex-1">{task.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTaskFromBlock(date, blocks[0].id, task.id);
                                  }}
                                  className="text-slate-400 hover:text-cyan-300 ml-1 flex-shrink-0"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </DroppableZone>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md border border-white/10 bg-[#0b1431] p-6">
            <h3 className="text-xl font-black text-slate-100 mb-4">Create Time Block</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={blockForm.title}
                  onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && addBlock()}
                  className="w-full p-3 border border-white/10 bg-[#0f1a3d] focus:border-cyan-400/50 focus:outline-none text-white"
                  placeholder="e.g., Deep Work, Exercise"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  value={blockForm.description}
                  onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
                  className="w-full p-3 border border-white/10 bg-[#0f1a3d] focus:border-cyan-400/50 focus:outline-none text-white h-20 resize-none"
                  placeholder="Details about this time block..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Duration (hours)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={blockForm.duration}
                  onChange={(e) => setBlockForm({ ...blockForm, duration: Math.max(1, Math.min(12, Number(e.target.value))) })}
                  className="w-full p-3 border border-white/10 bg-[#0f1a3d] focus:border-cyan-400/50 focus:outline-none text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowBlockModal(false); setSelectedSlot(null); setBlockForm({ startHour: 9, duration: 1, title: '', description: '' }); }}
                className="px-4 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-sm uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addBlock}
                disabled={!blockForm.title.trim()}
                className="px-4 py-2 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider transition-colors"
              >
                Create Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============= ANALYTICS PAGE (keeping original) =============
const AnalyticsPage = ({ analyticsData, onBack, onImport, onExport, onClearData }) => {
  const [viewMode, setViewMode] = useState('overview');

  const getDailyStats = (date) => analyticsData.filter(entry => entry.date === date);

  const getWeeklyStats = () => {
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
    }
    return last7Days.map(date => ({
      date,
      tasks: analyticsData.filter(entry => entry.date === date),
      totalTime: analyticsData.filter(entry => entry.date === date).reduce((s, e) => s + e.timeSpent, 0),
    }));
  };

  const totalTasksCompleted = analyticsData.length;
  const totalTimeSpent = analyticsData.reduce((s, e) => s + e.timeSpent, 0);
  const averageTaskTime = totalTasksCompleted > 0 ? Math.round(totalTimeSpent / totalTasksCompleted) : 0;
  const uniqueDates = [...new Set(analyticsData.map(e => e.date))].sort().reverse();

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        onImport(data);
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0a132e] text-white p-6">
      <style jsx>{`
        .blueprint-bg {
          background-image:
            repeating-linear-gradient(0deg, rgba(56,189,248,0.08) 0px, rgba(56,189,248,0.08) 1px, transparent 1px, transparent 22px),
            repeating-linear-gradient(90deg, rgba(56,189,248,0.08) 0px, rgba(56,189,248,0.08) 1px, transparent 1px, transparent 22px);
        }
      `}</style>

      <div className="absolute inset-0 blueprint-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_-10%,rgba(56,189,248,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded transition-colors text-slate-200">
              ← Back
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/40" />
                <span className="text-[10px] tracking-widest text-cyan-300/70 uppercase">Performance Analytics</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-100">Mission Analytics</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onExport} className="px-4 py-2 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 rounded flex items-center gap-2 transition-colors">
              <Download size={16} />
              <span className="text-sm">Export</span>
            </button>
            <label className="px-4 py-2 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 rounded flex items-center gap-2 cursor-pointer transition-colors">
              <Upload size={16} />
              <span className="text-sm">Import</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
            {analyticsData.length > 0 && (
              <button onClick={onClearData} className="px-4 py-2 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 rounded transition-colors">
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {['overview', 'daily', 'weekly'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-6 py-3 font-medium transition-all border ${
                viewMode === mode 
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {viewMode === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                    <Award className="text-cyan-400" size={20} />
                  </div>
                  <h3 className="text-slate-400 text-xs uppercase tracking-wider">Total Tasks</h3>
                </div>
                <p className="text-4xl font-black text-slate-100">{totalTasksCompleted}</p>
              </div>

              <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                    <Clock className="text-cyan-400" size={20} />
                  </div>
                  <h3 className="text-slate-400 text-xs uppercase tracking-wider">Total Time</h3>
                </div>
                <p className="text-4xl font-black text-slate-100">{Math.floor(totalTimeSpent / 60)}h</p>
                <p className="text-sm text-slate-400">{totalTimeSpent % 60}m</p>
              </div>

              <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                    <TrendingUp className="text-cyan-400" size={20} />
                  </div>
                  <h3 className="text-slate-400 text-xs uppercase tracking-wider">Avg Time</h3>
                </div>
                <p className="text-4xl font-black text-slate-100">{averageTaskTime}m</p>
              </div>

              <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                    <Calendar className="text-cyan-400" size={20} />
                  </div>
                  <h3 className="text-slate-400 text-xs uppercase tracking-wider">Active Days</h3>
                </div>
                <p className="text-4xl font-black text-slate-100">{uniqueDates.length}</p>
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-100">
                <BarChart3 className="text-cyan-400" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {uniqueDates.slice(0, 10).map(date => {
                  const dayTasks = getDailyStats(date);
                  const dayTime = dayTasks.reduce((sum, entry) => sum + entry.timeSpent, 0);
                  return (
                    <div key={date} className="border border-white/10 bg-white/5 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-cyan-300">
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                            weekday: 'short', month: 'short', day: 'numeric' 
                          })}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {dayTasks.length} tasks • {Math.floor(dayTime / 60)}h {dayTime % 60}m
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400/60 via-cyan-500/60 to-cyan-300/60"
                          style={{ width: `${Math.min(100, (dayTime / 480) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {viewMode === 'daily' && (
          <div className="space-y-6">
            {uniqueDates.map(date => {
              const dayTasks = getDailyStats(date);
              const dayTime = dayTasks.reduce((sum, entry) => sum + entry.timeSpent, 0);
              return (
                <div key={date} className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-cyan-300">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </h3>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-100">{dayTasks.length} tasks</div>
                      <div className="text-slate-400 text-sm">{Math.floor(dayTime / 60)}h {dayTime % 60}m total</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dayTasks.map((task, idx) => (
                      <div key={idx} className="border border-white/10 bg-white/5 p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-slate-100">{task.taskName}</div>
                          <div className="text-sm text-slate-400">
                            {new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-cyan-300">{task.timeSpent}m</div>
                          {task.isOvertime && <div className="text-xs text-cyan-300/80">Overtime</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'weekly' && (
          <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-black mb-6 text-slate-100">Last 7 Days</h2>
            <div className="space-y-4">
              {getWeeklyStats().map(({ date, tasks, totalTime }) => (
                <div key={date} className="border border-white/10 bg-white/5 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-cyan-300">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', month: 'short', day: 'numeric' 
                      })}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {tasks.length} tasks • {Math.floor(totalTime / 60)}h {totalTime % 60}m
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 transition-all"
                      style={{ width: `${Math.min(100, (totalTime / 480) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analyticsData.length === 0 && (
          <div className="text-center py-20 border border-white/10 bg-white/5">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-black mb-2 text-slate-100">No data yet</h2>
            <p className="text-slate-400">Complete some tasks to see your analytics</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= MAIN APP =============
const Page = () => {
  const [currentPage, setCurrentPage] = useState('tasks');
  const [dailyHabits, setDailyHabits] = useState([]);
  const [newTasks, setNewTasks] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timerState, setTimerState] = useState('stopped');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({ name: '', description: '' });
  const [activeId, setActiveId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [deletingTasks, setDeletingTasks] = useState(new Set());
  const [focusMode, setFocusMode] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [popupWindow, setPopupWindow] = useState(null);
  const [calendarBlocks, setCalendarBlocks] = useState({});

  const [taskTime, setTaskTime] = useState(25);
  const [breakTime, setBreakTime] = useState('none');
  const [customBreak, setCustomBreak] = useState(5);

  const timerRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  const taskStates = {
    WAITING: 'waiting',
    ACTIVE: 'active',
    BREAK: 'break',
    COMPLETED: 'completed',
    OVERTIME: 'overtime'
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Global darkening for native selects/options
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'native-dark-select';
    style.textContent = `
      :root { color-scheme: dark; }
      select, option {
        background-color: #0b1431 !important;
        color: #e5e7eb !important;
      }
      select:-internal-list-box, select:-webkit-autofill {
        background-color: #0b1431 !important;
        color: #e5e7eb !important;
      }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('native-dark-select'); if (el) el.remove(); };
  }, []);

  // ============= EFFECTS =============
  useEffect(() => {
    fetchHabits();
    loadSavedTasks();
    const savedAnalytics = JSON.parse(localStorage.getItem('speedTasksAnalytics') || '[]');
    setAnalyticsData(savedAnalytics);
    const savedCalendar = JSON.parse(localStorage.getItem('speedTasksCalendar') || '{}');
    setCalendarBlocks(savedCalendar);
  }, []);

  useEffect(() => {
    localStorage.setItem('speedTasksAnalytics', JSON.stringify(analyticsData));
  }, [analyticsData]);

  useEffect(() => {
    localStorage.setItem('speedTasksCalendar', JSON.stringify(calendarBlocks));
  }, [calendarBlocks]);

  useEffect(() => {
    if (timerState === 'running') {
      lastTickRef.current = Date.now();
      const tick = () => {
        const now = Date.now();
        const elapsed = now - lastTickRef.current;
        if (elapsed >= 1000) {
          lastTickRef.current = now;
          setTimeRemaining(prev => {
            if (prev <= 0 && !isBreakTime) {
              playNotification();
              updateTaskStatus(currentTaskIndex, taskStates.OVERTIME);
            }
            return prev - 1;
          });
        }
        timerRef.current = requestAnimationFrame(tick);
      };
      timerRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [timerState, currentTaskIndex, isBreakTime]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); toggleTimer(); }
      if (e.code === 'Enter' && timerState === 'running') completeCurrentTask();
      if (e.code === 'KeyF') { e.preventDefault(); setFocusMode(v => !v); }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [timerState]);

  useEffect(() => {
    localStorage.setItem('todaysTasks', JSON.stringify(todaysTasks));
  }, [todaysTasks]);

  useEffect(() => {
    if (isBreakTime && timeRemaining <= 0) {
      setIsBreakTime(false);
      moveToNextTask();
    }
  }, [isBreakTime, timeRemaining]);

  // Keep popup updated
  useEffect(() => {
    if (popupWindow && !popupWindow.closed) {
      const currentTask = todaysTasks[currentTaskIndex];
      popupWindow.postMessage({
        type: 'UPDATE_TIMER',
        time: formatTime(timeRemaining),
        taskName: currentTask ? currentTask.name : 'No Active Task',
        isRunning: timerState === 'running',
        isBreak: isBreakTime,
      }, '*');
    }
  }, [timeRemaining, timerState, currentTaskIndex, todaysTasks, popupWindow, isBreakTime]);

  // Listen for popup messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event?.data?.type) return;
      if (event.data.type === 'TOGGLE_TIMER') toggleTimer();
      if (event.data.type === 'COMPLETE_TASK') completeCurrentTask();
      if (event.data.type === 'STOP_TASK') stopTimer();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [timerState]);

  // ============= HELPERS =============
  const loadSavedTasks = () => {
    try {
      const saved = localStorage.getItem('todaysTasks');
      if (saved) setTodaysTasks(JSON.parse(saved));
    } catch (e) { console.error('Failed to load tasks:', e); }
  };

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      if (response.ok) {
        const habits = await response.json();
        setDailyHabits(habits);
      }
    } catch (e) {
      console.error('Failed to fetch habits:', e);
    } finally {
      setLoading(false);
    }
  };

  const playNotification = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new Ctx();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain); gain.connect(audioContext.destination);
      osc.frequency.value = 820; osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      osc.start(); osc.stop(audioContext.currentTime + 0.4);
    } catch {}
  };

  const addNewTask = () => {
    if (!taskForm.name.trim()) return;
    const newTask = { id: `task_${Date.now()}`, name: taskForm.name, description: taskForm.description, type: 'task' };
    setNewTasks(prev => [...prev, newTask]);
    setTaskForm({ name: '', description: '' });
  };

  const deleteNewTask = (taskId) => setNewTasks(prev => prev.filter(t => t.id !== taskId));

  const deleteCompletedTask = (taskId) => {
    setDeletingTasks(prev => new Set([...prev, taskId]));
    setTimeout(() => {
      setTodaysTasks(prev => prev.filter(t => (t.id || t._id) !== taskId));
      setDeletingTasks(prev => { const ns = new Set(prev); ns.delete(taskId); return ns; });
    }, 250);
  };

  const clearAllCompleted = () => {
    const completed = todaysTasks.filter(t => t.status === taskStates.COMPLETED);
    completed.forEach(t => setDeletingTasks(prev => new Set([...prev, t.id || t._id])));
    setTimeout(() => { setTodaysTasks(prev => prev.filter(t => t.status !== taskStates.COMPLETED)); setDeletingTasks(new Set()); }, 250);
  };

  const showCelebrationAnimation = () => { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 1600); };

  // ============= POPUP =============
  const openTaskPopup = () => {
    if (popupWindow && !popupWindow.closed) { popupWindow.focus(); return; }

    const currentTask = todaysTasks[currentTaskIndex];
    const taskName = currentTask ? currentTask.name : 'No Active Task';

    const popupHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Task Timer</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: dark; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background: linear-gradient(135deg, #0a132e, #111827); color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; height:100vh; display:flex; flex-direction:column; padding:16px; user-select:none; overflow:hidden; }
  .task-name { font-size: 14px; text-align:center; margin-bottom:12px; color:#cbd5e1; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .timer { font-size:48px; text-align:center; font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace; font-weight:900; background: linear-gradient(45deg, #67e8f9, #22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; flex:1; display:flex; align-items:center; justify-content:center; }
  .status { text-align:center; font-size:11px; margin-bottom:16px; padding:6px 12px; border-radius:4px; display:inline-block; width:100%; font-weight:700; text-transform:uppercase; letter-spacing:.5px; border:1px solid; }
  .status.break { background: rgba(34,211,238,0.08); color:#67e8f9; border-color: rgba(34,211,238,0.25); }
  .status.running { background: rgba(34,211,238,0.12); color:#22d3ee; border-color: rgba(34,211,238,0.35); }
  .status.paused { background: rgba(148,163,184,0.12); color:#cbd5e1; border-color: rgba(148,163,184,0.3); }
  .controls { display:flex; gap:8px; justify-content:center; margin-bottom:16px; }
  button { padding:10px 16px; color:#e5e7eb; border:1px solid; background: transparent; cursor:pointer; font-size:12px; font-weight:700; transition: all .2s; min-width:80px; text-transform:uppercase; letter-spacing:.5px; border-radius:4px; }
  button:hover { transform: translateY(-1px); }
  .btn-toggle, .btn-complete { border-color: rgba(34,211,238,0.5); background: rgba(34,211,238,0.08); }
  .btn-toggle:hover, .btn-complete:hover { background: rgba(34,211,238,0.18); }
  .btn-stop { border-color: rgba(203,213,225,0.4); background: rgba(203,213,225,0.08); }
  .btn-stop:hover { background: rgba(203,213,225,0.18); }
  .shortcuts { font-size:10px; color:#94a3b8; text-align:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; margin-top:auto; text-transform:uppercase; letter-spacing:.5px; }
</style>
</head>
<body>
  <div class="task-name" id="taskName">${taskName}</div>
  <div class="timer" id="timer">${formatTime(timeRemaining)}</div>
  <div class="status ${isBreakTime ? 'break' : timerState}" id="status">${isBreakTime ? 'Break Time' : (timerState === 'running' ? 'Running' : 'Paused')}</div>
  <div class="controls">
    <button onclick="toggleTimer()" class="btn-toggle" id="toggleBtn">${timerState === 'running' ? 'Pause' : 'Play'}</button>
    <button onclick="completeTask()" class="btn-complete">Complete</button>
    <button onclick="stopTask()" class="btn-stop">Stop</button>
  </div>
  <div class="shortcuts">Space: Pause • Enter: Complete • Esc: Stop</div>

<script>
  let currentData = {
    time: '${formatTime(timeRemaining)}',
    taskName: '${taskName}',
    isRunning: ${timerState === 'running'},
    isBreak: ${isBreakTime}
  };
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UPDATE_TIMER') {
      currentData = event.data;
      updateDisplay();
    }
  });
  function updateDisplay() {
    document.getElementById('timer').textContent = currentData.time;
    document.getElementById('taskName').textContent = currentData.taskName;
    document.getElementById('toggleBtn').textContent = currentData.isRunning ? 'Pause' : 'Play';
    const status = document.getElementById('status');
    status.className = 'status ' + (currentData.isBreak ? 'break' : (currentData.isRunning ? 'running' : 'paused'));
    status.textContent = currentData.isBreak ? 'Break Time' : (currentData.isRunning ? 'Running' : 'Paused');
  }
  function toggleTimer(){ if (window.opener && !window.opener.closed) window.opener.postMessage({type:'TOGGLE_TIMER'}, '*'); }
  function completeTask(){ if (window.opener && !window.opener.closed) window.opener.postMessage({type:'COMPLETE_TASK'}, '*'); }
  function stopTask(){ if (window.opener && !window.opener.closed) window.opener.postMessage({type:'STOP_TASK'}, '*'); }
  document.addEventListener('keydown', function(e){
    if (e.code==='Space'){ e.preventDefault(); toggleTimer(); }
    if (e.code==='Enter'){ e.preventDefault(); completeTask(); }
    if (e.code==='Escape'){ e.preventDefault(); stopTask(); }
  });
  window.focus();
</script>
</body>
</html>
    `.trim();

    const popup = window.open('', 'taskTimer', 'width=320,height=360,resizable=no,scrollbars=no,status=no,menubar=no,toolbar=no,location=no');
    if (!popup) return;
    try {
      popup.document.open();
      popup.document.write(popupHtml);
      popup.document.close();
    } catch {}
    setPopupWindow(popup);

    const onBeforeUnload = () => setPopupWindow(null);
    popup.addEventListener?.('beforeunload', onBeforeUnload);
    const monitor = setInterval(() => {
      if (popup.closed) {
        clearInterval(monitor);
        setPopupWindow(null);
      }
    }, 1000);
  };

  // ============= DND =============
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);

    let item = null;
    let sourceType = null;

    const habit = dailyHabits.find(h => h._id === active.id);
    if (habit) { item = { ...habit, sourceId: habit._id }; sourceType = 'habit'; }

    const task = newTasks.find(t => t.id === active.id);
    if (task) { item = { ...task, sourceId: task.id }; sourceType = 'newTask'; }

    const todaysTask = todaysTasks.find(t => (t.id || t._id) === active.id);
    if (todaysTask) { item = { ...todaysTask, sourceId: todaysTask.id || todaysTask._id }; sourceType = 'todaysTask'; }

    if (item) setDraggedItem({ ...item, sourceType });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    const currentDraggedItem = draggedItem;
    setDraggedItem(null);
    if (!over || !currentDraggedItem) return;

    // Check if dropping on calendar slot
    if (over.id.startsWith('slot-')) {
      const [, dateStr, hourStr] = over.id.split('-');
      const hour = parseInt(hourStr, 10);
      const date = new Date(dateStr);
      
      if (currentDraggedItem.sourceType === 'habit' || currentDraggedItem.sourceType === 'newTask') {
        const taskToAdd = {
          id: `task_${Date.now()}`,
          name: currentDraggedItem.name,
          description: currentDraggedItem.description || '',
          type: currentDraggedItem.sourceType === 'habit' ? 'habit' : 'task'
        };
        
        // Find the block at this slot
        const blocks = (calendarBlocks[dateStr] || []).filter(block => {
          return hour >= block.startHour && hour < block.startHour + block.duration;
        });
        
        if (blocks.length > 0) {
          const updated = { ...calendarBlocks };
          updated[dateStr] = updated[dateStr].map(b => {
            if (b.id === blocks[0].id) {
              return { ...b, tasks: [...(b.tasks || []), taskToAdd] };
            }
            return b;
          });
          setCalendarBlocks(updated);
          
          // Remove from new tasks if it was dragged from there
          if (currentDraggedItem.sourceType === 'newTask') {
            setNewTasks(prev => prev.filter(t => t.id !== active.id));
          }
        }
      }
      return;
    }

    if (over.id === 'todays-tasks-zone') {
      if (currentDraggedItem.sourceType === 'habit') {
        const habitToAdd = { ...currentDraggedItem, id: `habit_${Date.now()}`, type: 'habit' };
        setPendingTask(habitToAdd);
        setShowTimeModal(true);
      } else if (currentDraggedItem.sourceType === 'newTask') {
        setNewTasks(prev => prev.filter(t => t.id !== active.id));
        const taskToAdd = { ...currentDraggedItem, type: 'task' };
        setPendingTask(taskToAdd);
        setShowTimeModal(true);
      }
    } else if (currentDraggedItem.sourceType === 'todaysTask') {
      const oldIndex = todaysTasks.findIndex(item => (item.id || item._id) === active.id);
      const newIndex = todaysTasks.findIndex(item => (item.id || item._id) === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setTodaysTasks(arrayMove(todaysTasks, oldIndex, newIndex));
      }
    }
  };

  const confirmTaskTime = () => {
    if (!pendingTask) return;
    const breakDuration = breakTime === 'custom' ? customBreak : breakTime === 'none' ? 0 : parseInt(breakTime, 10);
    const taskWithTime = {
      ...pendingTask,
      estimatedTime: Number(taskTime),
      breakTime: breakDuration,
      status: taskStates.WAITING,
      actualTime: 0,
      overtimeMinutes: 0,
      id: pendingTask.id || `task_${Date.now()}`
    };
    setTodaysTasks(prev => [...prev, taskWithTime]);
    setShowTimeModal(false);
    setPendingTask(null);
    setTaskTime(25);
    setBreakTime('none');
  };

  // ============= TIMER =============
  const startTaskSequence = () => {
    if (todaysTasks.length === 0) return;
    setCurrentTaskIndex(0);
    setTimeRemaining(todaysTasks[0].estimatedTime * 60);
    setTimerState('running');
    setIsBreakTime(false);
    updateTaskStatus(0, taskStates.ACTIVE);
  };

  const startFromTask = (index) => {
    if (index < 0 || index >= todaysTasks.length) return;
    setTodaysTasks(prev => prev.map((task, i) => ({ ...task, status: i < index ? taskStates.COMPLETED : taskStates.WAITING })));
    setCurrentTaskIndex(index);
    setTimeRemaining(todaysTasks[index].estimatedTime * 60);
    setTimerState('running');
    setIsBreakTime(false);
    updateTaskStatus(index, taskStates.ACTIVE);
  };

  const toggleTimer = () => { if (timerState !== 'stopped') setTimerState(prev => prev === 'running' ? 'paused' : 'running'); };

  const stopTimer = () => {
    setTimerState('stopped');
    if (currentTaskIndex < todaysTasks.length) updateTaskStatus(currentTaskIndex, taskStates.WAITING);
  };

  const completeCurrentTask = () => {
    if (timerState === 'stopped') return;
    const currentTask = todaysTasks[currentTaskIndex];
    if (!currentTask) return;

    const today = new Date().toISOString().split('T')[0];
    const timeSpent = currentTask.estimatedTime - Math.floor(timeRemaining / 60);
    const analyticsEntry = {
      date: today,
      taskName: currentTask.name,
      timeSpent: Math.max(1, timeSpent),
      estimatedTime: currentTask.estimatedTime,
      completedAt: new Date().toISOString(),
      isOvertime: timeRemaining < 0,
      type: currentTask.type
    };
    setAnalyticsData(prev => [...prev, analyticsEntry]);

    updateTaskStatus(currentTaskIndex, taskStates.COMPLETED);
    showCelebrationAnimation();

    if (currentTask.breakTime > 0) {
      setIsBreakTime(true);
      setTimeRemaining(currentTask.breakTime * 60);
      updateTaskStatus(currentTaskIndex, taskStates.BREAK);
    } else {
      moveToNextTask();
    }
  };

  const moveToNextTask = () => {
    const nextIndex = currentTaskIndex + 1;
    if (nextIndex < todaysTasks.length) {
      setCurrentTaskIndex(nextIndex);
      setTimeRemaining(todaysTasks[nextIndex].estimatedTime * 60);
      setIsBreakTime(false);
      updateTaskStatus(nextIndex, taskStates.ACTIVE);
    } else {
      setTimerState('stopped');
      setIsBreakTime(false);
      playNotification();
    }
  };

  const updateTaskStatus = (index, status) => {
    setTodaysTasks(prev => prev.map((task, i) => i === index ? ({ ...task, status }) : task));
  };

  const formatTime = (seconds) => {
    const abs = Math.abs(seconds);
    const mins = Math.floor(abs / 60);
    const secs = abs % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ============= ANALYTICS IO =============
  const exportAnalytics = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `speed-tasks-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const importAnalytics = (data) => {
    if (Array.isArray(data)) { setAnalyticsData(data); alert('Analytics imported successfully!'); }
    else alert('Invalid data format');
  };

  const clearAnalyticsData = () => {
    if (confirm('Clear all analytics data? This cannot be undone.')) {
      setAnalyticsData([]); localStorage.removeItem('speedTasksAnalytics');
    }
  };

  const completedTasksCount = todaysTasks.filter(t => t.status === taskStates.COMPLETED).length;

  // ============= RENDER ALT PAGE =============
  if (currentPage === 'analytics') {
    return (
      <AnalyticsPage
        analyticsData={analyticsData}
        onBack={() => setCurrentPage('tasks')}
        onExport={exportAnalytics}
        onImport={importAnalytics}
        onClearData={clearAnalyticsData}
      />
    );
  }

  if (currentPage === 'calendar') {
    return (
      <CalendarPage
        calendarBlocks={calendarBlocks}
        onUpdateBlocks={setCalendarBlocks}
        onBack={() => setCurrentPage('tasks')}
        dailyHabits={dailyHabits}
        newTasks={newTasks}
      />
    );
  }

  // ============= LOADING =============
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a132e] flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          Loading habits...
        </div>
      </div>
    );
  }

  // ============= MAIN PAGE =============
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`min-h-screen bg-[#0a132e] text-white p-6 ${focusMode ? 'overflow-hidden' : ''}`}>
        <style jsx>{`
          .blueprint-bg {
            background-image:
              repeating-linear-gradient(0deg, rgba(56,189,248,0.08) 0px, rgba(56,189,248,0.08) 1px, transparent 1px, transparent 22px),
              repeating-linear-gradient(90deg, rgba(56,189,248,0.08) 0px, rgba(56,189,248,0.08) 1px, transparent 1px, transparent 22px);
          }
        `}</style>

        <div className="absolute inset-0 blueprint-bg opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_65%_-10%,rgba(56,189,248,0.12),transparent_60%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center border border-white/10 bg-white/5 px-4 py-1 text-[10px] tracking-widest text-slate-300 uppercase">
                SPEED TASKS · ENGINEERING
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-slate-200/30 to-transparent" />
            </div>

            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-100 mb-2">
                  <span className="block">Lightning Speed</span>
                  <span className="block text-cyan-300">Task Execution</span>
                </h1>
                <p className="text-slate-300/80 text-sm max-w-2xl">
                  High-velocity execution for tasks that must scale. Time-box with precision, execute with rigor.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentPage('calendar')}
                  className="px-4 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors flex items-center gap-2"
                >
                  <Calendar size={16} />
                  <span className="text-xs uppercase tracking-wider">Calendar</span>
                </button>
                <button
                  onClick={() => setCurrentPage('analytics')}
                  className="px-4 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors flex items-center gap-2"
                >
                  <BarChart3 size={16} />
                  <span className="text-xs uppercase tracking-wider">Analytics</span>
                </button>
                {completedTasksCount > 0 && (
                  <button
                    onClick={clearAllCompleted}
                    className="px-4 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors"
                  >
                    <span className="text-xs uppercase tracking-wider">Clear ({completedTasksCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Timer */}
          {timerState !== 'stopped' && (
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-8 mb-8 text-center shadow-xl">
              <div className={`text-6xl md:text-7xl font-black mb-6 font-mono ${
                timeRemaining < 0 ? 'text-cyan-300 animate-pulse' :
                timeRemaining < 300 ? 'text-cyan-300' :
                'bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent'
              }`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xl mb-6 text-slate-300 font-medium">
                {isBreakTime ? 'Recovery Phase' :
                 todaysTasks[currentTaskIndex] ? todaysTasks[currentTaskIndex].name : 'No Active Mission'}
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={toggleTimer}
                  className={`px-8 py-3 font-bold text-sm uppercase tracking-wider transition-all border ${
                    timerState === 'running' 
                      ? 'border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20' 
                      : 'border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20'
                  }`}
                >
                  {timerState === 'running' ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={stopTimer}
                  className="px-8 py-3 border border-white/20 bg-white/5 hover:bg-white/10 font-bold text-sm uppercase tracking-wider transition-all"
                >
                  Stop
                </button>
                {!isBreakTime ? (
                  <button
                    onClick={completeCurrentTask}
                    className="px-8 py-3 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 font-bold text-sm uppercase tracking-wider transition-all"
                  >
                    Complete
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsBreakTime(false); updateTaskStatus(currentTaskIndex, taskStates.COMPLETED); moveToNextTask(); }}
                    className="px-8 py-3 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 font-bold text-sm uppercase tracking-wider transition-all"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={openTaskPopup}
                  className="px-8 py-3 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Zap size={16} />
                  Popup
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Daily Habits */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                  <div className="w-3 h-3 bg-cyan-400/60" />
                </div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Training Regimen</h2>
              </div>
              <div className="space-y-3 min-h-[300px]">
                {dailyHabits.map((habit) => (
                  <SimpleDraggable key={habit._id} id={habit._id}>
                    <div className="border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-cyan-400/30 transition-all cursor-grab active:cursor-grabbing group">
                      <h3 className="font-bold text-slate-100">{habit.name}</h3>
                      {habit.description && <p className="text-slate-400 text-sm mt-1">{habit.description}</p>}
                      <div className="text-[10px] text-cyan-400 mt-2 uppercase tracking-wider">Mastery Path</div>
                    </div>
                  </SimpleDraggable>
                ))}
                {dailyHabits.length === 0 && (
                  <div className="text-center text-slate-400 py-12 border border-white/10">
                    <div className="text-3xl mb-3">⚡</div>
                    <div className="text-sm">No habits found</div>
                    <div className="text-xs mt-1">Add via API</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: New Tasks */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                  <Target size={16} className="text-cyan-400" />
                </div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Mission Queue</h2>
              </div>

              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Mission objective..."
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && addNewTask()}
                  className="w-full p-3 border border-white/10 bg-white/5 focus:border-cyan-400/50 focus:outline-none text-white placeholder-slate-400 text-sm"
                />
                <textarea
                  placeholder="Mission details (optional)..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full p-3 border border-white/10 bg-white/5 focus:border-cyan-400/50 focus:outline-none text-white placeholder-slate-400 h-20 resize-none text-sm"
                />
                <button
                  onClick={addNewTask}
                  disabled={!taskForm.name.trim()}
                  className="w-full py-3 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 disabled:border-white/10 disabled:bg-white/5 disabled:cursor-not-allowed font-bold text-sm uppercase tracking-wider transition-all"
                >
                  Add Mission
                </button>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {newTasks.map((task) => (
                  <SimpleDraggable key={task.id} id={task.id}>
                    <div className="border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-cyan-400/30 transition-all relative cursor-grab active:cursor-grabbing">
                      <button
                        onClick={() => deleteNewTask(task.id)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-cyan-300 text-sm transition-colors"
                      >
                        ×
                      </button>
                      <h3 className="font-bold text-slate-100 pr-6">{task.name}</h3>
                      {task.description && <p className="text-slate-400 text-sm mt-1">{task.description}</p>}
                      <div className="text-[10px] text-cyan-400 mt-2 uppercase tracking-wider">Quest</div>
                    </div>
                  </SimpleDraggable>
                ))}
                {newTasks.length === 0 && (
                  <div className="text-center text-slate-400 py-8 border border-white/10">
                    <div className="text-2xl mb-2">⚔️</div>
                    <div className="text-sm">Create your first quest</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Today's Tasks */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                    <Zap size={16} className="text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Battle Queue</h2>
                </div>
                {todaysTasks.length > 0 && timerState === 'stopped' && (
                  <button
                    onClick={startTaskSequence}
                    className="px-4 py-2 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Begin
                  </button>
                )}
              </div>

              <DroppableZone id="todays-tasks-zone" className="space-y-3 min-h-[400px] p-4 border-2 border-dashed border-white/10 hover:border-cyan-400/30 transition-all">
                {todaysTasks.length === 0 ? (
                  <div className="text-center text-slate-400 py-16">
                    <div className="text-5xl mb-4">⚡</div>
                    <div className="text-lg mb-1">Drop missions here</div>
                    <div className="text-xs">Prepare for execution</div>
                  </div>
                ) : (
                  <SortableContext items={todaysTasks.map(t => t.id || t._id)} strategy={verticalListSortingStrategy}>
                    {todaysTasks.map((task, index) => {
                      const isDeleting = deletingTasks.has(task.id || task._id);
                      return (
                        <SortableItem key={task.id || task._id} id={task.id || task._id}>
                          <div
                            className={`border p-4 transition-all cursor-grab active:cursor-grabbing relative group ${
                              isDeleting ? 'opacity-0 scale-95 translate-x-full' :
                              task.status === taskStates.ACTIVE ? 'border-cyan-400/60 bg-cyan-400/10' :
                              task.status === taskStates.COMPLETED ? 'border-cyan-400/30 bg-cyan-400/5 opacity-60' :
                              task.status === taskStates.OVERTIME ? 'border-cyan-300/70 bg-cyan-300/10' :
                              task.status === taskStates.BREAK ? 'border-cyan-400/30 bg-cyan-400/5' :
                              'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            {task.status === taskStates.COMPLETED && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteCompletedTask(task.id || task._id); }}
                                className="absolute top-3 right-10 text-slate-400 hover:text-cyan-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            )}

                            {task.status === taskStates.WAITING && timerState === 'stopped' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); startFromTask(index); }}
                                className="absolute top-3 right-3 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 text-xs uppercase tracking-wider px-3 py-1 transition-all"
                              >
                                Start here
                              </button>
                            )}

                            <div className="pr-28">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-bold text-slate-100">{task.name}</div>
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border border-white/10 bg-white/5 text-slate-300">
                                  {task.type === 'habit' ? 'Habit' : 'Task'}
                                </span>
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                                  task.status === taskStates.ACTIVE ? 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10' :
                                  task.status === taskStates.COMPLETED ? 'border-cyan-400/20 text-cyan-200 bg-cyan-400/5' :
                                  task.status === taskStates.OVERTIME ? 'border-cyan-300/50 text-cyan-200 bg-cyan-300/10' :
                                  task.status === taskStates.BREAK ? 'border-cyan-400/30 text-cyan-300 bg-cyan-400/5' :
                                  'border-white/10 text-slate-300 bg-white/5'
                                }`}>
                                  {task.status}
                                </span>
                              </div>

                              {task.description && <div className="text-sm text-slate-400 mb-2">{task.description}</div>}

                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>⏱ Est: <span className="text-slate-200 font-semibold">{task.estimatedTime}m</span></span>
                                <span>•</span>
                                <span>☕ Break: <span className="text-slate-200 font-semibold">{task.breakTime}m</span></span>
                                {index === currentTaskIndex && timerState !== 'stopped' && !isBreakTime && (
                                  <>
                                    <span>•</span>
                                    <span>Remaining: <span className="text-cyan-300 font-semibold">{formatTime(timeRemaining)}</span></span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      );
                    })}
                  </SortableContext>
                )}
              </DroppableZone>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && draggedItem ? (
            <div className="border border-cyan-400/40 bg-cyan-400/10 text-white p-4 pointer-events-none w-[320px] shadow-xl">
              <div className="font-bold">{draggedItem.name}</div>
              {draggedItem.description && <div className="text-xs text-slate-300 mt-1">{draggedItem.description}</div>}
              <div className="text-[10px] text-cyan-300 mt-2 uppercase tracking-wider">
                {draggedItem.sourceType === 'habit' ? 'Habit' : draggedItem.sourceType === 'newTask' ? 'New Task' : 'Today'}
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="bg-cyan-300/10 border border-cyan-300/30 text-cyan-200 px-6 py-4 text-xl font-black animate-pulse">
              Mission Complete! ⚡
            </div>
          </div>
        )}

        {/* Time Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-md border border-white/10 bg-[#0b1431] p-6">
              <h3 className="text-xl font-black text-slate-100 mb-1">Configure Time</h3>
              <p className="text-slate-400 text-sm mb-4">
                Set estimate & break for <span className="text-cyan-300 font-semibold">{pendingTask?.name}</span>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Estimated Minutes</label>
                  <input
                    type="number"
                    min={1}
                    value={taskTime}
                    onChange={(e) => setTaskTime(Math.max(1, Number(e.target.value)))}
                    className="w-full p-3 border border-white/10 bg-[#0f1a3d] focus:border-cyan-400/50 focus:outline-none text-white"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Break</label>
                  <div className="relative">
                    <select
                      value={breakTime}
                      onChange={(e) => setBreakTime(e.target.value)}
                      className="appearance-none w-full p-3 pr-10 border border-white/10 bg-[#0f1a3d] focus:border-cyan-400/50 focus:outline-none text-white"
                    >
                      <option value="none">None</option>
                      <option value="5">5 min</option>
                      <option value="10">10 min</option>
                      <option value="15">15 min</option>
                      <option value="custom">Custom…</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M7 10l5 5 5-5" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {breakTime === 'custom' && (
                <div className="mt-4">
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Custom Break (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={customBreak}
                    onChange={(e) => setCustomBreak(Math.max(0, Number(e.target.value)))}
                    className="w-full p-3 border border-white/10 bg-[#0f1a3d] focus:border-cyan-400/50 focus:outline-none text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowTimeModal(false); setPendingTask(null); }}
                  className="px-4 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-sm uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTaskTime}
                  className="px-4 py-2 border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 text-sm uppercase tracking-wider"
                >
                  Add to Today
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default Page;