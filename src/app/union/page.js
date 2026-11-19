"use client";
import { useEffect, useMemo, useState } from "react";
import { StickyNote, Plus, X, Check, ChevronDown, ChevronRight, ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { loadHabits, saveHabits, makeHabit } from "@/lib/localHabits";
import HabitImportExport from "@/components/HabitImportExport";
import {
  dayKey,
  addDays,
  normalizeDay,
  toggleTick,
  addChild,
  renameNode,
  removeNode,
  flatten,
  countNodes,
  ticksOn,
} from "@/lib/subgoals";

const WEEK_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const TILTS = ["-rotate-[0.8deg]", "rotate-[0.6deg]", "-rotate-[0.4deg]", "rotate-[1deg]"];

// Last n days ending `weekOffset` weeks before today (0 = this week).
const lastNDays = (n, weekOffset = 0) => {
  const end = addDays(dayKey(), weekOffset * 7);
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
};

const PALETTE = ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"];

export default function UnionPage() {
  const [habits, setHabits] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saved | error
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [newEmoji, setNewEmoji] = useState("");

  const today = dayKey();
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => lastNDays(7, weekOffset), [weekOffset]);

  useEffect(() => {
    setHabits(loadHabits());
    setLoaded(true);
  }, []);

  // Single write path: update state and persist to this browser.
  const persist = (next) => {
    setHabits(next);
    setSaveState(saveHabits(next) ? "saved" : "error");
  };

  const commit = (id, patch) => {
    persist(habits.map((h) => (h._id === id ? { ...h, ...patch } : h)));
  };

  const addHabit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    persist([...habits, makeHabit({ name: newName, color: newColor, emoji: newEmoji.trim().slice(0, 4) })]);
    setNewName("");
    setNewEmoji("");
  };

  const deleteHabit = (id) => {
    if (window.confirm("Delete this habit and all its sub-goals?")) {
      persist(habits.filter((h) => h._id !== id));
    }
  };

  const toggleHabitToday = (habit) => {
    const existing = habit.completedDates || [];
    const isDone = existing.some((d) => normalizeDay(d) === today);
    const next = isDone
      ? existing.filter((d) => normalizeDay(d) !== today)
      : [...existing, today];
    commit(habit._id, { completedDates: next });
  };

  const totalSub = habits.reduce((a, h) => a + countNodes(h.subgoals), 0);
  const ticksToday = habits.reduce(
    (a, h) => a + ticksOn(h.subgoals, today) + ((h.completedDates || []).some((d) => normalizeDay(d) === today) ? 1 : 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-[#37352f] pb-32">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-teal-700">
              <StickyNote className="h-6 w-6" />
              <span className="text-xs uppercase tracking-[0.25em]">Union board</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">Your habits, unpacked</h1>
            <p className="text-[#777570] text-sm mt-1 max-w-xl">
              Each habit is a note. Sub-goals live inside it, and sub-sub-goals live inside those.
              Every tick counts toward Analytics.
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <Stat label="Ticks today" value={ticksToday} />
            <Stat label="Sub-goals" value={totalSub} />
            <SaveBadge state={saveState} />
          </div>
        </header>

        <div className="mb-4"><HabitImportExport onChange={setHabits} /></div>
        <form onSubmit={addHabit} className="mb-8 rounded-2xl border border-[#e5e3df] bg-white p-4 flex flex-wrap items-center gap-3">
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="🙂"
            aria-label="Emoji"
            className="w-14 rounded-md border border-[#d6d3cd] px-2 py-2 text-center"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New habit name…"
            maxLength={80}
            className="flex-1 min-w-[180px] rounded-md border border-[#d6d3cd] px-3 py-2 text-sm"
          />
          <div className="flex gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                aria-label={`Colour ${c}`}
                className={`h-6 w-6 rounded-full border-2 ${newColor === c ? "border-[#37352f]" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-[#0d9488] px-3 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Add habit
          </button>
        </form>

        {!loaded && <p className="text-[#8a8982] animate-pulse">Pinning notes…</p>}
        {loaded && habits.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#d6d3cd] p-10 text-center text-[#8a8982]">
            No habits yet. Add one above, then pin sub-goals to it.
          </div>
        )}

        {/* Board */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 items-start">
          {habits.map((habit, i) => (
            <HabitNote
              key={habit._id}
              habit={habit}
              tilt={TILTS[i % TILTS.length]}
              today={today}
              week={week}
              weekOffset={weekOffset}
              onWeekChange={(d) => setWeekOffset((o) => Math.min(0, o + d))}
              onSubgoals={(next) => commit(habit._id, { subgoals: next })}
              onDelete={() => deleteHabit(habit._id)}
              onToggleHabit={() => toggleHabitToday(habit)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e5e3df] bg-white px-4 py-2 min-w-[96px]">
      <div className="text-[10px] uppercase tracking-wider text-[#8a8982]">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SaveBadge({ state }) {
  const map = {
    idle: ["text-[#8a8982]", "Ready"],
    saving: ["text-amber-700", "Saving…"],
    saved: ["text-emerald-700", "Saved"],
    error: ["text-red-600", "Not saved"],
  };
  const [cls, label] = map[state];
  return (
    <div className="rounded-lg border border-[#e5e3df] bg-white px-4 py-2 min-w-[96px]">
      <div className="text-[10px] uppercase tracking-wider text-[#8a8982]">Sync</div>
      <div className={`text-sm font-medium ${cls}`}>{label}</div>
    </div>
  );
}

/* ----------------------------------------------------------------
   A habit rendered as a big sticky note
   ---------------------------------------------------------------- */
function HabitNote({ habit, tilt, today, week, weekOffset, onWeekChange, onSubgoals, onToggleHabit, onDelete }) {
  const [draft, setDraft] = useState("");
  const accent = habit.color || "#10B981";
  const rows = flatten(habit.subgoals);
  const doneToday = ticksOn(habit.subgoals, today);
  const habitDone = (habit.completedDates || []).some((d) => normalizeDay(d) === today);
  const total = rows.length;
  const pct = total ? Math.round((doneToday / total) * 100) : habitDone ? 100 : 0;

  const addRoot = (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onSubgoals(addChild(habit.subgoals, null, title));
    setDraft("");
  };

  return (
    <article
      className={`${tilt} relative rounded-sm p-5 pt-7 shadow-[0_18px_40px_-18px_rgba(55,53,47,0.35)] transition-transform hover:rotate-0 hover:-translate-y-1`}
      style={{
        background: `linear-gradient(160deg, ${accent}33 0%, #ece9e2 55%, #111827 100%)`,
        borderTop: `3px solid ${accent}`,
      }}
    >
      {/* pin */}
      <span
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full shadow-md"
        style={{ background: accent, boxShadow: `0 0 0 3px rgba(0,0,0,0.35)` }}
        aria-hidden
      />

      {/* header */}
      <header className="flex items-start gap-3">
        <div className="text-2xl leading-none">{habit.emoji || "📝"}</div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-lg leading-tight truncate">{habit.name}</h2>
          <p className="text-[11px] text-[#777570]">{habit.category || "General"}</p>
        </div>
        <Ring pct={pct} color={accent} label={`${doneToday}/${total}`} />
        <button onClick={onDelete} className="p-1 text-[#9b9a97] hover:text-red-600" aria-label="Delete habit" title="Delete habit">
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      {/* habit-level tick */}
      <button
        onClick={onToggleHabit}
        className={`mt-4 w-full flex items-center justify-between rounded-md px-3 py-2 text-sm border transition ${
          habitDone
            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-800"
            : "border-[#d6d3cd] bg-white text-[#4a4843] hover:border-[#9b9a97]"
        }`}
      >
        <span>{habitDone ? "Done today" : "Mark habit done today"}</span>
        <span
          className={`grid place-items-center h-5 w-5 rounded border ${
            habitDone ? "bg-emerald-500 border-emerald-400" : "border-[#9b9a97]"
          }`}
        >
          {habitDone && <Check className="h-3.5 w-3.5 text-white" />}
        </span>
      </button>

      {/* weekday header */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between gap-1 text-[10px] text-[#8a8982]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onWeekChange(-1)}
              className="p-0.5 rounded hover:bg-[#f1efeb] text-[#4a4843]"
              aria-label="Previous week"
              title="Previous week"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="tabular-nums min-w-[78px] text-center">
              {week[0].slice(5)} → {week[6].slice(5)}
            </span>
            <button
              onClick={() => onWeekChange(1)}
              disabled={weekOffset === 0}
              className="p-0.5 rounded hover:bg-[#f1efeb] text-[#4a4843] disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Next week"
              title="Next week"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => onWeekChange(-weekOffset)}
                className="ml-1 px-1.5 rounded border border-[#d6d3cd] hover:bg-[#f1efeb]"
              >
                This week
              </button>
            )}
          </div>
          <div className="flex gap-1 pr-1">
            {week.map((d) => (
              <span key={d} className={`w-5 text-center ${d === today ? "text-[#37352f] font-semibold" : ""}`}>
                {WEEK_LETTERS[new Date(d + "T00:00:00").getDay()]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* sub-goal tree */}
      <ul className="mt-1 space-y-2">
        {habit.subgoals.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            depth={1}
            today={today}
            week={week}
            accent={accent}
            tree={habit.subgoals}
            onSubgoals={onSubgoals}
          />
        ))}
      </ul>

      {/* add root sub-goal */}
      <form onSubmit={addRoot} className="mt-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a sub-goal…"
          maxLength={200}
          className="flex-1 min-w-0 rounded-md bg-[#fafaf8] border border-[#d6d3cd] px-3 py-2 text-sm placeholder:text-[#9b9a97] focus:outline-none focus:ring-2 focus:ring-teal-600/40"
        />
        <button
          type="submit"
          className="grid place-items-center h-9 w-9 rounded-md bg-[#f1efeb] hover:bg-[#e8e6e1] border border-[#d6d3cd]"
          aria-label="Add sub-goal"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </article>
  );
}

/* ----------------------------------------------------------------
   A sub-goal (recursive) rendered as a smaller note inside
   ---------------------------------------------------------------- */
function NodeCard({ node, depth, today, week, accent, tree, onSubgoals }) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [childDraft, setChildDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const doneToday = node.completedDates.includes(today);
  const subtreeTotal = countNodes(node.children);
  const subtreeDone = ticksOn(node.children, today);
  const hasKids = node.children.length > 0;

  const indent = Math.min(depth - 1, 3) * 10; // px, capped so deep trees stay readable
  const shade = ["bg-white/80", "bg-white/80", "bg-white/80", "bg-white/80"][Math.min(depth - 1, 3)];

  const saveTitle = () => {
    setEditing(false);
    const t = title.trim();
    if (t && t !== node.title) onSubgoals(renameNode(tree, node.id, t));
    else setTitle(node.title);
  };

  const addSub = (e) => {
    e.preventDefault();
    const t = childDraft.trim();
    if (!t) return;
    onSubgoals(addChild(tree, node.id, t));
    setChildDraft("");
    setAdding(false);
    setOpen(true);
  };

  return (
    <li style={{ marginLeft: indent }} className="list-none">
      <div
        className={`${shade} rounded-md border border-[#e5e3df] px-3 py-2.5 shadow-sm`}
        style={{ borderLeft: `3px solid ${accent}${depth === 1 ? "" : "88"}` }}
      >
        <div className="flex items-start gap-2">
          {hasKids ? (
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-0.5 text-[#777570] hover:text-[#37352f]"
              aria-label={open ? "Collapse" : "Expand"}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* today tick */}
          <button
            onClick={() => onSubgoals(toggleTick(tree, node.id, today))}
            className={`mt-0.5 grid place-items-center h-5 w-5 shrink-0 rounded-md border transition ${
              doneToday ? "border-transparent" : "border-[#9b9a97] hover:border-[#777570]"
            }`}
            style={doneToday ? { background: accent } : undefined}
            aria-pressed={doneToday}
            aria-label={`Tick ${node.title} for today`}
          >
            {doneToday && <Check className="h-3.5 w-3.5 text-white" />}
          </button>

          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") {
                    setTitle(node.title);
                    setEditing(false);
                  }
                }}
                maxLength={200}
                className="w-full bg-transparent border-b border-[#9b9a97] text-sm focus:outline-none"
              />
            ) : (
              <button
                onDoubleClick={() => setEditing(true)}
                className={`text-left text-sm break-words ${doneToday ? "line-through text-[#777570]" : "text-[#37352f]"}`}
              >
                {node.title}
              </button>
            )}
            {hasKids && (
              <div className="text-[10px] text-[#8a8982] mt-0.5 tabular-nums">
                {subtreeDone}/{subtreeTotal} sub-items today
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-[#8a8982] hover:text-[#37352f]"
              aria-label="Rename"
              title="Rename (or double-click the title)"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {depth < 6 && (
              <button
                onClick={() => setAdding((a) => !a)}
                className="p-1 text-[#8a8982] hover:text-[#37352f]"
                aria-label="Add sub-sub-goal"
                title="Add nested sub-goal"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(`Delete "${node.title}" and everything inside it?`))
                  onSubgoals(removeNode(tree, node.id));
              }}
              className="p-1 text-[#9b9a97] hover:text-red-600"
              aria-label="Delete sub-goal"
              title="Delete sub-goal"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 7-day strip: tap any day to tick it */}
        <div className="mt-2 ml-7 flex items-center gap-1">
          {week.map((d) => {
            const on = node.completedDates.includes(d);
            return (
              <button
                key={d}
                onClick={() => onSubgoals(toggleTick(tree, node.id, d))}
                title={d}
                aria-label={`${node.title} on ${d}`}
                className={`h-4 w-4 rounded-[4px] border transition ${
                  on ? "border-transparent" : "border-[#bdbab3] hover:border-[#777570]"
                } ${d === today ? "ring-1 ring-gray-300/60 ring-offset-1 ring-offset-gray-900" : ""}`}
                style={on ? { background: accent } : undefined}
              />
            );
          })}
          <span className="ml-2 text-[10px] text-[#8a8982] tabular-nums">
            {node.completedDates.length} total
          </span>
        </div>

        {adding && (
          <form onSubmit={addSub} className="mt-2 ml-7 flex gap-2">
            <input
              autoFocus
              value={childDraft}
              onChange={(e) => setChildDraft(e.target.value)}
              placeholder="Nested sub-goal…"
              maxLength={200}
              className="flex-1 min-w-0 rounded bg-[#fafaf8] border border-[#d6d3cd] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600/40"
            />
            <button type="submit" className="text-xs px-2 rounded bg-[#f1efeb] border border-[#d6d3cd] hover:bg-[#e8e6e1]">
              Add
            </button>
          </form>
        )}
      </div>

      {hasKids && open && (
        <ul className="mt-2 space-y-2">
          {node.children.map((child) => (
            <NodeCard
              key={child.id}
              node={child}
              depth={depth + 1}
              today={today}
              week={week}
              accent={accent}
              tree={tree}
              onSubgoals={onSubgoals}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* Small progress ring for the note header */
function Ring({ pct, color, label }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-12 w-12 shrink-0" title={`${pct}% today`}>
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(55,53,47,0.08)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold tabular-nums">
        {label}
      </span>
    </div>
  );
}
