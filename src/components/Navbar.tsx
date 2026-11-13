import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { sections, profile } from '../data/content';
import { scrollToId } from '../lib/scroll';

const links = sections.filter((s) => s.id !== 'hero');

export default function Navbar({ active, scrolled, onTerminalMode }: { active: string; scrolled: boolean; onTerminalMode: () => void }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === '/';
  const current = onHome ? active : 'articles';

  const go = (id: string) => {
    setOpen(false);
    if (onHome) scrollToId(id);
    else navigate('/', { state: { section: id } }); // Home scrolls to it once mounted
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Main"
        className={`glass flex items-center justify-between gap-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled ? 'w-full max-w-4xl px-2 py-1.5' : 'w-full max-w-5xl px-3 py-2.5'
        }`}
      >
        <button
          type="button"
          onClick={() => go('hero')}
          className="rounded-full px-4 py-2 font-display text-lg font-semibold tracking-tight text-white"
          aria-label={`${profile.name}, back to top`}
        >
          vir<span className="text-neon">.</span>
        </button>

        <ul className="hidden items-center md:flex">
          {links.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => go(l.id)}
                aria-current={current === l.id ? 'true' : undefined}
                className={`relative rounded-full px-3.5 py-2 text-sm transition-colors duration-300 lg:px-4 ${
                  current === l.id ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {current === l.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border border-white/10 bg-white/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onTerminalMode}
            data-cursor="shell"
            aria-label="Switch to terminal mode"
            title="Switch to terminal mode"
            className="rounded-full border border-white/10 px-3 py-2 font-mono text-xs text-slate-300 transition-colors duration-300 hover:border-neon/60 hover:text-white"
          >
            <span className="text-neon">&gt;</span>_
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm text-slate-200 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="glass-strong absolute inset-x-4 top-[4.5rem] rounded-3xl p-3 md:hidden"
          >
            {links.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => go(l.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left font-display text-xl ${current === l.id ? 'text-neon' : 'text-white'}`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}
