"use client"
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [todayTask, setTodayTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('1task-data');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      setTasks(parsedTasks);
      
      // Check if today's task already exists
      const today = getTodayDate();
      const todayTaskData = parsedTasks.find(task => task.date === today);
      if (todayTaskData) {
        setTodayTask(todayTaskData.task);
      }
      
      // Calculate streak
      calculateStreak(parsedTasks);
    }
  }, []);

  // Save tasks to localStorage
  const saveTasks = (updatedTasks) => {
    localStorage.setItem('1task-data', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  // Calculate current streak
  const calculateStreak = (taskList) => {
    if (taskList.length === 0) {
      setStreak(0);
      return;
    }

    // Sort tasks by date (newest first)
    const sortedTasks = [...taskList].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    // Check if today has a completed task
    const today = getTodayDate();
    const todayTask = sortedTasks.find(task => task.date === today);
    if (todayTask && todayTask.completed) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (todayTask && !todayTask.completed) {
      // Today exists but not completed, streak is 0
      setStreak(0);
      return;
    }

    // Count consecutive completed days going backwards
    for (let i = 0; i < sortedTasks.length; i++) {
      const checkDateStr = checkDate.toISOString().split('T')[0];
      const taskOnDate = sortedTasks.find(task => task.date === checkDateStr);
      
      if (taskOnDate && taskOnDate.completed) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (taskOnDate && !taskOnDate.completed) {
        // Found an incomplete task, streak breaks
        break;
      } else {
        // No task on this date, streak breaks
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  // Handle task submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!todayTask.trim()) return;

    const today = getTodayDate();
    const updatedTasks = [...tasks];
    
    // Check if task for today already exists
    const existingTaskIndex = updatedTasks.findIndex(task => task.date === today);
    
    if (existingTaskIndex >= 0) {
      // Update existing task
      updatedTasks[existingTaskIndex] = {
        ...updatedTasks[existingTaskIndex],
        task: todayTask.trim()
      };
    } else {
      // Add new task
      updatedTasks.push({
        date: today,
        task: todayTask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      });
    }
    
    saveTasks(updatedTasks);
  };

  // Toggle task completion
  const toggleTaskCompletion = (date) => {
    const updatedTasks = tasks.map(task => {
      if (task.date === date) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    
    saveTasks(updatedTasks);
    calculateStreak(updatedTasks);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get today's task status
  const getTodayTaskStatus = () => {
    const today = getTodayDate();
    const todayTaskData = tasks.find(task => task.date === today);
    return todayTaskData;
  };

  const todayTaskStatus = getTodayTaskStatus();

  return (
    <>
      <Head>
        <title>1Task - One Thing A Day</title>
        <meta name="description" content="Focus on one task per day. One task. One focus. One win per day." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">1Task</h1>
            <p className="text-gray-600">One task. One focus. One win per day.</p>
          </div>

          {/* Streak Counter */}
          {streak > 0 && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-6 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-lg font-semibold text-orange-800">
                {streak}-day streak!
              </div>
              <div className="text-sm text-orange-600">Keep it going!</div>
            </div>
          )}

          {/* Main Task Input */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSubmit}>
              <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
                What is your One Task today?
              </label>
              <input
                type="text"
                id="task"
                value={todayTask}
                onChange={(e) => setTodayTask(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter your most important task..."
                maxLength={200}
              />
              <button
                type="submit"
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Set My Task
              </button>
            </form>

            {/* Today's Task Status */}
            {todayTaskStatus && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Today is task:</div>
                    <div className={`font-medium ${todayTaskStatus.completed ? 'text-green-600 line-through' : 'text-gray-800'}`}>
                      {todayTaskStatus.task}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTaskCompletion(todayTaskStatus.date)}
                    className={`ml-3 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                      todayTaskStatus.completed
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {todayTaskStatus.completed ? '✓ Done' : 'Mark Done'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Toggle */}
          <div className="text-center mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>

          {/* History View */}
          {showHistory && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Previous Days</h2>
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks yet. Start with today!</p>
              ) : (
                <div className="space-y-3">
                  {tasks
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((task) => (
                      <div
                        key={task.date}
                        className={`p-3 rounded-md border ${
                          task.completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">
                              {formatDate(task.date)}
                            </div>
                            <div className={`font-medium ${task.completed ? 'text-green-700' : 'text-red-700'}`}>
                              {task.task}
                            </div>
                          </div>
                          <div className="ml-3">
                            {task.completed ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-red-600 font-bold">✗</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Focus on what matters most. One task at a time.</p>
          </div>
        </div>
      </div>
    </>
  );
}