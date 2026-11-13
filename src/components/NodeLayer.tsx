import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articles, fieldLabel } from '../lib/articles';
import { store } from '../lib/store';

// Small made-up readouts for ordinary nodes, stable per node.
function detail(index: number, field: number) {
  if (field === 0) {
    const port = [22, 443, 1514, 1515, 3389, 55000][index % 6];
    return `10.0.${index % 4}.${10 + index} · port ${port} · up`;
  }
  return `layer ${1 + (index % 5)} · neuron ${index} · ReLU · a=${(0.1 + ((index * 37) % 90) / 100).toFixed(2)}`;
}

/**
 * The clickable layer over the 3D graph in the hero. The graph reports where
 * its article nodes are on screen; this draws a real button on each one, so
 * they work with a mouse, touch and the keyboard. Hovering any other node
 * shows a small technical readout.
 */
export default function NodeLayer() {
  const navigate = useNavigate();
  const spots = useRef<(HTMLDivElement | null)[]>([]);
  const tip = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(-1);
  const featured = articles.slice(0, 6);
  const [hovered, setHovered] = useState(-1);

  // hold the graph still while a card is showing
  const pinnedSpot = useRef(-1);
  useEffect(() => {
    pinnedSpot.current = open >= 0 ? open : hovered;
    store.hold = open >= 0 || hovered >= 0;
    return () => {
      store.hold = false;
    };
  }, [open, hovered]);

  useEffect(() => {
    let frame = 0;
    let lastTip = -2;
    const loop = () => {
      featured.forEach((_, i) => {
        const el = spots.current[i];
        const f = store.features[i];
        if (!el) return;
        // stay clear of the nav bar and the buttons along the bottom of the hero
        const show = !!f?.show && f.y > 96 && f.y < window.innerHeight - 190;
        // a spot with its card showing stays put, so the card does not wobble under the cursor
        if (f && pinnedSpot.current !== i) {
          el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
          // keep the label and card on screen near the right and bottom edges
          el.dataset.flipx = String(f.x > window.innerWidth - 330 && f.x > window.innerWidth / 2);
          el.dataset.flipy = String(f.y > window.innerHeight - 300);
        }
        el.style.opacity = show ? '1' : '0';
        el.style.visibility = show ? 'visible' : 'hidden';
      });
      const h = store.hover;
      if (tip.current) {
        if (h.index >= 0 && !store.hold) {
          tip.current.style.transform = `translate3d(${h.x + 14}px, ${h.y + 12}px, 0)`;
          if (h.index !== lastTip) tip.current.textContent = detail(h.index, h.field);
          tip.current.style.opacity = '1';
          tip.current.style.color = h.field === 0 ? 'var(--color-neon-soft)' : 'var(--color-ultra-soft)';
        } else {
          tip.current.style.opacity = '0';
        }
        lastTip = h.index;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [featured.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {featured.map((a, i) => {
        const ai = a.field === 'ai';
        return (
          <div
            key={a.slug}
            ref={(el) => {
              spots.current[i] = el;
            }}
            className="group pointer-events-auto absolute left-0 top-0 transition-opacity duration-300"
            style={{ opacity: 0, visibility: 'hidden', zIndex: open === i || hovered === i ? 10 : 0 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => {
              setHovered(-1);
              setOpen((o) => (o === i ? -1 : o));
            }}
            onFocus={() => setHovered(i)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(-1);
            }}
          >
            <button
              type="button"
              data-cursor="open"
              aria-expanded={open === i}
              aria-label={`${a.title}: show details`}
              onClick={() => setOpen((o) => (o === i ? -1 : i))}
              className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border ${
                ai ? 'border-ultra-soft/70' : 'border-neon/70'
              }`}
            >
              <span className={`absolute inset-0 animate-ping rounded-full border ${ai ? 'border-ultra-soft/40' : 'border-neon/40'} [animation-duration:2.4s]`} />
            </button>
            <span className={`pointer-events-none absolute left-7 top-[-0.6rem] whitespace-nowrap font-mono text-[11px] group-data-[flipx=true]:left-auto group-data-[flipx=true]:right-7 ${ai ? 'text-[#c4b0ff]' : 'text-neon'}`}>
              {a.slug}
            </span>

            <div
              className={`glass-strong absolute left-4 top-3 w-72 max-w-[72vw] rounded-2xl p-5 transition-all duration-300 group-data-[flipx=true]:left-auto group-data-[flipx=true]:right-4 group-data-[flipy=true]:bottom-3 group-data-[flipy=true]:top-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
                open === i ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0'
              }`}
            >
              <p className={`text-xs ${ai ? 'text-[#c4b0ff]' : 'text-neon'}`}>{fieldLabel(a.field)}</p>
              <p className="mt-1.5 font-display text-lg font-medium leading-snug text-white">{a.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{a.summary}</p>
              <p className="mt-3 font-mono text-[11px] text-slate-500">{a.tags.slice(0, 4).join(' · ')}</p>
              <button
                type="button"
                onClick={() => navigate(`/articles/${a.slug}`)}
                className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:border-neon/60"
              >
                Read the article
              </button>
            </div>
          </div>
        );
      })}
      <div
        ref={tip}
        aria-hidden="true"
        className="absolute left-0 top-0 whitespace-nowrap rounded-md bg-ink/80 px-2 py-1 font-mono text-[11px] opacity-0 transition-opacity duration-200"
      />
    </div>
  );
}
