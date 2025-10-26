'use client';

import React from 'react';

/**
 * Timers (90 | 60 | 25) + Local Micro-Coach
 * - Auto-start
 * - When a timer hits 0, it PAUSES and opens a local "coach" modal
 * - After answering/skipping, it restarts the next loop
 * - Visual % stepper does nothing to time, starts at 0, resets to 0 on loop/reset
 * - Hourglass shows progress
 * - All reflections stored in localStorage ("timerCoachLog")
 */

function useLocalStorage(key, initial) {
  const [val, setVal] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

function useLoopingTimer(durationMs, { onLoopStop }) {
  const [endAt, setEndAt] = React.useState(0);
  const [remaining, setRemaining] = React.useState(durationMs);
  const [loopCount, setLoopCount] = React.useState(0);
  const rafRef = React.useRef(null);

  const startFresh = React.useCallback((tNow = performance.now(), ms = durationMs) => {
    setEndAt(tNow + ms);
    setRemaining(ms);
  }, [durationMs]);

  const reset = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setLoopCount(0);
    startFresh();
  }, [startFresh]);

  const resumeNextLoop = React.useCallback(() => {
    // Start next loop after coach
    const t = performance.now();
    setEndAt(t + durationMs);
    setRemaining(durationMs);
  }, [durationMs]);

  React.useEffect(() => {
    let mounted = true;

    const tick = (t) => {
      if (!mounted) return;
      const left = Math.max(0, endAt - t);
      setRemaining(left);

      if (left > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Completed! Flash and HAND OFF to coach instead of auto-restarting.
        const el = document.getElementById(`flash-${endAt}`);
        if (el) {
          el.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
            duration: 700, easing: 'ease-in-out',
          });
        }
        setLoopCount((n) => n + 1);
        // Let the parent open the coach. Parent will call resumeNextLoop() when done.
        onLoopStop?.({ when: Date.now(), loopIndex: loopCount + 1, durationMs });
      }
    };

    if (endAt === 0) {
      const t0 = performance.now();
      setEndAt(t0 + durationMs);
      setRemaining(durationMs);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // NOTE: we don't restart ticking while coach is open; parent controls when to resume
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt, durationMs]); // (onLoopStop, loopCount managed via closure)

  const totalSec = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  const progress = 1 - remaining / durationMs; // 0..1

  return { mm, ss, reset, progress, endAt, loopCount, resumeNextLoop };
}

function PercentStepper({ value, onChange }) {
  const step = (d) => onChange(Math.max(0, Math.min(100, Math.round(value + d))));
  return (
    <div className="flex items-stretch overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => step(-5)}
        className="px-3 py-1 text-xs leading-none active:opacity-70"
        aria-label="Decrease percent"
      >
        ▲
      </button>
      <div className="px-2 py-1 text-xs tabular-nums select-none">{value}%</div>
      <button
        type="button"
        onClick={() => step(+5)}
        className="px-3 py-1 text-xs leading-none active:opacity-70"
        aria-label="Increase percent"
      >
        ▼
      </button>
    </div>
  );
}

