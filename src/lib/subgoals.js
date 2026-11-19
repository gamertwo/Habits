// Sub-goal trees for habits ("Union" board).
// Pure JS so it runs on the server (API sanitising) and in the browser (UI).
//
// Node shape:
//   { id: string, title: string, completedDates: ["YYYY-MM-DD", ...], children: Node[] }
// Every tick is a day key stored on the node it belongs to. Analytics counts every tick.

export const MAX_DEPTH = 6;
export const MAX_NODES = 300;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const addDays = (key, n) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

/** Accepts "YYYY-MM-DD" or ISO strings / Dates and returns a LOCAL day key. */
export const normalizeDay = (value) => {
  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : dayKey(d);
};

export const newId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const makeNode = (title) => ({
  id: newId(),
  title: title.trim().slice(0, 200),
  completedDates: [],
  children: [],
});

/** Server-side guard: strips unknown fields, caps depth/size, validates dates. */
export function sanitizeSubgoals(input) {
  let count = 0;
  const walk = (nodes, depth) => {
    if (!Array.isArray(nodes) || depth > MAX_DEPTH) return [];
    const out = [];
    for (const n of nodes) {
      if (!n || typeof n !== "object") continue;
      if (count >= MAX_NODES) break;
      const title = typeof n.title === "string" ? n.title.trim().slice(0, 200) : "";
      if (!title) continue;
      count++;
      const dates = Array.isArray(n.completedDates)
        ? [...new Set(n.completedDates.filter((d) => typeof d === "string" && DATE_RE.test(d)))].sort()
        : [];
      out.push({
        id: typeof n.id === "string" && n.id ? n.id.slice(0, 64) : newId(),
        title,
        completedDates: dates,
        children: walk(n.children, depth + 1),
      });
    }
    return out;
  };
  return walk(input, 1);
}

/* ---------- immutable tree operations (client) ---------- */

export function toggleTick(nodes, id, day) {
  return nodes.map((n) => {
    if (n.id === id) {
      const has = n.completedDates.includes(day);
      const completedDates = has
        ? n.completedDates.filter((d) => d !== day)
        : [...n.completedDates, day].sort();
      return { ...n, completedDates };
    }
    return { ...n, children: toggleTick(n.children, id, day) };
  });
}

export function addChild(nodes, parentId, title) {
  if (parentId == null) return [...nodes, makeNode(title)];
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, makeNode(title)] }
      : { ...n, children: addChild(n.children, parentId, title) }
  );
}

export function renameNode(nodes, id, title) {
  return nodes.map((n) =>
    n.id === id
      ? { ...n, title: title.trim().slice(0, 200) || n.title }
      : { ...n, children: renameNode(n.children, id, title) }
  );
}

export function removeNode(nodes, id) {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children, id) }));
}

export function depthOf(nodes, id, depth = 1) {
  for (const n of nodes) {
    if (n.id === id) return depth;
    const d = depthOf(n.children, id, depth + 1);
    if (d) return d;
  }
  return 0;
}

/* ---------- read helpers ---------- */

/** Flatten a tree into rows with depth, in display order. */
export function flatten(nodes, depth = 1, out = []) {
  for (const n of nodes) {
    out.push({ node: n, depth });
    flatten(n.children, depth + 1, out);
  }
  return out;
}

export function countNodes(nodes) {
  return flatten(nodes).length;
}

/** All tick days across a tree, keyed by day -> number of ticks that day. */
export function tickCountByDay(nodes, into = {}) {
  for (const n of nodes) {
    for (const d of n.completedDates) into[d] = (into[d] || 0) + 1;
    tickCountByDay(n.children, into);
  }
  return into;
}

export function ticksOn(nodes, day) {
  return flatten(nodes).filter(({ node }) => node.completedDates.includes(day)).length;
}

/** Normalise a habit's completion days (legacy ISO strings allowed). */
export function habitDayCounts(habit) {
  const counts = {};
  for (const raw of habit.completedDates || []) {
    const d = normalizeDay(raw);
    if (d) counts[d] = (counts[d] || 0) + 1;
  }
  return counts;
}
