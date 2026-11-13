import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { profile } from '../data/content';
import { Magnetic, RevealText } from '../components/ui';
import { scrollToId } from '../lib/scroll';
import { store } from '../lib/store';
import NodeLayer from '../components/NodeLayer';

const EXPO = [0.16, 1, 0.3, 1] as const;

export default function Hero({ ready }: { ready: boolean }) {
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 1, ease: EXPO, delay },
  });

  // Drag anywhere on the empty part of the hero to spin the graph (mouse only,
  // so touch scrolling is never hijacked).
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dx = e.clientX - lastX;
      store.drag.yaw += dx * 0.006;
      store.drag.pitch = Math.max(-0.9, Math.min(0.9, store.drag.pitch + (e.clientY - lastY) * 0.004));
      store.drag.velocity = (dx * 0.006) / Math.max(0.008, (now - lastT) / 1000);
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };
    const onUp = () => {
      store.drag.active = false;
      store.drag.velocity = Math.max(-2.2, Math.min(2.2, store.drag.velocity));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if ((e.target as Element).closest('a, button, input, [role="button"]')) return;
      store.drag.active = true;
      store.drag.velocity = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };
    el.addEventListener('pointerdown', onDown);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      onUp();
    };
  }, []);

  return (
    <section ref={section} id="hero" className="relative flex min-h-[100svh] select-none flex-col justify-end px-6 pb-16 pt-32 md:px-12 md:pb-20 lg:px-20">
      <NodeLayer />
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <motion.p {...fade(0.7)} className="mb-5 font-display text-lg text-slate-300 md:text-xl">
          {profile.short}
        </motion.p>

        <h1 className="sr-only">
          {profile.short}. {profile.taglineLines.join(' ')}
        </h1>
        <div aria-hidden="true" className="font-display text-[clamp(2.6rem,9.2vw,8.75rem)] font-medium leading-[0.92] tracking-[-0.045em] text-white [text-shadow:0_2px_40px_rgba(5,6,10,0.6)]">
          <RevealText as="div" text={profile.taglineLines[0]} active={ready} delay={0.9} />
          <RevealText as="div" text={profile.taglineLines[1]} active={ready} delay={1.2} wordClassName="text-gradient" />
        </div>

        <div className="mt-10 flex md:justify-end">
          <motion.div {...fade(1.7)}>
            <div className="flex flex-wrap gap-3">
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollToId('articles')}
                className="bg-gradient-accent rounded-full px-7 py-3.5 font-display text-base font-medium text-ink transition-shadow duration-500 hover:shadow-[0_0_40px_-4px_rgba(0,229,255,0.7)]"
              >
                Read the articles
              </button>
            </Magnetic>
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollToId('contact')}
                className="glass rounded-full px-7 py-3.5 font-display text-base font-medium text-white transition-colors duration-500 hover:border-neon/50"
              >
                Get in touch
              </button>
            </Magnetic>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div {...fade(2.6)} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex" aria-hidden="true">
        <span className="text-xs text-slate-500">Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden bg-white/10">
          <span className="absolute inset-x-0 top-0 h-4 bg-neon [animation:hint_1.8s_cubic-bezier(0.7,0,0.3,1)_infinite]" />
        </span>
      </motion.div>
    </section>
  );
}
