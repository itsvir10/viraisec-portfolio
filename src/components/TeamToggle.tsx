import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { setTeam, useTeam, type Team } from '../lib/team';

const shield = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
  </svg>
);
const target = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

const options: { id: Team; label: string; icon: ReactNode }[] = [
  { id: 'defend', label: 'Defend', icon: shield },
  { id: 'attack', label: 'Attack', icon: target },
];

/** Blue team / red team switch: recolours the whole site and the 3D scene. */
export default function TeamToggle() {
  const team = useTeam();
  return (
    <div role="radiogroup" aria-label="Team: defend or attack" className="flex items-center rounded-full border border-white/10 p-0.5">
      {options.map((o) => {
        const on = team === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setTeam(o.id)}
            title={o.id === 'attack' ? 'Red team: break it' : 'Blue team: defend it'}
            data-cursor={o.id}
            className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors duration-300 ${on ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {on && (
              <motion.span
                layoutId="team-pill"
                className="absolute inset-0 rounded-full border border-neon/40 bg-neon/15"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative ${on ? 'text-neon' : ''}`}>{o.icon}</span>
            <span className="relative hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
