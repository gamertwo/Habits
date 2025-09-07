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

// Simple Draggable Component for habits and new tasks
const SimpleDraggable = ({ id, children, disabled = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: id,
    disabled: disabled,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      {children}
    </div>
  );
};

// Sortable Component for today's tasks
const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      {children}
    </div>
  );
};

// Droppable Zone Component
const DroppableZone = ({ id, children, className = '' }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'ring-2 ring-purple-400 bg-purple-900/20' : ''} transition-all duration-200`}
    >
      {children}
    </div>
  );
};

const SpeedTasksPage = () => {
  // State Management
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
  const [popupWindow, setPopupWindow] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Modal state
  const [taskTime, setTaskTime] = useState(25);
  const [breakTime, setBreakTime] = useState('none');
  const [customBreak, setCustomBreak] = useState(5);

  const timerRef = useRef(null);

  const taskStates = {
    WAITING: 'waiting',
    ACTIVE: 'active',
    BREAK: 'break',
    COMPLETED: 'completed',
    OVERTIME: 'overtime'
  };

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Effects
  useEffect(() => {
    fetchHabits();
    loadSavedTasks();
  }, []);

  useEffect(() => {
    if (timerState === 'running') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            playNotification();
            if (!isBreakTime) {
              updateTaskStatus(currentTaskIndex, taskStates.OVERTIME);
            }
            return prev - 1;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerState, currentTaskIndex, isBreakTime]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleTimer();
      }
      if (e.code === 'Enter' && timerState === 'running') {
        completeCurrentTask();
      }
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

  // Helper functions
  const loadSavedTasks = () => {
    try {
      const saved = localStorage.getItem('todaysTasks');
      if (saved) {
        setTodaysTasks(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved tasks:', error);
    }
  };

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      if (response.ok) {
        const habits = await response.json();
        setDailyHabits(habits);
      } else {
        console.error('Failed to fetch habits:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNotification = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
  };

  const addNewTask = () => {
    if (!taskForm.name.trim()) return;
    
    const newTask = {
      id: `task_${Date.now()}`,
      name: taskForm.name,
      description: taskForm.description,
      type: 'task'
    };
    
    setNewTasks([...newTasks, newTask]);
    setTaskForm({ name: '', description: '' });
  };

  const deleteNewTask = (taskId) => {
    setNewTasks(newTasks.filter(task => task.id !== taskId));
  };

  // Celebration function
  const showCelebrationAnimation = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // Drag and drop handlers
  const handleDragStart = (event) => {
    console.log('Drag started:', event.active.id);
    const { active } = event;
    setActiveId(active.id);
    
    // Find the dragged item
    let item = null;
    let sourceType = null;
    
    // Check daily habits
    const habit = dailyHabits.find(h => h._id === active.id);
    if (habit) {
      item = { ...habit, sourceId: habit._id };
      sourceType = 'habit';
    }
    
    // Check new tasks
    const task = newTasks.find(t => t.id === active.id);
    if (task) {
      item = { ...task, sourceId: task.id };
      sourceType = 'newTask';
    }
    
    // Check today's tasks
    const todaysTask = todaysTasks.find(t => (t.id || t._id) === active.id);
    if (todaysTask) {
      item = { ...todaysTask, sourceId: todaysTask.id || todaysTask._id };
      sourceType = 'todaysTask';
    }
    
    if (item) {
      setDraggedItem({ ...item, sourceType });
      console.log('Found item:', item.name, 'Type:', sourceType);
    }
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (over) {
      console.log('Dragging over:', over.id);
    }
  };

  const handleDragEnd = (event) => {
    console.log('Drag ended');
    const { active, over } = event;
    
    setActiveId(null);
    const currentDraggedItem = draggedItem;
    setDraggedItem(null);
    
    if (!over || !currentDraggedItem) {
      console.log('No valid drop target');
      return;
    }

    console.log('Drop details:', {
      activeId: active.id,
      overId: over.id,
      sourceType: currentDraggedItem.sourceType
    });

    // Handle drop on today's tasks
    if (over.id === 'todays-tasks-zone') {
      console.log('Dropped on todays tasks zone');
      
      if (currentDraggedItem.sourceType === 'habit') {
        console.log('Processing habit drop');
        const habitToAdd = {
          ...currentDraggedItem,
          id: `habit_${Date.now()}`,
          type: 'habit'
        };
        setPendingTask(habitToAdd);
        setShowTimeModal(true);
        console.log('Opening time modal for habit');
        
      } else if (currentDraggedItem.sourceType === 'newTask') {
        console.log('Processing new task drop');
        // Remove from new tasks
        setNewTasks(prev => prev.filter(t => t.id !== active.id));
        const taskToAdd = {
          ...currentDraggedItem,
          type: 'task'
        };
        setPendingTask(taskToAdd);
        setShowTimeModal(true);
        console.log('Opening time modal for task');
      }
      
    } else if (currentDraggedItem.sourceType === 'todaysTask') {
      // Handle reordering within today's tasks
      console.log('Reordering within todays tasks');
      const oldIndex = todaysTasks.findIndex(item => (item.id || item._id) === active.id);
      const newIndex = todaysTasks.findIndex(item => (item.id || item._id) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`Moving from position ${oldIndex} to ${newIndex}`);
        setTodaysTasks(arrayMove(todaysTasks, oldIndex, newIndex));
      }
    }
  };

  const confirmTaskTime = () => {
    if (!pendingTask) return;

    const breakDuration = breakTime === 'custom' ? customBreak : 
                         breakTime === 'none' ? 0 : parseInt(breakTime);

    const taskWithTime = {
      ...pendingTask,
      estimatedTime: taskTime,
      breakTime: breakDuration,
      status: taskStates.WAITING,
      actualTime: 0,
      overtimeMinutes: 0,
      id: pendingTask.id || `task_${Date.now()}`
    };

    console.log('Adding task to todays list:', taskWithTime);
    setTodaysTasks([...todaysTasks, taskWithTime]);
    setShowTimeModal(false);
    setPendingTask(null);
    setTaskTime(25);
    setBreakTime('none');
  };

  // Timer functions
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
    
    // Reset all tasks to waiting state
    setTodaysTasks(prev => prev.map((task, i) => ({
      ...task,
      status: i < index ? taskStates.COMPLETED : taskStates.WAITING
    })));
    
    setCurrentTaskIndex(index);
    setTimeRemaining(todaysTasks[index].estimatedTime * 60);
    setTimerState('running');
    setIsBreakTime(false);
    updateTaskStatus(index, taskStates.ACTIVE);
  };

  const toggleTimer = () => {
    if (timerState === 'stopped') return;
    setTimerState(prev => prev === 'running' ? 'paused' : 'running');
  };

  const stopTimer = () => {
    setTimerState('stopped');
    if (currentTaskIndex < todaysTasks.length) {
      updateTaskStatus(currentTaskIndex, taskStates.WAITING);
    }
  };

  const completeCurrentTask = () => {
    if (timerState === 'stopped') return;
    
    const currentTask = todaysTasks[currentTaskIndex];
    if (!currentTask) return;

    updateTaskStatus(currentTaskIndex, taskStates.COMPLETED);
    showCelebrationAnimation();
    
    // Check the current task's break time, not the state variable
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
    setTodaysTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, status } : task
    ));
  };

  const formatTime = (seconds) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Popup window functions
  const openTaskPopup = () => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.focus();
      return;
    }

    // Create popup with inline HTML
    const currentTask = todaysTasks[currentTaskIndex];
    const taskName = currentTask ? currentTask.name : 'No Active Task';
    
    const popupContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Task Timer</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: linear-gradient(135deg, #1f2937, #111827);
            color: white; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 16px;
            user-select: none;
            overflow: hidden;
          }
          .task-name { 
            font-size: 14px; 
            text-align: center; 
            margin-bottom: 12px;
            color: #d1d5db;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .timer { 
            font-size: 40px; 
            text-align: center; 
            margin: 20px 0;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-weight: bold;
            background: linear-gradient(45deg, #60a5fa, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .status {
            text-align: center;
            font-size: 12px;
            margin-bottom: 16px;
            padding: 4px 8px;
            border-radius: 12px;
            display: inline-block;
            width: 100%;
          }
          .status.break { background: rgba(251, 146, 60, 0.2); color: #fed7aa; }
          .status.running { background: rgba(34, 197, 94, 0.2); color: #bbf7d0; }
          .status.paused { background: rgba(107, 114, 128, 0.2); color: #d1d5db; }
          .controls { 
            display: flex; 
            gap: 8px; 
            justify-content: center;
            margin-bottom: 16px;
          }
          button { 
            padding: 8px 12px; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s ease;
            min-width: 60px;
          }
          button:hover { 
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          .btn-toggle { background: linear-gradient(45deg, #3b82f6, #1d4ed8); }
          .btn-complete { background: linear-gradient(45deg, #10b981, #059669); }
          .btn-stop { background: linear-gradient(45deg, #ef4444, #dc2626); }
          .shortcuts {
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
            border-top: 1px solid #374151;
            padding-top: 8px;
            margin-top: auto;
          }
        </style>
      </head>
      <body>
        <div class="task-name" id="taskName">${taskName}</div>
        <div class="timer" id="timer">${formatTime(timeRemaining)}</div>
        <div class="status ${isBreakTime ? 'break' : timerState}" id="status">
          ${isBreakTime ? 'Break Time' : 
            timerState === 'running' ? 'Running' : 'Paused'}
        </div>
        <div class="controls">
          <button onclick="toggleTimer()" class="btn-toggle" id="toggleBtn">
            ${timerState === 'running' ? 'Pause' : 'Play'}
          </button>
          <button onclick="completeTask()" class="btn-complete">Complete</button>
          <button onclick="stopTask()" class="btn-stop">Stop</button>
        </div>
        <div class="shortcuts">
          Space: Pause • Enter: Complete • Esc: Stop
        </div>
        
        <script>
          let currentData = {
            time: '${formatTime(timeRemaining)}',
            taskName: '${taskName}',
            isRunning: ${timerState === 'running'},
            isBreak: ${isBreakTime}
          };
          
          window.addEventListener('message', function(event) {
            if (event.data.type === 'UPDATE_TIMER') {
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
            status.textContent = currentData.isBreak ? 'Break Time' : 
                               currentData.isRunning ? 'Running' : 'Paused';
          }
          
          function toggleTimer() {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({type: 'TOGGLE_TIMER'}, '*');
            }
          }
          
          function completeTask() {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({type: 'COMPLETE_TASK'}, '*');
            }
          }
          
          function stopTask() {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({type: 'STOP_TASK'}, '*');
            }
          }
          
          document.addEventListener('keydown', function(e) {
            if (e.code === 'Space') {
              e.preventDefault();
              toggleTimer();
            } else if (e.code === 'Enter') {
              e.preventDefault();
              completeTask();
            } else if (e.code === 'Escape') {
              e.preventDefault();
              stopTask();
            }
          });
          
          // Keep window focused and on top
          window.focus();
          setInterval(() => {
            if (document.hasFocus()) {
              window.focus();
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;

    const popup = window.open(
      'data:text/html,' + encodeURIComponent(popupContent),
      'taskTimer',
      'width=280,height=320,resizable=no,scrollbars=no,status=no,menubar=no,toolbar=no,location=no'
    );
    
    if (popup) {
      setPopupWindow(popup);
      popup.focus();
      
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          setPopupWindow(null);
          clearInterval(checkClosed);
        }
      }, 1000);
    }
  };

  // Update popup window
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
      if (event.data.type === 'TOGGLE_TIMER') {
        toggleTimer();
      } else if (event.data.type === 'COMPLETE_TASK') {
        completeCurrentTask();
      } else if (event.data.type === 'STOP_TASK') {
        stopTimer();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [timerState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          Loading habits...
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Speed Task Completion
          </h1>
          
          {/* Main Timer Display */}
          {timerState !== 'stopped' && (
            <div className="bg-gray-800 rounded-2xl p-8 mb-8 text-center border border-gray-700 shadow-2xl">
              <div className="text-7xl font-bold mb-6 font-mono bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-2xl mb-6 text-gray-300">
                {isBreakTime ? 'Break Time' : 
                 todaysTasks[currentTaskIndex] ? 
                 `${todaysTasks[currentTaskIndex].name}` : 
                 'No Active Task'}
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={toggleTimer}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                    timerState === 'running' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25'
                  } shadow-lg`}
                >
                  {timerState === 'running' ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={stopTimer}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/25"
                >
                  Stop
                </button>
                {!isBreakTime ? (
                  <button
                    onClick={completeCurrentTask}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
                  >
                    Complete Task
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsBreakTime(false);
                      updateTaskStatus(currentTaskIndex, taskStates.COMPLETED);
                      moveToNextTask();
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-yellow-500/25"
                  >
                    Skip Break
                  </button>
                )}
                <button
                  onClick={openTaskPopup}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25"
                >
                  Popup Timer
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Daily Habits */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Daily Habits
              </h2>
              <div className="space-y-4 min-h-[300px]">
                {dailyHabits.map((habit) => (
                  <SimpleDraggable key={habit._id} id={habit._id}>
                    <div className="bg-gray-700 p-5 rounded-xl border border-gray-600 hover:border-blue-400 hover:bg-gray-600 hover:scale-105 transition-all duration-200 cursor-grab active:cursor-grabbing">
                      <h3 className="font-bold text-lg text-white">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-gray-300 text-sm mt-2">{habit.description}</p>
                      )}
                      <div className="text-xs text-gray-400 mt-2">Infinite use</div>
                    </div>
                  </SimpleDraggable>
                ))}
                {dailyHabits.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <div>No habits found</div>
                    <div className="text-sm mt-2">Create habits using the habits API</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: New Tasks */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                New Tasks
              </h2>
              
              {/* Task Creation Form */}
              <div className="mb-8 space-y-4">
                <input
                  type="text"
                  placeholder="Task name..."
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && addNewTask()}
                  className="w-full p-4 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-400 transition-all duration-200"
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full p-4 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-400 h-24 resize-none transition-all duration-200"
                />
                <button
                  onClick={addNewTask}
                  disabled={!taskForm.name.trim()}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                >
                  Add Task
                </button>
              </div>

              {/* New Tasks List */}
              <div className="space-y-4 min-h-[200px]">
                {newTasks.map((task) => (
                  <SimpleDraggable key={task.id} id={task.id}>
                    <div className="bg-gray-700 p-5 rounded-xl border border-gray-600 hover:border-green-400 hover:bg-gray-600 hover:scale-105 transition-all duration-200 relative cursor-grab active:cursor-grabbing">
                      <button
                        onClick={() => deleteNewTask(task.id)}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full w-6 h-6 flex items-center justify-center text-lg transition-all duration-200"
                      >
                        ×
                      </button>
                      <h3 className="font-bold text-lg pr-8 text-white">{task.name}</h3>
                      {task.description && (
                        <p className="text-gray-300 text-sm mt-2">{task.description}</p>
                      )}
                      <div className="text-xs text-gray-400 mt-2">One-time task</div>
                    </div>
                  </SimpleDraggable>
                ))}
                {newTasks.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-3xl mb-3">📝</div>
                    <div>Create your first task above</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Today's Tasks */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Today Tasks
                </h2>
                {todaysTasks.length > 0 && timerState === 'stopped' && (
                  <button
                    onClick={startTaskSequence}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Start Blitz
                  </button>
                )}
              </div>

              <DroppableZone id="todays-tasks-zone" className="space-y-4 min-h-[400px] p-6 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-xl">
                {todaysTasks.length === 0 ? (
                  <div className="text-center text-gray-400 py-16">
                    <div className="text-6xl mb-6">🎯</div>
                    <div className="text-xl mb-2">Drop habits or tasks here</div>
                    <div className="text-sm">Get ready for your speed completion session!</div>
                  </div>
                ) : (
                  <SortableContext items={todaysTasks.map(t => t.id || t._id)} strategy={verticalListSortingStrategy}>
                    {todaysTasks.map((task, index) => (
                      <SortableItem key={task.id || task._id} id={task.id || task._id}>
                        <div 
                          className={`bg-gray-700 p-5 rounded-xl transition-all duration-200 border cursor-grab active:cursor-grabbing relative ${
                            task.status === taskStates.ACTIVE ? 'ring-2 ring-blue-400 bg-blue-900/30 border-blue-400 shadow-blue-400/20 shadow-lg animate-pulse' :
                            task.status === taskStates.COMPLETED ? 'bg-green-900/30 border-green-400 opacity-80' :
                            task.status === taskStates.OVERTIME ? 'bg-red-900/30 border-red-400 animate-bounce' :
                            task.status === taskStates.BREAK ? 'bg-orange-900/30 border-orange-400' :
                            'border-gray-600 hover:bg-gray-600 hover:scale-105'
                          }`}
                        >
                          {/* Start from this task button */}
                          {task.status === taskStates.WAITING && timerState === 'stopped' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startFromTask(index);
                              }}
                              className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded-md transition-colors z-10"
                            >
                              Start Here
                            </button>
                          )}
                          
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-blue-300">
                              #{index + 1} {task.name}
                            </h3>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${
                              task.status === taskStates.WAITING ? 'bg-gray-600 text-gray-200' :
                              task.status === taskStates.ACTIVE ? 'bg-blue-600 text-blue-100 animate-pulse' :
                              task.status === taskStates.BREAK ? 'bg-orange-600 text-orange-100' :
                              task.status === taskStates.COMPLETED ? 'bg-green-600 text-green-100' :
                              task.status === taskStates.OVERTIME ? 'bg-red-600 text-red-100 animate-pulse' : 'bg-gray-600 text-gray-200'
                            }`}>
                              {task.status === taskStates.OVERTIME ? 'OVERTIME!' : task.status}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-gray-300 text-sm mb-3">{task.description}</p>
                          )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-400 font-medium">
                              {task.estimatedTime}m
                              {task.breakTime > 0 && (
                                <span className="text-orange-400 ml-2">
                                  {task.breakTime}m break
                                </span>
                              )}
                            </span>
                            {task.status === taskStates.ACTIVE && (
                              <span className="text-blue-400 font-bold animate-pulse">
                                RUNNING
                              </span>
                            )}
                            {task.status === taskStates.COMPLETED && (
                              <span className="text-green-400 font-bold">
                                DONE
                              </span>
                            )}
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                )}
              </DroppableZone>
            </div>
          </div>
        </div>

        {/* Time Configuration Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full border border-gray-600 shadow-2xl transform transition-all duration-300">
              <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Configure Task
              </h3>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-lg font-medium mb-4 text-white">
                    How much time will this take?
                  </label>
                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                      {taskTime} minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={taskTime}
                    onChange={(e) => setTaskTime(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>5 min</span>
                    <span>60 min</span>
                    <span>120 min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium mb-4 text-white">
                    Break time after this task?
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'none', label: 'No break', desc: 'Continue immediately' },
                      { value: '5', label: '5 minutes', desc: 'Quick breather' },
                      { value: '10', label: '10 minutes', desc: 'Standard break' },
                      { value: '15', label: '15 minutes', desc: 'Longer rest' },
                      { value: 'custom', label: 'Custom', desc: 'Set your own time' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center p-3 rounded-xl bg-gray-700 hover:bg-gray-600 cursor-pointer transition-all duration-200 border border-gray-600 hover:border-blue-400">
                        <input
                          type="radio"
                          name="breakTime"
                          value={option.value}
                          checked={breakTime === option.value}
                          onChange={(e) => setBreakTime(e.target.value)}
                          className="mr-4 w-4 h-4 text-blue-500"
                        />
                        <div>
                          <div className="font-medium text-white">{option.label}</div>
                          <div className="text-sm text-gray-400">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {breakTime === 'custom' && (
                    <div className="mt-4">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={customBreak}
                        onChange={(e) => setCustomBreak(parseInt(e.target.value) || 5)}
                        className="w-24 p-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none text-white text-center"
                        placeholder="5"
                      />
                      <span className="ml-2 text-gray-400">minutes</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 py-4 bg-gray-600 hover:bg-gray-700 rounded-xl font-bold text-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTaskTime}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {todaysTasks.length > 0 && (
          <div className="fixed bottom-6 left-6 right-6 bg-gray-800/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-600 shadow-2xl">
            <div className="flex justify-between items-center text-lg mb-4">
              <span className="font-bold">
                Progress: {todaysTasks.filter(t => t.status === taskStates.COMPLETED).length} / {todaysTasks.length}
              </span>
              <span className="text-blue-400 font-bold">
                Total: {todaysTasks.reduce((acc, task) => acc + task.estimatedTime, 0)}m
                {todaysTasks.some(t => t.breakTime > 0) && (
                  <span className="text-orange-400 ml-2">
                    + {todaysTasks.reduce((acc, task) => acc + task.breakTime, 0)}m breaks
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{ 
                  width: `${todaysTasks.length > 0 ? 
                    (todaysTasks.filter(t => t.status === taskStates.COMPLETED).length / todaysTasks.length) * 100 : 0}%` 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
              <span>
                {todaysTasks.filter(t => t.status === taskStates.COMPLETED).length} completed
              </span>
              <span>
                {todaysTasks.filter(t => t.status === taskStates.OVERTIME).length} overtime
              </span>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help
        <div className="fixed top-6 right-6 bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl border border-gray-600 text-sm text-gray-400">
          <div className="font-bold mb-2">Shortcuts:</div>
          <div>Space: Pause/Resume</div>
          <div>Enter: Complete Task</div>
          <div>Esc: Stop Timer</div>
        </div> */}

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="fixed top-20 right-6 z-50 animate-bounce">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center shadow-2xl">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-lg font-medium text-white/90">Great Work!</div>
              <div className="text-sm text-white/70">Task Completed</div>
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && draggedItem ? (
            <div className="bg-gray-700 p-5 rounded-xl border-2 border-blue-400 shadow-2xl transform rotate-3 scale-105 bg-blue-900/30">
              <h3 className="font-bold text-lg text-white">{draggedItem.name}</h3>
              {draggedItem.description && (
                <p className="text-gray-300 text-sm mt-2">{draggedItem.description}</p>
              )}
              <div className="text-xs text-blue-400 mt-2">Dragging...</div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default SpeedTasksPage;