// Browser-only habit store (localStorage). No login, no server.
const KEY = "habits-local-v1";

export function loadHabits() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.map((h) => ({
          ...h,
          completedDates: Array.isArray(h.completedDates) ? h.completedDates : [],
          subgoals: Array.isArray(h.subgoals) ? h.subgoals : [],
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveHabits(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const makeHabit = ({ name, color = "#10B981", emoji = "", category = "General" }) => ({
  _id: `h_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  name: name.trim().slice(0, 80),
  category,
  emoji,
  color,
  completedDates: [],
  subgoals: [],
});

const uniqDates = (arr) => [...new Set((arr || []).map((d) => String(d).slice(0, 10)))].sort();

/**
 * Merge habits from an export/import file into the local list.
 * - Same _id as an existing habit: keep local fields, union the tick dates.
 * - New habit: added (its _id is reassigned if it would clash).
 * Accepts a bare array or { habits: [...] }. Drops server-only fields.
 */
export function mergeImported(existing, incomingRaw) {
  const incoming = Array.isArray(incomingRaw)
    ? incomingRaw
    : Array.isArray(incomingRaw?.habits)
    ? incomingRaw.habits
    : null;
  if (!incoming) throw new Error("File must contain a list of habits.");

  let next = [...existing];
  let added = 0;
  let merged = 0;
  let skipped = 0;

  for (const raw of incoming) {
    if (!raw || typeof raw.name !== "string" || !raw.name.trim()) {
      skipped++;
      continue;
    }
    const sourceId = raw._id ? String(raw._id) : null;
    const idx = sourceId ? next.findIndex((h) => h._id === sourceId) : -1;

    if (idx >= 0) {
      const local = next[idx];
      next[idx] = {
        ...local,
        completedDates: uniqDates([...(local.completedDates || []), ...(raw.completedDates || [])]),
      };
      merged++;
      continue;
    }

    const clash = next.some((h) => h._id === sourceId);
    const habit = {
      _id: sourceId && !clash ? sourceId : `h_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: raw.name.trim().slice(0, 80),
      category: typeof raw.category === "string" && raw.category.trim() ? raw.category.trim() : "General",
      emoji: typeof raw.emoji === "string" ? raw.emoji : "",
      color: typeof raw.color === "string" && raw.color.trim() ? raw.color.trim() : "#10B981",
      maxCheckOffs: typeof raw.maxCheckOffs === "number" && raw.maxCheckOffs > 0 ? Math.floor(raw.maxCheckOffs) : 1,
      xpPerCompletion: typeof raw.xpPerCompletion === "number" && raw.xpPerCompletion > 0 ? Math.floor(raw.xpPerCompletion) : 50,
      daysOfWeek: Array.isArray(raw.daysOfWeek) && raw.daysOfWeek.length === 7 ? raw.daysOfWeek.map(Boolean) : [true, true, true, true, true, true, true],
      completedDates: uniqDates(raw.completedDates),
      subgoals: Array.isArray(raw.subgoals) ? raw.subgoals : [],
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    next.push(habit);
    added++;
  }

  return { next, added, merged, skipped };
}

/** Full local data as a downloadable JSON string (backup / move to another browser). */
export function exportHabitsJson(list) {
  return JSON.stringify({ exportedAt: new Date().toISOString(), habits: list }, null, 2);
}
