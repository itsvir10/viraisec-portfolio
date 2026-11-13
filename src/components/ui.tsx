import { useRef, type ElementType, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

const EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Heading that reveals word by word from behind a mask.
 * Uses whileInView by default; pass `active` to control it yourself.
 */
export function RevealText({
  text,
  as: Tag = 'h2',
  className = '',
  wordClassName = '',
  delay = 0,
  active,
}: {
  text: string;
  wordClassName?: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  active?: boolean;
}) {
  const words = text.split(' ');
  const control =
    active === undefined
      ? { whileInView: 'show' as const, viewport: { once: true, margin: '0px 0px -12% 0px' } }
      : { animate: active ? 'show' : 'hidden' };
  return (
    <motion.div initial="hidden" {...control}>
      <Tag className={className} aria-label={text}>
        {words.map((w, i) => (
          <span key={i} aria-hidden="true" className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
            <motion.span
              className={`inline-block will-change-transform ${wordClassName}`}
              variants={{
                hidden: { y: '115%' },
                show: { y: 0, transition: { duration: 1, ease: EXPO, delay: delay + i * 0.07 } },
              }}
            >
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </Tag>
    </motion.div>
  );
}

/** Wrapper that pulls its child toward the cursor. */
export function Magnetic({ children, strength = 0.35, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });
  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Glass card that tilts in 3D toward the cursor with a moving glare. */
export function TiltCard({
  children,
  className = '',
  onClick,
  cursor,
  label,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  cursor?: string;
  label?: string;
  max?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const spring = { stiffness: 180, damping: 18, mass: 0.5 };
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useSpring(0, { stiffness: 120, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(460px circle at ${gx}% ${gy}%, rgba(255,255,255,0.13), rgba(0,229,255,0.05) 35%, transparent 65%)`;

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      data-cursor={cursor}
      onClick={onClick}
      className={`glass group relative block w-full overflow-hidden text-left ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * 2 * max);
        rx.set(-(py - 0.5) * 2 * max);
        gx.set(px * 100);
        gy.set(py * 100);
        glareOpacity.set(1);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
        glareOpacity.set(0);
      }}
    >
      {children}
      <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: glare, opacity: glareOpacity }} />
    </motion.button>
  );
}

export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[13px] text-slate-200 ${className}`}>
      {children}
    </span>
  );
}

export const icons = {
  github: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
};
