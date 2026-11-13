import { useCallback, useEffect, useRef, useState } from 'react';
import { boot, burst } from '../data/content';

type Phase = 'boot' | 'burst' | 'leave';

/**
 * First visit of a session: a short boot, a fast burst of security and AI
 * commands, then the terminal dissolves and the site (with the 3D graph
 * assembling underneath) comes through. Any key or click skips it.
 *
 * `onReveal` fires as the dissolve starts, so the graph's opening shot plays
 * while the terminal is fading; `onDone` fires once it has gone.
 */
export default function BootSequence({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('boot');
  const [lines, setLines] = useState<string[]>([]);
  const [typing, setTyping] = useState('');
  const [feed, setFeed] = useState<number[]>([]);
  const leaving = useRef(false);

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    setPhase('leave');
    onReveal();
    window.setTimeout(onDone, 1300);
  }, [onReveal, onDone]);

  // Driven by the clock, not by counting timer ticks, so it takes the same
  // time even while the 3D scene is loading underneath and the browser is busy.
  useEffect(() => {
    const TYPE_START = 200;
    const CHAR_MS = 14;
    const LINE_GAP = 130;
    const BURST_MS = 1900;
    // when each boot line starts typing
    const starts: number[] = [];
    let t = TYPE_START;
    for (const l of boot) {
      starts.push(t);
      t += l.length * CHAR_MS + LINE_GAP;
    }
    const burstStart = t + 80;
    const t0 = performance.now();
    let timer = 0;
    const update = () => {
      const now = performance.now() - t0;
      if (now < burstStart) {
        let done = 0;
        while (done < boot.length && now >= starts[done] + boot[done].length * CHAR_MS) done += 1;
        setLines(boot.slice(0, done));
        setTyping(done < boot.length && now >= starts[done] ? boot[done].slice(0, Math.floor((now - starts[done]) / CHAR_MS)) : '');
      } else if (now < burstStart + BURST_MS) {
        setPhase('burst');
        setLines(boot);
        setTyping('');
        // lines arrive faster and faster: n grows with the square of time
        const p = (now - burstStart) / BURST_MS;
        const n = Math.floor(6 + p * 30 + p * p * 120);
        setFeed(Array.from({ length: Math.min(n, 34) }, (_, k) => n - Math.min(n, 34) + k + 1));
      } else {
        leave();
        return;
      }
      timer = window.setTimeout(update, 30);
    };
    update();
    return () => window.clearTimeout(timer);
  }, [leave]);

  // skip with any key or a click
  useEffect(() => {
    const skip = () => leave();
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [leave]);

  const out = phase === 'leave';

  return (
    <div
      onClick={leave}
      role="status"
      aria-label="Loading the portfolio"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: out ? 'rgba(5,6,10,0)' : 'rgba(5,6,10,1)',
        transition: 'background-color 1.1s cubic-bezier(0.65,0,0.35,1) 0.15s',
      }}
    >
      <div
        className="scanlines pointer-events-none absolute inset-0"
        style={{ opacity: out ? 0 : 1, transition: 'opacity 0.8s ease' }}
      />

      <div
        className="relative w-full max-w-2xl px-7 font-mono text-[13px] leading-6 text-slate-300 md:text-sm"
        style={{
          opacity: out ? 0 : 1,
          transform: out ? 'translateY(-40px) scale(1.04)' : 'none',
          filter: out ? 'blur(10px)' : 'none',
          transition: 'opacity 0.9s ease, transform 1.1s cubic-bezier(0.16,1,0.3,1), filter 0.9s ease',
        }}
      >
        <div className="flex h-[62vh] flex-col justify-end overflow-hidden">
          {lines.map((l, i) => (
            <p key={`b${i}`} className={i === boot.length - 1 ? 'text-neon' : ''}>
              {l}
            </p>
          ))}
          {phase === 'boot' && (
            <p>
              {typing}
              <span className="boot-caret ml-0.5" />
            </p>
          )}
          {feed.map((n) => {
            const b = burst[n % burst.length];
            return (
              <p key={n} className={`truncate ${b.field === 'security' ? 'text-neon' : 'text-[#a98bff]'}`}>
                <span className="text-slate-600">{String(1000 + n * 37).slice(-4)} </span>
                {b.field === 'security' ? '$ ' : '>>> '}
                {b.text}
              </p>
            );
          })}
        </div>
      </div>

      {!out && <p className="absolute bottom-6 right-7 font-mono text-xs text-slate-600">press any key to skip</p>}
    </div>
  );
}
