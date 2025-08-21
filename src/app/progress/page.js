"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* =========================
   Date helpers (critical)
   ========================= */
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const dateKeyLocal = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Convert any stored completion value to LOCAL YYYY-MM-DD (fixes UTC drift) */
const toLocalDayKey = (value) => {
  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (m) {
      const y = +m[1], mo = +m[2] - 1, d = +m[3];
      return dateKeyLocal(new Date(y, mo, d));
    }
  }
  const d = value instanceof Date ? value : new Date(value);
  return dateKeyLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
};

export default function ProgressPage() {
  const [habits, setHabits] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHabits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/habits");
        if (!response.ok) throw new Error(`Error fetching habits: ${response.status}`);
        const data = await response.json();

        // Normalize all completedDates to LOCAL keys for consistency
        const normalized = Array.isArray(data)
          ? data.map((h) => ({
              ...h,
              completedDates: Array.isArray(h.completedDates)
                ? h.completedDates.map(toLocalDayKey)
                : [],
            }))
          : [];

        setHabits(normalized);
      } catch (err) {
        console.error("Error loading habits:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadHabits();
  }, []);

  const handleYearChange = useCallback((direction) => {
    setCurrentYear((prev) => prev + direction);
  }, []);

  const navigateToCurrentYear = useCallback(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Group by category
  const habitsByCategory = useMemo(() => {
    const grouped = habits.reduce((acc, habit) => {
      const category = habit.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(habit);
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => {
      if (a[0] === "Uncategorized") return 1;
      if (b[0] === "Uncategorized") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [habits]);

  const canGoForward = currentYear < new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-950 p-2 sm:p-4 md:p-8">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
            <h1 className="text-xl md:text-3xl font-bold text-gray-100">Habit Tracker</h1>
          </div>

          <div className="flex items-center gap-2 text-gray-100">
            <button
              onClick={() => handleYearChange(-1)}
              className="p-1 hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              aria-label="Previous Year"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={navigateToCurrentYear}
              className="px-2 py-1 text-sm bg-gray-900 hover:bg-gray-800 rounded transition-colors border border-gray-800"
              aria-label="Jump to current year"
              title="Jump to current year"
            >
              <span className="text-lg font-semibold">{currentYear}</span>
            </button>
            <button
              onClick={() => handleYearChange(1)}
              className="p-1 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              aria-label="Next Year"
              disabled={!canGoForward}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-900/60 border-gray-800">
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-gray-800" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full bg-gray-800" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="bg-red-900/20 border-red-800 text-red-200 p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              <p>Failed to load habits: {error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm"
            >
              Retry
            </button>
          </Card>
        )}

        {!isLoading && !error && habits.length === 0 && (
          <Card className="bg-gray-900/60 border-gray-800 p-6 text-center">
            <p className="text-gray-400 mb-3">No habits found. Start tracking new habits to see your progress.</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium">
              Create Your First Habit
            </button>
          </Card>
        )}

        {!isLoading && !error && habits.length > 0 && (
          <div className="space-y-8">
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-gray-400 px-1">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-gray-700" /> No activity
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> Full completion
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm ring-1 ring-blue-400" /> Today
              </span>
            </div>

            {habitsByCategory.map(([category, categoryHabits]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2 px-2">
                  {category} <span className="text-sm text-gray-400">({categoryHabits.length})</span>
                </h2>
                <div className="grid gap-4 md:gap-6">
                  {categoryHabits.map((habit) => (
                    <HabitGrid key={habit._id} habit={habit} year={currentYear} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   Habit Grid
   ========================= */
const HabitGrid = ({ habit, year }) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Local midnight "today"
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  // Precompute per-day counts from LOCAL keys
  const { dayCountsMap, daySet } = useMemo(() => {
    const m = new Map();
    const arr = Array.isArray(habit.completedDates) ? habit.completedDates : [];
    for (const raw of arr) {
      const key = toLocalDayKey(raw);
      m.set(key, (m.get(key) || 0) + 1);
    }
    return { dayCountsMap: m, daySet: new Set(m.keys()) };
  }, [habit.completedDates]);

  // Build days for the year up to today (no future cells)
  const { days, daysByMonth } = useMemo(() => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const last = today < end ? today : end;

    const out = [];
    for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
      out.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    const byMonth = {};
    for (const d of out) {
      const m = d.getMonth();
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(d);
    }
    return { days: out, daysByMonth: byMonth };
  }, [year, today]);

  // Color intensity for a day cell
  const getColorIntensity = useCallback(
    (date) => {
      const key = dateKeyLocal(date);
      const completions = dayCountsMap.get(key) || 0;
      const max = habit.maxCheckOffs || 1;
      const intensity = Math.max(0, Math.min(completions / max, 1));
      const hex = (habit.color || "#10B981").replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const base = 45;
      return `rgb(${Math.round(r * intensity + base * (1 - intensity))},
                  ${Math.round(g * intensity + base * (1 - intensity))},
                  ${Math.round(b * intensity + base * (1 - intensity))})`;
    },
    [dayCountsMap, habit.color, habit.maxCheckOffs]
  );

  // Drag scroll
  const handleMouseDown = useCallback((e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );
  const handleTouchStart = useCallback((e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);
  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || !scrollRef.current) return;
      const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  /* =============================
     Stats with 2-day grace rule
     ============================= */
  const {
    completedCount,
    completionPercentage,
    currentStreak,
    currentStreakWithGrace,
    bestStreak,
    averagePerWeek,
  } = useMemo(() => {
    const dayKeys = days.map(dateKeyLocal);
    const completedCount = dayKeys.filter((k) => daySet.has(k)).length;
    const completionPercentage =
      dayKeys.length > 0 ? ((completedCount / dayKeys.length) * 100).toFixed(1) : "0.0";

    // strict streak ending at today
    const getCurrentStreakStrict = () => {
      let streak = 0;
      for (let i = dayKeys.length - 1; i >= 0; i--) {
        if (daySet.has(dayKeys[i])) streak++;
        else break;
      }
      return streak;
    };

    // Grace: reset only if 3+ days missed since last completion
    const getCurrentStreakWithGrace = () => {
      if (dayKeys.length === 0) return 0;
      let lastCompleteIdx = -1;
      for (let i = dayKeys.length - 1; i >= 0; i--) {
        if (daySet.has(dayKeys[i])) {
          lastCompleteIdx = i;
          break;
        }
      }
      if (lastCompleteIdx === -1) return 0;
      const daysSinceLast = dayKeys.length - 1 - lastCompleteIdx;
      if (daysSinceLast > 2) return 0;
      let streak = 0;
      for (let i = lastCompleteIdx; i >= 0; i--) {
        if (daySet.has(dayKeys[i])) streak++;
        else break;
      }
      return streak;
    };

    const getBestStreak = () => {
      let best = 0;
      let run = 0;
      for (let i = 0; i < dayKeys.length; i++) {
        if (daySet.has(dayKeys[i])) {
          run++;
          best = Math.max(best, run);
        } else {
          run = 0;
        }
      }
      return best;
    };

    const getAveragePerWeek = () => {
      if (dayKeys.length === 0) return "0.0";
      const oldest = days[0];
      const newest = days[days.length - 1];
      const diffWeeks = Math.max(
        1,
        Math.ceil((+newest - +oldest + 1) / (1000 * 60 * 60 * 24 * 7))
      );
      return (completedCount / diffWeeks).toFixed(1);
    };

    return {
      completedCount,
      completionPercentage,
      currentStreak: getCurrentStreakStrict(),
      currentStreakWithGrace: getCurrentStreakWithGrace(),
      bestStreak: getBestStreak(),
      averagePerWeek: getAveragePerWeek(),
    };
  }, [days, daySet]);

  const toggleExpanded = () => setIsExpanded((v) => !v);

  // Auto-scroll to current month if current year
  useEffect(() => {
    if (scrollRef.current && year === today.getFullYear()) {
      const currentMonth = today.getMonth();
      const monthWidth = scrollRef.current.scrollWidth / 12;
      scrollRef.current.scrollLeft = monthWidth * currentMonth;
    }
  }, [year, today]);

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 transition-all">
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle
            className="text-lg md:text-xl font-semibold text-gray-100 flex items-center gap-2 cursor-pointer"
            onClick={toggleExpanded}
          >
            {habit.emoji && (
              <span className="text-xl" role="img" aria-label={`Emoji: ${habit.emoji}`}>
                {habit.emoji}
              </span>
            )}
            <div
              className="w-2 h-2 md:w-3 md:h-3 rounded-full shadow"
              style={{ backgroundColor: habit.color || "#10B981" }}
            />
            <span>{habit.name}</span>
          </CardTitle>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
            <span>
              Streak: <strong className="text-gray-200">{currentStreakWithGrace}</strong> days
              <span className="ml-1 text-xs text-gray-500">(2-day grace)</span>
            </span>
            <span>
              Completion: <strong className="text-gray-200">{completionPercentage}%</strong>
            </span>
            {habit.maxCheckOffs && (
              <span>
                Daily Goal: <strong className="text-gray-200">{habit.maxCheckOffs}×</strong>
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {/* IMPORTANT: allow tooltips to overflow vertically */}
      <CardContent
        className="p-2 md:p-6 overflow-x-auto overflow-y-visible transition-all"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
        style={{
          userSelect: "none",
          overscrollBehavior: "none",
          maxHeight: isExpanded ? "1000px" : "160px",
        }}
      >
        <div className="flex flex-col gap-1">
          {/* Sticky month header stays below tooltips now */}
          <div className="sticky top-0 grid grid-cols-12 gap-1 text-xs text-gray-400 mb-1 bg-gray-900/80 backdrop-blur py-1 z-10 border-b border-gray-800">
            {monthNames.map((month) => (
              <div key={month} className="text-center hidden sm:block">
                {month}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-1">
            {Object.entries(daysByMonth).map(([month, monthDays]) => (
              <div key={month} className="flex flex-wrap gap-0.5">
                <div className="text-xs text-gray-400 w-full text-center mb-1 sm:hidden">
                  {monthNames[+month]}
                </div>

                {monthDays.map((day) => {
                  const key = dateKeyLocal(day);
                  const completionsForDate = dayCountsMap.get(key) || 0;
                  const maxCheckOffs = habit.maxCheckOffs || 1;
                  const isToday = dateKeyLocal(today) === key;
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={key}
                      /* Raise above sticky header; tooltip inherits this context */
                      className={`relative z-20 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-[3px] transition-transform duration-150 hover:scale-150 cursor-pointer group
                        ${isToday ? "ring-1 ring-blue-400" : ""} ${isWeekend ? "opacity-80" : ""} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      style={{ backgroundColor: getColorIntensity(day) }}
                      aria-label={`${day.toLocaleDateString()}: ${completionsForDate}/${maxCheckOffs} completed`}
                      role="gridcell"
                      tabIndex={0}
                      title=""
                    >
                      {/* Top-most, non-interactive tooltip to avoid flicker */}
                      <div className="pointer-events-none hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-gray-100 bg-gray-900/95 border border-gray-800 rounded shadow-lg whitespace-nowrap z-50">
                        <div className="font-medium">
                          {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        <div>
                          {completionsForDate}/{maxCheckOffs} completed
                          {isWeekend && " (Weekend)"} {isToday && " (Today)"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {isExpanded && (
        <CardFooter className="px-4 py-3 bg-gray-900/60 border-t border-gray-800 text-gray-300 text-sm flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <strong>Best Streak:</strong> {bestStreak} days
          </div>
          <div>
            <strong>Total Completions:</strong> {completedCount} days
          </div>
          <div>
            <strong>Average:</strong> {averagePerWeek} times/week
          </div>
          <div>
            <strong>Started:</strong> {days[0]?.toLocaleDateString() || "N/A"}
          </div>
          {habit.description && <div className="w-full mt-2 text-gray-400 italic">{habit.description}</div>}
        </CardFooter>
      )}
    </Card>
  );
};
