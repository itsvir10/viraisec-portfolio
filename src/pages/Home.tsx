import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sections } from '../data/content';
import { useSectionMeasure } from '../hooks/usePage';
import { scrollToId } from '../lib/scroll';
import Hero from '../sections/Hero';
import About from '../sections/About';
import Skills from '../sections/Skills';
import Articles from '../sections/Articles';
import Certs from '../sections/Certs';
import Terminal from '../sections/Terminal';
import Contact from '../sections/Contact';

const SECTION_IDS = sections.map((s) => s.id);

export default function Home({ ready, onTerminalMode, onPlay }: { ready: boolean; onTerminalMode: () => void; onPlay: () => void }) {
  const location = useLocation();
  useSectionMeasure(SECTION_IDS);

  // Arriving from an article page with a section to jump to.
  useEffect(() => {
    const section = (location.state as { section?: string } | null)?.section;
    if (!section) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(section, true)));
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.state]);

  return (
    <main className="relative z-10">
      <Hero ready={ready} />
      <About />
      <Skills />
      <Articles />
      <Certs />
      <Terminal onFull={onTerminalMode} onPlay={onPlay} />
      <Contact />
    </main>
  );
}
