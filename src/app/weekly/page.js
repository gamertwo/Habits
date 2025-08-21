"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  ArrowUpDown,
  RefreshCw,
  ListFilter,
  Layers,
  Clock,
  X,
} from "lucide-react";

/* --------- Local-date helpers (critical) ---------- */
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const dateKeyLocalFromDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toLocalDayKey = (value) => {
  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (m) {
      const y = +m[1], mo = +m[2] - 1, d = +m[3];
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

/* --------- Duration options (minutes) ---------- */
const DURATION_OPTIONS = [0, 10, 15, 30, 45, 60, 90, 120, 180];
const formatMinutes = (m) => {
  const min = Number(m || 0);
  if (!min) return "0m";
  const h = Math.floor(min / 60);
  const r = min % 60;
  if (h && r) return `${h}h ${r}m`;
  if (h) return `${h}h`;
  return `${r}m`;
};

export default function WeeklyView() {
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [weekStats, setWeekStats] = useState({
    totalCompletions: 0,
    completionRate: 0,
    bestDay: "",
    worstDay: "",
  });

  // time-spent modal state
  const [timeModal, setTimeModal] = useState({
    open: false,
    habitId: null,
    dateKey: "",
    minutes: 0,
  });

  const getWeekDates = (offset = 0) => {
    const week = [];
    const t = todayLocal();
    const firstDay = new Date(t);
    firstDay.setDate(t.getDate() - t.getDay() + offset * 7);
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + i);
      week.push(new Date(day.getFullYear(), day.getMonth(), day.getDate()));
    }
    return week;
  };

  const currentWeek = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    let result = [...habits];
    if (selectedCategories.length > 0) {
      result = result.filter((habit) => selectedCategories.includes(habit.category));
    }
    result = sortHabits(result);
    setFilteredHabits(result);
    calculateWeekStats(result);
  }, [habits, selectedCategories, sortBy, sortDirection, weekOffset]);

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits");
      const data = await response.json();

      // Normalize completedDates and timeSpentByDate keys to LOCAL YYYY-MM-DD
      const normalized = data.map((h) => {
        const cd = Array.isArray(h.completedDates) ? h.completedDates.map(toLocalDayKey) : [];
        let ts = {};
        if (h.timeSpentByDate && typeof h.timeSpentByDate === "object") {
          for (const [k, v] of Object.entries(h.timeSpentByDate)) {
            const kk = toLocalDayKey(k);
            ts[kk] = Number(v) || 0;
          }
        }
        return { ...h, completedDates: cd, timeSpentByDate: ts };
      });

      setHabits(normalized);
      const categories = [...new Set(normalized.map((habit) => habit.category))];
      setCategoryFilters(categories);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const calculateWeekStats = (habitsList) => {
    if (!habitsList.length) {
      setWeekStats({ totalCompletions: 0, completionRate: 0, bestDay: "", worstDay: "" });
      return;
    }

    const dayStats = currentWeek.map((date) => {
      const key = dateKeyLocalFromDate(date);
      const dayCompletions = habitsList.reduce((acc, habit) => {
        const countForDay = (habit.completedDates || []).filter((d) => toLocalDayKey(d) === key).length;
        const isCompleted = countForDay >= (habit.maxCheckOffs || 1);
        return isCompleted ? acc + 1 : acc;
      }, 0);

      const possibleCompletions = habitsList.length;
      const completionRate = possibleCompletions > 0 ? (dayCompletions / possibleCompletions) * 100 : 0;

      return {
        date: key,
        dayName: formatDate(date).day,
        completions: dayCompletions,
        completionRate,
      };
    });

    const sortedDays = [...dayStats].sort((a, b) => b.completionRate - a.completionRate);
    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];

    const totalPossibleCompletions = habitsList.length * 7;
    const totalCompletions = dayStats.reduce((acc, day) => acc + day.completions, 0);
    const overallCompletionRate =
      totalPossibleCompletions > 0 ? (totalCompletions / totalPossibleCompletions) * 100 : 0;

    setWeekStats({
      totalCompletions,
      completionRate: overallCompletionRate.toFixed(1),
      bestDay: bestDay ? `${bestDay.dayName} (${bestDay.completionRate.toFixed(1)}%)` : "N/A",
      worstDay: worstDay ? `${worstDay.dayName} (${worstDay.completionRate.toFixed(1)}%)` : "N/A",
      dayStats,
    });
  };

  const sortHabits = (habitsList) => {
    return [...habitsList].sort((a, b) => {
      let compareResult = 0;
      if (sortBy === "name") {
        compareResult = a.name.localeCompare(b.name);
      } else if (sortBy === "category") {
        compareResult = (a.category || "").localeCompare(b.category || "");
      } else if (sortBy === "completion") {
        const aCompletions = currentWeek.filter((date) => isHabitCompleted(a, date)).length;
        const bCompletions = currentWeek.filter((date) => isHabitCompleted(b, date)).length;
        compareResult = aCompletions - bCompletions;
      }
      return sortDirection === "asc" ? compareResult : -compareResult;
    });
  };

  const navigateWeek = (direction) => setWeekOffset((prev) => prev + direction);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const toggleCategoryFilter = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  /* ---------- Helpers ---------- */
  const completionsOn = (habit, date) => {
    const key = dateKeyLocalFromDate(date);
    const arr = Array.isArray(habit.completedDates) ? habit.completedDates : [];
    return arr.filter((d) => toLocalDayKey(d) === key).length || 0;
  };

  const isHabitCompleted = (habit, date) => {
    const count = completionsOn(habit, date);
    return count >= (habit.maxCheckOffs || 1);
  };

  const getCompletionRatio = (habit, date) => {
    const count = completionsOn(habit, date);
    return `${count}/${habit.maxCheckOffs || 1}`;
  };

  const getTimeFor = (habit, date) => {
    const key = dateKeyLocalFromDate(date);
    return Number(habit.timeSpentByDate?.[key] || 0);
  };

  const formatDate = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return { day: days[date.getDay()], date: date.getDate() };
  };

  const saveHabit = async (habitId, update) => {
    await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: habitId, ...update }),
    });
  };

  const toggleHabit = async (habit, date) => {
    const key = dateKeyLocalFromDate(date);
    const arr = Array.isArray(habit.completedDates) ? [...habit.completedDates] : [];
    const countForDay = arr.filter((d) => toLocalDayKey(d) === key).length;
    const max = habit.maxCheckOffs || 1;
    let newCompletedDates = arr;

    if (countForDay >= max) {
      // uncheck: clear all entries for that day + remove time
      newCompletedDates = arr.filter((d) => toLocalDayKey(d) !== key);
      const newTimeMap = { ...(habit.timeSpentByDate || {}) };
      delete newTimeMap[key];

      setHabits((prev) =>
        prev.map((h) =>
          h._id === habit._id ? { ...h, completedDates: newCompletedDates, timeSpentByDate: newTimeMap } : h
        )
      );

      try {
        await saveHabit(habit._id, { completedDates: newCompletedDates, timeSpentByDate: newTimeMap });
      } catch (e) {
        console.error("Error updating habit:", e);
      }
      return;
    }

    // add one more completion
    newCompletedDates = [...arr, key];

    setHabits((prev) =>
      prev.map((h) => (h._id === habit._id ? { ...h, completedDates: newCompletedDates } : h))
    );

    try {
      await saveHabit(habit._id, { completedDates: newCompletedDates });
    } catch (e) {
      console.error("Error updating habit:", e);
    }

    // If it just reached full completion, open time-spent modal
    if (countForDay + 1 >= max) {
      const currentMinutes = Number(habit.timeSpentByDate?.[key] || 0);
      setTimeModal({ open: true, habitId: habit._id, dateKey: key, minutes: currentMinutes });
    }
  };

  const handleTimeSave = async () => {
    const { habitId, dateKey, minutes } = timeModal;
    if (!habitId || !dateKey) {
      setTimeModal({ open: false, habitId: null, dateKey: "", minutes: 0 });
      return;
    }

    setHabits((prev) =>
      prev.map((h) => {
        if (h._id !== habitId) return h;
        const map = { ...(h.timeSpentByDate || {}) };
        map[dateKey] = minutes;
        return { ...h, timeSpentByDate: map };
      })
    );

    try {
      const habit = habits.find((h) => h._id === habitId);
      const map = { ...(habit?.timeSpentByDate || {}), [dateKey]: minutes };
      await saveHabit(habitId, { timeSpentByDate: map });
    } catch (e) {
      console.error("Error saving time spent:", e);
    } finally {
      setTimeModal({ open: false, habitId: null, dateKey: "", minutes: 0 });
    }
  };

  /* ---- MISSING BEFORE: add this ---- */
  const calculateCompletionStatusClass = (habit, date) => {
    const keyToday = dateKeyLocalFromDate(todayLocal());
    const key = dateKeyLocalFromDate(date);
    const isToday = key === keyToday;

    const count = completionsOn(habit, date);
    const max = habit.maxCheckOffs || 1;
    const pct = Math.min((count / max) * 100, 100);

    if (pct >= 100) return "bg-green-600 hover:bg-green-700 text-white";
    if (pct > 0) return "bg-yellow-600 hover:bg-yellow-700 text-white";
    if (isToday) return "bg-blue-600 hover:bg-blue-700 text-gray-200";
    return "bg-gray-700 hover:bg-gray-600 text-gray-400";
  };
  /* ---------------------------------- */

  const todayKey = dateKeyLocalFromDate(todayLocal());
  const isCurrentWeek = currentWeek.some((d) => dateKeyLocalFromDate(d) === todayKey);

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-gray-100">Weekly Calendar</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigateWeek(-1)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-300">
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="text-gray-300 whitespace-nowrap px-2 py-1 bg-gray-800 rounded-lg">
              {currentWeek[0].toLocaleDateString()} - {currentWeek[6].toLocaleDateString()}
            </span>

            <button onClick={() => navigateWeek(1)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-300">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>

            {!isCurrentWeek && (
              <button onClick={() => setWeekOffset(0)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 text-white">
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline">Today</span>
              </button>
            )}

            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-gray-300 ${
                isFilterVisible ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {isFilterVisible && (
          <Card className="bg-gray-800 border-gray-700 mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                    <ListFilter className="h-4 w-4" /> Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategoryFilter(category)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          selectedCategories.includes(category)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="px-3 py-1 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" /> Sort By
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "name", label: "Name" },
                      { id: "category", label: "Category" },
                      { id: "completion", label: "Completion" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => toggleSort(option.id)}
                        className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                          sortBy === option.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {option.label}
                        {sortBy === option.id && <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Total Completions</h3>
              <p className="text-2xl font-bold text-white">{weekStats.totalCompletions}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Completion Rate</h3>
              <p className="text-2xl font-bold text-white">{weekStats.completionRate}%</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Best Day</h3>
              <p className="text-2xl font-bold text-white">{weekStats.bestDay}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-gray-400 text-sm mb-1">Worst Day</h3>
              <p className="text-2xl font-bold text-white">{weekStats.worstDay}</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid */}
        <Card className="bg-gray-800 border-gray-700 overflow-x-auto">
          <CardContent className="p-4">
            <div className="min-w-[768px]">
              {/* Header row */}
              <div className="grid grid-cols-[minmax(200px,1fr)_repeat(7,minmax(80px,1fr))] gap-2 mb-4">
                <div className="text-gray-400 font-medium flex items-center">
                  <span className="flex-1">Habit</span>
                  <span className="text-sm text-gray-500">{filteredHabits.length} of {habits.length}</span>
                </div>
                {currentWeek.map((date) => {
                  const isToday = dateKeyLocalFromDate(date) === todayKey;
                  return (
                    <div key={dateKeyLocalFromDate(date)} className={`text-center p-1 rounded ${isToday ? "bg-gray-700" : ""}`}>
                      <div className={`font-medium ${isToday ? "text-blue-400" : "text-gray-400"}`}>
                        {formatDate(date).day}
                      </div>
                      <div className={`text-sm ${isToday ? "text-gray-300" : "text-gray-500"}`}>
                        {formatDate(date).date}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              <div className="space-y-3">
                {filteredHabits.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {habits.length === 0 ? "No habits found. Create your first habit to get started!" : "No habits match your current filters."}
                  </div>
                ) : (
                  filteredHabits.map((habit) => (
                    <div key={habit._id} className="grid grid-cols-[minmax(200px,1fr)_repeat(7,minmax(80px,1fr))] gap-2 items-center py-2 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        {habit.emoji && <span className="text-xl">{habit.emoji}</span>}
                        <div className="flex flex-col">
                          <span className="text-gray-200">{habit.name}</span>
                          <span className="text-xs text-gray-500">{habit.category}</span>
                        </div>
                      </div>
                      {currentWeek.map((date) => {
                        const isCompleted = isHabitCompleted(habit, date);
                        const timeMin = getTimeFor(habit, date);
                        return (
                          <div key={dateKeyLocalFromDate(date)} className="flex flex-col items-center justify-center">
                            <button
                              onClick={() => toggleHabit(habit, date)}
                              className={`
                                w-12 h-12 rounded-lg flex items-center justify-center
                                transition-colors duration-200
                                ${calculateCompletionStatusClass(habit, date)}
                              `}
                              title={`${habit.name}: ${getCompletionRatio(habit, date)} • Time ${formatMinutes(timeMin)}`}
                            >
                              {isCompleted ? <Check className="h-6 w-6" /> : getCompletionRatio(habit, date)}
                            </button>
                            {timeMin > 0 && (
                              <div className="mt-1 text-[11px] text-gray-300 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatMinutes(timeMin)}
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
          </CardContent>
        </Card>

        {/* Footer links */}
        <div className="mt-4 flex justify-between items-center">
          <a href="/analytics" className="text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
            <BarChart3 className="h-5 w-5" /><span>View Full Analytics</span>
          </a>
          <a href="/habits" className="text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
            <Layers className="h-5 w-5" /><span>Manage Habits</span>
          </a>
        </div>
      </div>

      {/* Time-spent Modal */}
      {timeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTimeModal({ open: false, habitId: null, dateKey: "", minutes: 0 })} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-lg p-5 w-[90%] max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-gray-100 font-semibold">Time spent</h3>
              </div>
              <button
                onClick={() => setTimeModal({ open: false, habitId: null, dateKey: "", minutes: 0 })}
                className="text-gray-400 hover:text-gray-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              {timeModal.dateKey} — choose how long you spent (15-min granularity).
            </p>

            <div className="px-1">
              <input
                type="range"
                min={0}
                max={DURATION_OPTIONS.length - 1}
                step={1}
                value={Math.max(0, DURATION_OPTIONS.indexOf(timeModal.minutes))}
                onChange={(e) =>
                  setTimeModal((s) => ({ ...s, minutes: DURATION_OPTIONS[Number(e.target.value)] }))
                }
                className="w-full accent-blue-500"
              />
              <div className="mt-2 flex justify-between text-[11px] text-gray-400">
                {DURATION_OPTIONS.map((m, i) => (
                  <span key={i} className="tabular-nums">{m < 60 ? `${m}m` : formatMinutes(m)}</span>
                ))}
              </div>
              <div className="mt-3 text-center text-gray-200">
                Selected: <span className="font-semibold">{formatMinutes(timeModal.minutes)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setTimeModal((s) => ({ ...s, minutes: 0 }))}
                className="px-3 py-1.5 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
              >
                Clear
              </button>
              <button
                onClick={handleTimeSave}
                className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
