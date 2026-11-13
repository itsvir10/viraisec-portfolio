import { useEffect, useMemo, useReducer, useRef } from 'react';
import { motion } from 'framer-motion';
import { lockScroll } from '../lib/scroll';
import { icons } from './ui';

/**
 * Contain the breach: a 30-second game.
 * An infection spreads through a small network, one machine per tick, heading
 * for the core. Click a clean machine to firewall it. An AI advisor predicts
 * the next hit; it is right most of the time, not all of it. Firewall the
 * machine the infection was really about to take and that tick is blocked.
 * Hold out until the patch deploys, or cut the infection off completely.
 */

type Status = 'clean' | 'infected' | 'wall';
type Phase = 'idle' | 'playing' | 'won' | 'lost';
const TICKS = 14;
const WALLS = 6;
const CORE = 0;

// ---- the board: a core, then three rings of machines
type Machine = { id: number; x: number; y: number; ring: number };
function buildBoard() {
  const machines: Machine[] = [{ id: 0, x: 50, y: 50, ring: 0 }];
  const rings = [
    { count: 4, radius: 15, offset: 0.4 },
    { count: 8, radius: 29, offset: 0.1 },
    { count: 12, radius: 43, offset: 0.25 },
  ];
  const start: number[] = [];
  rings.forEach((ring, r) => {
    start.push(machines.length);
    for (let k = 0; k < ring.count; k++) {
      const a = ((k + ring.offset) / ring.count) * Math.PI * 2;
      machines.push({ id: machines.length, x: 50 + Math.cos(a) * ring.radius, y: 50 + Math.sin(a) * ring.radius, ring: r + 1 });
    }
  });
  const links: [number, number][] = [];
  const [r1, r2, r3] = start;
  for (let k = 0; k < 4; k++) links.push([CORE, r1 + k], [r1 + k, r1 + ((k + 1) % 4)]);
  for (let k = 0; k < 8; k++) links.push([r2 + k, r1 + Math.floor(k / 2)], [r2 + k, r2 + ((k + 1) % 8)]);
  for (let k = 0; k < 12; k++) {
    links.push([r3 + k, r2 + Math.floor((k * 8) / 12)]);
    if (k % 2 === 0) links.push([r3 + k, r3 + ((k + 1) % 12)]);
  }
  const neighbours: number[][] = machines.map(() => []);
  links.forEach(([a, b]) => {
    neighbours[a].push(b);
    neighbours[b].push(a);
  });
  return { machines, links, neighbours, outer: Array.from({ length: 12 }, (_, k) => r3 + k) };
}

type State = {
  phase: Phase;
  status: Status[];
  tick: number;
  walls: number;
  target: number; // the machine the infection will really take next
  advice: number; // the machine the AI advisor says is next
  confidence: number;
  log: string;
};
type Action = { type: 'start' } | { type: 'wall'; id: number } | { type: 'tick' };

