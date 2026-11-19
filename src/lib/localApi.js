// Serves the old /api/habits contract from the browser's localStorage.
// Pages keep calling fetch("/api/habits") unchanged; no server or login involved.
import { loadHabits, saveHabits } from "./localHabits";

const DEFAULT_DAYS = [true, true, true, true, true, true, true];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const newId = () => `h_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function parse(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) || {};
    } catch {
      return {};
    }
  }
  return {};
}

function handleHabits(url, init = {}) {
  const u = new URL(url, window.location.origin);
  const method = (init.method || "GET").toUpperCase();
  const list = loadHabits();

  if (method === "GET") return json(list);

  if (method === "POST") {
    const body = parse(init.body);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return json({ error: "Name is required" }, 400);
    const doc = {
      _id: newId(),
      name,
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : "General",
      emoji: typeof body.emoji === "string" ? body.emoji : "",
      maxCheckOffs: typeof body.maxCheckOffs === "number" && body.maxCheckOffs > 0 ? Math.floor(body.maxCheckOffs) : 1,
      completedDates: Array.isArray(body.completedDates) ? body.completedDates.map(String) : [],
      timeSpentByDate: body.timeSpentByDate && typeof body.timeSpentByDate === "object" ? body.timeSpentByDate : {},
      xpPerCompletion: typeof body.xpPerCompletion === "number" && body.xpPerCompletion > 0 ? Math.floor(body.xpPerCompletion) : 50,
      color: typeof body.color === "string" && body.color.trim() ? body.color.trim() : "#10B981",
      daysOfWeek: Array.isArray(body.daysOfWeek) && body.daysOfWeek.length === 7 ? body.daysOfWeek.map(Boolean) : DEFAULT_DAYS,
      subgoals: Array.isArray(body.subgoals) ? body.subgoals : [],
      createdAt: new Date().toISOString(),
    };
    saveHabits([...list, doc]);
    return json({ success: true, _id: doc._id });
  }

  if (method === "PUT") {
    const { id, ...rest } = parse(init.body);
    if (!list.some((h) => h._id === id)) return json({ error: "Not found" }, 404);
    const patch = {};
    for (const [k, v] of Object.entries(rest)) {
      if (k === "_id" || v === undefined) continue;
      patch[k] = v;
    }
    patch.updatedAt = new Date().toISOString();
    saveHabits(list.map((h) => (h._id === id ? { ...h, ...patch } : h)));
    return json({ success: true, modifiedCount: 1 });
  }

  if (method === "DELETE") {
    const id = u.searchParams.get("id");
    const next = list.filter((h) => h._id !== id);
    saveHabits(next);
    return json({ success: true, deletedCount: list.length - next.length });
  }

  return json({ error: "Method not allowed" }, 405);
}

// Install once, before any page effect runs.
if (typeof window !== "undefined" && !window.__localApiInstalled) {
  window.__localApiInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    try {
      if (url.startsWith("/api/habits")) return Promise.resolve(handleHabits(url, init));
    } catch (e) {
      return Promise.resolve(json({ error: e.message }, 500));
    }
    return originalFetch(input, init);
  };
}
