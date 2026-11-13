import { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor: a dot that tracks exactly and a ring that lags behind.
 * The ring grows over links and buttons; elements with data-cursor="text"
 * show that text inside it.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('has-cursor');
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const lag = { ...pos };
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      setVisible(true);
      const el = (e.target as Element | null)?.closest?.('[data-cursor], a, button, input, [role="button"]');
      setHover(!!el);
      setLabel(el?.getAttribute('data-cursor') ?? '');
    };
    const loop = () => {
      lag.x += (pos.x - lag.x) * 0.16;
      lag.y += (pos.y - lag.y) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    const onDown = () => setDown(true);
    // a click often changes what is under the cursor (page change, modal), so drop the label until the next move
    const onClick = () => setLabel('');
    const onUp = () => setDown(false);
    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('click', onClick);
    document.documentElement.addEventListener('pointerleave', onLeave);
    frame = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('click', onClick);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const size = label ? 84 : hover ? 56 : 34;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]" style={{ opacity: visible ? 1 : 0 }}>
      <div ref={ring} className="absolute left-0 top-0">
        <div
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[width,height,background-color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: size * (down ? 0.85 : 1),
            height: size * (down ? 0.85 : 1),
            borderColor: hover ? 'color-mix(in srgb, var(--color-neon) 90%,transparent)' : 'rgba(255,255,255,0.4)',
            backgroundColor: label ? 'rgba(5,6,10,0.55)' : 'transparent',
          }}
        >
          <span className="font-mono text-[11px] text-white">{label}</span>
        </div>
      </div>
      <div ref={dot} className="absolute left-0 top-0">
        <div
          className="h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon shadow-[0_0_12px_2px_color-mix(in_srgb,var(--color-neon)_80%,transparent)] transition-opacity duration-200"
          style={{ opacity: label ? 0 : 1 }}
        />
      </div>
    </div>
  );
}
