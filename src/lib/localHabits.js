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
