import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { store } from '../lib/store';
import { setLenis } from '../lib/scroll';

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scrolling, driven by the GSAP ticker and synced with ScrollTrigger. */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ lerp: 0.09 });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, [enabled]);
}

/** Measures where each section sits on the page so the 3D scene can follow. */
export function useSectionMeasure(ids: readonly string[]) {
  useEffect(() => {
    const measure = () => {
      store.sections = ids
        .map((id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { id, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      store.sections = [];
    };
  }, [ids]);
}

/** Tracks the pointer in normalised coordinates for the 3D scene. */
export function usePointer() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') store.mouse.active = true;
      store.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
}

/** Which section is under the middle of the screen, plus overall progress. */
export function useScrollState() {
  const [active, setActive] = useState('hero');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.scrollY + window.innerHeight / 2;
      let current = store.sections[0]?.id ?? 'hero';
      for (const s of store.sections) if (mid >= s.top) current = s.id;
      setActive(current);
      setScrolled(window.scrollY > 40);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return { active, scrolled };
}

/**
 * Calls back with how far the viewport has travelled through an element:
 * 0 when its top reaches the top of the screen, 1 when its bottom reaches the bottom.
 * Used by the pinned scenes.
 */
export function useScrollThrough(ref: { current: HTMLElement | null }, onProgress: (p: number) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      onProgress(span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : r.top < window.innerHeight * 0.6 ? 1 : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, onProgress, enabled]);
}
