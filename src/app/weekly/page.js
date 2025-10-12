"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Layers,
  ToggleLeft,
  ToggleRight,
  X,
  ChevronUp,
  ChevronDown,
  BarChart3,
  ListFilter,
} from "lucide-react";

/* ---------------- Local date helpers ---------------- */
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const dateKeyLocalFromDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toLocalDayKey = (value) => {
  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (m) {
      const y = +m[1],
        mo = +m[2] - 1,
        d = +m[3];
      return dateKeyLocalFromDate(new Date(y, mo, d));
    }
  }
  const d = value instanceof Date ? value : new Date(value);
  return dateKeyLocalFromDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
};

const todayLocal = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

const monthLabel = (d) =>
  d.toLocaleString(undefined, { month: "long", year: "numeric" });

const shortHumanDate = (yyyy_mm_dd) => {
  const [y, m, d] = yyyy_mm_dd.split("-").map((x) => +x);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleString(undefined, { month: "short", day: "numeric" });
};

/* ---------------- Page ---------------- */
export default function WeeklyView() {
  /* force dark */
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "force-dark";
    style.textContent = `:root { color-scheme: dark; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  /* state */
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const [categoryFilters, setCategoryFilters] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Modes
  const [isCounterMode, setIsCounterMode] = useState(false);
  const [isDatesMode, setIsDatesMode] = useState(false);

  // Stats
  const [weekStats, setWeekStats] = useState({
    totalCompletions: 0,
    completionRate: 0,
    bestDay: "",
    worstDay: "",
  });

  // Per-habit per-cell “attribution” (cell date -> actual done date)
  // Stored in localStorage so only the edited tasks show a pill.
  // Shape: { [habitId]: { [cellKey]: actualDateKey } }
  const [attributions, setAttributions] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("habitDateAttributions");
      if (raw) setAttributions(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("habitDateAttributions", JSON.stringify(attributions));
  }, [attributions]);

  // Dates overlay (single-select; tied to clicked cell)
  const [datesModal, setDatesModal] = useState({
    open: false,
    habit: null,
    monthCursor: todayLocal(),
    selectedKey: null,     // the date user picked in calendar (actual done date)
    cellContextKey: null,  // the week cell date key they clicked (the one to tick)
    saving: false,
  });

  /* Week building */
  const getWeekDates = (offset = 0) => {
    const t = todayLocal();
    const first = new Date(t);
    first.setDate(t.getDate() - t.getDay() + offset * 7); // Sunday start
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    });
  };

  const currentWeek = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayKey = dateKeyLocalFromDate(todayLocal());
  const isCurrentWeek = currentWeek.some((d) => dateKeyLocalFromDate(d) === todayKey);

  /* fetch */
  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    let result = [...habits];
    if (selectedCategories.length > 0) {
      result = result.filter((h) => selectedCategories.includes(h.category));
    }
    result = sortHabits(result);
    setFilteredHabits(result);
    calculateWeekStats(result);
  }, [habits, selectedCategories, sortBy, sortDirection, weekOffset, isCounterMode]);

  const fetchHabits = async () => {
    try {
      const r = await fetch("/api/habits");
      const data = await r.json();
      const normalized = data.map((h) => ({
        ...h,
        completedDates: Array.isArray(h.completedDates)
          ? h.completedDates.map(toLocalDayKey)
          : [],
      }));
      setHabits(normalized);
      setCategoryFilters([
        ...new Set(normalized.map((h) => h.category).filter(Boolean)),
      ]);
    } catch (e) {
      console.error("Error fetching habits:", e);
    }
  };

  /* stats */
  const calculateWeekStats = (list) => {
    if (!list.length) {
      setWeekStats({
        totalCompletions: 0,
        completionRate: 0,
        bestDay: "",
        worstDay: "",
      });
      return;
    }

    const dayStats = currentWeek.map((date) => {
      const key = dateKeyLocalFromDate(date);
      const dayCompletions = list.reduce((acc, habit) => {
        const count = (habit.completedDates || []).filter((k) => k === key).length;
        const ok = isCounterMode ? count > 0 : count >= (habit.maxCheckOffs || 1);
        return ok ? acc + 1 : acc;
      }, 0);
      const possible = list.length;
      return {
        key,
        dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
        completions: dayCompletions,
        rate: possible ? (dayCompletions / possible) * 100 : 0,
      };
    });

    const sorted = [...dayStats].sort((a, b) => b.rate - a.rate);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    const totalPossible = list.length * 7;
    const total = dayStats.reduce((s, d) => s + d.completions, 0);
    const rate = totalPossible ? (total / totalPossible) * 100 : 0;

    setWeekStats({
      totalCompletions: total,
      completionRate: rate.toFixed(1),
      bestDay: best ? `${best.dayName} (${best.rate.toFixed(1)}%)` : "N/A",
      worstDay: worst ? `${worst.dayName} (${worst.rate.toFixed(1)}%)` : "N/A",
    });
  };

  /* helpers */
  const sortHabits = (list) => {
    return [...list].sort((a, b) => {
      let c = 0;
      if (sortBy === "name") c = a.name.localeCompare(b.name);
      else if (sortBy === "category")
        c = (a.category || "").localeCompare(b.category || "");
      else if (sortBy === "completion") {
        const aC = currentWeek.filter((d) => isHabitCompleted(a, d)).length;
        const bC = currentWeek.filter((d) => isHabitCompleted(b, d)).length;
        c = aC - bC;
      }
      return sortDirection === "asc" ? c : -c;
    });
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const toggleCategoryFilter = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const completionsOn = (habit, date) => {
    const key = dateKeyLocalFromDate(date);
    return (habit.completedDates || []).filter((k) => k === key).length || 0;
  };

  const isHabitCompleted = (habit, date) => {
    const count = completionsOn(habit, date);
    return isCounterMode ? count > 0 : count >= (habit.maxCheckOffs || 1);
  };

  const getCompletionRatio = (habit, date) => {
    const c = completionsOn(habit, date);
    if (isCounterMode) return String(c);
    return `${c}/${habit.maxCheckOffs || 1}`;
  };

  const saveHabit = async (habitId, update) => {
    await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: habitId, ...update }),
    });
  };

  /* threshold toggle (disabled in Dates mode; in Dates mode we open editor) */
  const toggleHabit = async (habit, date) => {
    if (isCounterMode) return;
    const cellKey = dateKeyLocalFromDate(date);

    if (isDatesMode) {
      openDatesEditor(habit, cellKey);
      return;
    }

    const arr = Array.isArray(habit.completedDates) ? [...habit.completedDates] : [];
    const countForDay = arr.filter((k) => k === cellKey).length;
    const max = habit.maxCheckOffs || 1;
    let newList = arr;

    if (countForDay >= max) {
      newList = arr.filter((k) => k !== cellKey);
      // also clear any attribution attached to this cell (cleanup)
      setAttributions((prev) => {
        if (!prev[habit._id]?.[cellKey]) return prev;
        const next = { ...prev };
        const map = { ...(next[habit._id] || {}) };
        delete map[cellKey];
        next[habit._id] = map;
        return next;
      });
    } else {
      newList = [...arr, cellKey];
    }

    setHabits((prev) => prev.map((h) => (h._id === habit._id ? { ...h, completedDates: newList } : h)));
    try {
      await saveHabit(habit._id, { completedDates: newList });
    } catch (e) {
      console.error("Error updating habit:", e);
    }
  };

  /* counter mode adjust */
  const adjustCounter = async (habit, date, delta) => {
    if (!isCounterMode) return;
    const key = dateKeyLocalFromDate(date);
    const arr = Array.isArray(habit.completedDates) ? [...habit.completedDates] : [];
    const current = arr.filter((k) => k === key).length;
    const next = Math.max(0, current + delta);
    const trimmed = arr.filter((k) => k !== key);
    const newList = [...trimmed, ...Array.from({ length: next }, () => key)];

    // cleanup attribution if removing count to 0
    if (next === 0) {
      setAttributions((prev) => {
        if (!prev[habit._id]?.[key]) return prev;
        const cp = { ...prev };
        const map = { ...(cp[habit._id] || {}) };
        delete map[key];
        cp[habit._id] = map;
        return cp;
      });
    }

    setHabits((prev) => prev.map((h) => (h._id === habit._id ? { ...h, completedDates: newList } : h)));
    try {
      await saveHabit(habit._id, { completedDates: newList });
    } catch (e) {
      console.error("Error updating habit:", e);
    }
  };

  /* ----------- DATES MODE: editor tied to clicked cell ----------- */
  const openDatesEditor = (habit, cellKey) => {
    // default selection: today
    const base = todayLocal();
    setDatesModal({
      open: true,
      habit,
      monthCursor: new Date(base.getFullYear(), base.getMonth(), 1),
      selectedKey: dateKeyLocalFromDate(base),
      cellContextKey: cellKey, // <- the cell to tick
      saving: false,
    });
  };

  const closeDatesEditor = () =>
    setDatesModal((s) => ({ ...s, open: false }));

  const shiftMonth = (delta) => {
    setDatesModal((s) => {
      const d = new Date(s.monthCursor);
      d.setMonth(d.getMonth() + delta, 1);
      return { ...s, monthCursor: d };
    });
  };

  const buildMonthMatrix = (cursor) => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const startDay = first.getDay(); // 0 Sun
    const daysIn = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysIn; d++) cells.push(new Date(y, m, d));
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < trailing; i++) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  };

  const setCalendarSelection = (dateObj) => {
    const key = dateKeyLocalFromDate(dateObj);
    setDatesModal((s) => ({ ...s, selectedKey: key }));
  };

  // Save rule (what you asked):
  // - Tick the clicked CELL date (cellContextKey) in completedDates
  // - Attach attribution: habitId + cellContextKey -> selectedKey
  // - DO NOT tick the selectedKey date itself.
  const saveDateSelection = async () => {
    if (!datesModal.habit || !datesModal.cellContextKey || !datesModal.selectedKey) return;
    setDatesModal((s) => ({ ...s, saving: true }));

    const habitId = datesModal.habit._id;
    const cellKey = datesModal.cellContextKey;      // the week cell that should be checked
    const actualKey = datesModal.selectedKey;       // the date you did it on (e.g., Oct 14)

    // ensure cellKey in completedDates
    const list = Array.isArray(datesModal.habit.completedDates)
      ? [...datesModal.habit.completedDates]
      : [];
    const newList = list.includes(cellKey) ? list : [...list, cellKey];

    // set attribution mapping for ONLY this cell
    setAttributions((prev) => {
      const next = { ...prev };
      const map = { ...(next[habitId] || {}) };
      map[cellKey] = actualKey; // "Done on actualKey"
      next[habitId] = map;
      return next;
    });

    // Update local habit
    setHabits((prev) =>
      prev.map((h) => (h._id === habitId ? { ...h, completedDates: newList } : h))
    );

    // Save only completedDates to server (attribution is local-only)
    try {
      await saveHabit(habitId, { completedDates: newList });
    } catch (e) {
      console.error("Error saving habit dates:", e);
    } finally {
      setDatesModal((s) => ({ ...s, saving: false, open: false }));
    }
  };

  /* --------------------------- UI --------------------------- */
  return (
    <div className="min-h-screen relative bg-slate-950 text-slate-100">
      {/* soft cyan/indigo glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(34,211,238,0.15),transparent_60%),radial-gradient(900px_500px_at_80%_110%,rgba(99,102,241,0.14),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cyan-300/70 mb-1">
                Performance · Weekly
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
                Weekly Planner
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Threshold / Counter */}
            <button
              onClick={() => setIsCounterMode((v) => !v)}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 border ${
                isCounterMode
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
              title="Toggle Counter / Threshold"
            >
              {isCounterMode ? (
                <ToggleRight className="h-5 w-5" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">
                {isCounterMode ? "Counter" : "Threshold"}
              </span>
            </button>

            {/* Dates mode */}
            <button
              onClick={() => setIsDatesMode((v) => !v)}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 border ${
                isDatesMode
                  ? "border-indigo-400/50 bg-indigo-400/10 text-indigo-200"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
              title="Pick a different completion date"
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Dates</span>
            </button>

            {/* Week nav */}
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 text-slate-300"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="text-slate-200 whitespace-nowrap px-3 py-2 border border-white/10 bg-white/5 rounded-md">
              {currentWeek[0].toLocaleDateString()} —{" "}
              {currentWeek[6].toLocaleDateString()}
            </span>

            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              className="px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 text-slate-300"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>

            {!isCurrentWeek && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-2 border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/20 rounded-md transition-colors flex items-center gap-2 text-cyan-200"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline">Today</span>
              </button>
            )}

            <button
              onClick={() => setIsFilterVisible((v) => !v)}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 border ${
                isFilterVisible
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {isFilterVisible && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-cyan-300" /> Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categoryFilters.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCategoryFilter(c)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors border ${
                        selectedCategories.includes(c)
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                          : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="px-3 py-1 rounded-md text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-cyan-300" /> Sort By
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "name", label: "Name" },
                    { id: "category", label: "Category" },
                    { id: "completion", label: "Completion" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggleSort(opt.id)}
                      className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors border ${
                        sortBy === opt.id
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                          : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.id && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Completions", value: weekStats.totalCompletions },
            { label: "Completion Rate", value: `${weekStats.completionRate}%` },
            { label: "Best Day", value: weekStats.bestDay },
            { label: "Worst Day", value: weekStats.worstDay },
          ].map((k, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-slate-300 text-sm mb-1">{k.label}</div>
              <div className="text-2xl font-black text-slate-100">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Header row */}
            <div className="grid grid-cols-[minmax(220px,1fr)_repeat(7,minmax(90px,1fr))] gap-2 mb-4">
              <div className="text-slate-300 font-medium flex items-center">
                <span className="flex-1">Habit</span>
                <span className="text-sm text-slate-400">
                  {filteredHabits.length} of {habits.length}
                </span>
              </div>
              {currentWeek.map((date) => {
                const key = dateKeyLocalFromDate(date);
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={`text-center p-1 rounded border ${
                      isToday
                        ? "bg-cyan-400/10 border-cyan-400/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        isToday ? "text-cyan-200" : "text-slate-300"
                      }`}
                    >
                      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][date.getDay()]}
                    </div>
                    <div
                      className={`text-xs ${
                        isToday ? "text-slate-200" : "text-slate-400"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {filteredHabits.length === 0 ? (
                <div className="text-center py-10 text-slate-300">
                  {habits.length === 0
                    ? "No habits found. Create your first habit to get started!"
                    : "No habits match your current filters."}
                </div>
              ) : (
                filteredHabits.map((habit) => (
                  <div
                    key={habit._id}
                    className="grid grid-cols-[minmax(220px,1fr)_repeat(7,minmax(90px,1fr))] gap-2 items-center py-2 border-b border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="text-lg">{habit.emoji || "🔥"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-100 font-medium">
                          {habit.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {habit.category || "General"}
                        </span>
                      </div>
                    </div>

                    {currentWeek.map((date) => {
                      const cellKey = dateKeyLocalFromDate(date);
                      const isCompleted = isHabitCompleted(habit, date);
                      const count = completionsOn(habit, date);
                      const attrForCell =
                        attributions[habit._id]?.[cellKey] || null;

                      return (
                        <div
                          key={cellKey}
                          className="flex flex-col items-center justify-center gap-1"
                        >
                          {isCounterMode ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => adjustCounter(habit, date, -1)}
                                className="w-7 h-7 rounded bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center"
                                title="Decrease"
                              >
                                <ChevronDown className="h-4 w-4 text-slate-300" />
                              </button>
                              <div
                                className={`w-12 h-10 rounded-lg flex items-center justify-center text-sm font-semibold border ${
                                  count > 0
                                    ? "bg-emerald-600/90 text-white border-emerald-500/50"
                                    : "bg-slate-700/70 text-slate-300 border-white/10"
                                }`}
                              >
                                {count}
                              </div>
                              <button
                                onClick={() => adjustCounter(habit, date, 1)}
                                className="w-7 h-7 rounded bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center"
                                title="Increase"
                              >
                                <ChevronUp className="h-4 w-4 text-slate-300" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleHabit(habit, date)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border ${
                                isCompleted
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/60"
                                  : "bg-slate-700/70 hover:bg-slate-600 text-slate-300 border-white/10"
                              } ${isDatesMode ? "ring-1 ring-indigo-400/40" : ""}`}
                              title={
                                isDatesMode
                                  ? "Pick a different completion date"
                                  : `${habit.name}: ${getCompletionRatio(habit, date)}`
                              }
                            >
                              {isCompleted ? (
                                <Check className="h-6 w-6" />
                              ) : (
                                getCompletionRatio(habit, date)
                              )}
                            </button>
                          )}

                          {/* Show pill ONLY for cells you've attributed AND only in Dates mode */}
                          {isDatesMode && attrForCell && (
                            <div className="text-[10px] px-2 py-0.5 rounded bg-indigo-400/10 border border-indigo-400/30 text-indigo-200">
                              Done on {shortHumanDate(attrForCell)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center">
          <a
            href="/analytics"
            className="text-cyan-300 flex items-center gap-2 hover:text-cyan-200 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span>View Full Analytics</span>
          </a>
          <a
            href="/habits"
            className="text-cyan-300 flex items-center gap-2 hover:text-cyan-200 transition-colors"
          >
            <Layers className="h-5 w-5" />
            <span>Manage Habits</span>
          </a>
        </div>
      </div>

      {/* ---------------- Dates Overlay (single-select tied to clicked cell) ---------------- */}
      {datesModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDatesEditor}
          />
          {/* Modal */}
          <div className="relative w-full max-w-3xl mx-3 rounded-xl border border-white/10 bg-slate-900 text-white shadow-2xl overflow-hidden">
            <div className="absolute -inset-1 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(34,211,238,0.12),transparent_25%,rgba(99,102,241,0.12),transparent_50%,rgba(34,211,238,0.12),transparent_75%)] blur-2xl opacity-40 pointer-events-none" />
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-cyan-300/70">
                      Pick Completion Date
                    </div>
                    <div className="font-black text-slate-100">
                      {datesModal.habit?.name}
                    </div>
                    {datesModal.cellContextKey && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        Ticking <span className="text-slate-200">{shortHumanDate(datesModal.cellContextKey)}</span> (this cell)
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeDatesEditor}
                  className="h-9 w-9 rounded border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-4">
                {/* Calendar */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => shiftMonth(-1)}
                      className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="font-semibold text-slate-100">
                      {monthLabel(datesModal.monthCursor)}
                    </div>
                    <button
                      onClick={() => shiftMonth(1)}
                      className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Weekday header */}
                  <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] text-slate-400">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <div key={d} className="text-center">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar matrix */}
                  <div className="grid grid-cols-7 gap-1">
                    {buildMonthMatrix(datesModal.monthCursor)
                      .flat()
                      .map((cell, idx) => {
                        if (!cell) {
                          return (
                            <div
                              key={`blank-${idx}`}
                              className="h-10 rounded bg-transparent"
                            />
                          );
                        }
                        const key = dateKeyLocalFromDate(cell);
                        const selected = datesModal.selectedKey === key;
                        const isToday = key === todayKey;
                        return (
                          <button
                            key={key}
                            onClick={() => setCalendarSelection(cell)}
                            className={`h-10 rounded border text-sm transition-colors ${
                              selected
                                ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-100"
                                : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                            } ${isToday ? "ring-1 ring-cyan-400/40" : ""}`}
                            title={key}
                          >
                            {cell.getDate()}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Inspector */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col">
                  <div className="text-sm text-slate-300 mb-2">
                    Selected date
                  </div>
                  <div className="min-h-[44px] flex items-center">
                    {datesModal.selectedKey ? (
                      <span className="px-2 py-1 rounded border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 text-sm">
                        {datesModal.selectedKey} ({shortHumanDate(datesModal.selectedKey)})
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm">None</span>
                    )}
                  </div>

                  <div className="mt-auto flex justify-end gap-2 pt-2">
                    <button
                      onClick={closeDatesEditor}
                      className="px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!datesModal.selectedKey || datesModal.saving}
                      onClick={saveDateSelection}
                      className="px-4 py-2 rounded border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-100 disabled:opacity-60"
                    >
                      {datesModal.saving ? "Saving..." : "Save"}
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 mt-3">
                    This will check <span className="text-slate-200">the week day you clicked</span> and show a pill
                    like <span className="text-indigo-200">“Done on Oct 14”</span> under that cell (only in Dates mode).
                    The actual picked date does not get auto-checked.
                  </div>
                </div>
              </div>

              <div className="h-2 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-indigo-400/0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
