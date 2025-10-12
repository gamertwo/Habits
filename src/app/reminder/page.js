"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * This page:
 * - Lets each user paste their own Discord Webhook URL (stored in localStorage).
 * - Reads your XP Task Forge data from localStorage ("xp_tasks_v6").
 * - Computes effective debt and posts it to that webhook on button click.
 */

const STORAGE_KEY = "xp_tasks_v6";           // your existing app’s data
const WEBHOOK_KEY = "xp_webhook_url_v1";     // where we store the user’s webhook URL
const INSTAGRAM_RATE = 2; // keep in sync with your main page (2 XP per minute)

export default function ReminderSetupPage() {
  // ----- webhook url (per-user, saved locally) -----
  const [webhookURL, setWebhookURL] = useState("");
  const [saving, setSaving] = useState(false);

  // ----- XP data pulled from your main app’s localStorage -----
  const [tasks, setTasks] = useState([]);
  const [spentXP, setSpentXP] = useState(0);
  const [debt, setDebt] = useState(0);

  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, tone = "ok") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2500);
  }

  // Load webhook + XP data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    // webhook
    const saved = localStorage.getItem(WEBHOOK_KEY);
    if (saved) setWebhookURL(saved);

    // xp data
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (typeof data.spentXP === "number") setSpentXP(data.spentXP);
        if (typeof data.debt === "number") setDebt(data.debt);
      }
    } catch (_) {}

    setHydrated(true);
  }, []);

  // Derived
  const totalEarned = useMemo(
    () => tasks.reduce((sum, t) => sum + (t.completed ? (t.xp || 0) : 0), 0),
    [tasks]
  );
  const effectiveDebt = Math.max(0, debt - (totalEarned - spentXP));

  // Save webhook to localStorage
  const saveWebhook = () => {
    try {
      if (!webhookURL || !/^https:\/\/discord\.com\/api\/webhooks\//.test(webhookURL)) {
        showToast("Paste a valid Discord webhook URL.", "warn");
        return;
      }
      setSaving(true);
      localStorage.setItem(WEBHOOK_KEY, webhookURL.trim());
      showToast("Webhook saved ✅");
    } finally {
      setSaving(false);
    }
  };

  // Post to Discord
  const postNow = async () => {
    try {
      const url = (webhookURL || "").trim();
      if (!url) {
        showToast("Please paste your Discord webhook URL first.", "warn");
        return;
      }
      if (!/^https:\/\/discord\.com\/api\/webhooks\//.test(url)) {
        showToast("That doesn't look like a valid Discord webhook URL.", "warn");
        return;
      }

      const payload = {
        username: "XP Task Forge",
        content: `⏰ Debt reminder: **${effectiveDebt} XP**`,
        embeds: [
          {
            title: "Instagram Debt",
            description:
              effectiveDebt > 0
                ? `You currently owe **${effectiveDebt} XP**.\nFinish tasks to pay it down.`
                : "No debt right now 🎉",
            color: effectiveDebt > 0 ? 0xef4444 : 0x22c55e,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Discord webhook failed: ${res.status} ${text}`);
      }

      showToast("Posted to Discord ✅");
    } catch (e) {
      showToast(`Failed to post: ${e.message || e}`, "warn");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">
          Discord Reminder Setup
        </h1>

        <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
          <label className="text-sm text-slate-300">Discord Webhook URL</label>
          <input
            type="url"
            placeholder="https://discord.com/api/webhooks/....."
            value={webhookURL}
            onChange={(e) => setWebhookURL(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-slate-100"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button
              onClick={saveWebhook}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Save Webhook
            </button>
            <button
              onClick={postNow}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Post Debt to Discord Now
            </button>
          </div>
          <p className="text-xs text-slate-400">
            This URL is saved only in your browser (localStorage). It won’t be uploaded to your repo.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4">
          <h2 className="font-semibold mb-2">Preview</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-400">Total Earned</div>
              <div className="text-blue-400 text-xl font-bold">{totalEarned}</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-400">Spent XP</div>
              <div className="text-slate-200 text-xl font-bold">{spentXP}</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-400">Raw Debt</div>
              <div className="text-slate-200 text-xl font-bold">{debt}</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-400">Effective Debt</div>
              <div className="text-red-400 text-xl font-bold">{Math.max(0, debt - (totalEarned - spentXP))}</div>
            </div>
          </div>
          {!hydrated && <div className="text-xs text-slate-500 mt-2">Loading local data…</div>}
        </div>

        {toast && (
          <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm shadow-lg
              ${toast.tone === "warn"
                ? "bg-red-900/80 border border-red-500/40 text-red-100"
                : "bg-slate-800/80 border border-slate-600/40 text-slate-100"}`}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}
