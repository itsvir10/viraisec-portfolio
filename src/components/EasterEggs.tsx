import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { certs, profile, skillsCore, skillsFoundations } from '../data/content';

/**
 * Small hidden extras:
 *  - a "visitor scan" badge that types out once per visit
 *  - a message and a hire() function in the browser console
 * The email-copy pulse burst lives in Contact.tsx.
 */

const SCAN_KEY = 'vir-scanned';

// ---------- console ----------
let consoleDone = false;
function consoleHello() {
  if (consoleDone) return;
  consoleDone = true;
  const big = 'font: 600 20px "Space Grotesk", sans-serif; color: #00e5ff;';
  const body = 'font: 13px "JetBrains Mono", monospace; color: #cbd5e1;';
  const code = 'font: 13px "JetBrains Mono", monospace; color: #a98bff;';
  console.log('%cLooking under the hood?', big);
  console.log('%cRespect. Type %chire()%c and press Enter.', body, code, body);
  (window as unknown as { hire: () => string }).hire = () => {
    const skills = [...skillsCore.flatMap((g) => g.items), ...skillsFoundations.flatMap((g) => g.items)];
    console.log(`%c${profile.short}: cyber security and AI`, big);
    console.log(`%c${profile.sub}\n${profile.location}`, body);
    console.log('%ccerts:   %c' + certs.map((c) => c.title).join(', '), code, body);
    console.log('%cskills:  %c' + skills.join(', '), code, body);
    console.log('%cemail:   %c' + profile.email, code, body);
    console.log('%cgithub:  %c' + profile.github, code, body);
    console.log('%clinkedin:%c ' + profile.linkedin, code, body);
    return 'Connection established. Talk soon.';
  };
}

// ---------- visitor scan ----------
function scanLines(): string[] {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'unknown browser';
  let place = '';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    place = tz.split('/').pop()?.replace(/_/g, ' ') ?? '';
  } catch {
    /* no timezone: skip it */
  }
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark mode' : 'light mode';
  return ['scanning visitor...', [place, browser, dark].filter(Boolean).join(' · '), 'threat level: friendly ✓'];
}

function readScanned() {
  try {
    return sessionStorage.getItem(SCAN_KEY) === '1';
  } catch {
    return false;
  }
}

function VisitorScan({ start }: { start: boolean }) {
  const [lines, setLines] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (!start || ran.current || readScanned()) return;
    ran.current = true;
    try {
      sessionStorage.setItem(SCAN_KEY, '1');
    } catch {
      /* fine: it just shows again next visit */
    }
    const all = scanLines();
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setShow(true), 1800));
    all.forEach((_, i) => timers.push(window.setTimeout(() => setLines(all.slice(0, i + 1)), 2000 + i * 900)));
    timers.push(window.setTimeout(() => setShow(false), 2000 + all.length * 900 + 3800));
    return () => timers.forEach(clearTimeout);
  }, [start]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass pointer-events-none fixed bottom-6 left-6 z-[60] hidden rounded-2xl px-4 py-3 font-mono text-xs leading-relaxed text-slate-300 md:block"
          aria-hidden="true"
        >
          {lines.map((l, i) => (
            <div key={i} className={i === 2 ? 'text-neon' : i === 0 ? 'text-slate-500' : ''}>
              <span className="text-slate-600">› </span>
              {l}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function EasterEggs({ ready }: { ready: boolean }) {
  useEffect(() => {
    consoleHello();
  }, []);
  return <VisitorScan start={ready} />;
}
