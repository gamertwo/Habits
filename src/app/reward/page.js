"use client";

import { useEffect, useMemo, useState } from "react";

export default function XPTaskForge() {
  const STORAGE_KEY = "xp_tasks_v6";
  const INSTAGRAM_RATE = 2; // 2 XP per minute

  // ---------- Core State ----------
  const [tasks, setTasks] = useState([]);
  const [spentXP, setSpentXP] = useState(0);
  const [bankedMinutes, setBankedMinutes] = useState(0);
  const [debt, setDebt] = useState(0); // XP debt that gets paid off automatically
  const [hydrated, setHydrated] = useState(false);

  // ---------- Toast System ----------
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, tone = "ok") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, tone }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  // ---------- Derived ----------
  const totalEarned = useMemo(
    () => tasks.reduce((sum, t) => sum + (t.completed ? t.xp : 0), 0),
    [tasks]
  );
  // XP auto-pays debt first; remainder is available
  const availableXP = Math.max(0, totalEarned - debt - spentXP);
  const effectiveDebt = Math.max(0, debt - (totalEarned - spentXP));

  // ---------- Load from localStorage ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.tasks) setTasks(data.tasks);
        if (typeof data.spentXP === "number") setSpentXP(data.spentXP);
        if (typeof data.bankedMinutes === "number") setBankedMinutes(data.bankedMinutes);
        if (typeof data.debt === "number") setDebt(data.debt);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // ---------- Save to localStorage ----------
  useEffect(() => {
    if (!hydrated) return;
    const data = { tasks, spentXP, bankedMinutes, debt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [tasks, spentXP, bankedMinutes, debt, hydrated]);

  // ---------- NEW: Sync debt -> server KV whenever it changes ----------
  useEffect(() => {
    if (!hydrated) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch("/api/debt/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ debt }),
        signal: ctrl.signal
      }).catch(() => {});
    }, 350); // tiny debounce so we don't spam
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [debt, hydrated]);

  // ---------- Helpers to mutate ----------
  const addTask = (title, xpValue) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const newTask = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      completed: false,
      xp: xpValue
    };
    setTasks(prev => [newTask, ...prev]);
    addToast("Task added! 🎯");
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const wasCompleted = task.completed;
        addToast(wasCompleted ? "Marked as todo" : "Task completed! +XP ✨");
        return { ...task, completed: !task.completed };
      }
      return task;
    }));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addToast("Task deleted", "warn");
  };

  const updateTaskXP = (taskId, delta) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, xp: Math.max(1, Math.min(999, task.xp + delta)) };
      }
      return task;
    }));
  };

  // ---------- Instagram ----------
  const redeemInstagram = (minutes) => {
    const cost = minutes * INSTAGRAM_RATE;
    if (availableXP < cost) {
      addToast(`Need ${cost - availableXP} more XP for ${minutes}m Instagram`, "warn");
      return;
    }
    setSpentXP(prev => prev + cost);
    setBankedMinutes(prev => prev + minutes);
    addToast(`Redeemed ${minutes}m Instagram for ${cost} XP! 🎉`);
  };

  const spendInstagramTime = (minutes) => {
    if (bankedMinutes < minutes) {
      addToast(`Only have ${bankedMinutes}m banked`, "warn");
      return;
    }
    setBankedMinutes(prev => prev - minutes);
    addToast(`Used ${minutes}m Instagram. Enjoy! 📱`);
  };

  const addOveruse = (minutes) => {
    const xpCost = minutes * INSTAGRAM_RATE;
    setDebt(prev => prev + xpCost);
    addToast(`Added ${xpCost} XP debt (${minutes}m overuse)`, "warn");
  };

  const resetEverything = () => {
    if (!confirm("Reset everything? This cannot be undone.")) return;
    setTasks([]);
    setSpentXP(0);
    setBankedMinutes(0);
    setDebt(0);
    addToast("Everything reset");
  };

  // ---------- Form State ----------
  const [newTitle, setNewTitle] = useState("");
  const [newXP, setNewXP] = useState(10);
  const [overuseMinutes, setOveruseMinutes] = useState(30);
  const [customRedeemMinutes, setCustomRedeemMinutes] = useState(45);

  // ---------- NEW: Manual server post (useful for testing) ----------
  async function postServerNow() {
    try {
      const res = await fetch("/api/debt/cron"); // triggers server-side post
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      addToast(`Server posted debt (${j.debt} XP) ✅`);
    } catch (e) {
      addToast(`Failed: ${e.message || e}`, "warn");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-48 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-36 -right-24 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Title Card */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6 flex items-center gap-4">
            <div className="text-4xl">✅</div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              XP Task Forge
            </h1>
          </div>

          {/* Stats Grid + Action */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Available XP</div>
              <div className="text-2xl font-bold text-green-400">{availableXP}</div>
              <div className="text-xs text-slate-500">Ready to spend</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Total Earned</div>
              <div className="text-2xl font-bold text-blue-400">{totalEarned}</div>
              <div className="text-xs text-slate-500">From tasks</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Debt</div>
              <div className="text-2xl font-bold text-red-400">{effectiveDebt}</div>
              <div className="text-xs text-slate-500">Auto-paid</div>
            </div>
          </div>
        </div>

        {/* Quick action (server post) */}
        <div className="flex justify-end">
          <button
            onClick={postServerNow}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg border border-emerald-400/40 shadow"
          >
            Post Debt (server) Now
          </button>
        </div>

        {/* Add Task Section */}
        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">Add New Task</h2>
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Read 10 pages, Exercise for 30 minutes..."
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask(newTitle, newXP);
                    setNewTitle("");
                  }
                }}
              />
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex items-center bg-slate-800/50 border border-slate-600/50 rounded-xl p-1">
                <button 
                  onClick={() => setNewXP(v => Math.max(1, v - 5))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  –
                </button>
                <div className="px-3 py-2 font-bold text-sm">{newXP} XP</div>
                <button 
                  onClick={() => setNewXP(v => Math.min(999, v + 5))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => {
                  addTask(newTitle, newXP);
                  setNewTitle("");
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Tasks</h2>
            <button 
              onClick={resetEverything}
              className="text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-300/50 px-3 py-1 rounded-lg text-sm transition-colors"
            >
              Reset All
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-4">🎯</div>
              <p>No tasks yet—add one above and start earning XP!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`
                    rounded-xl border transition-all duration-200
                    ${task.completed 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : 'bg-slate-800/30 border-slate-600/30 hover:border-slate-500/50'
                    }
                  `}
                >
                  {/* Mobile Layout */}
                  <div className="block md:hidden p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`
                          w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 text-lg
                          ${task.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-slate-500 hover:border-slate-400'
                          }
                        `}
                      >
                        {task.completed && "✔"}
                      </button>
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <div className={`font-semibold text-lg leading-snug mb-2 ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {task.title}
                        </div>
                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          task.completed 
                            ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                        }`}>
                          {task.completed ? 'Completed' : 'Todo'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateTaskXP(task.id, -5)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors text-lg font-bold"
                        >
                          −
                        </button>
                        <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-base font-bold text-white min-w-[70px] text-center">
                          {task.xp} XP
                        </div>
                        <button 
                          onClick={() => updateTaskXP(task.id, +5)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-400/10 border border-red-400/20 hover:border-red-400/40 transition-all text-lg"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center gap-4 p-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`
                        w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all duration-200 text-lg
                        ${task.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-slate-500 hover:border-slate-400'
                        }
                      `}
                    >
                      {task.completed && "✔"}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-lg ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {task.title}
                      </div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        task.completed 
                          ? 'bg-green-900/30 text-green-300' 
                          : 'bg-slate-700/50 text-slate-300'
                      }`}>
                        {task.completed ? 'Completed' : 'Todo'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateTaskXP(task.id, -5)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-lg"
                      >
                        −
                      </button>
                      <div className="px-3 py-2 bg-slate-700 rounded-lg text-sm font-bold min-w-[65px] text-center">
                        {task.xp} XP
                      </div>
                      <button 
                        onClick={() => updateTaskXP(task.id, +5)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-lg"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instagram Section */}
        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
              <h2 className="text-xl font-bold">Instagram Time</h2>
            </div>
            <div className="bg-slate-800/50 border border-slate-600/50 rounded-full px-3 py-1 text-sm">
              <span className="text-slate-400">Banked:</span>
              <span className="font-bold ml-1">{bankedMinutes}m</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 text-sm text-slate-400">
            <span>Rate: {INSTAGRAM_RATE} XP per minute</span>
            <span>Available: {availableXP} XP</span>
          </div>

          <div className="space-y-6">
            {/* Redeem Time */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Redeem Time</h3>
              <div className="space-y-3">
                {/* Quick Options */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { minutes: 15, label: "15m" },
                    { minutes: 30, label: "30m" },
                    { minutes: 60, label: "1h" }
                  ].map(({ minutes, label }) => (
                    <button
                      key={minutes}
                      onClick={() => redeemInstagram(minutes)}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-full text-sm transition-colors"
                    >
                      {label} ({minutes * INSTAGRAM_RATE} XP)
                    </button>
                  ))}
                </div>
                
                {/* Custom Option */}
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={customRedeemMinutes}
                    onChange={(e) => setCustomRedeemMinutes(Math.max(1, Math.min(999, Number(e.target.value || 1))))}
                    className="w-20 bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm"
                    placeholder="Min"
                  />
                  <span className="text-slate-400 text-sm">minutes</span>
                  <button
                    onClick={() => redeemInstagram(customRedeemMinutes)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-full text-sm transition-colors"
                  >
                    Redeem ({customRedeemMinutes * INSTAGRAM_RATE} XP)
                  </button>
                </div>
              </div>
            </div>

            {/* Use Banked Time */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Use Banked Time</h3>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 60].map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => spendInstagramTime(minutes)}
                    className="border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-full text-sm transition-colors"
                  >
                    Use {minutes}m
                  </button>
                ))}
              </div>
            </div>

            {/* Record Overuse */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Record Overuse</h3>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  min={1}
                  value={overuseMinutes}
                  onChange={(e) => setOveruseMinutes(Math.max(1, Number(e.target.value || 1)))}
                  className="w-24 bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm"
                  placeholder="Minutes"
                />
                <button 
                  onClick={() => addOveruse(overuseMinutes)}
                  className="bg-red-900/30 border border-red-500/30 text-red-300 hover:bg-red-900/50 font-medium py-2 px-4 rounded-full text-sm transition-colors"
                >
                  Add {overuseMinutes}m Overuse
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-full font-medium text-sm shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-300
              ${toast.tone === 'warn' 
                ? 'bg-red-900/80 border border-red-500/50 text-red-100' 
                : 'bg-slate-800/80 border border-slate-600/50 text-slate-100'
              }`}
          >
            {toast.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
