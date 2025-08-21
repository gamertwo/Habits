"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Task: { id: string, title: string, completed: boolean, xp: number }
 * Persisted shape:
 * {
 *   tasks: Task[],
 *   spentXP: number,
 *   bank: { instagram: number, anime: number },
 *   rates: { instagram: number, anime: number }
 * }
 */

export default function Page() {
  const STORAGE_KEY = "xp_tasks_v3";

  // ---------- core state ----------
  const [tasks, setTasks] = useState([]);
  const [spentXP, setSpentXP] = useState(0);
  const [bank, setBank] = useState({ instagram: 0, anime: 0 });
  // 1 XP per minute → 10m costs 10 XP
  const [rates, setRates] = useState({ instagram: 2, anime: 1 });
  const [hydrated, setHydrated] = useState(false);

  // toasts
  const [toasts, setToasts] = useState([]);
  const toast = (msg, tone = "ok") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2600);
  };

  // ---------- derived ----------
  const earnedXP = useMemo(
    () => tasks.reduce((sum, t) => sum + (t.completed ? t.xp : 0), 0),
    [tasks]
  );
  const xp = Math.max(0, earnedXP - spentXP);
  const overspent = earnedXP - spentXP < 0;

  // ---------- localStorage ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (typeof parsed.spentXP === "number") setSpentXP(parsed.spentXP);
        if (parsed.bank) setBank(parsed.bank);
        if (parsed.rates) setRates({ ...parsed.rates, instagram: 2 });
      }
    } catch (_) {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const data = { tasks, spentXP, bank, rates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [tasks, spentXP, bank, rates, hydrated]);

  // ---------- helpers ----------
  const addTask = (title, xpValue) => {
    const t = title.trim();
    if (!t) return;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setTasks((prev) => [{ id, title: t, completed: false, xp: xpValue }, ...prev]);
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTaskXP = (id, delta) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, xp: Math.max(1, Math.min(999, t.xp + delta)) } : t
      )
    );
  };

  const spendXPFor = (kind, minutes) => {
    const cost = minutes * rates[kind];
    if (xp < cost) {
      toast(`Not enough XP. Need ${cost - xp} more.`, "warn");
      return;
    }
    setSpentXP((s) => s + cost);
    setBank((b) => ({ ...b, [kind]: b[kind] + minutes }));
    toast(`Redeemed ${minutes}m ${cap(kind)} for ${cost} XP 🎉`, "ok");
  };

  const refundMinutes = (kind, minutes) => {
    setBank((b) => {
      const m = Math.min(minutes, b[kind]);
      if (m <= 0) {
        toast(`You don't have ${minutes}m banked to refund.`, "warn");
        return b;
      }
      setSpentXP((s) => Math.max(0, s - m * rates[kind]));
      toast(`Refunded ${m}m ${cap(kind)} back to XP.`, "ok");
      return { ...b, [kind]: b[kind] - m };
    });
  };

  // FIX: don't name this function starting with "use"
  const consumeMinutes = (kind, minutes) => {
    setBank((b) => {
      const m = Math.min(minutes, b[kind]);
      if (m <= 0) {
        toast(`No ${cap(kind)} minutes to use.`, "warn");
        return b;
      }
      toast(`Used ${m}m ${cap(kind)}. Enjoy!`, "ok");
      return { ...b, [kind]: b[kind] - m };
    });
  };

  const clearAll = () => {
    if (!confirm("Reset everything? This cannot be undone.")) return;
    setTasks([]);
    setSpentXP(0);
    setBank({ instagram: 0, anime: 0 });
    setRates({ instagram: 2, anime: 1 }); // Instagram costs 2 XP/min
    toast("All data cleared.");
  };

  // ---------- form local state ----------
  const [newTitle, setNewTitle] = useState("");
  const [newXP, setNewXP] = useState(10);

  return (
    <main className="wrap">
      {/* animated blobs */}
      <div className="bgDecor">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
      </div>

      <header className="hero">
        <div className="title">
          <span className="emoji">✅</span>
          <h1>XP Task Forge</h1>
        </div>

        <section className="stats">
          <div className={`stat ${overspent ? "warn" : ""}`}>
            <div className="stat-label">XP Balance</div>
            <div className="stat-value">{xp}</div>
            <div className="stat-note">
              Complete tasks below to earn XP, then redeem for screen time.
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">XP Earned</div>
            <div className="stat-value">{earnedXP}</div>
          </div>
          <div className="stat">
            <div className="stat-label">XP Spent</div>
            <div className="stat-value">{spentXP}</div>
          </div>
        </section>
      </header>

      <section className="card addTask">
        <h2>Make a Task</h2>
        <div className="row">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Read 10 pages"
          />
          <div className="xpPicker">
            <button type="button" onClick={() => setNewXP((v) => Math.max(1, v - 5))}>
              –
            </button>
            <div className="xpBubble">{newXP} XP</div>
            <button type="button" onClick={() => setNewXP((v) => Math.min(999, v + 5))}>
              +
            </button>
          </div>
          <button
            type="button"
            className="primary"
            onClick={() => {
              addTask(newTitle, newXP);
              setNewTitle("");
              toast("Task added.");
            }}
          >
            Add
          </button>
        </div>
      </section>

      <section className="card tasks">
        <div className="tasks-head">
          <h2>Your Tasks</h2>
          <button type="button" className="ghost danger" onClick={clearAll}>
            Reset All
          </button>
        </div>

        {tasks.length === 0 && (
          <div className="empty">no tasks yet—add one above and start earning!</div>
        )}

        <ul className="taskList">
          {tasks.map((t) => (
            <li key={t.id} className={`task ${t.completed ? "done" : ""}`}>
              <button
                type="button"
                aria-label="toggle"
                className={`checkbox ${t.completed ? "checked" : ""}`}
                onClick={() => {
                  toggleTask(t.id);
                  toast(t.completed ? "Marked as todo." : "Completed! +XP");
                }}
              >
                {t.completed ? "✔" : ""}
              </button>

              <div className="taskMain">
                <div className="taskTitle">{t.title}</div>
                <div className="taskMeta">
                  <span className="chip">{t.completed ? "Completed" : "Todo"}</span>
                </div>
              </div>

              <div className="taskXP">
                <button type="button" onClick={() => updateTaskXP(t.id, -5)}>
                  –
                </button>
                <div className="xpBubble small">{t.xp} XP</div>
                <button type="button" onClick={() => updateTaskXP(t.id, +5)}>
                  +
                </button>
              </div>

              <button
                type="button"
                className="ghost danger"
                onClick={() => {
                  deleteTask(t.id);
                  toast("Task deleted.", "warn");
                }}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="redeem">
        <RedeemCard
          label="Instagram"
          color="var(--insta)"
          minutes={bank.instagram}
          rate={rates.instagram}
          onSetRate={(v) => setRates((r) => ({ ...r, instagram: v }))}
          onRedeem={(m) => spendXPFor("instagram", m)}
          onConsume={(m) => consumeMinutes("instagram", m)}
          onRefund={(m) => refundMinutes("instagram", m)}
          xpBalance={xp}
          onToast={toast}
        />
        <RedeemCard
          label="Anime"
          color="var(--anime)"
          minutes={bank.anime}
          rate={rates.anime}
          onSetRate={(v) => setRates((r) => ({ ...r, anime: v }))}
          onRedeem={(m) => spendXPFor("anime", m)}
          onConsume={(m) => consumeMinutes("anime", m)}
          onRefund={(m) => refundMinutes("anime", m)}
          xpBalance={xp}
          onToast={toast}
        />
      </section>

      {/* toasts */}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>{t.msg}</div>
        ))}
      </div>

      <style jsx>{`
        :root {
          --bg: #0b0e1a;
          --card: #14182b;
          --muted: #a3adc3;
          --text: #eaf0ff;
          --primary: #7e9cff;
          --success: #48d597;
          --danger: #ff6b6b;
          --insta: #ff8ab5;
          --anime: #8ef5ff;
          --ring: rgba(255, 255, 255, 0.12);
        }

        * { box-sizing: border-box; }

        .wrap {
          min-height: 100svh;
          color: var(--text);
          padding: 28px clamp(16px, 4vw, 48px);
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          overflow: hidden;
          font-family: ui-rounded, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue",
            Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
          background:
            radial-gradient(1200px 600px at 30% -10%, #1b2140 0%, transparent 60%),
            radial-gradient(1000px 500px at 100% 0%, #151b35 0%, transparent 60%),
            var(--bg);
        }

        /* animated soft blobs */
        .bgDecor { pointer-events: none; position: absolute; inset: 0; }
        .blob {
          position: absolute;
          width: 46vmax; height: 46vmax;
          filter: blur(60px) saturate(140%);
          opacity: 0.36;
          border-radius: 999px;
          mix-blend-mode: screen;
          animation: floaty 22s ease-in-out infinite;
        }
        .blob.a { background: radial-gradient(circle at 30% 30%, #5b74ff, transparent 60%); top: -20vmax; left: -10vmax; animation-delay: 0s; }
        .blob.b { background: radial-gradient(circle at 70% 70%, #53f0c4, transparent 60%); bottom: -18vmax; right: -8vmax; animation-delay: 4s; }
        .blob.c { background: radial-gradient(circle at 60% 20%, #ff7aa8, transparent 60%); top: 10vmax; right: 5vmax; animation-delay: 8s; }

        @keyframes floaty {
          0%,100% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(-4vmax) translateX(2vmax) scale(1.06); }
        }

        .hero {
          display: grid;
          grid-template-columns: 1.2fr 2fr;
          gap: 20px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }

        .title {
          background: linear-gradient(160deg, #1a1f37, #14182a);
          border-radius: 28px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 0 0 1px var(--ring);
        }
        .emoji { font-size: 42px; }
        h1 { font-size: clamp(28px, 3.8vw, 48px); margin: 0; letter-spacing: 0.5px; }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) { .stats { grid-template-columns: 1fr; } }
        .stat {
          border-radius: 24px; padding: 18px 22px; background: var(--card);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 0 0 1px var(--ring);
        }
        .stat.warn { outline: 3px solid var(--danger); }
        .stat-label { font-size: 14px; color: var(--muted); margin-bottom: 8px; }
        .stat-value { font-size: 40px; font-weight: 800; }
        .stat-note { color: var(--muted); font-size: 13px; margin-top: 6px; }

        .card {
          background: var(--card);
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35), inset 0 0 0 1px var(--ring);
          position: relative; z-index: 1;
        }

        .addTask h2, .tasks h2 { margin: 0 0 14px 0; font-size: 26px; }
        .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        input[type="text"] {
          flex: 1; min-width: 220px; border: none; outline: none; background: #0f1324;
          color: var(--text); padding: 18px 18px; border-radius: 18px; font-size: 18px;
          box-shadow: inset 0 0 0 1px var(--ring);
        }

        .xpPicker { display: flex; align-items: center; gap: 8px; background: #0f1324; border-radius: 999px; padding: 6px; box-shadow: inset 0 0 0 1px var(--ring); }
        .xpPicker > button { width: 44px; height: 44px; border-radius: 999px; background: #171a2a; border: none; color: var(--text); font-size: 26px; cursor: pointer; }
        .xpBubble { background: #2a2f4a; border-radius: 999px; padding: 10px 16px; font-weight: 700; font-size: 16px; }
        .xpBubble.small { padding: 8px 12px; font-size: 14px; }

        button.primary {
          background: linear-gradient(180deg, #7e9cff, #5472ff);
          color: white; border: none; padding: 16px 24px; border-radius: 18px;
          font-size: 18px; font-weight: 800; cursor: pointer;
          box-shadow: 0 10px 20px rgba(84, 114, 255, 0.35);
        }
        button.ghost { background: transparent; border: 1px solid var(--ring); color: var(--text); padding: 12px 16px; border-radius: 16px; cursor: pointer; }
        .danger { color: var(--danger); border-color: rgba(255, 107, 107, 0.35); }

        .tasks-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .empty { color: var(--muted); padding: 24px; text-align: center; font-size: 16px; }

        .taskList { display: grid; gap: 12px; list-style: none; padding: 0; margin: 12px 0 0 0; }
        .task {
          display: grid; grid-template-columns: auto 1fr auto auto; gap: 14px; align-items: center;
          padding: 14px; border-radius: 20px; background: #101428; box-shadow: inset 0 0 0 1px var(--ring);
        }
        @media (max-width: 680px) {
          .task { grid-template-columns: auto 1fr; grid-template-rows: auto auto; }
          .taskXP, .task > .ghost { grid-column: 1 / -1; }
        }
        .task.done { background: #0f1f18; box-shadow: inset 0 0 0 2px rgba(72, 213, 151, 0.35); }
        .checkbox {
          width: 42px; height: 42px; border-radius: 14px; border: 2px solid #2b3253;
          background: #111632; color: white; display: grid; place-items: center; font-size: 22px; cursor: pointer;
        }
        .checkbox.checked {
          background: linear-gradient(180deg, #4ce3a6, #2abf7a);
          border-color: transparent; box-shadow: 0 8px 16px rgba(72, 213, 151, 0.35);
        }

        .taskMain { display: flex; flex-direction: column; gap: 6px; }
        .taskTitle { font-size: 18px; font-weight: 700; letter-spacing: 0.2px; }
        .taskMeta .chip { background: #212642; color: var(--muted); border-radius: 999px; padding: 6px 10px; font-size: 12px; }

        .taskXP { display: flex; align-items: center; gap: 8px; }
        .taskXP > button { width: 36px; height: 36px; border-radius: 10px; border: none; color: var(--text); background: #1a1f3e; font-size: 22px; cursor: pointer; }

        .redeem { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; position: relative; z-index: 1; }
        @media (max-width: 900px) { .redeem { grid-template-columns: 1fr; } }

        .toasts { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: grid; gap: 8px; z-index: 50; }
        .toast { background: #141a2f; border-radius: 999px; padding: 10px 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35), inset 0 0 0 1px var(--ring); font-weight: 700; }
        .toast.warn { color: #ffd7d7; border: 1px solid rgba(255,107,107,.4); }
      `}</style>
    </main>
  );
}