function makeReducer(board: ReturnType<typeof buildBoard>) {
  const frontier = (status: Status[]) =>
    board.machines.filter((m) => status[m.id] === 'clean' && board.neighbours[m.id].some((n) => status[n] === 'infected')).map((m) => m.id);

  // decide the next real hit, and what the advisor will claim
  const plan = (s: State): State => {
    const options = frontier(s.status);
    if (!options.length) return { ...s, phase: 'won', target: -1, advice: -1, log: 'Contained. The infection has nowhere left to go.' };
    // the infection prefers machines closer to the core
    const weighted = options.flatMap((id) => Array(4 - board.machines[id].ring + 1).fill(id) as number[]);
    const target = weighted[Math.floor(Math.random() * weighted.length)];
    const honest = Math.random() < 0.7 || options.length === 1;
    const others = options.filter((o) => o !== target);
    const advice = honest ? target : others[Math.floor(Math.random() * others.length)];
    const confidence = honest ? 62 + Math.floor(Math.random() * 32) : 45 + Math.floor(Math.random() * 34);
    return { ...s, target, advice, confidence };
  };

  return (s: State, a: Action): State => {
    switch (a.type) {
      case 'start': {
        const status: Status[] = board.machines.map(() => 'clean');
        const first = board.outer[Math.floor(Math.random() * 12)];
        const second = board.outer[(board.outer.indexOf(first) + 5 + Math.floor(Math.random() * 3)) % 12];
        status[first] = 'infected';
        status[second] = 'infected';
        return plan({ phase: 'playing', status, tick: 0, walls: WALLS, target: -1, advice: -1, confidence: 0, log: 'Two machines are infected. Protect the core.' });
      }
      case 'wall': {
        if (s.phase !== 'playing' || s.status[a.id] !== 'clean') return s;
        if (a.id === CORE) return { ...s, log: 'The core has to stay online. Firewall the machines around it.' };
        if (s.walls <= 0) return { ...s, log: 'No firewalls left. Hold on for the patch.' };
        const status = [...s.status];
        status[a.id] = 'wall';
        const next = { ...s, status, walls: s.walls - 1, log: `Firewall up on machine ${a.id}.` };
        // if nothing can spread any more, that is a win straight away
        return frontier(status).length ? next : plan(next);
      }
      case 'tick': {
        if (s.phase !== 'playing') return s;
        const status = [...s.status];
        let log: string;
        if (s.status[s.target] === 'wall') {
          log = `Blocked. Machine ${s.target} was next and you had it firewalled.`;
        } else {
          status[s.target] = 'infected';
          log = `Machine ${s.target} infected.`;
          if (s.target === CORE) return { ...s, status, phase: 'lost', log: 'The core is infected. Breach complete.' };
        }
        const tick = s.tick + 1;
        if (tick >= TICKS) return { ...s, status, tick, phase: 'won', target: -1, advice: -1, log: 'Patch deployed. The core held.' };
        return plan({ ...s, status, tick, log });
      }
    }
  };
}

const INITIAL: State = { phase: 'idle', status: [], tick: 0, walls: WALLS, target: -1, advice: -1, confidence: 0, log: '' };

