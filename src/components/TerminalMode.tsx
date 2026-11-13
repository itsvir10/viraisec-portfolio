import TerminalShell from './TerminalShell';
import { profile } from '../data/content';

/** Full-screen terminal: the whole site through commands, no 3D. */
export default function TerminalMode({ onGui, onPlay, finePointer }: { onGui: () => void; onPlay: () => void; finePointer: boolean }) {
  return (
    <main className="fixed inset-0 z-30 flex flex-col bg-ink p-3 md:p-6">
      <div className="scanlines pointer-events-none absolute inset-0" aria-hidden="true" />
      <h1 className="sr-only">{profile.name}: terminal mode</h1>
      <TerminalShell
        variant="full"
        onGui={onGui}
        onPlay={onPlay}
        autoFocus={finePointer}
        className="relative mx-auto w-full max-w-5xl flex-1"
        headerExtra={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGui();
            }}
            className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-slate-300 transition-colors duration-300 hover:border-neon/60 hover:text-white"
          >
            Switch to graphical
          </button>
        }
      />
    </main>
  );
}
