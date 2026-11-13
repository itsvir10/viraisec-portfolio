import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useMedia } from './hooks/useMedia';
import { usePointer, useScrollState, useSmoothScroll } from './hooks/usePage';
import { lockScroll, scrollToTop } from './lib/scroll';
import { store } from './lib/store';
import { articles } from './lib/articles';
import BootSequence from './components/BootSequence';
import TerminalMode from './components/TerminalMode';
import Cursor from './components/Cursor';
import Navbar from './components/Navbar';
import { ProgressRail, Toaster } from './components/Chrome';
import Home from './pages/Home';

// Heavy parts load separately: the 3D scene and the article pages.
const loadScene = () => import('./components/three/Scene');
const Scene = lazy(loadScene);
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const BreachGame = lazy(() => import('./components/BreachGame'));

// one clickable node in the 3D graph per article (0 = security, 1 = AI)
const FEATURE_FIELDS = articles.slice(0, 6).map((a) => (a.field === 'ai' ? 1 : 0));

type Mode = 'gui' | 'terminal';
const MODE_KEY = 'vir-mode';
const BOOT_KEY = 'vir-booted';

function readSession(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the boot just plays again next visit */
  }
}

/** Jump to the top whenever the route changes (unless a section was requested). */
function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (!(location.state as { section?: string } | null)?.section) scrollToTop();
  }, [location.pathname, location.state]);
  return null;
}

function GraphicalSite({ ready, onTerminalMode, onPlay }: { ready: boolean; onTerminalMode: () => void; onPlay: () => void }) {
  const { pathname } = useLocation();
  const { active, scrolled } = useScrollState();
  return (
    <>
      <ScrollManager />
      <Navbar active={active} scrolled={scrolled} onTerminalMode={onTerminalMode} />
      {pathname === '/' && <ProgressRail active={active} />}
      <Suspense fallback={<main className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Home ready={ready} onTerminalMode={onTerminalMode} onPlay={onPlay} />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="*" element={<Home ready={ready} onTerminalMode={onTerminalMode} onPlay={onPlay} />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const finePointer = useMedia('(hover: hover) and (pointer: fine)');
  const mobile = useMedia('(max-width: 767px)');

  // The site always opens graphical. Terminal mode is one click away (>_ in the nav)
  // and is remembered for the rest of the session once chosen.
  const [mode, setMode] = useState<Mode>(() => (readSession(MODE_KEY) === 'terminal' ? 'terminal' : 'gui'));
  // The boot animation plays once per session, and never with reduced motion.
  const [booting, setBooting] = useState(() => !reduced && readSession(BOOT_KEY) !== '1' && mode === 'gui');
  const [revealed, setRevealed] = useState(!booting);
  const [game, setGame] = useState(false);
  const openGame = useCallback(() => setGame(true), []);
  const closeGame = useCallback(() => setGame(false), []);

  useSmoothScroll(!reduced);
  usePointer();

  useEffect(() => {
    lockScroll(booting);
    return () => lockScroll(false);
  }, [booting]);

  // the graph's opening shot starts as the boot screen dissolves
  useEffect(() => {
    store.introGo = mode === 'gui' && revealed;
  }, [mode, revealed]);

  const pick = useCallback((next: Mode) => {
    writeSession(MODE_KEY, next);
    setMode(next);
    if (next === 'gui') scrollToTop();
  }, []);
  const onReveal = useCallback(() => {
    writeSession(BOOT_KEY, '1');
    setRevealed(true);
  }, []);
  const onBootDone = useCallback(() => setBooting(false), []);

  // Hash URLs (#/articles/...) work on any static host. Inside an embedded
  // preview frame the address bar is off limits, so routing stays in memory.
  const Router = useMemo(() => {
    let framed = false;
    try {
      framed = window.self !== window.top;
    } catch {
      framed = true;
    }
    return framed ? MemoryRouter : HashRouter;
  }, []);


  return (
    <MotionConfig reducedMotion="user">
      <Router>
        {mode !== 'terminal' && (
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('about')?.scrollIntoView();
            }}
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
          >
            Skip to content
          </a>
        )}

        {booting && <BootSequence onReveal={onReveal} onDone={onBootDone} />}

        {mode === 'gui' && (
          <Suspense fallback={null}>
            <Scene mobile={mobile} reduced={reduced} finePointer={finePointer} featureFields={FEATURE_FIELDS} />
          </Suspense>
        )}
        {/* soft colour wash over the canvas: cyan one side, violet the other */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[1]"
          style={{
            background:
              'radial-gradient(60% 50% at 88% 0%, rgba(124,58,237,0.14), transparent 70%), radial-gradient(55% 48% at 0% 100%, rgba(0,229,255,0.1), transparent 70%), linear-gradient(to bottom, transparent 40%, rgba(11,15,26,0.55))',
          }}
        />
        <div className="grain" aria-hidden="true" />
        {finePointer && !reduced && <Cursor />}

        {mode === 'terminal' ? (
          <TerminalMode onGui={() => pick('gui')} onPlay={openGame} finePointer={finePointer} />
        ) : (
          // inert while the boot screen is up
          <div inert={booting}>
            <GraphicalSite ready={revealed} onTerminalMode={() => pick('terminal')} onPlay={openGame} />
          </div>
        )}

        <AnimatePresence>
          {game && (
            <Suspense fallback={null}>
              <BreachGame onClose={closeGame} />
            </Suspense>
          )}
        </AnimatePresence>

        <Toaster />
      </Router>
    </MotionConfig>
  );
}
