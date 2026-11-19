"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Download, Flame, Target, Trophy, Layers, Sparkles } from "lucide-react";
import {
  dayKey,
  addDays,
  habitDayCounts,
  tickCountByDay,
  flatten,
  normalizeDay,
} from "@/lib/subgoals";
import { loadHabits } from "@/lib/localHabits";

/* ---------- palette (dark, high-contrast, accessible) ---------- */
const C = {
  habit: "#34d399", // emerald — habit-level ticks
  sub: "#60a5fa", // blue — sub-goal ticks
  purple: "#a78bfa",
  amber: "#fbbf24",
  grid: "rgba(55,53,47,0.08)",
  axis: "#6b7280",
  text: "#37352f",
};
const HEAT = ["#ece9e2", "#064e3b", "#047857", "#10b981", "#6ee7b7"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
];

/* ---------- pure analytics ---------- */
const rangeFromDays = (n) => {
  const end = dayKey();
  return { start: addDays(end, -(n - 1)), end };
};

const buildDays = (start, end) => {
  const out = [];
  for (let d = start, guard = 0; d <= end && guard < 1000; guard++, d = addDays(d, 1)) out.push(d);
  return out;
};

function currentStreak(counts, today) {
  let d = counts[today] ? today : addDays(today, -1);
  let n = 0;
  while (counts[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

function bestStreak(counts, days) {
  let best = 0;
  let run = 0;
  for (const d of days) {
    if (counts[d]) {
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }
  return best;
}

function analyse(habits, days, today) {
  const inRange = new Set(days);
  const perDay = Object.fromEntries(days.map((d) => [d, { date: d, habit: 0, sub: 0 }]));
  const allUnits = {}; // every day, all time: used for streaks + heatmap
  let weekdaySum = Array(7).fill(0);

  const perHabit = habits.map((h) => {
    const hc = habitDayCounts(h);
    const sc = tickCountByDay(h.subgoals || []);
    const merged = {};
    const keys = new Set([...Object.keys(hc), ...Object.keys(sc)]);
    let habitTicks = 0;
    let subTicks = 0;
    const activeInRange = new Set();

    for (const d of keys) {
      const units = (hc[d] || 0) + (sc[d] || 0);
      merged[d] = units;
      allUnits[d] = (allUnits[d] || 0) + units;
      if (inRange.has(d)) {
        habitTicks += hc[d] || 0;
        subTicks += sc[d] || 0;
        activeInRange.add(d);
      }
    }
    for (const d of days) if (perDay[d]) {
      perDay[d].habit += hc[d] || 0;
      perDay[d].sub += sc[d] || 0;
    }

    return {
      id: h._id,
      name: h.name,
      emoji: h.emoji,
      color: h.color || "#10B981",
      category: h.category || "General",
      habitTicks,
      subTicks,
      totalTicks: habitTicks + subTicks,
      activeDays: activeInRange.size,
      // Rate counts only the days the habit was running (created → expiry).
      rate: (() => {
        const from = h.createdAt ? normalizeDay(h.createdAt) : null;
        const eligible = days.filter((d) => (!from || d >= from) && (!h.expiresOn || d <= h.expiresOn));
        return eligible.length ? [...activeInRange].filter((d) => eligible.includes(d)).length / eligible.length : 0;
      })(),
      expiresOn: h.expiresOn || null,
      current: currentStreak(merged, today),
      best: bestStreak(merged, days),
      merged,
      subgoalCount: flatten(h.subgoals || []).length,
    };
  });

  // Global per-day totals
  const series = days.map((d) => {
    const row = perDay[d];
    const dow = new Date(d + "T00:00:00").getDay();
    weekdaySum[dow] += row.habit + row.sub;
    return { ...row, total: row.habit + row.sub, label: d.slice(5) };
  });

  const activeDayCount = series.filter((r) => r.total > 0).length;
  const totalTicks = series.reduce((a, r) => a + r.total, 0);
  const subTotal = series.reduce((a, r) => a + r.sub, 0);
  const peak = series.reduce((m, r) => (r.total > (m?.total || 0) ? r : m), null);

  const weekdayCounts = Array(7).fill(0);
  for (const d of days) weekdayCounts[new Date(d + "T00:00:00").getDay()]++;
  const weekday = WEEKDAYS.map((name, i) => ({
    day: name,
    avg: weekdayCounts[i] ? +(weekdaySum[i] / weekdayCounts[i]).toFixed(2) : 0,
  }));

  // Sub-goal leaderboard (path-labelled) within range
  const subRows = [];
  const dayLookup = new Set(days);
  for (const h of habits) {
    const walk = (nodes, trail) => {
      for (const n of nodes) {
        const inR = n.completedDates.filter((d) => dayLookup.has(d)).length;
        const path = [...trail, n.title];
        if (inR > 0) subRows.push({ label: path.join(" › "), habit: h.name, ticks: inR, color: h.color || C.sub });
        walk(n.children || [], path);
      }
    };
    walk(h.subgoals || [], [h.name]);
  }
  subRows.sort((a, b) => b.ticks - a.ticks);

  return {
    series,
    perHabit,
    weekday,
    subRows: subRows.slice(0, 12),
    allUnits,
    kpi: {
      consistency: days.length ? activeDayCount / days.length : 0,
      activeDayCount,
      totalTicks,
      subShare: totalTicks ? subTotal / totalTicks : 0,
      current: currentStreak(allUnits, today),
      best: bestStreak(allUnits, days),
      peak,
    },
  };
}

function heatmapWeeks(allUnits, today) {
  const start = addDays(today, -363);
  const offset = new Date(start + "T00:00:00").getDay();
  const first = addDays(start, -offset);
  const cells = [];
  for (let i = 0; i < 53 * 7; i++) {
    const d = addDays(first, i);
    if (d > today) break;
    cells.push({ date: d, units: allUnits[d] || 0, inWindow: d >= start });
  }
  const values = cells.filter((c) => c.units > 0).map((c) => c.units).sort((a, b) => a - b);
  const q = (p) => (values.length ? values[Math.min(values.length - 1, Math.floor(p * values.length))] : 1);
  const t = [q(0.25), q(0.5), q(0.75)];
  const level = (u) => (u === 0 ? 0 : u <= t[0] ? 1 : u <= t[1] ? 2 : u <= t[2] ? 3 : 4);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7).map((c) => ({ ...c, level: level(c.units) })));
  return weeks;
}

/* ================================================================ */
export default function AnalyticsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preset, setPreset] = useState(30);
  const [custom, setCustom] = useState(null); // {start,end}
  const [customDraft, setCustomDraft] = useState({ start: "", end: "" });
  const today = dayKey();

  useEffect(() => {
    setHabits(loadHabits());
    setLoading(false);
  }, []);

  const range = custom || rangeFromDays(preset);
  const days = useMemo(() => {
    const d = buildDays(range.start, range.end);
    return d.length > 730 ? d.slice(-730) : d;
  }, [range.start, range.end]);

  const A = useMemo(() => analyse(habits, days, today), [habits, days, today]);
  const weeks = useMemo(() => heatmapWeeks(A.allUnits, today), [A.allUnits, today]);
  const matrixDays = useMemo(() => buildDays(addDays(today, -13), today), [today]);

  const applyCustom = () => {
    if (!customDraft.start || !customDraft.end || customDraft.start > customDraft.end) return;
    setCustom({ ...customDraft });
  };

  const exportCsv = () => {
    const rows = [["date", "habit_ticks", "subgoal_ticks", "total"], ...A.series.map((r) => [r.date, r.habit, r.sub, r.total])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-${range.start}_${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tooltipStyle = {
    background: "#ffffff",
    border: "1px solid #ece9e2",
    borderRadius: 8,
    color: "#37352f",
    fontSize: 12,
  };

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-[#37352f] pb-32">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-6">
        {/* ---------- header + controls ---------- */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-700">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.25em]">Analytics</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">Progress, measured</h1>
            <p className="text-[#777570] text-sm mt-1">
              {range.start} → {range.end} · {days.length} days · habit ticks and sub-goal ticks combined
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[#e5e3df] bg-white p-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setCustom(null);
                    setPreset(p.days);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    !custom && preset === p.days ? "bg-[#e8e6e1] text-[#37352f] font-medium" : "text-[#777570] hover:text-[#37352f]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={customDraft.start}
                onChange={(e) => setCustomDraft((s) => ({ ...s, start: e.target.value }))}
                className="rounded-md bg-white border border-[#e5e3df] px-2 py-1.5 text-[#37352f]"
              />
              <span className="text-[#8a8982]">to</span>
              <input
                type="date"
                value={customDraft.end}
                onChange={(e) => setCustomDraft((s) => ({ ...s, end: e.target.value }))}
                className="rounded-md bg-white border border-[#e5e3df] px-2 py-1.5 text-[#37352f]"
              />
              <button onClick={applyCustom} className="px-2.5 py-1.5 rounded-md bg-[#f1efeb] hover:bg-[#e8e6e1] border border-[#d6d3cd]">
                Apply
              </button>
            </div>
            <button
              onClick={exportCsv}
              disabled={!A.series.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white border border-[#e5e3df] hover:bg-[#f1efeb] disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        </header>

        {loading && <p className="text-[#8a8982] animate-pulse">Crunching numbers…</p>}
        {error && <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-700">{error}</div>}
        {!loading && !error && habits.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#d6d3cd] p-10 text-center text-[#8a8982]">
            No habits yet. Add some on the Union page, then come back here.
          </div>
        )}

        {!loading && !error && habits.length > 0 && (
          <>
            {/* ---------- KPI row ---------- */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiRing
                label="Consistency"
                value={`${Math.round(A.kpi.consistency * 100)}%`}
                sub={`${A.kpi.activeDayCount} of ${days.length} days active`}
                pct={A.kpi.consistency}
                color={C.habit}
              />
              <KpiCard icon={<Target className="h-4 w-4" />} label="Total ticks" value={A.kpi.totalTicks} sub={`${Math.round(A.kpi.subShare * 100)}% from sub-goals`} color={C.sub} />
              <KpiCard icon={<Flame className="h-4 w-4" />} label="Current streak" value={`${A.kpi.current}d`} sub="any habit, any tick" color={C.amber} />
              <KpiCard icon={<Trophy className="h-4 w-4" />} label="Best streak" value={`${A.kpi.best}d`} sub={A.kpi.peak?.total ? `peak ${A.kpi.peak.total} on ${A.kpi.peak.date.slice(5)}` : "in range"} color={C.purple} />
            </section>

            {/* ---------- daily activity ---------- */}
            <Panel title="Daily momentum" hint="Stacked: habit ticks + sub-goal ticks per day">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={A.series} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gHabit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.habit} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={C.habit} stopOpacity={0.15} />
                      </linearGradient>
                      <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.sub} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={C.sub} stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={C.grid} vertical={false} />
                    <XAxis dataKey="label" stroke={C.axis} tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis stroke={C.axis} tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#9ca3af" }} />
                    <Area type="monotone" dataKey="habit" stackId="1" stroke={C.habit} fill="url(#gHabit)" name="Habit ticks" />
                    <Area type="monotone" dataKey="sub" stackId="1" stroke={C.sub} fill="url(#gSub)" name="Sub-goal ticks" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="grid lg:grid-cols-5 gap-6">
              {/* ---------- heatmap ---------- */}
              <Panel className="lg:col-span-3" title="Year in squares" hint="Last 52 weeks · all habits combined">
                <div className="overflow-x-auto">
                  <div className="flex gap-[3px] min-w-max">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((c) => (
                          <div
                            key={c.date}
                            title={`${c.date}: ${c.units} tick${c.units === 1 ? "" : "s"}`}
                            className={`h-3 w-3 rounded-[3px] ${c.inWindow ? "" : "opacity-30"} ${c.date === today ? "outline outline-1 outline-gray-300" : ""}`}
                            style={{ background: HEAT[c.level] }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <Legend />
              </Panel>

              {/* ---------- weekday rhythm ---------- */}
              <Panel className="lg:col-span-2" title="Weekly rhythm" hint="Average ticks per weekday in range">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={A.weekday} outerRadius="72%">
                      <PolarGrid stroke={C.grid} />
                      <PolarAngleAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <Radar dataKey="avg" stroke={C.purple} fill={C.purple} fillOpacity={0.35} name="Avg ticks" />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            {/* ---------- habit rings ---------- */}
            <Panel title="Habit orbits" hint="Share of days active in range · streak and volume alongside">
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {A.perHabit.map((h) => (
                  <div key={h.id} className="rounded-xl border border-[#e5e3df] bg-[#fafaf8] p-4 flex items-center gap-4">
                    <OrbitRing pct={h.rate} color={h.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{h.emoji || "•"}</span>
                        <span className="font-semibold truncate">{h.name}</span>
                      </div>
                      <div className="text-[11px] text-[#8a8982]">{h.category}</div>
                      {h.expiresOn && <span className="ml-2 rounded bg-[#f1efeb] px-1.5 py-0.5 text-[10px] text-[#777570]">ended {h.expiresOn}</span>}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <Mini label="ticks" value={h.totalTicks} />
                        <Mini label="streak" value={`${h.current}d`} />
                        <Mini label="best" value={`${h.best}d`} />
                      </div>
                      <div className="mt-2 flex gap-1.5 text-[10px] text-[#8a8982]">
                        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: C.habit }} />{h.habitTicks} habit</span>
                        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: C.sub }} />{h.subTicks} sub</span>
                        <span className="ml-auto">{h.subgoalCount} sub-goals</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ---------- sub-goal leaderboard ---------- */}
              <Panel title="Sub-goal leaderboard" hint="Where your ticks actually land (top 12)">
                {A.subRows.length === 0 ? (
                  <Empty text="No sub-goal ticks in this range yet. Tick some on the Union board." />
                ) : (
                  <div style={{ height: Math.max(180, A.subRows.length * 30) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={A.subRows} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                        <CartesianGrid stroke={C.grid} horizontal={false} />
                        <XAxis type="number" stroke={C.axis} tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="label" width={180} stroke={C.axis} tick={{ fontSize: 11, fill: "#4a4843" }} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="ticks" radius={[0, 6, 6, 0]} name="Ticks">
                          {A.subRows.map((r, i) => (
                            <Cell key={i} fill={r.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              {/* ---------- habit × day matrix ---------- */}
              <Panel title="Last 14 days" hint="Each row is a habit; brighter = more ticks">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#8a8982]">
                        <th className="text-left font-normal pb-2 pr-3">Habit</th>
                        {matrixDays.map((d) => (
                          <th key={d} className="font-normal pb-2 px-0.5">{d.slice(8)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {A.perHabit.map((h) => (
                        <tr key={h.id}>
                          <td className="pr-3 py-1 text-[#4a4843] whitespace-nowrap max-w-[120px] truncate">{h.name}</td>
                          {matrixDays.map((d) => {
                            const u = h.merged[d] || 0;
                            return (
                              <td key={d} className="px-0.5 py-1">
                                <div
                                  title={`${h.name} · ${d}: ${u}`}
                                  className="h-5 w-5 rounded-[4px] mx-auto"
                                  style={{
                                    background: u ? h.color : "#ece9e2",
                                    opacity: u ? Math.min(0.45 + u * 0.2, 1) : 1,
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* ---------- insight strip ---------- */}
            <Panel title="Readout" hint="Auto-generated from your data">
              <ul className="grid md:grid-cols-2 gap-3 text-sm text-[#4a4843]">
                <Insight icon={<Layers className="h-4 w-4 text-teal-700" />}>
                  {A.kpi.subShare > 0.5
                    ? `Most of your work is in sub-goals (${Math.round(A.kpi.subShare * 100)}%). Your granular system is carrying the load.`
                    : A.kpi.totalTicks
                    ? `Habit-level ticks dominate (${Math.round((1 - A.kpi.subShare) * 100)}%). Breaking habits into sub-goals could add detail.`
                    : "No ticks yet in this range."}
                </Insight>
                <Insight icon={<Flame className="h-4 w-4 text-amber-700" />}>
                  {A.kpi.current > 0
                    ? `Live streak: ${A.kpi.current} day${A.kpi.current === 1 ? "" : "s"}. Protect it.`
                    : "No live streak. One tick today restarts the count."}
                </Insight>
                <Insight icon={<Sparkles className="h-4 w-4 text-violet-600" />}>
                  {(() => {
                    const best = [...A.weekday].sort((a, b) => b.avg - a.avg)[0];
                    return best && best.avg > 0
                      ? `${best.day} is your strongest day (avg ${best.avg} ticks). Schedule the hardest sub-goals there.`
                      : "Weekday pattern appears once you have a few weeks of data.";
                  })()}
                </Insight>
                <Insight icon={<Target className="h-4 w-4 text-emerald-700" />}>
                  {A.perHabit.length
                    ? `Most consistent: ${[...A.perHabit].sort((a, b) => b.rate - a.rate)[0].name} (${Math.round([...A.perHabit].sort((a, b) => b.rate - a.rate)[0].rate * 100)}% of days).`
                    : "Add habits to see rankings."}
                </Insight>
              </ul>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- small presentational pieces ---------- */
function Panel({ title, hint, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-[#e5e3df] bg-gradient-to-b from-white to-[#fafaf8] p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-[#37352f]">{title}</h2>
        {hint && <p className="text-xs text-[#8a8982] mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-[#e5e3df] bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-[#8a8982] uppercase tracking-wider">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-semibold mt-2 tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[#8a8982] mt-1">{sub}</div>
    </div>
  );
}

function KpiRing({ label, value, sub, pct, color }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="rounded-2xl border border-[#e5e3df] bg-white p-4 flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(55,53,47,0.08)" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - c * pct}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[#8a8982] uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-semibold tabular-nums" style={{ color }}>{value}</div>
        <div className="text-[11px] text-[#8a8982] truncate">{sub}</div>
      </div>
    </div>
  );
}

function OrbitRing({ pct, color }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(55,53,47,0.08)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - c * pct}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-md bg-white border border-[#e5e3df] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-[#8a8982]">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex items-center gap-2 text-[10px] text-[#8a8982]">
      <span>Less</span>
      {HEAT.map((c) => (
        <span key={c} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
      ))}
      <span>More</span>
    </div>
  );
}

function Insight({ icon, children }) {
  return (
    <li className="flex gap-3 rounded-xl border border-[#e5e3df] bg-white p-3">
      <span className="mt-0.5">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-[#8a8982] py-8 text-center">{text}</p>;
}
