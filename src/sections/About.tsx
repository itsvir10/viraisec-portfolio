import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { about } from '../data/content';
import { RevealText } from '../components/ui';
import { useMedia } from '../hooks/useMedia';
import { useScrollThrough } from '../hooks/usePage';

const EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * A pinned scene on desktop: the section holds still while the sphere tears
 * into its two halves, and each paragraph arrives as its cluster forms.
 * On phones and with reduced motion it is a normal section with everything visible.
 */
export default function About() {
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const wide = useMedia('(min-width: 1024px)');
  const pinned = wide && !reduced;

  const section = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const onProgress = useCallback((p: number) => setStage(p > 0.62 ? 3 : p > 0.42 ? 2 : p > 0.2 ? 1 : 0), []);
  useScrollThrough(section, onProgress, pinned);

  const at = (n: number) => !pinned || stage >= n;
  const show = (n: number) => ({
    initial: false as const,
    animate: at(n) ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 18, filter: 'blur(6px)' },
    transition: { duration: 0.9, ease: EXPO },
  });

  return (
    <section ref={section} id="about" className={`relative ${pinned ? 'h-[240vh]' : ''}`}>
      <div className={`flex items-center px-6 md:px-12 lg:px-20 ${pinned ? 'sticky top-0 h-screen' : 'min-h-screen py-28'}`}>
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-xl">
            <RevealText text={about.heading} className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.035em] text-white md:text-7xl" />

            <div className="mt-9 space-y-6 text-lg leading-relaxed text-slate-300 md:text-xl">
              {about.paragraphs.map((p, i) => (
                <motion.p key={p.field} {...show(i + 1)} className={`border-l-2 pl-5 ${p.field === 'security' ? 'border-neon/70' : 'border-ultra'}`}>
                  {p.text}
                </motion.p>
              ))}
            </div>

            <motion.div {...show(3)}>
              <ul className="mt-9 flex flex-wrap gap-2.5" aria-label="Highlights">
                {about.chips.map((c) => (
                  <li key={c} className="glass rounded-full px-4 py-2 text-sm font-medium text-white">
                    <span className="bg-gradient-accent mr-2.5 inline-block h-1.5 w-1.5 rounded-full align-middle" />
                    {c}
                  </li>
                ))}
              </ul>

              <dl className="mt-9 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-white/10 pt-7 sm:grid-cols-2">
                {about.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-sm text-slate-500">{f.label}</dt>
                    <dd className="mt-1 text-[15px] text-slate-100">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </div>

        {/* captions under the two clusters in the 3D scene */}
        {pinned && (
          <div className="pointer-events-none absolute inset-0 font-mono text-xs" aria-hidden="true">
            <motion.p {...show(1)} className="absolute left-[62%] top-[73%] -translate-x-1/2 text-center text-neon">
              computer network
              <span className="mt-1 block font-sans text-slate-500">devices, links, alerts</span>
            </motion.p>
            <motion.p {...show(2)} className="absolute left-[86%] top-[73%] -translate-x-1/2 text-center text-[#c4b0ff]">
              neural network
              <span className="mt-1 block font-sans text-slate-500">layers, neurons, signals</span>
            </motion.p>
          </div>
        )}
      </div>
    </section>
  );
}
