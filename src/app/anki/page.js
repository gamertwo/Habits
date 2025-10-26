'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/* -------------------- CARD DATA (math-safe) -------------------- */
const DECK = [
  {
    q: <>State proportionality for linear circuits.</>,
    a: (
      <>
        <p>For linear resistive circuits the input–output relation is</p>
        <BlockMath math={'y = Kx'} />
        <ul style={{ textAlign: 'left', marginTop: 8 }}>
          <li><InlineMath math={'x'} /> — input (voltage or current)</li>
          <li><InlineMath math={'y'} /> — output (voltage or current)</li>
          <li><InlineMath math={'K'} /> — proportionality constant</li>
        </ul>
      </>
    ),
  },
  {
    q: <>What does the constant <InlineMath math={'K'} /> represent?</>,
    a: (
      <p>
        <InlineMath math={'K'} /> is the gain (scaling). If the input doubles, the output doubles:
        <InlineMath math={'\\;y = Kx'} />.
      </p>
    ),
  },
  {
    q: <>Why doesn’t proportionality apply to power?</>,
    a: (
      <p>
        Power is nonlinear in the input because <InlineMath math={'P = VI'} /> and both
        <InlineMath math={'\\;V'} /> and <InlineMath math={'\\;I'} /> can depend on the input.
      </p>
    ),
  },
  {
    q: <>Give the ratio form of proportionality.</>,
    a: (
      <>
        <p>The scaling factor is the output–input ratio</p>
        <BlockMath math={'K = \\dfrac{y}{x}'} />
      </>
    ),
  },
  {
    q: <>Voltage divider result (two series resistors)?</>,
    a: (
      <>
        <BlockMath math={'v_o = \\left(\\dfrac{R_2}{R_1 + R_2}\\right) v_i'} />
        <p>So <InlineMath math={'K = \\dfrac{v_o}{v_i} = \\dfrac{R_2}{R_1+R_2}'} />.</p>
      </>
    ),
  },
  {
    q: <>Current divider result (two parallel resistors)?</>,
    a: (
      <>
        <BlockMath math={'i_{R1} = \\left(\\dfrac{R_2}{R_1 + R_2}\\right) i_s'} />
        <BlockMath math={'i_{R2} = \\left(\\dfrac{R_1}{R_1 + R_2}\\right) i_s'} />
        <p>Each branch is a fixed fraction of the source current.</p>
      </>
    ),
  },
  {
    q: <>Summarize proportionality in one line.</>,
    a: (
      <BlockMath math={'\\text{Linear circuits:}\\quad y = Kx\\quad (\\text{not for } P=VI)'} />
    ),
  },
];