/** Hourglass SVG — progress: 0..1 (0 = start, 1 = finished) */
/** Hourglass v2 — progress: 0..1 (0 = start, 1 = finished) */
/** Hourglass v3 — bold capsule style, progress: 0..1 (0 = start, 1 = done) */
function Hourglass({ progress }) {
  // clamp
  const p = Math.max(0, Math.min(1, progress));
  const topFill = 1 - p;   // 1→0 drains
  const botFill = p;       // 0→1 fills
  const running = p > 0 && p < 1;

  // Geometry (viewBox 140 x 200)
  // We’ll build a mounded top and a conical bottom using paths inside clip areas.
  const TOP_Y = 22, BOT_Y = 108;
  const FILL_H = 72;

  // Top fill height + mound curvature factor
  const topH = FILL_H * topFill;
  const topBaseY = TOP_Y + FILL_H;        // bottom of top chamber
  const topFillY = topBaseY - topH;       // current top fill surface Y
  const mound = Math.max(0, 12 * topFill); // mound height (curvier when fuller)

  // Bottom pile height + cone width factor
  const botH = FILL_H * botFill;
  const botBaseY = BOT_Y + FILL_H;        // bottom of bottom chamber
  const botTopY = botBaseY - botH;        // top of pile Y
  const cone = Math.max(0, 18 * botFill); // wider cone as it fills

  // Colors / gradients
  const glassStroke = "#0a0a0a";
  const sandDark = "#2a1e00";
  const sandGold = "#b08900";

  return (
    <svg viewBox="0 0 140 200" className="h-14 w-auto">
      <defs>
        {/* Sand gradient (gold → dark) */}
        <linearGradient id="sandGoldGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={sandGold} />
          <stop offset="100%" stopColor={sandDark} />
        </linearGradient>

        {/* Soft inner glass glow */}
        <radialGradient id="glassGlow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>

        {/* Figure-8 capsule outline reused for stroke & clipping */}
        <path id="capsuleTop" d="
          M20,24 H120
          c0,28 -26,48 -50,64
          c-24,-16 -50,-36 -50,-64 Z" />
        <path id="capsuleBot" d="
          M20,176 H120
          c0,-28 -26,-48 -50,-64
          c-24,16 -50,36 -50,64 Z" />

        <clipPath id="clipTop"><use href="#capsuleTop" /></clipPath>
        <clipPath id="clipBot"><use href="#capsuleBot" /></clipPath>
      </defs>

      {/* Rocking tilt while running (very subtle) */}
      <g>
        {running && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-1 70 100; 1 70 100; -1 70 100"
            dur="3s"
            repeatCount="indefinite"
          />
        )}

        {/* Glass strokes */}
        <use href="#capsuleTop" fill="none" stroke={glassStroke} strokeWidth="5" strokeLinejoin="round" />
        <use href="#capsuleBot" fill="none" stroke={glassStroke} strokeWidth="5" strokeLinejoin="round" />

        {/* Neck (tapered curve) */}
        <path d="M58,100 C62,97 78,97 82,100" stroke={glassStroke} strokeWidth="5" fill="none" strokeLinecap="round" />

        {/* Very soft inner glow */}
        <g opacity="0.7">
          <path d="M26,28 H114 c0,22 -22,38 -44,52 c-22,-14 -44,-30 -44,-52 Z" fill="url(#glassGlow)" />
          <path d="M26,172 H114 c0,-22 -22,-38 -44,-52 c-22,14 -44,30 -44,52 Z" fill="url(#glassGlow)" />
        </g>

        {/* --- TOP SAND (mounded) --- */}
        <g clipPath="url(#clipTop)">
          {/* Body below the curved surface */}
          <rect x="24" y={topFillY} width="92" height={Math.max(0, topBaseY - topFillY)} rx="10" fill="url(#sandGoldGrad)" />
          {/* Curved surface cap (mound) */}
          {topH > 1 && (
            <path
              d={`
                M24 ${topFillY + 2}
                Q 70 ${topFillY - mound}, 116 ${topFillY + 2}
                L 116 ${topFillY + 8}
                Q 70 ${topFillY - mound + 6}, 24 ${topFillY + 8}
                Z
              `}
              fill="url(#sandGoldGrad)"
              opacity="0.95"
            />
          )}
        </g>

        {/* --- BOTTOM SAND (conical pile) --- */}
        <g clipPath="url(#clipBot)">
          {/* Base fill */}
          <rect x="24" y={botTopY} width="92" height={Math.max(0, botBaseY - botTopY)} rx="10" fill="url(#sandGoldGrad)" />
          {/* Conical top for the pile */}
          {botH > 1 && (
            <path
              d={`
                M ${70 - cone} ${botTopY + 6}
                Q 70 ${botTopY - 10}, ${70 + cone} ${botTopY + 6}
                L ${70 + cone} ${botTopY + 14}
                Q 70 ${botTopY - 2}, ${70 - cone} ${botTopY + 14}
                Z
              `}
              fill="url(#sandGoldGrad)"
              opacity="0.95"
            />
          )}
        </g>

        {/* Falling stream & grains */}
        {running && (
          <g>
            {/* central stream (dashes) */}
            <rect x="68" y="88" width="4" height="24" rx="2" fill={sandDark} opacity="0.85">
              <animate attributeName="y" values="86;92;86" dur="0.9s" repeatCount="indefinite" />
            </rect>
            {/* tiny grains (staggered) */}
            <circle cx="64" cy="94" r="1.2" fill={sandDark}>
              <animate attributeName="cy" values="90;108" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="0.7s" repeatCount="indefinite" />
            </circle>
            <circle cx="76" cy="92" r="1" fill={sandDark} opacity="0.9">
              <animate attributeName="cy" values="88;108" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </g>
    </svg>
  );
}



/** Micro-coach that runs locally (no API). */
function useCoach(timerLabel) {
  const [log, setLog] = useLocalStorage('timerCoachLog', []); // array of entries
  const [open, setOpen] = React.useState(false);
  const [questions, setQuestions] = React.useState([]);
  const [answers, setAnswers] = React.useState({});
  const [rating, setRating] = React.useState(3);

  // Generate tiny, adaptive question set from last entry + keywords
  const genQuestions = React.useCallback(() => {
    const last = [...log].reverse().find(e => e.timer === timerLabel);
    const base = [
      "What did you actually complete this block?",
      "Any blockers or distractions worth noting?",
      "One small improvement for the next block?"
    ];
    // keyword nudge
    const keywords = (last?.answers?.q2 || '').toLowerCase();
    const focused = /scroll|phone|youtube|tab|social|chat/.test(keywords);
    const overwhelm = /overwhelm|hard|stuck|confus|difficult|heavy/.test(keywords);

    const q = [...base];
    if (focused) q[1] = "Phone/tabs pulled you off? How will you reduce that 1% next block?";
    if (overwhelm) q[2] = "What micro-step will reduce overwhelm in the first 5 minutes?";
    if (last?.rating <= 2) q.unshift("What would have made a 3/5 instead of today’s score?");
    if (last?.rating >= 4) q.unshift("What worked well that you can repeat right away?");
    return q.slice(0, 3).map((t, i) => ({ id: `q${i + 1}`, text: t }));
  }, [log, timerLabel]);

  const openCoach = React.useCallback(() => {
    setQuestions(genQuestions());
    setAnswers({});
    setRating(3);
    setOpen(true);
  }, [genQuestions]);

  const closeCoach = React.useCallback(() => setOpen(false), []);

  const submitCoach = React.useCallback(() => {
    const entry = {
      id: crypto?.randomUUID?.() || String(Date.now()),
      at: new Date().toISOString(),
      timer: timerLabel,
      answers,
      rating,
    };
    setLog(arr => [...arr, entry]);
    setOpen(false);
  }, [answers, rating, timerLabel, setLog]);

  return {
    open,
    openCoach,
    closeCoach,
    submitCoach,
    questions,
    answers,
    setAnswers,
    rating,
    setRating,
    log,
    exportLog: () => {
      const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timerCoachLog.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };
}

function CoachModal({ open, questions, answers, setAnswers, rating, setRating, onClose, onSubmit }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/50 p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-lg">
        <div className="border-b px-4 py-3">
          <div className="text-xs uppercase tracking-widest text-zinc-400" style={{ fontFamily: 'Space Mono, ui-monospace, monospace' }}>
            Quick reflection
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          {questions.map(q => (
            <div key={q.id} className="space-y-1">
              <div className="text-sm font-medium text-zinc-800">{q.text}</div>
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                rows={2}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-300"
                placeholder="Write a tiny note…"
              />
            </div>
          ))}

          <div className="pt-1">
            <div className="mb-2 text-sm font-medium text-zinc-800">How did that block go?</div>
            <input
              type="range"
              min={1} max={5} step={1}
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 text-xs text-zinc-500">Score: {rating}/5</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button onClick={onClose} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm active:opacity-80">Skip</button>
          <button onClick={onSubmit} className="rounded-lg bg-black px-3 py-1.5 text-sm text-white active:opacity-80 pb-20">Save & Continue</button>
        </div>
      </div>
    </div>
  );
}

function TimerBlock({ minutes, label }) {
  const durationMs = minutes * 60 * 1000;
  const coach = useCoach(label);

  // Visual %: starts at 0; returns to 0 on reset & after each loop
  const [pct, setPct] = React.useState(0);
  const [loopIndex, setLoopIndex] = React.useState(0);

  const { mm, ss, reset, progress, endAt, loopCount, resumeNextLoop } = useLoopingTimer(durationMs, {
    onLoopStop: ({ loopIndex: idx }) => {
      setPct(0);
      setLoopIndex(idx);
      coach.openCoach();
    }
  });

  const handleReset = () => {
    reset();
    setPct(0);
  };

  // When coach closes (skip), start next loop
  const handleSkip = () => {
    coach.closeCoach();
    resumeNextLoop();
  };

  const handleSubmit = () => {
    coach.submitCoach();
    resumeNextLoop();
  };

  return (
    <div className="relative isolate flex w-full flex-col rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      {/* subtle flash on completion */}
      <div id={`flash-${endAt}`} className="pointer-events-none absolute inset-0 rounded-3xl bg-black/80" style={{ opacity: 0 }} />

      {/* header row — hourglass + label + export */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Hourglass progress={progress} />
        <div className="text-[10px] uppercase tracking-widest text-zinc-400" style={{ fontFamily: 'Space Mono, ui-monospace, monospace' }}>
          {label}
        </div>
        <button
          onClick={coach.exportLog}
          className="rounded-full border border-zinc-200 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-500 active:opacity-80"
          title="Export reflections"
        >
          Export
        </button>
      </div>

      {/* timer body (tap to reset) */}
      <button
        onClick={handleReset}
        className="grid grow place-items-center rounded-2xl bg-white/0 px-2 py-4 active:scale-[0.995]"
        aria-label={`${minutes}-minute timer (tap to reset)`}
      >
        <div
          className="digits"
          style={{
            fontFamily: 'var(--timer-font)',
            fontSize: 'clamp(3.25rem, 14vw, 8rem)',
            lineHeight: 0.92,
            fontWeight: 400,
            color: '#111',
          }}
          aria-live="polite"
        >
          <span>{mm}</span>
          <span className="blink">:</span>
          <span>{ss}</span>
        </div>
        <div
          className="mt-2 text-[10px] uppercase tracking-widest text-zinc-400"
          style={{ fontFamily: 'Space Mono, ui-monospace, monospace' }}
        >
          Tap timer to reset
        </div>
      </button>

      {/* controls row (purely visual %) */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <PercentStepper value={pct} onChange={setPct} />
        <div className="text-[10px] uppercase tracking-widest text-zinc-400" style={{ fontFamily: 'Space Mono, ui-monospace, monospace' }}>
          Visual %
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-900 transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        />
      </div>

      {/* Coach modal (opens on loop end) */}
      <CoachModal
        open={coach.open}
        questions={coach.questions}
        answers={coach.answers}
        setAnswers={coach.setAnswers}
        rating={coach.rating}
        setRating={coach.setRating}
        onClose={handleSkip}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-dvh bg-white text-black selection:bg-black selection:text-white">
      {/* Fonts + tiny style helpers */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
        :root { --timer-font: 'Bebas Neue', system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif; }
        .digits { font-feature-settings: 'tnum' 1, 'ss01' 1; letter-spacing: 0.02em; }
        .blink { animation: blink 1s steps(1, end) infinite; }
        @keyframes blink { 50% { opacity: 0.18; } }
      `}</style>

      {/* Mobile-first stack; expands to 3 columns on md+ */}
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:gap-5 sm:p-5 md:max-w-6xl md:grid-cols-3">
        <TimerBlock minutes={90} label="90-MIN TIMER" />
        <TimerBlock minutes={60} label="60-MIN TIMER" />
        <TimerBlock minutes={25} label="25-MIN TIMER" />
      </div>
    </main>
  );
}
