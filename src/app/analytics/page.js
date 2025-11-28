"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Download, Upload, BarChart3, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const [habits, setHabits] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [chartData, setChartData] = useState([]);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [habitStats, setHabitStats] = useState([]);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    processChartData();
    calculateHabitStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, selectedTimeframe, customStartDate, customEndDate, isCustomRange]);

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits");
      const data = await response.json();
      setHabits(data);

      // Set default custom dates when habits are loaded
      if (data.length > 0 && !customStartDate) {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);

        setCustomStartDate(oneMonthAgo.toISOString().split("T")[0]);
        setCustomEndDate(today.toISOString().split("T")[0]);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const buildDateRange = () => {
    const dateRange = [];

    if (isCustomRange && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        alert("Date range is too large. Please select a range of 365 days or less.");
        return [];
      }

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateRange.push(d.toISOString().split("T")[0]);
      }
    } else {
      const days = {
        week: 7,
        month: 30,
        year: 365,
      }[selectedTimeframe];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateRange.push(date.toISOString().split("T")[0]);
      }
    }

    return dateRange;
  };

  const calculateHabitStats = () => {
    if (!habits.length) return;

    const dateRange = buildDateRange();
    if (!dateRange.length) return;

    const stats = habits.map((habit) => {
      // completions in range (count of days with ticks — matches how you stored them)
      const completions =
        habit.completedDates?.filter((date) => dateRange.includes(date)).length || 0;

      const maxCheck = habit.maxCheckOffs || 1;
      const totalPossibleCompletions = dateRange.length * maxCheck;
      const completionRate =
        totalPossibleCompletions > 0
          ? (completions / totalPossibleCompletions) * 100
          : 0;

      // longest streak in range
      let currentStreak = 0;
      let longestStreak = 0;
      let lastDate = null;

      const sortedDates = [...(habit.completedDates || [])]
        .filter((date) => dateRange.includes(date))
        .sort();

      sortedDates.forEach((date) => {
        if (!lastDate) {
          currentStreak = 1;
        } else {
          const lastDateObj = new Date(lastDate);
          const currentDateObj = new Date(date);
          lastDateObj.setDate(lastDateObj.getDate() + 1);

          if (lastDateObj.toISOString().split("T")[0] === date) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

        lastDate = date;
      });

      const xpPer =
        typeof habit.xpPerCompletion === "number" && habit.xpPerCompletion > 0
          ? habit.xpPerCompletion
          : 50;
      const xpEarned = completions * xpPer;

      return {
        id: habit._id || habit.id,
        name: habit.name,
        category: habit.category,
        completions,
        completionRate: completionRate.toFixed(1),
        longestStreak,
        xpEarned,
        xpPer,
      };
    });

    setHabitStats(stats);
  };

  const processChartData = () => {
    const dateRange = buildDateRange();
    if (!dateRange.length) return;

    const data = dateRange.map((dateStr) => {
      const completions = habits.reduce((acc, habit) => {
        const dayCompletions =
          habit.completedDates?.filter((d) => d === dateStr).length || 0;
        return acc + dayCompletions;
      }, 0);

      return {
        date: dateStr,
        completions,
      };
    });

    setChartData(data);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(habits, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "habits-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        await fetch("/api/habits/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(importedData),
        });
        fetchHabits();
      } catch (error) {
        console.error("Error importing data:", error);
      }
    };
    reader.readAsText(file);
  };

  const toggleCustomRange = () => {
    setIsCustomRange(!isCustomRange);
  };

  // ------ Extra motivating stats ------
  const totalCompletions = chartData.reduce(
    (sum, day) => sum + day.completions,
    0
  );
  const avgDailyCompletions =
    chartData.length > 0 ? (totalCompletions / chartData.length).toFixed(1) : "0";

  const totalXp = habitStats.reduce((sum, h) => sum + h.xpEarned, 0);

  const bestHabitByRate =
    habitStats.length > 0
      ? [...habitStats].sort(
          (a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate)
        )[0]
      : null;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCompletions = habits.reduce((acc, habit) => {
    const dayCompletions =
      habit.completedDates?.filter((d) => d === todayStr).length || 0;
    return acc + dayCompletions;
  }, 0);
  const todayXp = habits.reduce((acc, habit) => {
    const xpPer =
      typeof habit.xpPerCompletion === "number" && habit.xpPerCompletion > 0
        ? habit.xpPerCompletion
        : 50;
    const dayCompletions =
      habit.completedDates?.filter((d) => d === todayStr).length || 0;
    return acc + dayCompletions * xpPer;
  }, 0);
  const todayActiveHabits = habits.filter(
    (habit) =>
      (habit.completedDates || []).filter((d) => d === todayStr).length > 0
  ).length;

  const dailyChipIntensity = (completions) => {
    if (completions === 0) return "bg-gray-800 border-gray-700 text-gray-400";
    if (completions === 1)
      return "bg-emerald-900/60 border-emerald-600/70 text-emerald-200";
    if (completions <= 3)
      return "bg-emerald-800/80 border-emerald-500/80 text-emerald-100";
    return "bg-emerald-700 border-emerald-400 text-emerald-50";
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Analytics</h1>
            <p className="text-sm text-gray-400">
              See the story of your habits across days, not just numbers.
            </p>
          </div>
        </div>

        {/* Export / timeframe / custom dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-white">
                  Data Export / Import
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={exportData}
                    className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-5 w-5 text-white" />
                  </button>
                  <label className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      onChange={importData}
                      accept=".json"
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Timeframe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["week", "month", "year"].map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => {
                      setSelectedTimeframe(timeframe);
                      setIsCustomRange(false);
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedTimeframe === timeframe && !isCustomRange
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </button>
                ))}
                <button
                  onClick={toggleCustomRange}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                    isCustomRange
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Custom
                </button>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gray-800 border-gray-700 ${
              !isCustomRange ? "opacity-60" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Custom Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    disabled={!isCustomRange}
                    className="px-3 py-2 bg-gray-700 rounded-lg text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    disabled={!isCustomRange}
                    className="px-3 py-2 bg-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary / motivation strip */}
        <div className="mb-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Summary for{" "}
                {isCustomRange && customStartDate && customEndDate
                  ? `${customStartDate} → ${customEndDate}`
                  : selectedTimeframe}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-700/80 p-4 rounded-lg border border-gray-600/80">
                  <p className="text-gray-400 text-sm">Total Completions</p>
                  <p className="text-2xl font-bold text-white">
                    {totalCompletions}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Avg per day:{" "}
                    <span className="font-semibold text-gray-200">
                      {avgDailyCompletions}
                    </span>
                  </p>
                </div>
                <div className="bg-gray-700/80 p-4 rounded-lg border border-gray-600/80">
                  <p className="text-gray-400 text-sm">Total XP Earned</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {totalXp}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Every completion is pushing your bar up.
                  </p>
                </div>
                <div className="bg-gray-700/80 p-4 rounded-lg border border-gray-600/80">
                  <p className="text-gray-400 text-sm">Best Performing Habit</p>
                  <p className="text-lg font-semibold text-white">
                    {bestHabitByRate ? bestHabitByRate.name : "None yet"}
                  </p>
                  {bestHabitByRate && (
                    <p className="text-xs text-gray-400 mt-1">
                      {bestHabitByRate.completionRate}% completion ·{" "}
                      {bestHabitByRate.longestStreak} day streak
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today snapshot */}
        <div className="mb-4">
          <Card className="bg-gradient-to-r from-emerald-700/60 via-emerald-600/50 to-blue-600/50 border border-emerald-400/40">
            <CardHeader>
              <CardTitle className="text-lg text-white flex justify-between items-center">
                <span>Today&apos;s Snapshot</span>
                <span className="text-xs uppercase tracking-wide text-emerald-100">
                  {todayStr}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-emerald-100 text-sm">Completions Today</p>
                  <p className="text-3xl font-bold text-white">
                    {todayCompletions}
                  </p>
                  <p className="text-xs text-emerald-100 mt-1">
                    You touched{" "}
                    <span className="font-semibold">
                      {todayActiveHabits}/{habits.length || 0}
                    </span>{" "}
                    habits today.
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">XP Gained Today</p>
                  <p className="text-3xl font-bold text-white">{todayXp}</p>
                  <p className="text-xs text-emerald-100 mt-1">
                    Even one small action is progress. This is you stacking XP.
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Vibe Check</p>
                  <p className="text-lg font-semibold text-white">
                    {todayCompletions === 0
                      ? "Soft day — restart is always allowed."
                      : todayCompletions < 3
                      ? "Slow burn — tiny wins still count."
                      : "You’re on a roll 🔥"}
                  </p>
                  <p className="text-xs text-emerald-100 mt-1">
                    Tomorrow is just another chance to add one more tick.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row (trend + bar) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Completion Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (chartData.length > 30) {
                          return value.slice(5); // MM-DD
                        }
                        return value;
                      }}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#111827" }} />
                    <Line
                      type="monotone"
                      dataKey="completions"
                      stroke="#3B82F6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Daily Completions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (chartData.length > 30) {
                          return value.slice(5); // MM-DD
                        }
                        return value;
                      }}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#111827" }} />
                    <Bar dataKey="completions" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily breakdown chips – “every single day” POV */}
        <div className="mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Daily Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No data yet. Once you start checking off habits, each day will
                  show up here.
                </p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {chartData.map((day) => (
                    <div
                      key={day.date}
                      className={`min-w-[90px] px-3 py-2 rounded-lg border text-xs flex flex-col items-start ${dailyChipIntensity(
                        day.completions
                      )}`}
                    >
                      <span className="font-semibold">
                        {day.date.slice(5)}{/* MM-DD */}
                      </span>
                      <span className="mt-1">
                        {day.completions}{" "}
                        <span className="text-[10px] opacity-80">
                          {day.completions === 1 ? "check" : "checks"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Habit Performance table + “top habits” vibe */}
        <div className="mt-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">
                  Habit Performance
                </CardTitle>
                <p className="text-xs text-gray-400">
                  Zoomed-in view of each habit in this range.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {habitStats.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No habit data available yet. Once you log some completions,
                  you’ll see per-habit stats here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-gray-200 text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-left">Habit</th>
                        <th className="py-3 px-4 text-left">Category</th>
                        <th className="py-3 px-4 text-center">Completions</th>
                        <th className="py-3 px-4 text-center">
                          Completion Rate
                        </th>
                        <th className="py-3 px-4 text-center">
                          Longest Streak
                        </th>
                        <th className="py-3 px-4 text-center">XP Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {habitStats.map((habit) => (
                        <tr
                          key={habit.id}
                          className="border-b border-gray-800 hover:bg-gray-750/70"
                        >
                          <td className="py-3 px-4">{habit.name}</td>
                          <td className="py-3 px-4">
                            {habit.category || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {habit.completions}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {habit.completionRate}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            {habit.longestStreak} days
                          </td>
                          <td className="py-3 px-4 text-center">
                            {habit.xpEarned}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