/* -------------------- PAGE -------------------- */
export default function Page() {
  const s = useMemo(() => styles(), []);
  const [i, setI] = useState(0);             // current card index
  const [showA, setShowA] = useState(false); // show answer?
  const [elapsed, setElapsed] = useState(0);  // seconds for THIS card
  const timerRef = useRef(null);

  // start/reset timer whenever card index changes
  useEffect(() => {
    setElapsed(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [i]);

  // simple keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setShowA((v) => !v); }
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') next();
      else if (e.key === 'ArrowLeft'  || e.key.toLowerCase() === 'p') prev();
      else if (e.key.toLowerCase() === 'r') restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, showA]);

  function format(t) {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s2 = (t % 60).toString().padStart(2, '0');
    return `${m}:${s2}`;
  }

  function showAnswer() { setShowA(true); }
  function hideAnswer() { setShowA(false); }
  function prev() { setI((x) => Math.max(0, x - 1)); setShowA(false); }
  function next() { setI((x) => Math.min(DECK.length - 1, x + 1)); setShowA(false); }
  function restart() { setI(0); setShowA(false); }
  function shuffle() {
    // Fisher–Yates, new deck instance (keeps LaTeX intact)
    const arr = [...DECK];
    for (let j = arr.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [arr[j], arr[k]] = [arr[k], arr[j]];
    }
    // store to ref by replacing array constant? simplest: keep deck local state
    setDeck(arr);
    setI(0); setShowA(false);
  }

  // keep deck in state if we want shuffle
  const [deck, setDeck] = useState(DECK);
  useEffect(() => { setDeck(DECK); }, []); // initial assign (so shuffle works independently)

  const card = deck[i];

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <h1 style={s.title}>🧠 Proportionality — Flashcards</h1>
        <div style={s.meta}>
          <span>Card {i + 1}/{deck.length}</span>
          <span style={s.dot}>•</span>
          <span>Time: <strong>{format(elapsed)}</strong></span>
        </div>
      </header>

      <section style={s.cardArea}>
        <div style={s.card} onClick={() => setShowA(!showA)} role="button" aria-label="Flip card">
          <div style={s.side}>
            <h2 style={s.sideLabel}>Question</h2>
            <div style={s.content}>{card.q}</div>
          </div>

          {showA && (
            <div style={{ ...s.side, ...s.answerSide }}>
              <h2 style={s.sideLabel}>Answer</h2>
              <div style={s.content}>{card.a}</div>
            </div>
          )}
        </div>
        <p style={s.hint}>click the card or press <kbd>Space</kbd> to flip</p>
      </section>

      <nav style={s.controls}>
        <button style={s.btn} onClick={prev} disabled={i === 0}>◀ Prev</button>
        {!showA ? (
          <button style={{ ...s.btn, ...s.primary }} onClick={showAnswer}>Show Answer</button>
        ) : (
          <button style={{ ...s.btn, ...s.primary }} onClick={hideAnswer}>Hide Answer</button>
        )}
        <button style={s.btn} onClick={next} disabled={i === deck.length - 1}>Next ▶</button>
      </nav>

      <footer style={s.footer}>
        <button style={s.smallBtn} onClick={restart}>Restart (R)</button>
        <button style={s.smallBtn} onClick={() => { shuffle(); }}>Shuffle</button>
      </footer>
    </main>
  );
}

/* -------------------- styles -------------------- */
function styles() {
  return {
    wrap: {
      maxWidth: 900,
      margin: '30px auto 60px',
      padding: '0 20px',
      fontFamily:
        'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji"',
      color: '#0f172a',
    },
    header: { textAlign: 'center', marginBottom: 16 },
    title: { fontSize: '1.9rem', margin: 0 },
    meta: { marginTop: 6, color: '#475569', display: 'inline-flex', gap: 10, alignItems: 'center' },
    dot: { opacity: .6 },
    cardArea: { marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' },
    card: {
      width: '100%',
      minHeight: 380,
      background: '#0b1220',
      color: '#e5e7eb',
      border: '1px solid #1f2937',
      borderRadius: 14,
      boxShadow: '0 10px 28px rgba(0,0,0,.35)',
      padding: 24,
      cursor: 'pointer',
      position: 'relative',
    },
    side: {
      minHeight: 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      textAlign: 'center',
      lineHeight: 1.6,
      fontSize: 20,
    },
    answerSide: { background: 'rgba(16,185,129,.08)', borderRadius: 12, padding: 12 },
    sideLabel: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: '#93c5fd',
    },
    content: { maxWidth: 740 },
    hint: { color: '#64748b', marginTop: 10, fontSize: 14 },
    controls: {
      marginTop: 18,
      display: 'flex',
      justifyContent: 'center',
      gap: 12,
      flexWrap: 'wrap',
    },
    btn: {
      padding: '10px 16px',
      background: '#1f2937',
      color: '#e5e7eb',
      border: '1px solid #374151',
      borderRadius: 10,
      cursor: 'pointer',
      minWidth: 110,
    },
    primary: { background: '#2563eb', borderColor: '#1d4ed8' },
    footer: { marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10 },
    smallBtn: {
      padding: '6px 10px',
      background: '#0ea5e9',
      border: 'none',
      borderRadius: 8,
      color: 'white',
      cursor: 'pointer',
      fontSize: 13,
    },
  };
}
