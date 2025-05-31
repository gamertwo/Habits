"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Download,
  Upload,
  Timer,
  BarChart3,
  Calendar,
  Filter,
  X,
  User,
  RefreshCw,
  Save
} from "lucide-react";

const ANALYTICS_PERIODS = {
  day: 'Daily',
  week: 'Weekly', 
  month: 'Monthly',
  custom: 'Custom Range'
};

export default function TasksPage() {
  const [user, setUser] = useState({ email: 'user@example.com', name: 'Demo User' });
  const [tasks, setTasks] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [newTaskName, setNewTaskName] = useState('');
  const [newSubTaskName, setNewSubTaskName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualTaskId, setManualTaskId] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editName, setEditName] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  
  // Analytics state
  const [analyticsPeriod, setAnalyticsPeriod] = useState('week');
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');
  const [selectedTasksForAnalytics, setSelectedTasksForAnalytics] = useState(new Set());
  
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Generate unique ID
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem(`taskTimeTracker_${user.email}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setTasks(parsed.tasks || []);
          setExpandedTasks(new Set(parsed.expandedTasks || []));
          setSelectedTasksForAnalytics(new Set(parsed.selectedTasksForAnalytics || []));
        }
        setLastSync(new Date());
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Simulate loading delay for better UX
    setTimeout(loadData, 500);
  }, [user.email]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    try {
      const dataToSave = {
        tasks,
        expandedTasks: Array.from(expandedTasks),
        selectedTasksForAnalytics: Array.from(selectedTasksForAnalytics),
        lastModified: new Date().toISOString(),
        user: user
      };
      localStorage.setItem(`taskTimeTracker_${user.email}`, JSON.stringify(dataToSave));
      setLastSync(new Date());
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [tasks, expandedTasks, selectedTasksForAnalytics, user]);

  // Auto-save when data changes
  useEffect(() => {
    if (!loading && tasks.length >= 0) {
      saveData();
    }
  }, [tasks, expandedTasks, selectedTasksForAnalytics, saveData, loading]);

  // Timer effect
  useEffect(() => {
    if (activeTimer && timerStart) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - timerStart);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTimer, timerStart]);

  // Helper function to format time
  const formatTime = useCallback((milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Helper function to parse manual time input
  const parseTimeInput = useCallback((input) => {
    const regex = /(\d+)\s*(h|hour|hours|m|min|minute|minutes|s|sec|second|seconds)?/gi;
    let totalMs = 0;
    let match;

    while ((match = regex.exec(input)) !== null) {
      const value = parseInt(match[1]);
      const unit = (match[2] || 'm').toLowerCase();
      
      if (unit.startsWith('h')) {
        totalMs += value * 60 * 60 * 1000;
      } else if (unit.startsWith('m')) {
        totalMs += value * 60 * 1000;
      } else if (unit.startsWith('s')) {
        totalMs += value * 1000;
      }
    }
    
    return totalMs || 0;
  }, []);

  // Get all tasks in flat structure for easier processing
  const getAllTasks = useCallback((taskList = tasks) => {
    const allTasks = [];
    
    const traverse = (tasks, parentPath = '') => {
      tasks.forEach(task => {
        const fullPath = parentPath ? `${parentPath} > ${task.name}` : task.name;
        allTasks.push({ ...task, fullPath });
        if (task.subTasks && task.subTasks.length > 0) {
          traverse(task.subTasks, fullPath);
        }
      });
    };
    
    traverse(taskList);
    return allTasks;
  }, [tasks]);

  // Calculate total time for a task including subtasks
  const calculateTotalTime = useCallback((task) => {
    let total = task.totalTime || 0;
    if (task.subTasks) {
      total += task.subTasks.reduce((sum, subTask) => sum + calculateTotalTime(subTask), 0);
    }
    return total;
  }, []);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!showAnalytics) return null;

    const allTasks = getAllTasks();
    const filteredTasks = selectedTasksForAnalytics.size > 0 
      ? allTasks.filter(task => selectedTasksForAnalytics.has(task.id))
      : allTasks;

    let startDate, endDate;
    const now = new Date();

    switch (analyticsPeriod) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'custom':
        if (analyticsStartDate && analyticsEndDate) {
          startDate = new Date(analyticsStartDate);
          endDate = new Date(analyticsEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Filter time logs by date range
    const filteredData = filteredTasks.map(task => {
      const filteredLogs = (task.timeLogs || []).filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate < endDate;
      });

      const totalTime = filteredLogs.reduce((sum, log) => sum + log.duration, 0);
      
      return {
        ...task,
        filteredLogs,
        totalTime,
        logCount: filteredLogs.length
      };
    }).filter(task => task.totalTime > 0);

    // Group by date for daily breakdown
    const dailyBreakdown = {};
    filteredData.forEach(task => {
      task.filteredLogs.forEach(log => {
        const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
        if (!dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey] = { date: dateKey, totalTime: 0, tasks: {} };
        }
        dailyBreakdown[dateKey].totalTime += log.duration;
        if (!dailyBreakdown[dateKey].tasks[task.name]) {
          dailyBreakdown[dateKey].tasks[task.name] = 0;
        }
        dailyBreakdown[dateKey].tasks[task.name] += log.duration;
      });
    });

    const sortedDailyData = Object.values(dailyBreakdown).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return {
      tasks: filteredData.sort((a, b) => b.totalTime - a.totalTime),
      dailyBreakdown: sortedDailyData,
      totalTime: filteredData.reduce((sum, task) => sum + task.totalTime, 0),
      totalSessions: filteredData.reduce((sum, task) => sum + task.logCount, 0),
      period: { startDate, endDate }
    };
  }, [showAnalytics, analyticsPeriod, analyticsStartDate, analyticsEndDate, selectedTasksForAnalytics, getAllTasks]);

  // Add new task
  const addTask = useCallback(() => {
    if (!newTaskName.trim()) return;
    
    const newTask = {
      id: generateId(),
      name: newTaskName.trim(),
      totalTime: 0,
      timeLogs: [],
      subTasks: [],
      createdAt: new Date().toISOString()
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
  }, [newTaskName]);

  // Add subtask
  const addSubTask = useCallback(() => {
    if (!newSubTaskName.trim() || !selectedParentId) return;
    
    const addSubTaskRecursive = (tasks) => {
      return tasks.map(task => {
        if (task.id === selectedParentId) {
          const newSubTask = {
            id: generateId(),
            name: newSubTaskName.trim(),
            totalTime: 0,
            timeLogs: [],
            subTasks: [],
            createdAt: new Date().toISOString()
          };
          return {
            ...task,
            subTasks: [...(task.subTasks || []), newSubTask]
          };
        } else if (task.subTasks && task.subTasks.length > 0) {
          return {
            ...task,
            subTasks: addSubTaskRecursive(task.subTasks)
          };
        }
        return task;
      });
    };
    
    setTasks(prev => addSubTaskRecursive(prev));
    setNewSubTaskName('');
  }, [newSubTaskName, selectedParentId]);

  // Start timer
  const startTimer = useCallback((taskId) => {
    if (activeTimer && activeTimer !== taskId) {
      // Stop current timer and log time
      stopTimer();
    }
    
    setActiveTimer(taskId);
    setTimerStart(Date.now());
    setElapsedTime(0);
  }, [activeTimer]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (!activeTimer || !timerStart) return;
    
    const duration = Date.now() - timerStart;
    logTimeToTask(activeTimer, duration);
    
    setActiveTimer(null);
    setTimerStart(null);
    setElapsedTime(0);
  }, [activeTimer, timerStart]);

  // Log time to task
  const logTimeToTask = useCallback((taskId, duration) => {
    if (duration <= 0) return;
    
    const updateTaskTime = (tasks) => {
      return tasks.map(task => {
        if (task.id === taskId) {
          const timeLog = {
            id: generateId(),
            duration,
            timestamp: new Date().toISOString(),
            description: `${formatTime(duration)} logged`
          };
          
          return {
            ...task,
            totalTime: (task.totalTime || 0) + duration,
            timeLogs: [...(task.timeLogs || []), timeLog]
          };
        } else if (task.subTasks && task.subTasks.length > 0) {
          return {
            ...task,
            subTasks: updateTaskTime(task.subTasks)
          };
        }
        return task;
      });
    };
    
    setTasks(prev => updateTaskTime(prev));
  }, [formatTime]);

  // Manual time entry
  const addManualTime = useCallback(() => {
    if (!manualTime.trim() || !manualTaskId) return;
    
    const duration = parseTimeInput(manualTime);
    if (duration > 0) {
      logTimeToTask(manualTaskId, duration);
      setManualTime('');
    }
  }, [manualTime, manualTaskId, parseTimeInput, logTimeToTask]);

  // Toggle task expansion
  const toggleExpanded = useCallback((taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  // Delete task
  const deleteTask = useCallback((taskId) => {
    if (!confirm('Are you sure you want to delete this task and all its data?')) return;
    
    const deleteRecursive = (tasks) => {
      return tasks.filter(task => {
        if (task.id === taskId) {
          return false;
        }
        if (task.subTasks && task.subTasks.length > 0) {
          task.subTasks = deleteRecursive(task.subTasks);
        }
        return true;
      });
    };
    
    setTasks(prev => deleteRecursive(prev));
    
    // Stop timer if deleting active task
    if (activeTimer === taskId) {
      setActiveTimer(null);
      setTimerStart(null);
      setElapsedTime(0);
    }
  }, [activeTimer]);

  // Edit task
  const startEditing = useCallback((task) => {
    setEditingTask(task.id);
    setEditName(task.name);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editName.trim()) return;
    
    const updateTaskName = (tasks) => {
      return tasks.map(task => {
        if (task.id === editingTask) {
          return { ...task, name: editName.trim() };
        } else if (task.subTasks && task.subTasks.length > 0) {
          return { ...task, subTasks: updateTaskName(task.subTasks) };
        }
        return task;
      });
    };
    
    setTasks(prev => updateTaskName(prev));
    setEditingTask(null);
    setEditName('');
  }, [editingTask, editName]);

  // Export data
  const exportData = useCallback(() => {
    const dataToExport = {
      tasks,
      user,
      expandedTasks: Array.from(expandedTasks),
      selectedTasksForAnalytics: Array.from(selectedTasksForAnalytics),
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-tracker-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [tasks, user, expandedTasks, selectedTasksForAnalytics]);

  // Import data
  const importData = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.tasks && Array.isArray(imported.tasks)) {
          setTasks(imported.tasks);
          if (imported.expandedTasks) {
            setExpandedTasks(new Set(imported.expandedTasks));
          }
          if (imported.selectedTasksForAnalytics) {
            setSelectedTasksForAnalytics(new Set(imported.selectedTasksForAnalytics));
          }
          if (imported.user) {
            setUser(imported.user);
          }
          alert(`Successfully imported ${imported.tasks.length} tasks`);
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  // Calculate total time across all tasks
  const totalTimeAllTasks = useMemo(() => {
    return tasks.reduce((total, task) => total + calculateTotalTime(task), 0);
  }, [tasks, calculateTotalTime]);

  // Toggle task selection for analytics
  const toggleTaskForAnalytics = useCallback((taskId) => {
    setSelectedTasksForAnalytics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  // Change user (for demo purposes)
  const changeUser = useCallback((email) => {
    const newUser = { email, name: email.split('@')[0] };
    setUser(newUser);
    setTasks([]);
    setExpandedTasks(new Set());
    setSelectedTasksForAnalytics(new Set());
    setActiveTimer(null);
    setTimerStart(null);
    setElapsedTime(0);
    setLoading(true);
  }, []);

  // Render task tree
  const renderTask = useCallback((task, level = 0) => {
    const hasSubTasks = task.subTasks && task.subTasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const isActive = activeTimer === task.id;
    const totalTime = calculateTotalTime(task);
    
    return (
      <div key={task.id} className="mb-2">
        <div 
          className={`p-3 rounded-lg border transition-all ${
            isActive 
              ? 'bg-blue-900/20 border-blue-500 shadow-lg' 
              : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {hasSubTasks && (
                <button
                  onClick={() => toggleExpanded(task.id)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              
              {editingTask === task.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-white text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-100 font-medium">{task.name}</span>
                  {isActive && (
                    <div className="flex items-center gap-1 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{formatTime(elapsedTime)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">
                {formatTime(totalTime)}
              </span>
              
              {!isActive ? (
                <button
                  onClick={() => startTimer(task.id)}
                  className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded"
                  title="Start Timer"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={stopTimer}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                  title="Stop Timer"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => startEditing(task)}
                className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
                title="Edit Task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => deleteTask(task.id)}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {hasSubTasks && isExpanded && (
          <div className="mt-2">
            {task.subTasks.map(subTask => renderTask(subTask, level + 1))}
          </div>
        )}
      </div>
    );
  }, [
    expandedTasks, activeTimer, elapsedTime, editingTask, editName,
    toggleExpanded, startTimer, stopTimer, startEditing, saveEdit, deleteTask,
    calculateTotalTime, formatTime
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-100">Task Time Tracker</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Email Input */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={user.email}
                onChange={(e) => changeUser(e.target.value)}
                placeholder="Enter your email"
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm"
              />
            </div>

            {/* Sync Status */}
            {lastSync && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Save className="w-3 h-3" />
                Last saved: {lastSync.toLocaleTimeString()}
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showAnalytics 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 font-medium"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </div>
        </div>

        {/* Total Time Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Total Time Tracked</h2>
            <div className="text-4xl font-bold text-blue-400">{formatTime(totalTimeAllTasks)}</div>
            <p className="text-gray-400 mt-2">{tasks.length} tasks • {getAllTasks().length} total items</p>
            <p className="text-gray-500 text-sm mt-1">
              Tracking for: {user.name || user.email}
            </p>
          </div>
        </div>

        {/* Central Timer Widget */}
        {activeTimer && (
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-8 mb-8 text-center">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-200 mb-2">Currently Tracking</h3>
              <p className="text-xl font-semibold text-blue-300">
                {getAllTasks().find(t => t.id === activeTimer)?.fullPath || 'Unknown Task'}
              </p>
            </div>
            
            <div className="text-6xl font-mono font-bold text-white mb-6">
              {formatTime(elapsedTime)}
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={stopTimer}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium"
              >
                <Square className="w-5 h-5" />
                Stop & Log Time
              </button>
              
              <button
                onClick={() => {
                  setActiveTimer(null);
                  setTimerStart(null);
                  setElapsedTime(0);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Analytics Dashboard</h2>
            
            {/* Analytics Controls */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time Period</label>
                <select
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                >
                  {Object.entries(ANALYTICS_PERIODS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              {analyticsPeriod === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={analyticsStartDate}
                      onChange={(e) => setAnalyticsStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={analyticsEndDate}
                      onChange={(e) => setAnalyticsEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Task Selection for Analytics */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">Select Tasks for Analysis</label>
                <button
                  onClick={() => setSelectedTasksForAnalytics(new Set())}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear All
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {getAllTasks().map(task => (
                  <label key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedTasksForAnalytics.has(task.id)}
                      onChange={() => toggleTaskForAnalytics(task.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300 truncate">{task.fullPath}</span>
                  </label>
                ))}
              </div>
              {selectedTasksForAnalytics.size === 0 && (
                <p className="text-sm text-gray-400 mt-2">No tasks selected - showing all tasks</p>
              )}
            </div>

            {/* Analytics Display */}
            {analyticsData && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Total Time</h3>
                    <p className="text-2xl font-bold text-green-400">{formatTime(analyticsData.totalTime)}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Sessions</h3>
                    <p className="text-2xl font-bold text-blue-400">{analyticsData.totalSessions}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Avg per Day</h3>
                    <p className="text-2xl font-bold text-purple-400">
                      {analyticsData.dailyBreakdown.length > 0 
                        ? formatTime(analyticsData.totalTime / analyticsData.dailyBreakdown.length)
                        : '0s'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Active Tasks</h3>
                    <p className="text-2xl font-bold text-orange-400">{analyticsData.tasks.length}</p>
                  </div>
                </div>

                {/* Daily Breakdown Chart */}
                {analyticsData.dailyBreakdown.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">Daily Time Breakdown</h3>
                    <div className="space-y-2">
                      {analyticsData.dailyBreakdown.map(day => (
                        <div key={day.date} className="flex items-center gap-4">
                          <div className="w-24 text-sm text-gray-400">
                            {new Date(day.date).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="h-6 bg-blue-500 rounded"
                                style={{ 
                                  width: `${Math.max(5, (day.totalTime / Math.max(...analyticsData.dailyBreakdown.map(d => d.totalTime))) * 100)}%` 
                                }}
                              />
                              <span className="text-sm text-gray-300">{formatTime(day.totalTime)}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {Object.entries(day.tasks).map(([taskName, time]) => (
                                <span key={taskName} className="mr-3">
                                  {taskName}: {formatTime(time)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Performance */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Task Performance</h3>
                  <div className="space-y-3">
                    {analyticsData.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-200">{task.fullPath}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span>{task.logCount} sessions</span>
                            <span>Avg: {formatTime(task.totalTime / Math.max(1, task.logCount))}/session</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-100">{formatTime(task.totalTime)}</div>
                          <div className="text-sm text-gray-400">
                            {((task.totalTime / Math.max(1, analyticsData.totalTime)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add New Task */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Add New Task</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Task Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter task name..."
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400"
                />
                <button
                  onClick={addTask}
                  disabled={!newTaskName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Add Subtask</label>
              <div className="flex gap-2">
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                >
                  <option value="">Select parent task...</option>
                  {getAllTasks().map(task => (
                    <option key={task.id} value={task.id}>{task.fullPath}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Subtask name..."
                  value={newSubTaskName}
                  onChange={(e) => setNewSubTaskName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSubTask()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400"
                />
                <button
                  onClick={addSubTask}
                  disabled={!newSubTaskName.trim() || !selectedParentId}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Sub
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Time Entry */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Manual Time Entry</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Task</label>
              <select
                value={manualTaskId}
                onChange={(e) => setManualTaskId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              >
                <option value="">Choose a task...</option>
                {getAllTasks().map(task => (
                  <option key={task.id} value={task.id}>{task.fullPath}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration <span className="text-gray-500">(e.g., 25m, 1h 30m, 45 minutes)</span>
              </label>
              <input
                type="text"
                placeholder="25m, 1h 30m, 45 minutes..."
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addManualTime()}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={addManualTime}
              disabled={!manualTime.trim() || !manualTaskId}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Log Time
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-200">Tasks & Projects</h2>
            {tasks.length > 0 && (
              <div className="text-sm text-gray-400">
                {tasks.length} main tasks • {getAllTasks().length} total items
              </div>
            )}
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Timer className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No tasks yet</p>
              <p className="text-gray-500">Create your first task to start tracking time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => renderTask(task))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}