"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Clock, Play, Pause, Square, Plus, ChevronDown, ChevronRight, Edit2, Trash2,
  Download, Upload, Timer, BarChart3, Calendar, Filter, X, User, RefreshCw, Save,
  Tag, Search, Settings, Bell, AlarmClockCheck, Coffee, Undo, Redo, Info, Printer
} from "lucide-react";

/* =========================
   CONFIG & CONSTANTS
========================= */
const ANALYTICS_PERIODS = { day: "Today", week: "This Week", month: "This Month", quarter: "This Quarter", year: "This Year", custom: "Custom" };
const PRIORITY = ["Low", "Medium", "High", "Critical"];
const STATUS = ["Todo", "In Progress", "Blocked", "Done", "Archived"];
const THEME = {
  bg: "bg-[#0a132e]",
  panel: "bg-gray-800/70 border border-white/10 backdrop-blur-sm",
  subpanel: "bg-gray-800/50 border border-white/10 backdrop-blur",
  text: "text-slate-100",
  subtext: "text-slate-300/80",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
};
const DEFAULT_POMO = { work: 25, break: 5, longBreak: 15, cyclesBeforeLong: 4 };
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;

/* =========================
   UTILS
========================= */
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const msToHMS = (ms) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}h ${m}m ${r}s`;
  if (m) return `${m}m ${r}s`;
  return `${r}s`;
};
const parseTimeInput = (input) => {
  const regex = /(\d+)\s*(h|hour|hours|m|min|minute|minutes|s|sec|second|seconds)?/gi;
  let totalMs = 0, match;
  while ((match = regex.exec(input)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = (match[2] || "m").toLowerCase();
    if (unit.startsWith("h")) totalMs += value * 3600000;
    else if (unit.startsWith("m")) totalMs += value * 60000;
    else if (unit.startsWith("s")) totalMs += value * 1000;
  }
  return totalMs || 0;
};
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/* Small helpers for charts */
const fmtDay = (d) => new Date(d).toISOString().slice(0, 10);
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; }
const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; }

/* =========================
   MAIN
========================= */
export default function TasksPage() {
  /* ---------- Core ---------- */
  const [user, setUser] = useState({ email: "user@example.com", name: "Demo User" });
  const [tasks, setTasks] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  /* ---------- Timer ---------- */
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseAccumRef = useRef(0);
  const pauseStartRef = useRef(null);
  const timerRef = useRef(null);

  /* ---------- Pomodoro ---------- */
  const [pomo, setPomo] = useState(DEFAULT_POMO);
  const [pomoMode, setPomoMode] = useState("off"); // off | work | break | long
  const [pomoRemaining, setPomoRemaining] = useState(0);
  const [pomoCycleCount, setPomoCycleCount] = useState(0);
  const pomoIntervalRef = useRef(null);
  const [pomoAuto, setPomoAuto] = useState(true);

  /* ---------- Editing / forms ---------- */
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");
  const [newSubTaskName, setNewSubTaskName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editObj, setEditObj] = useState({ name: "", description: "", dueDate: "", priority: "Medium", tags: "" });
  const [manualTime, setManualTime] = useState("");
  const [manualTaskId, setManualTaskId] = useState("");
  const [manualWhen, setManualWhen] = useState(() => new Date().toISOString().slice(0, 16));

  /* ---------- Filters ---------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTag, setFilterTag] = useState("All");
  const [sortBy, setSortBy] = useState("created"); // created | name | time | due | priority

  /* ---------- Analytics ---------- */
  // Collapsed by default so it’s not overwhelming:
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("week");
  const [analyticsStartDate, setAnalyticsStartDate] = useState("");
  const [analyticsEndDate, setAnalyticsEndDate] = useState("");
  const [selectedTasksForAnalytics, setSelectedTasksForAnalytics] = useState(new Set());
  const [sessionFilterQuery, setSessionFilterQuery] = useState("");
  const [showAnalyticsCustomize, setShowAnalyticsCustomize] = useState(false);
  // Fine-grained dropdown toggles (keep it light by default)
  const [analyticsSections, setAnalyticsSections] = useState({
    kpis: true,
    trend: false,
    donut: false,
    heatmap: false,
    distributions: false,
    top: false,
    sessions: false,
  });
  const fileInputRef = useRef(null);

  /* ---------- Undo/Redo ---------- */
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  /* ---------- Idle ---------- */
  const [idleSince, setIdleSince] = useState(null);
  const idleCheckRef = useRef(null);

  /* =========================
     Load / Save (Local Memory)
  ========================= */
  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem(`taskTimeTracker_${user.email}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setTasks(parsed.tasks || []);
          setExpandedTasks(new Set(parsed.expandedTasks || []));
          setSelectedTasksForAnalytics(new Set(parsed.selectedTasksForAnalytics || []));
          // restore analytics section prefs if available
          if (parsed.analyticsSections) setAnalyticsSections(parsed.analyticsSections);
          if (typeof parsed.showAnalytics === "boolean") setShowAnalytics(parsed.showAnalytics);
        }
        setLastSync(new Date());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    setTimeout(load, 200);
  }, [user.email]);

  const saveData = useCallback((next = tasks) => {
    try {
      const payload = {
        tasks: next,
        expandedTasks: Array.from(expandedTasks),
        selectedTasksForAnalytics: Array.from(selectedTasksForAnalytics),
        analyticsSections,
        showAnalytics,
        lastModified: new Date().toISOString(),
        user
      };
      localStorage.setItem(`taskTimeTracker_${user.email}`, JSON.stringify(payload));
      setLastSync(new Date());
    } catch (e) { console.error("save error", e); }
  }, [tasks, expandedTasks, selectedTasksForAnalytics, user, analyticsSections, showAnalytics]);

  useEffect(() => { if (!loading) saveData(); }, [
    tasks, expandedTasks, selectedTasksForAnalytics, analyticsSections, showAnalytics, saveData, loading
  ]);

  /* =========================
     Timer
  ========================= */
  useEffect(() => {
    if (activeTimer && timerStart && !isPaused) {
      timerRef.current = setInterval(() => setElapsedTime(Date.now() - timerStart - pauseAccumRef.current), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTimer, timerStart, isPaused]);

  const startTimer = useCallback((taskId) => {
    if (activeTimer && activeTimer !== taskId) stopTimer();
    setActiveTimer(taskId);
    setTimerStart(Date.now());
    setElapsedTime(0);
    setIsPaused(false);
    pauseAccumRef.current = 0;
    pauseStartRef.current = null;
  }, [activeTimer]);

  const pauseTimer = () => {
    if (!activeTimer || isPaused) return;
    setIsPaused(true);
    pauseStartRef.current = Date.now();
  };
  const resumeTimer = () => {
    if (!activeTimer || !isPaused) return;
    setIsPaused(false);
    if (pauseStartRef.current) {
      pauseAccumRef.current += (Date.now() - pauseStartRef.current);
      pauseStartRef.current = null;
    }
  };

  const logTimeToTask = useCallback((taskId, { duration, start, end, note = "" }) => {
    if (duration <= 0) return;
    mutateTasks(prev => {
      const upd = (arr) => arr.map(t => {
        if (t.id === taskId) {
          const log = { id: generateId(), duration, timestamp: end || new Date().toISOString(), start, end, note };
          return { ...t, totalTime: (t.totalTime || 0) + duration, timeLogs: [...(t.timeLogs || []), log] };
        }
        if (t.subTasks?.length) return { ...t, subTasks: upd(t.subTasks) };
        return t;
      });
      return upd(prev);
    });
  }, []);

  const stopTimer = useCallback(() => {
    if (!activeTimer || !timerStart) return;
    const end = Date.now();
    const duration = end - timerStart - pauseAccumRef.current;
    if (duration > 0) logTimeToTask(activeTimer, { duration, start: new Date(timerStart).toISOString(), end: new Date(end).toISOString(), note: "Timer session" });
    setActiveTimer(null); setTimerStart(null); setElapsedTime(0); setIsPaused(false);
    pauseAccumRef.current = 0; pauseStartRef.current = null;
  }, [activeTimer, timerStart, logTimeToTask]);

  /* =========================
     Pomodoro (light)
  ========================= */
  const notify = (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification(title, { body });
    else if (Notification.permission !== "denied") Notification.requestPermission().then(p => { if (p === "granted") new Notification(title, { body }); });
  };
  const clearPomoInterval = () => { if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current); }
  const tickPomo = () => setPomoRemaining(prev => Math.max(0, prev - 1));
  const beginWorkCycle = () => { setPomoMode("work"); setPomoRemaining(pomo.work * 60); clearPomoInterval(); pomoIntervalRef.current = setInterval(tickPomo, 1000); };
  const stopPomo = () => { setPomoMode("off"); setPomoRemaining(0); clearPomoInterval(); };
  useEffect(() => () => clearPomoInterval(), []);

  /* =========================
     Idle detection (auto-pause)
  ========================= */
  useEffect(() => {
    const markActive = () => setIdleSince(null);
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach(ev => window.addEventListener(ev, markActive, { passive: true }));
    idleCheckRef.current = setInterval(() => {
      if (!activeTimer || isPaused) return;
      if (!idleSince) setIdleSince(Date.now());
      else if (Date.now() - idleSince >= IDLE_THRESHOLD_MS) { setIsPaused(true); pauseStartRef.current = Date.now(); notify("Idle detected", "Timer paused due to inactivity."); }
    }, 30_000);
    return () => { events.forEach(ev => window.removeEventListener(ev, markActive)); clearInterval(idleCheckRef.current); };
  }, [activeTimer, isPaused, idleSince]);

  /* =========================
     Task helpers
  ========================= */
  const mutateTasks = (mutator) => {
    setTasks(prev => {
      const before = deepClone(prev);
      const after = mutator(deepClone(prev));
      setHistory(h => [...h.slice(-49), before]);
      setFuture([]);
      return after;
    });
  };
  const getAllTasks = useCallback((taskList = tasks) => {
    const all = [];
    const walk = (arr, parent = "") => {
      arr.forEach(t => {
        const fullPath = parent ? `${parent} > ${t.name}` : t.name;
        all.push({ ...t, fullPath });
        if (t.subTasks?.length) walk(t.subTasks, fullPath);
      });
    };
    walk(taskList);
    return all;
  }, [tasks]);
  const calculateTotalTime = useCallback((t) => (t.totalTime || 0) + (t.subTasks?.reduce((s, st) => s + calculateTotalTime(st), 0) || 0), []);

  /* CRUD */
  const addTask = () => {
    if (!newTaskName.trim()) return;
    const t = {
      id: generateId(), name: newTaskName.trim(), description: "",
      tags: newTaskTag ? [newTaskTag.trim()] : [], color: "", status: "Todo",
      priority: "Medium", dueDate: "", totalTime: 0, timeLogs: [], subTasks: [],
      createdAt: new Date().toISOString(), archived: false
    };
    mutateTasks(prev => ([...prev, t]));
    setNewTaskName(""); setNewTaskTag("");
  };
  const addSubTask = () => {
    if (!newSubTaskName.trim() || !selectedParentId) return;
    mutateTasks(prev => {
      const addRec = (arr) => arr.map(t => {
        if (t.id === selectedParentId) {
          const sub = { id: generateId(), name: newSubTaskName.trim(), description: "", tags: [], color: "", status: "Todo", priority: "Medium", dueDate: "", totalTime: 0, timeLogs: [], subTasks: [], createdAt: new Date().toISOString(), archived: false };
          return { ...t, subTasks: [...(t.subTasks || []), sub] };
        }
        if (t.subTasks?.length) return { ...t, subTasks: addRec(t.subTasks) };
        return t;
      });
      return addRec(prev);
    });
    setNewSubTaskName("");
  };
  const toggleExpanded = (id) => setExpandedTasks(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const deleteTask = (id) => {
    if (!confirm("Delete this task and all subtasks/time logs?")) return;
    mutateTasks(prev => {
      const delRec = (arr) => arr.filter(t => {
        if (t.id === id) return false;
        if (t.subTasks?.length) t.subTasks = delRec(t.subTasks);
        return true;
      });
      return delRec(prev);
    });
    if (activeTimer === id) { setActiveTimer(null); setTimerStart(null); setElapsedTime(0); setIsPaused(false); }
  };
  const startEditing = (t) => {
    setEditingTask(t.id);
    setEditObj({ name: t.name || "", description: t.description || "", dueDate: t.dueDate ? t.dueDate.slice(0,10) : "", priority: t.priority || "Medium", tags: (t.tags || []).join(", ") });
  };
  const saveEdit = () => {
    if (!editingTask || !editObj.name.trim()) return;
    mutateTasks(prev => {
      const upd = (arr) => arr.map(t => {
        if (t.id === editingTask) {
          return {
            ...t,
            name: editObj.name.trim(),
            description: editObj.description.trim(),
            dueDate: editObj.dueDate ? new Date(editObj.dueDate).toISOString() : "",
            priority: editObj.priority,
            tags: editObj.tags.split(",").map(s => s.trim()).filter(Boolean)
          };
        }
        if (t.subTasks?.length) return { ...t, subTasks: upd(t.subTasks) };
        return t;
      });
      return upd(prev);
    });
    setEditingTask(null);
  };
  const updateTaskStatus = (id, status) => mutateTasks(prev => {
    const upd = (arr) => arr.map(t => {
      if (t.id === id) return { ...t, status, archived: status === "Archived" };
      if (t.subTasks?.length) return { ...t, subTasks: upd(t.subTasks) };
      return t;
    });
    return upd(prev);
  });
  const removeLog = (taskId, logId) => mutateTasks(prev => {
    const upd = (arr) => arr.map(t => {
      if (t.id === taskId) {
        const log = t.timeLogs.find(l => l.id === logId);
        const newTime = (t.totalTime || 0) - (log?.duration || 0);
        return { ...t, totalTime: Math.max(0, newTime), timeLogs: t.timeLogs.filter(l => l.id !== logId) };
      }
      if (t.subTasks?.length) return { ...t, subTasks: upd(t.subTasks) };
      return t;
    });
    return upd(prev);
  });

  /* Undo/Redo */
  const undo = () => setHistory(h => {
    if (!h.length) return h;
    const prev = h[h.length - 1];
    setFuture(f => [deepClone(tasks), ...f]);
    setTasks(prev);
    return h.slice(0, -1);
  });
  const redo = () => setFuture(f => {
    if (!f.length) return f;
    const next = f[0];
    setHistory(h => [...h, deepClone(tasks)]);
    setTasks(next);
    return f.slice(1);
  });

  /* Manual Time */
  const addManualTime = () => {
    if (!manualTaskId || !manualTime.trim()) return;
    const duration = parseTimeInput(manualTime);
    if (duration <= 0) return;
    const endISO = new Date(manualWhen || new Date()).toISOString();
    const startISO = new Date(new Date(endISO).getTime() - duration).toISOString();
    logTimeToTask(manualTaskId, { duration, start: startISO, end: endISO, note: "Manual entry" });
    setManualTime("");
  };

  /* Derived */
  const allTasksFlat = useMemo(() => getAllTasks(), [getAllTasks]);
  const totalTimeAllTasks = useMemo(() => tasks.reduce((s, t) => s + calculateTotalTime(t), 0), [tasks, calculateTotalTime]);
  const allTags = useMemo(() => {
    const set = new Set(); allTasksFlat.forEach(t => (t.tags || []).forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [allTasksFlat]);

  const filteredTopLevel = useMemo(() => {
    let list = tasks
      .filter(t => filterStatus === "All" ? true : (filterStatus === "Archived" ? t.archived : t.status === filterStatus))
      .filter(t => filterTag === "All" ? true : (t.tags || []).includes(filterTag))
      .filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return [t.name, t.description, (t.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
      });
    const byPriority = (p) => PRIORITY.indexOf(p ?? "Medium");
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "time": return calculateTotalTime(b) - calculateTotalTime(a);
        case "due": return (a.dueDate || "").localeCompare(b.dueDate || "");
        case "priority": return byPriority(b.priority) - byPriority(a.priority);
        default: return (a.createdAt || "").localeCompare(b.createdAt || "");
      }
    });
    return list;
  }, [tasks, filterStatus, filterTag, searchQuery, sortBy, calculateTotalTime]);

  /* =========================
     Analytics (Better UX/UI)
  ========================= */
  const analyticsWindow = useMemo(() => {
    const now = new Date();
    let start, end;
    switch (analyticsPeriod) {
      case "day": { start = startOfDay(now); end = new Date(start.getTime() + 86400000); break; }
      case "week": { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); start = startOfDay(s); end = new Date(start.getTime() + 7 * 86400000); break; }
      case "month": { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth() + 1, 1); break; }
      case "quarter": { const q = Math.floor(now.getMonth() / 3) * 3; start = new Date(now.getFullYear(), q, 1); end = new Date(now.getFullYear(), q + 3, 1); break; }
      case "year": { start = new Date(now.getFullYear(), 0, 1); end = new Date(now.getFullYear() + 1, 0, 1); break; }
      case "custom": {
        if (analyticsStartDate && analyticsEndDate) {
          start = startOfDay(new Date(analyticsStartDate));
          end = endOfDay(new Date(analyticsEndDate));
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        break;
      }
      default: { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth() + 1, 1); }
    }
    return { start, end };
  }, [analyticsPeriod, analyticsStartDate, analyticsEndDate]);

  const analyticsRows = useMemo(() => {
    const pick = selectedTasksForAnalytics.size ? allTasksFlat.filter(t => selectedTasksForAnalytics.has(t.id)) : allTasksFlat;
    const filtered = pick.map(t => {
      const logs = (t.timeLogs || []).filter(l => {
        const d = new Date(l.timestamp || l.end || l.start);
        return d >= analyticsWindow.start && d < analyticsWindow.end;
      });
      const total = logs.reduce((s, l) => s + l.duration, 0);
      return { ...t, filteredLogs: logs, totalTime: total, logCount: logs.length };
    });
    return filtered;
  }, [allTasksFlat, selectedTasksForAnalytics, analyticsWindow]);

  const analyticsSummary = useMemo(() => {
    const rows = analyticsRows.filter(r => r.totalTime > 0);
    const totalTime = rows.reduce((s, r) => s + r.totalTime, 0);
    const sessions = rows.reduce((s, r) => s + r.logCount, 0);

    // build day buckets
    const dayMap = {};
    rows.forEach(r => r.filteredLogs.forEach(l => {
      const k = fmtDay(l.timestamp || l.end || l.start);
      dayMap[k] = (dayMap[k] || 0) + l.duration;
    }));
    const days = Object.keys(dayMap).sort().map(d => ({ date: d, value: dayMap[d] }));

    // hour-of-day & weekday
    const hour = Array.from({ length: 24 }, () => 0);
    const wday = Array.from({ length: 7 }, () => 0); // Sun..Sat
    rows.forEach(r => r.filteredLogs.forEach(l => {
      const end = new Date(l.end || l.timestamp || l.start);
      hour[end.getHours()] += l.duration;
      wday[end.getDay()] += l.duration;
    }));

    // share per task
    const share = rows
      .filter(r => r.totalTime > 0)
      .sort((a,b)=>b.totalTime-a.totalTime)
      .slice(0, 8)
      .map(r => ({ id: r.id, name: r.fullPath, value: r.totalTime }));

    // sessions table
    const sessionsFlat = [];
    rows.forEach(r => r.filteredLogs.forEach(l => sessionsFlat.push({
      taskId: r.id, taskPath: r.fullPath, start: l.start || l.timestamp, end: l.end || l.timestamp, duration: l.duration, note: l.note || ""
    })));
    sessionsFlat.sort((a,b) => new Date(b.start) - new Date(a.start));

    return { totalTime, sessions, days, hour, wday, share, rows, sessionsFlat };
  }, [analyticsRows]);

  const kpiAvgPerDay = useMemo(() => {
    if (!analyticsSummary.days.length) return 0;
    const total = analyticsSummary.days.reduce((s,d)=>s+d.value,0);
    return total / analyticsSummary.days.length;
  }, [analyticsSummary.days]);

  /* CSV export for analytics sessions */
  const exportAnalyticsCSV = () => {
    const rows = [["Task Path","Start","End","Duration (ms)","Duration (readable)","Note"]];
    analyticsSummary.sessionsFlat
      .filter(s => !sessionFilterQuery.trim() || s.taskPath.toLowerCase().includes(sessionFilterQuery.toLowerCase()) || s.note.toLowerCase().includes(sessionFilterQuery.toLowerCase()))
      .forEach(s => rows.push([s.taskPath, s.start, s.end, s.duration, msToHMS(s.duration), (s.note || "").replaceAll(",", ";")]));
    const csv = rows.map(r => r.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analytics-${user.email}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  /* =========================
     RENDERERS
  ========================= */
  const TaskBadge = ({ t }) => (
    <div className="flex items-center gap-2 text-[11px]">
      {t.tags?.slice(0,3).map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-cyan-400/30 text-cyan-200/90">
          <Tag className="w-3 h-3" />{tag}
        </span>
      ))}
      {t.dueDate && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-400/30 text-amber-200/90">
          <Calendar className="w-3 h-3" />{new Date(t.dueDate).toLocaleDateString()}
        </span>
      )}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border
        ${t.priority === 'Critical' ? 'border-red-400/50 text-red-200'
        : t.priority === 'High' ? 'border-amber-400/50 text-amber-200'
        : t.priority === 'Medium' ? 'border-cyan-400/40 text-cyan-200' : 'border-slate-400/40 text-slate-300'}`}>
        <Info className="w-3 h-3" />{t.priority}
      </span>
    </div>
  );

  const renderTask = useCallback((task, level = 0) => {
    const hasSub = task.subTasks?.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const isActive = activeTimer === task.id;
    const totalTime = calculateTotalTime(task);
    const lastLogs = (task.timeLogs || []).slice(-3).reverse();

    return (
      <div key={task.id} className="mb-2">
        <div
          className={`p-3 rounded-lg border transition-all ${isActive ? 'bg-blue-900/20 border-blue-500 shadow-lg' : 'bg-gray-800/70 border-white/10 hover:bg-gray-800/90'}`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {hasSub && (
                  <button onClick={() => toggleExpanded(task.id)} className="text-gray-400 hover:text-gray-200">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
                {editingTask === task.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-2">
                    <input className="md:col-span-2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100"
                           value={editObj.name} onChange={e => setEditObj(o => ({...o, name: e.target.value}))} placeholder="Task name"/>
                    <input className="md:col-span-2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100"
                           value={editObj.description} onChange={e => setEditObj(o => ({...o, description: e.target.value}))} placeholder="Description"/>
                    <select className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100"
                            value={editObj.priority} onChange={e => setEditObj(o => ({...o, priority: e.target.value}))}>
                      {PRIORITY.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input type="date" className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100"
                           value={editObj.dueDate} onChange={e => setEditObj(o => ({...o, dueDate: e.target.value}))}/>
                    <input className="md:col-span-3 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100"
                           value={editObj.tags} onChange={e => setEditObj(o => ({...o, tags: e.target.value}))} placeholder="tags, comma,separated"/>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-white text-sm">Save</button>
                      <button onClick={() => setEditingTask(null)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 flex-1">
                    <div className="font-medium text-gray-100">{task.name}</div>
                    {isActive && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <Clock className="w-4 h-4" /><span className="text-sm">{msToHMS(elapsedTime)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* meta row */}
              <div className="mt-2 flex items-center justify-between gap-3">
                <TaskBadge t={task} />
                <div className="text-gray-400 text-sm">{msToHMS(totalTime)}</div>
              </div>

              {/* last logs */}
              {(task.description || lastLogs.length > 0) && (
                <div className="mt-2 grid md:grid-cols-2 gap-3">
                  {task.description && <p className="text-xs text-slate-300/80">{task.description}</p>}
                  {lastLogs.length > 0 && (
                    <div className="text-[11px] text-slate-300/80">
                      <div className="font-semibold mb-1">Recent Sessions</div>
                      <div className="space-y-1">
                        {lastLogs.map(l => (
                          <div key={l.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-white/5">
                            <span className="truncate">
                              {new Date(l.start || l.timestamp).toLocaleString()} → {new Date(l.end || l.timestamp).toLocaleTimeString()}
                              {' · '} {msToHMS(l.duration)} {l.note ? ` · ${l.note}` : ''}
                            </span>
                            <button onClick={() => removeLog(task.id, l.id)} className="text-red-300/80 hover:text-red-200">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* actions */}
            <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-2">
              {!isActive ? (
                <div className="flex gap-1">
                  <button onClick={() => startTimer(task.id)} className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded" title="Start Timer">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  {!isPaused ? (
                    <button onClick={pauseTimer} className="p-1 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-900/20 rounded" title="Pause">
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={resumeTimer} className="p-1 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/20 rounded" title="Resume">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={stopTimer} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded" title="Stop & Log">
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              )}

              <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-xs">
                {STATUS.map(s => <option key={s}>{s}</option>)}
              </select>

              <button onClick={() => startEditing(task)} className="p-1 text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteTask(task.id)} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {hasSub && expandedTasks.has(task.id) && (
          <div className="mt-2">
            {task.subTasks.map(st => renderTask(st, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedTasks, activeTimer, elapsedTime, isPaused, editObj, editingTask]);

  /* =========================
     UI
  ========================= */
  if (loading) {
    return (
      <div className={`${THEME.bg} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${THEME.bg} min-h-screen p-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-black text-slate-100">Task Time Tracker</h1>
            <span className="text-[11px] px-2 py-0.5 border border-cyan-400/30 text-cyan-200/90 rounded">Analytics (Collapsible)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <input type="email" value={user.email} onChange={(e) => setUser({ email: e.target.value, name: e.target.value.split("@")[0] })}
                     placeholder="Enter your email"
                     className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm" />
            </div>

            {lastSync && (
              <div className="hidden md:flex items-center gap-1 text-xs text-gray-400">
                <Save className="w-3 h-3" /> Last saved: {lastSync.toLocaleTimeString()}
              </div>
            )}

            {/* Collapsible Analytics Button + Customize dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAnalytics(s => !s)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${showAnalytics ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}>
                <BarChart3 className="w-4 h-4" /> {showAnalytics ? "Hide Analytics" : "Show Analytics"}
              </button>
              {showAnalytics && (
                <button
                  onClick={() => setShowAnalyticsCustomize(v => !v)}
                  className="ml-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-100 text-sm">
                  Customize
                </button>
              )}
              {showAnalytics && showAnalyticsCustomize && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-gray-800/95 p-3 z-10">
                  <div className="text-xs text-slate-300 mb-2">Analytics sections</div>
                  {[
                    ["kpis", "KPI Cards"],
                    ["trend", "Time Trend"],
                    ["donut", "Task Share (Donut)"],
                    ["heatmap", "Calendar Heatmap"],
                    ["distributions", "Hour & Weekday Bars"],
                    ["top", "Top Tasks Table"],
                    ["sessions", "Sessions Explorer"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 py-1 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!analyticsSections[key]}
                        onChange={() => setAnalyticsSections(s => ({ ...s, [key]: !s[key] }))}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button onClick={undo} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200" title="Undo">
              <Undo className="w-4 h-4" />
            </button>
            <button onClick={redo} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200" title="Redo">
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Summary + Search + Add Task */}
        <div className={`${THEME.panel} rounded-xl p-4 mb-6`}>
          <div className="grid lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-slate-300/80">Total Time Tracked</div>
              <div className="text-3xl font-bold text-blue-300">{msToHMS(totalTimeAllTasks)}</div>
              <div className="text-xs text-slate-400 mt-1">{tasks.length} tasks · {allTasksFlat.length} total items</div>
            </div>
            <div className="lg:col-span-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded">
                  <Search className="w-4 h-4 text-slate-300/80" />
                  <input id="search" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search tasks, descriptions, tags…"
                         className="bg-transparent outline-none text-slate-100 text-sm w-64 md:w-96"/>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-300/80" />
                  <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-2 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-100">
                    <option>All</option>{STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={filterTag} onChange={e=>setFilterTag(e.target.value)} className="px-2 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-100">
                    <option>All</option>{allTags.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-2 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-100">
                    <option value="created">Sort: Created</option>
                    <option value="name">Sort: Name</option>
                    <option value="time">Sort: Time</option>
                    <option value="due">Sort: Due</option>
                    <option value="priority">Sort: Priority</option>
                  </select>
                </div>

                {/* Import/Export */}
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Import
                </button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const r = new FileReader();
                  r.onload = (ev) => {
                    try {
                      const imported = JSON.parse(ev.target.result);
                      if (!Array.isArray(imported.tasks)) throw new Error("Invalid file");
                      setHistory(h => [...h, deepClone(tasks)]);
                      setTasks(imported.tasks);
                      if (imported.expandedTasks) setExpandedTasks(new Set(imported.expandedTasks));
                      if (imported.selectedTasksForAnalytics) setSelectedTasksForAnalytics(new Set(imported.selectedTasksForAnalytics));
                      if (imported.analyticsSections) setAnalyticsSections(imported.analyticsSections);
                      if (typeof imported.showAnalytics === "boolean") setShowAnalytics(imported.showAnalytics);
                      if (imported.user) setUser(imported.user);
                      alert(`Imported ${imported.tasks.length} top-level tasks`);
                    } catch (err) { alert("Import failed: " + err.message); }
                  };
                  r.readAsText(file);
                  e.target.value = "";
                }} className="hidden" />

                {/* --- Add Task (quick) --- */}
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    value={newTaskName}
                    onChange={(e)=>setNewTaskName(e.target.value)}
                    placeholder="New task name"
                    className="px-2 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-100"
                  />
                  <input
                    value={newTaskTag}
                    onChange={(e)=>setNewTaskTag(e.target.value)}
                    placeholder="Tag (optional)"
                    className="px-2 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-100"
                  />
                  <button
                    onClick={addTask}
                    disabled={!newTaskName.trim()}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white">
                    <Plus className="w-4 h-4" /> Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============== ANALYTICS: Collapsible ============== */}
        {showAnalytics && (
          <div className={`${THEME.panel} rounded-xl p-6 mb-8 print:bg-white print:text-black`}>
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-100">Analytics Dashboard</h2>
              <div className="flex items-center gap-2">
                <button onClick={printReport} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-slate-100 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button onClick={exportAnalyticsCSV} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export Sessions CSV
                </button>
              </div>
            </div>

            {/* Controls Row */}
            <div className="grid md:grid-cols-4 gap-3 mb-6">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Time Period</label>
                <select value={analyticsPeriod} onChange={(e)=>setAnalyticsPeriod(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100">
                  {Object.entries(ANALYTICS_PERIODS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {analyticsPeriod === "custom" && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Start</label>
                    <input type="date" value={analyticsStartDate} onChange={(e)=>setAnalyticsStartDate(e.target.value)}
                           className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">End</label>
                    <input type="date" value={analyticsEndDate} onChange={(e)=>setAnalyticsEndDate(e.target.value)}
                           className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100" />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-300 mb-2">Pick Tasks (type to filter)</label>
                <TaskPicker
                  items={allTasksFlat}
                  selected={selectedTasksForAnalytics}
                  onChange={setSelectedTasksForAnalytics}
                />
              </div>
            </div>

            {/* KPI Cards */}
            {analyticsSections.kpis && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <KPI title="Total Time" value={msToHMS(analyticsSummary.totalTime)} accent="text-green-400" />
                <KPI title="Sessions" value={analyticsSummary.sessions} accent="text-blue-400" />
                <KPI title="Avg / Day" value={kpiAvgPerDay ? msToHMS(kpiAvgPerDay) : "0s"} accent="text-purple-400" />
                <KPI title="Active Tasks" value={analyticsSummary.rows.filter(r=>r.totalTime>0).length} accent="text-amber-400" />
              </div>
            )}

            {/* Trend + Donut */}
            {(analyticsSections.trend || analyticsSections.donut) && (
              <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {analyticsSections.trend && (
                  <div className="lg:col-span-2">
                    <PanelTitle title="Time Trend" subtitle={`${analyticsWindow.start.toLocaleDateString()} → ${analyticsWindow.end.toLocaleDateString()}`} />
                    <AreaTrend data={analyticsSummary.days} height={180} />
                  </div>
                )}
                {analyticsSections.donut && (
                  <div>
                    <PanelTitle title="Task Share" subtitle="Top 8 tasks" />
                    <Donut data={analyticsSummary.share} />
                    <Legend data={analyticsSummary.share} />
                  </div>
                )}
              </div>
            )}

            {/* Heatmap + Distributions */}
            {(analyticsSections.heatmap || analyticsSections.distributions) && (
              <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {analyticsSections.heatmap && (
                  <div className="lg:col-span-2">
                    <PanelTitle title="Calendar Heatmap" subtitle="Intensity = time spent per day" />
                    <CalendarHeatmap data={analyticsSummary.days} window={analyticsWindow} />
                  </div>
                )}
                {analyticsSections.distributions && (
                  <div className="grid gap-6">
                    <div className="">
                      <PanelTitle title="By Hour of Day" subtitle="When you’re most active" />
                      <BarsHorizontal labels={Array.from({length:24},(_,i)=>`${i}:00`)} values={analyticsSummary.hour} />
                    </div>
                    <div className="">
                      <PanelTitle title="By Day of Week" subtitle="Workload distribution" />
                      <BarsHorizontal labels={["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]} values={analyticsSummary.wday} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top Tasks Table */}
            {analyticsSections.top && (
              <div className="mb-6">
                <PanelTitle title="Top Tasks" subtitle="Sorted by total time" />
                <TopTasksTable rows={analyticsSummary.rows
                  .filter(r=>r.totalTime>0)
                  .sort((a,b)=>b.totalTime-a.totalTime)
                  .slice(0,12)}
                />
              </div>
            )}

            {/* Sessions Explorer */}
            {analyticsSections.sessions && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <PanelTitle title="Sessions Explorer" subtitle="Filter & export" tight />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded">
                      <Search className="w-4 h-4 text-slate-300/80" />
                      <input value={sessionFilterQuery} onChange={e=>setSessionFilterQuery(e.target.value)} placeholder="Search in task path / note"
                             className="bg-transparent outline-none text-slate-100 text-sm"/>
                    </div>
                    <button onClick={exportAnalyticsCSV} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                  </div>
                </div>
                <SessionsTable rows={analyticsSummary.sessionsFlat} query={sessionFilterQuery} />
              </div>
            )}
          </div>
        )}

        {/* Manual Entry */}
        <div className={`${THEME.panel} rounded-xl p-6 mb-8`}>
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Manual Time Entry</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm text-gray-300 mb-2">Select Task</label>
              <select value={manualTaskId} onChange={e=>setManualTaskId(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100">
                <option value="">Choose a task…</option>
                {allTasksFlat.map(t => <option key={t.id} value={t.id}>{t.fullPath}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm text-gray-300 mb-2">Duration <span className="text-gray-500">(e.g., 25m, 1h 30m, 45s)</span></label>
              <input type="text" placeholder="25m, 1h 30m…" value={manualTime} onChange={e=>setManualTime(e.target.value)}
                     className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400"/>
            </div>
            <div className="min-w-[220px]">
              <label className="block text-sm text-gray-300 mb-2">End Date & Time</label>
              <input type="datetime-local" value={manualWhen} onChange={e=>setManualWhen(e.target.value)}
                     className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"/>
            </div>
            <button onClick={addManualTime} disabled={!manualTime.trim() || !manualTaskId}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Log Time
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className={`${THEME.panel} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-200">Tasks & Projects</h2>
            {tasks.length > 0 && (
              <div className="text-sm text-gray-400">
                {tasks.length} main tasks · {allTasksFlat.length} total items
              </div>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Timer className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No tasks yet</p>
              <p className="text-gray-500">Use <span className="text-slate-200 font-medium">Add Task</span> above to create your first task.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTopLevel.map(t => renderTask(t))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   ANALYTICS UI PARTS
========================= */
function KPI({ title, value, accent = "text-slate-200" }) {
  return (
    <div className="bg-gray-700/60 rounded-lg p-4 border border-white/10">
      <div className="text-sm text-slate-300/80">{title}</div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
function PanelTitle({ title, subtitle, tight }) {
  return (
    <div className={`mb-${tight ? "1" : "3"}`}>
      <div className="text-base font-semibold text-slate-100">{title}</div>
      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
}

/* --- Task Picker with search & count --- */
function TaskPicker({ items, selected, onChange }) {
  const [q, setQ] = useState("");
  const match = useMemo(() => {
    const lower = q.toLowerCase();
    return items.filter(i => !q.trim() || i.fullPath.toLowerCase().includes(lower));
  }, [q, items]);
  const toggle = (id) => {
    onChange(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <div className="p-2 flex items-center gap-2 border-b border-white/10">
        <Search className="w-4 h-4 text-slate-300/80" />
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Filter tasks…" className="bg-transparent outline-none text-slate-100 text-sm flex-1"/>
        <span className="text-xs text-slate-400">{selected.size} selected</span>
        <button onClick={()=>onChange(new Set())} className="text-xs text-blue-300 hover:text-blue-200">Clear</button>
      </div>
      <div className="max-h-40 overflow-y-auto p-2 grid md:grid-cols-2 gap-1">
        {match.map(t => (
          <label key={t.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
            <input type="checkbox" checked={selected.has(t.id)} onChange={()=>toggle(t.id)} />
            <span className="text-xs text-slate-200 truncate">{t.fullPath}</span>
          </label>
        ))}
        {match.length === 0 && <div className="text-xs text-slate-400 px-2 py-1">No results</div>}
      </div>
    </div>
  );
}

/* --- Area Trend (SVG) --- */
function AreaTrend({ data, height = 160 }) {
  const w = 700; // SVG scales with width:100%
  const padding = 24;
  const maxV = Math.max(1, ...data.map(d => d.value));
  const points = data.map((d, i) => {
    const x = padding + (i * (w - padding * 2)) / Math.max(1, data.length - 1);
    const y = padding + (1 - d.value / maxV) * (height - padding * 2);
    return [x, y];
  });
  const path = points.length
    ? `M ${points[0][0]} ${points[0][1]} ` + points.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(" ")
    : "";
  const area = points.length
    ? `${path} L ${padding + (w - padding * 2)} ${height - padding} L ${padding} ${height - padding} Z`
    : "";

  return (
    <div className="w-full rounded-lg border border-white/10 bg-white/5 p-3">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
        {/* axes */}
        <line x1={padding} y1={height - padding} x2={w - padding} y2={height - padding} stroke="currentColor" opacity="0.2"/>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" opacity="0.2"/>
        {/* area */}
        <path d={area} fill="currentColor" opacity="0.15" />
        {/* stroke */}
        <path d={path} stroke="currentColor" strokeWidth="2" fill="none" />
        {/* points */}
        {points.map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="2.5" fill="currentColor" />))}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{data[0]?.date || "-"}</span>
        <span>{data[data.length-1]?.date || "-"}</span>
      </div>
    </div>
  );
}

/* --- Donut Chart --- */
function Donut({ data, size = 220, stroke = 22 }) {
  const total = data.reduce((s,d)=>s+d.value,0) || 1;
  let acc = 0;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-center">
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" opacity="0.1" strokeWidth={stroke}/>
        {data.map((d, i) => {
          const val = d.value / total;
          const dash = val * circumference;
          const gap = circumference - dash;
          const dashArray = `${dash} ${gap}`;
          const rot = (acc / total) * 360;
          acc += d.value;
          return (
            <g key={d.id} transform={`rotate(${rot} ${center} ${center})`}>
              <circle
                cx={center} cy={center} r={radius}
                fill="none" stroke="currentColor"
                strokeWidth={stroke} strokeDasharray={dashArray} strokeLinecap="butt"
                opacity={0.35 + (0.5 * (i+1)/data.length)}
              />
            </g>
          );
        })}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-current text-slate-200" style={{fontSize: 14}}>
          {data.length ? "Top Tasks" : "No data"}
        </text>
      </svg>
    </div>
  );
}
function Legend({ data }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-1 text-xs">
      {data.map((d,i)=>(
        <div key={d.id} className="flex items-center justify-between gap-2">
          <span className="truncate text-slate-200">{i+1}. {d.name}</span>
          <span className="text-slate-400">{msToHMS(d.value)}</span>
        </div>
      ))}
      {data.length === 0 && <div className="text-slate-400">Nothing to show</div>}
    </div>
  );
}

/* --- Calendar Heatmap --- */
function CalendarHeatmap({ data, window }) {
  // build day-by-day from window.start..end
  const start = startOfDay(window.start);
  const end = startOfDay(window.end);
  const map = new Map(data.map(d => [d.date, d.value]));
  const days = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) {
    const key = fmtDay(d);
    days.push({ date: key, value: map.get(key) || 0, dow: d.getDay() });
  }
  const max = Math.max(1, ...days.map(d=>d.value));
  // Lay out weeks columns (like GitHub)
  const weeks = [];
  let chunk = [];
  days.forEach((day, idx) => {
    chunk.push(day);
    if (day.dow === 6 || idx === days.length-1) { weeks.push(chunk); chunk = []; }
  });

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 overflow-auto">
      <div className="inline-flex gap-1">
        {weeks.map((wk, wi)=>(
          <div key={wi} className="grid gap-1" style={{gridTemplateRows: "repeat(7, 12px)"}}>
            {Array.from({length:7}, (_,ri)=>{
              const d = wk.find(x => x.dow === ri);
              const val = d?.value || 0;
              const intensity = val / max;
              return (
                <div key={ri} title={`${d?.date || "—"} • ${msToHMS(val)}`}
                     className="w-3 h-3 rounded-sm"
                     style={{ background: `rgba(56, 189, 248, ${0.15 + 0.6*intensity})` }} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-400 mt-2">{start.toLocaleDateString()} → {new Date(end.getTime()-86400000).toLocaleDateString()}</div>
    </div>
  );
}

/* --- Bars Horizontal --- */
function BarsHorizontal({ labels, values }) {
  const max = Math.max(1, ...values);
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="space-y-1">
        {labels.map((lab, i) => (
          <div key={lab} className="flex items-center gap-2">
            <div className="w-16 shrink-0 text-[11px] text-slate-300/80">{lab}</div>
            <div className="flex-1">
              <div className="h-3 rounded bg-blue-500/30" style={{ width: `${Math.max(2, (values[i] / max) * 100)}%` }} />
            </div>
            <div className="w-16 text-right text-[11px] text-slate-400">{values[i] ? msToHMS(values[i]) : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Top Tasks Table --- */
function TopTasksTable({ rows }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="text-left p-3">Task</th>
            <th className="text-right p-3">Sessions</th>
            <th className="text-right p-3">Avg / Session</th>
            <th className="text-right p-3">Total</th>
            <th className="text-right p-3">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const total = rows.reduce((s,x)=>s+x.totalTime, 0) || 1;
            return (
              <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-3 text-slate-100">{r.fullPath}</td>
                <td className="p-3 text-right text-slate-300">{r.logCount}</td>
                <td className="p-3 text-right text-slate-300">{msToHMS(r.totalTime / Math.max(1, r.logCount))}</td>
                <td className="p-3 text-right text-slate-100">{msToHMS(r.totalTime)}</td>
                <td className="p-3 text-right text-slate-400">{((r.totalTime / total) * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="p-3 text-center text-slate-400">No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* --- Sessions Explorer Table --- */
function SessionsTable({ rows, query }) {
  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(r => r.taskPath.toLowerCase().includes(q) || r.note.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-slate-300 sticky top-0">
          <tr>
            <th className="text-left p-3">Task</th>
            <th className="text-left p-3">Start</th>
            <th className="text-left p-3">End</th>
            <th className="text-right p-3">Duration</th>
            <th className="text-left p-3">Note</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s, i) => (
            <tr key={i} className="border-t border-white/10 hover:bg-white/5">
              <td className="p-3 text-slate-100 min-w-[260px]">{s.taskPath}</td>
              <td className="p-3 text-slate-300">{s.start ? new Date(s.start).toLocaleString() : "—"}</td>
              <td className="p-3 text-slate-300">{s.end ? new Date(s.end).toLocaleString() : "—"}</td>
              <td className="p-3 text-right text-slate-100">{msToHMS(s.duration)}</td>
              <td className="p-3 text-slate-300">{s.note}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="p-3 text-center text-slate-400">No sessions match your filter</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
