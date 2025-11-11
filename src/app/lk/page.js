"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------
// Budget Vote TV — a dark, stock-ticker style page
// - LocalStorage persistence (items, upvotes used, cap, week state)
// - Import / Export data (JSON file)
// ---------------------------------------------

const STORAGE_KEYS = {
  ITEMS: "budgetVoteTV:items:v1",
  WEEK_STATE: "budgetVoteTV:weekstate:v1",
  SETTINGS: "budgetVoteTV:settings:v1",
};

function startOfISOWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function isoWeekId(d = new Date()) {
  // Returns a compact string like 2025-W44
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Thursday decides the year
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

export default function Page() {
  const [items, setItems] = useState([]);
  const [cap, setCap] = useState(3); // weekly upvote allowance
  const [weekId, setWeekId] = useState(isoWeekId());
  const [upvotesUsed, setUpvotesUsed] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");

  // Hidden file input for Import
  const fileInputRef = useRef(null);

  // Load persisted state
  useEffect(() => {
    const s = loadJSON(STORAGE_KEYS.SETTINGS, { cap: 3 });
    setCap(Number.isFinite(s.cap) && s.cap > 0 ? s.cap : 3);

    const w = loadJSON(STORAGE_KEYS.WEEK_STATE, {
      weekId: isoWeekId(),
      upvotesUsed: 0,
    });

    const nowWeek = isoWeekId();
    if (w.weekId !== nowWeek) {
      // New week → reset upvotes
      const next = { weekId: nowWeek, upvotesUsed: 0 };
      setWeekId(next.weekId);
      setUpvotesUsed(0);
      saveJSON(STORAGE_KEYS.WEEK_STATE, next);
    } else {
      setWeekId(w.weekId);
      setUpvotesUsed(w.upvotesUsed || 0);
    }

    const defaultItems = [
      {
        id: randomId(),
        name: "Noise-cancelling headphones",
        price: 129.0,
        details: "For deep work at the library.",
        up: 0,
        down: 0,
        createdAt: Date.now(),
      },
      {
        id: randomId(),
        name: "Standing desk mat",
        price: 39.99,
        details: "Comfort + posture.",
        up: 0,
        down: 0,
        createdAt: Date.now(),
      },
    ];

    const stored = loadJSON(STORAGE_KEYS.ITEMS, null);
    setItems(Array.isArray(stored) ? stored : defaultItems);
  }, []);

  // Persist items + settings + week state
  useEffect(() => {
    saveJSON(STORAGE_KEYS.ITEMS, items);
  }, [items]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.SETTINGS, { cap });
  }, [cap]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.WEEK_STATE, { weekId, upvotesUsed });
  }, [weekId, upvotesUsed]);

  const votesLeft = Math.max(0, cap - upvotesUsed);

  // Derived + sorting
  const sorted = useMemo(() => {
    // Sort by "Need Score" (up - down), then by recency
    return [...items].sort((a, b) => {
      const sa = (a.up || 0) - (a.down || 0);
      const sb = (b.up || 0) - (b.down || 0);
      if (sb !== sa) return sb - sa;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [items]);

  // Light stats
  const stats = useMemo(() => {
    const count = items.length;
    const totalPrice = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    const avgPrice = count ? totalPrice / count : 0;
    const totalUp = items.reduce((s, it) => s + (it.up || 0), 0);
    const totalDown = items.reduce((s, it) => s + (it.down || 0), 0);
    const netNeed = totalUp - totalDown;
    const positiveCount = items.filter((it) => (it.up || 0) - (it.down || 0) > 0).length;
    const top =
      items.length === 0
        ? null
        : [...items].sort(
            (a, b) =>
              (b.up || 0) - (b.down || 0) - ((a.up || 0) - (a.down || 0)) ||
              (b.createdAt || 0) - (a.createdAt || 0)
          )[0];
    return {
      count,
      totalPrice,
      avgPrice,
      totalUp,
      totalDown,
      netNeed,
      positiveCount,
      topName: top ? top.name : "—",
      topScore: top ? (top.up || 0) - (top.down || 0) : 0,
    };
  }, [items]);

  function addItem(e) {
    e?.preventDefault();
    const p = parseFloat(String(price).replace(",", "."));
    if (!name.trim() || Number.isNaN(p)) return;
    const next = [
      ...items,
      {
        id: randomId(),
        name: name.trim(),
        price: p,
        details: details.trim(),
        up: 0,
        down: 0,
        createdAt: Date.now(),
      },
    ];
    setItems(next);
    setName("");
    setPrice("");
    setDetails("");
  }

  function removeItem(id) {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  function upvote(id) {
    if (votesLeft <= 0) return; // no upvotes remaining this week
    setItems((xs) =>
      xs.map((x) => (x.id === id ? { ...x, up: (x.up || 0) + 1 } : x))
    );
    setUpvotesUsed((n) => n + 1);
  }

  function downvote(id) {
    setItems((xs) =>
      xs.map((x) => (x.id === id ? { ...x, down: (x.down || 0) + 1 } : x))
    );
  }

  function resetWeek() {
    const nowWeek = isoWeekId();
    setWeekId(nowWeek);
    setUpvotesUsed(0);
  }

  function clearAll() {
    if (!confirm("Clear all items and votes?")) return;
    setItems([]);
    setUpvotesUsed(0);
    saveJSON(STORAGE_KEYS.ITEMS, []);
    saveJSON(STORAGE_KEYS.WEEK_STATE, { weekId: isoWeekId(), upvotesUsed: 0 });
  }

  // ===== Import / Export =====

  function makeBundle() {
    return {
      meta: {
        app: "budget-vote-tv",
        version: 1,
        exportedAt: new Date().toISOString(),
      },
      data: {
        items,
        settings: { cap },
        weekState: { weekId, upvotesUsed },
      },
    };
  }

  function exportData() {
    try {
      const bundle = makeBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-vote-tv-backup-${weekId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export data.");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  function validateBundle(obj) {
    if (!obj || typeof obj !== "object") return false;
    if (!obj.data || typeof obj.data !== "object") return false;
    const d = obj.data;
    if (!Array.isArray(d.items)) return false;
    if (!d.settings || typeof d.settings.cap !== "number") return false;
    if (!d.weekState || typeof d.weekState.weekId !== "string") return false;
    if (typeof d.weekState.upvotesUsed !== "number") return false;
    return true;
  }

  function importFromText(text) {
    try {
      const obj = JSON.parse(text);
      if (!validateBundle(obj)) {
        alert("Invalid backup file format.");
        return;
      }
      const { items: importedItems, settings, weekState } = obj.data;

      // Sanitize items minimally
      const cleaned = importedItems
        .filter((it) => it && typeof it === "object")
        .map((it) => ({
          id: typeof it.id === "string" ? it.id : randomId(),
          name: String(it.name || "").slice(0, 200),
          price: Number(it.price) || 0,
          details: String(it.details || ""),
          up: Number(it.up) || 0,
          down: Number(it.down) || 0,
          createdAt: Number(it.createdAt) || Date.now(),
        }));

      setItems(cleaned);
      setCap(Math.max(1, Number(settings.cap) || 3));
      setWeekId(typeof weekState.weekId === "string" ? weekState.weekId : isoWeekId());
      setUpvotesUsed(Math.max(0, Number(weekState.upvotesUsed) || 0));

      // Persist immediately
      saveJSON(STORAGE_KEYS.ITEMS, cleaned);
      saveJSON(STORAGE_KEYS.SETTINGS, { cap: Math.max(1, Number(settings.cap) || 3) });
      saveJSON(STORAGE_KEYS.WEEK_STATE, {
        weekId: typeof weekState.weekId === "string" ? weekState.weekId : isoWeekId(),
        upvotesUsed: Math.max(0, Number(weekState.upvotesUsed) || 0),
      });

      alert("Import successful.");
    } catch (err) {
      alert("Failed to import data.");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  function onChooseImportFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      importFromText(text);
      e.target.value = ""; // reset input
    };
    reader.onerror = () => {
      alert("Could not read the file.");
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  // Derived helpers
  function needScore(item) {
    return (item.up || 0) - (item.down || 0);
  }

  function changeArrow(item) {
    const s = needScore(item);
    if (s > 0) return "▲";
    if (s < 0) return "▼";
    return "■"; // flat
    }

  // Auto width ticker content
  const tickerRef = useRef(null);

  return (
    <div className="min-h-dvh w-full bg-black text-slate-100">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        {/* Faux TV Frame */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-black shadow-[0_0_30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="text-sm tracking-widest text-slate-400">BUDGET • VOTE • TV</div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Week {weekId}</span>

              {/* Import/Export */}
              <button
                onClick={exportData}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
                title="Download a JSON backup of your data"
              >
                Export
              </button>
              <button
                onClick={onChooseImportFile}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300 hover:border-amber-500 hover:text-amber-300"
                title="Restore data from a JSON backup"
              >
                Import
              </button>
              <input
                type="file"
                accept="application/json,.json"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
              />

              <button
                onClick={clearAll}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300 hover:border-rose-600 hover:text-rose-300"
                title="Clear all items and votes"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Market Ticker */}
          <div className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
            <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-950" />
            <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-950" />
            <div className="whitespace-nowrap will-change-transform animate-marquee" ref={tickerRef}>
              {sorted.length === 0 ? (
                <span className="px-6 py-3 text-sm text-slate-500">No items yet — add one below.</span>
              ) : (
                // duplicate once so the loop feels continuous
                <>
                  {sorted.map((it) => (
                    <span key={it.id} className="inline-flex items-center gap-3 px-6 py-3">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] tracking-widest text-slate-400">ITEM</span>
                      <span className="text-sm font-medium text-slate-200">{it.name}</span>
                      <span className="text-xs tabular-nums text-emerald-400">{fmtMoney(it.price)}</span>
                      <span
                        className={cls(
                          "text-xs",
                          needScore(it) > 0 ? "text-emerald-400" : needScore(it) < 0 ? "text-rose-400" : "text-slate-400"
                        )}
                      >
                        {changeArrow(it)} {needScore(it)}
                      </span>
                    </span>
                  ))}
                  {sorted.map((it, i) => (
                    <span key={it.id + "-dup-" + i} className="inline-flex items-center gap-3 px-6 py-3">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] tracking-widest text-slate-400">ITEM</span>
                      <span className="text-sm font-medium text-slate-200">{it.name}</span>
                      <span className="text-xs tabular-nums text-emerald-400">{fmtMoney(it.price)}</span>
                      <span
                        className={cls(
                          "text-xs",
                          needScore(it) > 0 ? "text-emerald-400" : needScore(it) < 0 ? "text-rose-400" : "text-slate-400"
                        )}
                      >
                        {changeArrow(it)} {needScore(it)}
                      </span>
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-xs text-slate-400">Upvotes this week</div>
              <div className="flex items-baseline gap-2">
                <span className="tabular-nums text-lg font-semibold">{cap - votesLeft}/{cap}</span>
                <span className="text-xs text-slate-500">used</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <label className="text-xs text-slate-400" htmlFor="cap">Weekly upvote cap</label>
              <div className="flex items-center gap-2">
                <input
                  id="cap"
                  type="number"
                  min={1}
                  value={cap}
                  onChange={(e) => setCap(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-md border border-slate-700 bg-black px-2 py-1 text-slate-100 outline-none focus:border-emerald-500"
                />
                <button
                  onClick={resetWeek}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
                  title="Reset this week's usage to 0"
                >
                  Reset week
                </button>
              </div>
            </div>

            <div className="ml-auto text-xs text-slate-500">Tip: Upvotes = need. Downvotes = not now.</div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 bg-slate-950/60 p-3 text-sm md:grid-cols-6">
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-400">Items</div>
              <div className="mt-0.5 text-base font-semibold">{stats.count}</div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-400">Total Price</div>
              <div className="mt-0.5 text-base font-semibold">{fmtMoney(stats.totalPrice)}</div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-400">Average Price</div>
              <div className="mt-0.5 text-base font-semibold">{fmtMoney(stats.avgPrice)}</div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-400">Total Up / Down</div>
              <div className="mt-0.5 text-base font-semibold tabular-nums">
                {stats.totalUp} / {stats.totalDown}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-400">Net Need (Σ up−down)</div>
              <div
                className={cls(
                  "mt-0.5 text-base font-semibold",
                  stats.netNeed > 0 ? "text-emerald-400" : stats.netNeed < 0 ? "text-rose-400" : "text-slate-200"
                )}
              >
                {stats.netNeed}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-xs text-slate-400">Most Needed</div>
              <div className="mt-0.5 text-base font-semibold truncate" title={stats.topName}>
                {stats.topName} {stats.topName !== "—" ? `(${stats.topScore >= 0 ? "+" : ""}${stats.topScore})` : ""}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Positive items: {stats.positiveCount}
              </div>
            </div>
          </div>
        </div>

        {/* Add Item Form */}
        <form onSubmit={addItem} className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="block text-xs text-slate-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Coffee grinder"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-black px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400">Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 59.99"
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-black px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs text-slate-400">Details</label>
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Why do you want it? Use-case, alternatives, etc."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-black px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              Add
            </button>
          </div>
        </form>

        {/* Items List */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          {sorted.map((it) => {
            const score = needScore(it);
            const totalVotes = (it.up || 0) + (it.down || 0);
            const positivity = totalVotes === 0 ? 0.5 : Math.max(0, Math.min(1, (it.up || 0) / totalVotes));
            return (
              <div key={it.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="mr-auto">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-semibold text-slate-100">{it.name}</div>
                      <div
                        className={cls(
                          "text-xs tabular-nums",
                          score > 0 ? "text-emerald-400" : score < 0 ? "text-rose-400" : "text-slate-400"
                        )}
                      >
                        {changeArrow(it)} {score}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {fmtMoney(it.price)} • {it.details || "No extra details"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => upvote(it.id)}
                      disabled={votesLeft <= 0}
                      className={cls(
                        "rounded-md border px-3 py-1 text-sm font-medium",
                        votesLeft > 0
                          ? "border-emerald-700 bg-emerald-950/40 text-emerald-300 hover:border-emerald-500 hover:text-emerald-200"
                          : "cursor-not-allowed border-slate-700 bg-slate-900 text-slate-500"
                      )}
                      title={votesLeft > 0 ? `Use 1 upvote (left: ${votesLeft})` : "No upvotes left this week"}
                    >
                      ▲ Upvote ({it.up || 0})
                    </button>
                    <button
                      onClick={() => downvote(it.id)}
                      className="rounded-md border border-rose-900 bg-rose-950/40 px-3 py-1 text-sm font-medium text-rose-300 hover:border-rose-600 hover:text-rose-200"
                      title="Downvotes are unlimited"
                    >
                      ▼ Downvote ({it.down || 0})
                    </button>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Need Meter */}
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>Buy-need meter</span>
                    <span className="tabular-nums">{Math.round(positivity * 100)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500"
                      style={{ width: `${Math.round(positivity * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
              Nothing here yet. Add a few candidates above and start voting.
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Weekly usage resets automatically when a new ISO week begins (Monday). All data is stored locally in your browser.
        </div>
      </div>

      {/* Styles: marquee animation */}
      <style jsx global>{`
        .animate-marquee {
          display: inline-block;
          min-width: 200%;
          padding-left: 6rem;
          animation: marquee 22s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
