import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { certs } from '../data/content';
import { RevealText } from '../components/ui';

gsap.registerPlugin(ScrollTrigger);
const EXPO = [0.16, 1, 0.3, 1] as const;

export default function Certs() {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  // The timeline line draws itself as the section scrolls into view.
  useEffect(() => {
    if (!line.current || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line.current,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'top 30%', scrub: 0.8 } },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="certs" className="relative flex min-h-[80vh] items-center px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-4xl">
          <RevealText text="Certified." className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.035em] text-white md:text-7xl" />

          <div ref={root} className="relative mt-14">
            <div className="absolute left-0 right-0 top-[7px] hidden h-px bg-white/10 md:block" />
            <div ref={line} className="bg-gradient-accent absolute left-0 right-0 top-[7px] hidden h-px origin-left md:block" />

            <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
              {certs.map((c, i) => (
                <motion.li
                  key={c.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                  transition={{ duration: 0.9, ease: EXPO, delay: i * 0.18 }}
                >
                  <span className="relative hidden h-[15px] w-[15px] rounded-full border border-neon/60 bg-ink md:block">
                    <span className="bg-gradient-accent absolute inset-[3px] rounded-full" />
                  </span>
                  <div className="glass rounded-3xl p-6 md:mt-6">
                    <h3 className="font-display text-xl font-medium leading-snug text-white">{c.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{c.issuer}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{c.detail}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
