"use client"
import { useMemo, useState } from "react"

/**
 * Node-Voltage Analysis — Randomized Practice (JS-only)
 * ----------------------------------------------------
 * - Single-file Next.js `page.js` for the /app router.
 * - No external UI libraries (just Tailwind classes if present in the project).
 * - Generates fresh problems on demand with fully worked solutions.
 */
export default function Page() {
  const [seed, setSeed] = useState(() => Date.now())
  const [revealAll, setRevealAll] = useState(false)

  const problems = useMemo(() => generateProblemSet(seed), [seed])

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Node‑Voltage Analysis — Random Practice</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Fresh problems every time. Click <em>New Set</em> to regenerate. Toggle each solution or reveal all.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
              onClick={() => setSeed(Date.now())}
            >
              New Set
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100"
              onClick={() => setRevealAll(v => !v)}
            >
              {revealAll ? "Hide All Solutions" : "Reveal All Solutions"}
            </button>
          </div>
        </header>

        <ol className="space-y-5">
          {problems.map((p, idx) => (
            <ProblemCard key={p.id} idx={idx + 1} problem={p} revealAll={revealAll} />
          ))}
        </ol>

        <footer className="mt-10 text-xs text-neutral-500">
          JS-only • Works offline • Generated with simple KCL + Ohm’s law
        </footer>
      </div>
    </main>
  )
}

