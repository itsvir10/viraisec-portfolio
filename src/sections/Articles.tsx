import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { articles } from '../lib/articles';
import { RevealText } from '../components/ui';
import ArticleCard from '../components/ArticleCard';
import { useMedia } from '../hooks/useMedia';
import { useScrollThrough } from '../hooks/usePage';
import { getLenis } from '../lib/scroll';

/**
 * On desktop this is a pinned film strip: the section holds still and
 * scrolling down slides the article cards sideways. On phones and with
 * reduced motion it is a plain vertical list.
 */
export default function Articles() {
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const wide = useMedia('(min-width: 1024px)');
  const pinned = wide && !reduced;
  const latest = articles.slice(0, 2);
  const more = articles.length - latest.length;

  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [extra, setExtra] = useState(0);

  // how far the strip has to travel = how much taller the section must be
  useEffect(() => {
    if (!pinned) return;
    const measure = () => {
      if (track.current) setExtra(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pinned, latest.length]);

  const onProgress = useCallback(
    (p: number) => {
      if (track.current) track.current.style.transform = `translate3d(${-p * extra}px, 0, 0)`;
    },
    [extra],
  );
  useScrollThrough(section, onProgress, pinned);

  // tabbing to a card that is off screen scrolls the page so the strip brings it in
  const reveal = (i: number) => {
    if (!pinned || !section.current || !track.current) return;
    section.current.querySelectorAll<HTMLElement>('[data-strip]').forEach((el) => (el.scrollLeft = 0));
    const card = track.current.children[i] as HTMLElement | undefined;
    if (!card) return;
    const top = section.current.getBoundingClientRect().top + window.scrollY;
    const y = top + Math.min(extra, Math.max(0, card.offsetLeft - 80));
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 0.8 });
    else window.scrollTo(0, y);
  };

  const heading = (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <RevealText
        text="Things I've built, written up."
        className={`font-display font-medium leading-[1.02] tracking-[-0.035em] text-white ${pinned ? 'text-5xl' : 'max-w-3xl text-5xl md:text-7xl'}`}
      />
      <p className="max-w-sm text-slate-400">No project cards. Each build gets a proper write-up: what I made, what broke and what I learned.</p>
    </div>
  );

  if (!pinned) {
    return (
      <section ref={section} id="articles" className="relative px-6 py-28 md:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-7xl">
          {heading}
          {latest.length === 0 ? (
            <p className="glass mt-12 rounded-3xl p-8 text-slate-300">The first article is on its way.</p>
          ) : (
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {latest.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          )}
          <Link to="/articles" className="glass mt-10 inline-flex rounded-full px-6 py-3 font-display text-base text-white transition-colors duration-500 hover:border-neon/50">
            {more > 0 ? `See all ${articles.length} articles` : 'See all articles'}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section ref={section} id="articles" className="relative" style={{ height: `calc(100vh + ${extra}px)` }}>
      <div data-strip className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-20">
        <div className="px-12 lg:px-20">
          <div className="mx-auto w-full max-w-7xl">{heading}</div>
        </div>

        <div ref={track} className="mt-8 flex w-max items-stretch gap-6 px-12 will-change-transform lg:px-20">
          {latest.map((a, i) => (
            <div key={a.slug} className="w-[min(46vw,640px)] shrink-0">
              <ArticleCard article={a} large onFocus={() => reveal(i)} />
            </div>
          ))}
          <Link
            to="/articles"
            onFocus={() => reveal(latest.length)}
            data-cursor="all"
            className="glass flex w-[min(30vw,380px)] shrink-0 flex-col justify-end rounded-[1.75rem] p-8 transition-colors duration-500 hover:border-neon/50"
          >
            <span className="font-display text-3xl font-medium tracking-tight text-white">See all articles</span>
            <span className="mt-2 text-slate-400">
              {more > 0 ? `${more} more, ` : ''}filter by security or AI.
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