export default function BreachGame({ onClose }: { onClose: () => void }) {
  const board = useMemo(buildBoard, []);
  const reducer = useMemo(() => makeReducer(board), [board]);
  const [s, dispatch] = useReducer(reducer, INITIAL);
  const closeRef = useRef<HTMLButtonElement>(null);

  // the infection clock: speeds up as the game goes on
  useEffect(() => {
    if (s.phase !== 'playing') return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), Math.max(1000, 1900 - s.tick * 65));
    return () => window.clearTimeout(timer);
  }, [s.phase, s.tick, s.target]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    lockScroll(true);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const clean = s.status.filter((x) => x === 'clean').length;
  const score = clean * 10 + s.walls * 15;
  const over = s.phase === 'won' || s.phase === 'lost';
  const statusOf = (id: number): Status => s.status[id] ?? 'clean';

  return (
    <motion.div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="breach-title"
        data-lenis-prevent
        className="glass-strong relative flex max-h-full w-full max-w-4xl flex-col gap-5 overflow-y-auto rounded-[2rem] p-5 md:flex-row md:gap-8 md:p-8"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close the game"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-neon/50 hover:text-white"
        >
          {icons.close}
        </button>

        {/* the network */}
        <div className="relative mx-auto aspect-square w-full max-w-[26rem] shrink-0 md:w-[26rem]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {board.links.map(([a, b], i) => {
              const hot = statusOf(a) === 'infected' && statusOf(b) === 'infected';
              return (
                <line
                  key={i}
                  x1={board.machines[a].x}
                  y1={board.machines[a].y}
                  x2={board.machines[b].x}
                  y2={board.machines[b].y}
                  stroke={hot ? '#fb7185' : '#00E5FF'}
                  strokeOpacity={hot ? 0.8 : 0.22}
                  strokeWidth={hot ? 0.5 : 0.3}
                />
              );
            })}
          </svg>
          {board.machines.map((m) => {
            const st = statusOf(m.id);
            const core = m.id === CORE;
            const advised = s.phase === 'playing' && s.advice === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={s.phase !== 'playing' || st !== 'clean'}
                onClick={() => dispatch({ type: 'wall', id: m.id })}
                data-cursor={s.phase === 'playing' && st === 'clean' && !core ? 'wall' : undefined}
                aria-label={`${core ? 'Core' : `Machine ${m.id}`}: ${st === 'wall' ? 'firewalled' : st}${advised ? ', AI advisor predicts this is next' : ''}`}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-mono text-[10px] transition-all duration-300 ${
                  core ? 'h-12 w-12 md:h-14 md:w-14' : 'h-8 w-8 md:h-9 md:w-9'
                } ${
                  st === 'infected'
                    ? 'border-rose-400 bg-rose-500/40 text-white shadow-[0_0_18px_2px_rgba(244,63,94,0.7)]'
                    : st === 'wall'
                      ? 'border-white bg-white/90 text-ink'
                      : core
                        ? 'border-ultra-soft bg-ultra/40 text-white shadow-[0_0_22px_3px_color-mix(in_srgb,var(--color-ultra)_70%,transparent)]'
                        : 'border-neon/60 bg-neon/10 text-neon enabled:hover:scale-125 enabled:hover:bg-neon/30'
                }`}
              >
                {core ? 'core' : st === 'wall' ? 'fw' : m.id}
                {advised && <span className="pointer-events-none absolute -inset-2 animate-pulse rounded-full border-2 border-dashed border-[#c4b0ff]" />}
              </button>
            );
          })}
        </div>

        {/* the panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 id="breach-title" className="pr-12 font-display text-3xl font-medium tracking-tight text-white">
            Contain the breach
          </h2>

          {s.phase === 'idle' ? (
            <>
              <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-slate-300">
                <li>An infection spreads one machine at a time, heading for the core.</li>
                <li>Click a clean machine to firewall it. You have {WALLS}.</li>
                <li>
                  The <span className="text-[#c4b0ff]">AI advisor</span> marks the machine it thinks is next with a dashed ring. It is usually right. Firewall the real next target and that hit is blocked.
                </li>
                <li>Keep the core clean until the patch deploys.</li>
              </ul>
              <button
                type="button"
                onClick={() => dispatch({ type: 'start' })}
                className="bg-gradient-accent mt-6 w-fit rounded-full px-7 py-3 font-display text-base font-medium text-ink"
              >
                Start
              </button>
            </>
          ) : (
            <>
              <div className="mt-5">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Patch deploying</span>
                  <span>{Math.round((s.tick / TICKS) * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Patch progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((s.tick / TICKS) * 100)}>
                  <div className="bg-gradient-accent h-full transition-[width] duration-500" style={{ width: `${(s.tick / TICKS) * 100}%` }} />
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  ['Firewalls', s.walls],
                  ['Clean', clean],
                  ['Score', score],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 py-3">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-0.5 font-display text-2xl text-white">{value}</dd>
                  </div>
                ))}
              </dl>

              {s.phase === 'playing' && s.advice >= 0 && (
                <p className="mt-5 rounded-2xl border border-ultra/50 bg-ultra/10 px-4 py-3 text-sm text-[#d6c8ff]">
                  AI advisor: next hit is {s.advice === CORE ? 'the core' : `machine ${s.advice}`} ({s.confidence}% sure). Trust it?
                </p>
              )}

              <p className={`mt-4 min-h-[3rem] font-mono text-sm ${s.phase === 'lost' ? 'text-rose-300' : s.phase === 'won' ? 'text-emerald-300' : 'text-slate-300'}`} role="status" aria-live="polite">
                {s.log}
              </p>

              {over && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => dispatch({ type: 'start' })} className="bg-gradient-accent rounded-full px-6 py-2.5 font-display text-base font-medium text-ink">
                    Play again
                  </button>
                  <span className="text-sm text-slate-400">{s.phase === 'won' ? `Final score ${score}.` : 'The infection reached the core.'}</span>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
