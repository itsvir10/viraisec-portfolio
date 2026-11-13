import { RevealText } from '../components/ui';
import TerminalShell from '../components/TerminalShell';

export default function Terminal({ onFull, onPlay }: { onFull: () => void; onPlay: () => void }) {
  return (
    <section id="terminal" className="relative flex min-h-screen items-center px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="ml-auto max-w-3xl">
          <RevealText text="Ask the terminal." className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.035em] text-white md:text-7xl" />
          <p className="mt-5 max-w-lg text-lg text-slate-400">
            Prefer a shell to a scroll bar? Everything on this site is one command away, articles included.
          </p>
          <TerminalShell variant="section" onFull={onFull} onPlay={onPlay} className="mt-10" />

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl font-medium tracking-tight text-white">Contain the breach</p>
              <p className="mt-1 text-slate-400">A 30-second game. An infection is spreading, and the AI advisor is only mostly right.</p>
            </div>
            <button
              type="button"
              onClick={onPlay}
              className="glass w-fit shrink-0 rounded-full px-6 py-3 font-display text-base text-white transition-colors duration-500 hover:border-neon/50"
            >
              Play the game
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