function RedeemCard({
  label,
  color,
  minutes,
  rate,
  onSetRate,
  onRedeem,
  onConsume,
  onRefund,
  xpBalance,
  onToast,
}) {
  const quick = [5, 15, 30];
  const [custom, setCustom] = useState(10);

  const redeem = (m) => {
    const cost = m * rate;
    if (xpBalance < cost) {
      onToast?.(`Not enough XP for ${m}m ${label}. Need ${cost - xpBalance} more.`, "warn");
      return;
    }
    onRedeem(m);
  };

  return (
    <section className="redeemCard">
      <div className="head">
        <div className="left">
          <div className="dot" aria-hidden style={{ background: color }} />
          <h3>{label} Time</h3>
        </div>
        <div className="bank">
          <span className="bankLabel">Banked</span>
          <span className="bankValue">{minutes} min</span>
        </div>
      </div>

      <div className="rate">
        <span>Rate:</span>
        <div className="rateBox">
          <button type="button" onClick={() => onSetRate(Math.max(1, rate - 1))}>–</button>
          <div className="val">{rate} XP / min</div>
          <button type="button" onClick={() => onSetRate(Math.min(999, rate + 1))}>+</button>
        </div>
        <div className="xpHint">Balance: {xpBalance} XP</div>
      </div>

      <div className="buttons">
        {quick.map((m) => (
          <button
            key={m}
            type="button"
            className="pill"
            onClick={() => redeem(m)}
            title={`Costs ${m * rate} XP`}
          >
            Redeem {m}m
          </button>
        ))}
      </div>

      <div className="custom">
        <input
          type="number"
          min={1}
          value={custom}
          onChange={(e) => setCustom(Math.max(1, Number(e.target.value || 1)))}
        />
        <button type="button" className="pill" onClick={() => redeem(custom)}>
          Redeem {custom}m ({custom * rate} XP)
        </button>
      </div>

      <div className="buttons">
        {quick.map((m) => (
          <button key={"use" + m} type="button" className="pill ghost" onClick={() => onConsume(m)}>
            Use {m}m
          </button>
        ))}
      </div>

      <div className="buttons">
        {quick.map((m) => (
          <button
            key={"refund" + m}
            type="button"
            className="pill danger"
            onClick={() => onRefund(m)}
            title={`Refunds ${m * rate} XP (must have at least ${m}m banked)`}
          >
            Refund {m}m
          </button>
        ))}
      </div>

      <style jsx>{`
        .redeemCard {
          background: #141a2f;
          border-radius: 28px;
          padding: 18px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .head { display: flex; justify-content: space-between; align-items: center; }
        .left { display: flex; align-items: center; gap: 10px; }
        .dot { width: 18px; height: 18px; border-radius: 999px; box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.06); }
        h3 { margin: 0; font-size: 22px; }
        .bank { display: flex; align-items: baseline; gap: 8px; background: #0f1326; padding: 10px 12px; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08); }
        .bankLabel { color: #9aa3b2; font-size: 12px; }
        .bankValue { font-size: 18px; font-weight: 800; }

        .rate { display: flex; align-items: center; gap: 10px; color: #b7bfd0; flex-wrap: wrap; }
        .rateBox { display: flex; align-items: center; gap: 8px; background: #0f1326; padding: 6px; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08); }
        .rateBox > button { width: 40px; height: 40px; border-radius: 12px; border: none; color: white; background: #1a1f3e; font-size: 22px; cursor: pointer; }
        .val { background: #232846; border-radius: 999px; padding: 8px 12px; font-weight: 800; font-size: 14px; }
        .xpHint { margin-left: auto; font-size: 13px; color: #9aa3b2; }

        .buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        .pill {
          border: none; cursor: pointer; padding: 14px 18px; border-radius: 999px;
          background: #21264a; color: white; font-weight: 800; font-size: 14px;
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.25);
        }
        .pill.ghost { background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); }
        .pill.danger { background: #3a1720; border: 1px solid rgba(255, 107, 107, 0.4); color: #ffb7b7; }

        .custom { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .custom input {
          width: 110px; padding: 12px 14px; border-radius: 14px; border: none;
          color: white; background: #0f1326; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
        }
      `}</style>
    </section>
  );
}

function cap(s) {
  return s[0].toUpperCase() + s.slice(1);
}
