import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sections } from '../data/content';
import { scrollToId } from '../lib/scroll';
import { onToast } from '../lib/toast';

/** Vertical progress rail on the right edge with a dot per section. */
export function ProgressRail({ active }: { active: string }) {
  const fill = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (fill.current) fill.current.style.transform = `scaleY(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <div className="relative flex h-56 flex-col items-center justify-between">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div ref={fill} className="bg-gradient-accent absolute inset-y-0 left-1/2 w-px origin-top -translate-x-1/2" style={{ transform: 'scaleY(0)' }} />
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToId(s.id)}
            aria-label={`Go to ${s.label}`}
            className="group relative flex h-4 w-4 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                active === s.id ? 'h-2 w-2 bg-neon shadow-[0_0_10px_2px_rgba(0,229,255,0.7)]' : 'h-1 w-1 bg-white/40 group-hover:bg-white'
              }`}
            />
            <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-full bg-black/60 px-2.5 py-1 text-xs text-slate-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toaster() {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  useEffect(() => {
    let timer = 0;
    const off = onToast((text) => {
      setMsg({ id: Date.now(), text });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 2600);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[80] flex justify-center" role="status" aria-live="polite">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong rounded-full px-5 py-3 text-sm text-white"
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