// ===================== Problem Card =====================
function ProblemCard({ idx, problem, revealAll }) {
  const [open, setOpen] = useState(false)
  const shown = open || revealAll
  return (
    <li className="rounded-2xl bg-white border border-neutral-200 shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold text-lg">{idx}. {problem.title}</h2>
          <button
            className="text-sm px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100"
            onClick={() => setOpen(v => !v)}
          >
            {shown ? "Hide" : "Show"} solution
          </button>
        </div>
        <p className="mt-2 whitespace-pre-wrap leading-relaxed">{problem.statement}</p>
        {problem.ascii && (
          <pre className="mt-3 p-3 rounded-xl bg-neutral-50 border text-xs overflow-auto">
            {problem.ascii}
          </pre>
        )}
        {shown && (
          <div className="mt-4 border-t pt-3">
            <h3 className="font-medium">Solution</h3>
            <div className="mt-2 space-y-2 text-sm leading-relaxed">
              {problem.solution.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {problem.answer && (
                <p className="mt-2 font-semibold">Answer: {problem.answer}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  )
}

// ===================== Generators =====================
function generateProblemSet(seed) {
  const rnd = makeRNG(seed)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const Vs = [5, 9, 10, 12, 15]
  const Rs = [2, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30]

  const problems = []

  // 1) Voltage differences between nodes
  for (let k = 0; k < 2; k++) {
    const v1 = pick([10, 8, 6, 5, 3])
    const v2 = pick([4, -2, -3, 0, 1])
    const v3 = pick([-6, -5, -8, -1])
    const q = {
      id: `pdiff-${k}-${seed}`,
      title: "Compute voltage differences between nodes",
      statement:
        `Given node voltages (relative to ground): V1 = ${v1} V, V2 = ${v2} V, V3 = ${v3} V.\n` +
        `Find: (a) v12 = V1 − V2, (b) v13 = V1 − V3, (c) v23 = V2 − V3. State signs/polarity.`,
      solution: [
        `Use vXY = VX − VY.`,
        `v12 = ${v1} − (${v2}) = ${fmt(v1 - v2)} V`,
        `v13 = ${v1} − (${v3}) = ${fmt(v1 - v3)} V`,
        `v23 = ${v2} − (${v3}) = ${fmt(v2 - v3)} V`,
      ],
      answer: `v12 = ${fmt(v1 - v2)} V, v13 = ${fmt(v1 - v3)} V, v23 = ${fmt(v2 - v3)} V`,
    }
    problems.push(q)
  }

  // 2) Two-resistor divider (source → R1 → node → R2 → ground)
  for (let k = 0; k < 2; k++) {
    const vs = pick(Vs)
    const R1 = pick(Rs)
    const R2 = pick(Rs.filter(r => r !== R1))
    const Vx = vs * (R2 / (R1 + R2))
    const q = {
      id: `divider-${k}-${seed}`,
      title: "Node voltage in a two‑resistor divider",
      ascii:
`  +${vs}V ── R1=${R1}Ω ──• Vx ── R2=${R2}Ω ── GND`,
      statement:
        `Find node voltage Vx using KCL/Ohm’s law. (Source ${vs} V to R1, node Vx, R2 to ground.)`,
      solution: [
        `KCL at node: (Vs − Vx)/R1 = Vx/R2`,
        `⇒ Vs/R1 = Vx(1/R1 + 1/R2) ⇒ Vx = Vs * (R2/(R1 + R2))`,
        `Numeric: Vx = ${vs} * (${R2}/(${R1}+${R2})) = ${fmt(Vx)} V`,
      ],
      answer: `${fmt(Vx)} V`,
    }
    problems.push(q)
  }

  // 3) One input resistor, two shunt resistors to ground (R2 ∥ R3)
  for (let k = 0; k < 2; k++) {
    const vs = pick(Vs)
    const R1 = pick(Rs)
    const R2 = pick(Rs)
    const R3 = pick(Rs)
    const inv = (x) => 1 / x
    const Vx = vs / (1 + R1 * (inv(R2) + inv(R3)))
    const Req = 1 / (inv(R2) + inv(R3))
    const q = {
      id: `threeleg-${k}-${seed}`,
      title: "Node with two shunt resistors (use KCL)",
      ascii:
`  +${vs}V ── R1=${R1}Ω ──• Vx ──┬─ R2=${R2}Ω ── GND\n                     └─ R3=${R3}Ω ── GND`,
      statement:
        `Find Vx. R1 from source to node; R2 and R3 from node to ground.`,
      solution: [
        `KCL: (Vs − Vx)/R1 = Vx/R2 + Vx/R3`,
        `⇒ Vs − Vx = Vx * R1 * (1/R2 + 1/R3)`,
        `⇒ Vx = Vs / (1 + R1(1/R2 + 1/R3))`,
        `Parallel check: R2 ∥ R3 = ${fmt(Req)} Ω, so Vx = Vs * (Req / (R1 + Req)) = ${fmt(Vx)} V`,
      ],
      answer: `${fmt(Vx)} V`,
    }
    problems.push(q)
  }

  // 4) Current through a resistor between two nodes
  for (let k = 0; k < 1; k++) {
    const V1 = pick([12, 10, 8, 6])
    const V2 = pick([4, 2, 0, -2])
    const R = pick(Rs)
    const i = (V1 - V2) / R
    problems.push({
      id: `ir-${k}-${seed}`,
      title: "Current through a resistor between nodes",
      statement: `Given V1 = ${V1} V, V2 = ${V2} V with a resistor R = ${R} Ω between them (from node 1 to node 2). Find current i (positive from 1→2).`,
      solution: [
        `Ohm’s law with node voltages: i = (V1 − V2)/R`,
        `i = (${V1} − ${V2})/${R} = ${fmt(i)} A`,
      ],
      answer: `${fmt(i)} A (positive means 1→2)`,
    })
  }

  // 5) Two-node coupled system (solve 2×2)
  for (let k = 0; k < 1; k++) {
    const vs = pick(Vs)
    const R1 = pick(Rs)
    const R2 = pick(Rs)
    const R3 = pick(Rs)
    const R4 = pick(Rs)

    // Node A connected to Vs via R1, to ground via R2, and to node B via R3.
    // Node B connected to node A via R3 and to ground via R4.
    // KCL@A: (Vs−Va)/R1 = Va/R2 + (Va−Vb)/R3
    // KCL@B: (Va−Vb)/R3 = Vb/R4

    const g1 = 1 / R1, g2 = 1 / R2, g3 = 1 / R3, g4 = 1 / R4

    // Arrange as A·x = b where x=[Va,Vb]
    // From KCL@A: g1*Vs = Va(g1+g2+g3) − Vb*g3
    // From KCL@B: 0 = Va*g3 − Vb(g3+g4)
    const A = [
      [g1 + g2 + g3, -g3],
      [g3, -(g3 + g4)],
    ]
    const b = [g1 * vs, 0]
    const [Va, Vb] = solve2x2(A, b)

    problems.push({
      id: `2node-${k}-${seed}`,
      title: "Solve a two‑node coupled KCL system",
      ascii:
`  +${vs}V ── R1=${R1}Ω ──• Va ──┬─ R2=${R2}Ω ── GND\n                      │\n                      └─ R3=${R3}Ω ──• Vb ── R4=${R4}Ω ── GND`,
      statement:
        `Write KCL at nodes A and B and solve for Va and Vb.`,
      solution: [
        `KCL@A: (Vs−Va)/R1 = Va/R2 + (Va−Vb)/R3`,
        `KCL@B: (Va−Vb)/R3 = Vb/R4`,
        `Rewrite in conductances (g=1/R) →`,
        `g1*Vs = Va(g1+g2+g3) − Vb*g3`,
        `0 = Va*g3 − Vb(g3+g4)`,
        `Solve the 2×2 system A·x=b → Va = ${fmt(Va)} V, Vb = ${fmt(Vb)} V`,
      ],
      answer: `Va = ${fmt(Va)} V, Vb = ${fmt(Vb)} V`,
    })
  }

  return problems
}

// ===================== Utilities =====================
function makeRNG(seed) {
  // Simple mulberry32 PRNG
  let t = (seed >>> 0) + 0x6D2B79F5
  return function () {
    t += 0x6D2B79F5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function fmt(n) {
  // Format to 2 or 3 significant decimals depending on magnitude
  const a = Math.abs(n)
  if (a >= 10) return n.toFixed(2)
  if (a >= 1) return n.toFixed(3)
  return n.toFixed(4)
}

function solve2x2(A, b) {
  const [[a, b1], [c, d]] = A
  const [e, f] = b
  const det = a * d - b1 * c
  const Va = (e * d - b1 * f) / det
  const Vb = (a * f - e * c) / det
  return [Va, Vb]
}
