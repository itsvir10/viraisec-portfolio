import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { certs, type Cert } from '../data/content';
import { RevealText, icons } from '../components/ui';
import { lockScroll } from '../lib/scroll';

gsap.registerPlugin(ScrollTrigger);
const EXPO = [0.16, 1, 0.3, 1] as const;

function fieldStyle(field: Cert['field']) {
  if (field === 'security') return { label: 'Security', cls: 'border-neon/30 bg-neon/10 text-neon' };
  if (field === 'ai') return { label: 'AI', cls: 'border-ultra/60 bg-ultra/15 text-[#c4b0ff]' };
  return { label: 'Foundations', cls: 'border-white/15 bg-white/[0.06] text-slate-200' };
}

/** Pop-up with what a certificate is, who issued it and what it covers. */
function CertModal({ cert, onClose }: { cert: Cert; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    lockScroll(true);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const f = fieldStyle(cert.field);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-title"
        data-lenis-prevent
        className="glass-strong relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[2rem] p-7 md:p-9"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.5, ease: EXPO }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close certificate details"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-neon/50 hover:text-white"
        >
          {icons.close}
        </button>

        <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs ${f.cls}`}>{f.label}</span>
        <h3 id="cert-title" className="mt-4 pr-12 font-display text-3xl font-medium tracking-tight text-white">
          {cert.title}
        </h3>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500">Issued by</dt>
          <dd className="text-slate-200">{cert.issuer}</dd>
          <dt className="text-slate-500">Details</dt>
          <dd className="text-slate-200">{cert.detail}</dd>
        </dl>

        <p className="mt-6 text-[15px] leading-relaxed text-slate-300">{cert.about}</p>

        <h4 className="mt-7 font-display text-lg font-medium text-white">What it covers</h4>
        <ul className="mt-3 space-y-2.5">
          {cert.outcomes.map((o) => (
            <li key={o} className="flex gap-3 text-[15px] leading-relaxed text-slate-200">
              <span className="bg-gradient-accent mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full" />
              {o}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export default function Certs() {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Cert | null>(null);

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
          <p className="mt-5 text-slate-400">Open any certificate to see what it covers.</p>

          <div ref={root} className="relative mt-12">
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
                  <button
                    type="button"
                    data-cursor="open"
                    onClick={() => setOpen(c)}
                    aria-label={`${c.title}: show details`}
                    className="glass group block w-full rounded-3xl p-6 text-left transition-colors duration-300 hover:border-neon/40 md:mt-6"
                  >
                    <h3 className="font-display text-xl font-medium leading-snug text-white">{c.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{c.issuer}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{c.detail}</p>
                    <p className="mt-5 text-sm text-slate-400 transition-colors group-hover:text-white">View details</p>
                  </button>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <AnimatePresence>{open && <CertModal cert={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}
