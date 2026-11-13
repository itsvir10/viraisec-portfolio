import { Suspense, lazy, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articles, formatDate, getArticle } from '../lib/articles';
import { store } from '../lib/store';
import { Chip, icons } from '../components/ui';
import { FieldMark } from '../components/ArticleCard';

// The Markdown renderer and syntax highlighter only load when an article opens.
const Markdown = lazy(() => import('../components/Markdown'));

function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[55] h-0.5" aria-hidden="true">
      <div ref={bar} className="bg-gradient-accent h-full origin-left" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
}

export default function ArticlePage() {
  const { slug = '' } = useParams();
  const article = getArticle(slug);

  useEffect(() => {
    store.page = 'article';
    return () => {
      store.page = 'home';
    };
  }, []);
  useEffect(() => {
    if (article) document.title = `${article.title} | Virdhawal Jadhav`;
    return () => {
      document.title = 'Virdhawal Jadhav | Cyber Security and AI';
    };
  }, [article]);

  if (!article) {
    return (
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl font-medium text-white">That article does not exist.</h1>
        <p className="mt-4 text-slate-400">It may have been renamed or not published yet.</p>
        <Link to="/articles" className="glass mt-8 rounded-full px-6 py-3 text-white">
          See all articles
        </Link>
      </main>
    );
  }

  const index = articles.findIndex((a) => a.slug === article.slug);
  const newer = articles[index - 1];
  const older = articles[index + 1];

  return (
    <main className="relative z-10 px-6 pb-24 pt-32 md:px-12">
      <ReadingProgress />
      <article className="mx-auto w-full max-w-[72ch]">
        <Link to="/articles" className="text-sm text-slate-400 transition-colors hover:text-white">
          All articles
        </Link>

        <header className="mt-8">
          <FieldMark field={article.field} />
          <h1 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-white md:text-6xl">{article.title}</h1>
          {article.summary && <p className="mt-5 text-xl leading-relaxed text-slate-300">{article.summary}</p>}
          <p className="mt-5 text-sm text-slate-500">
            {formatDate(article.date)}, {article.minutes} min read
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
          {article.repo && (
            <a
              href={article.repo}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white transition-colors hover:border-neon/60"
            >
              {icons.github}
              Code and full steps on GitHub
            </a>
          )}
        </header>


        <div className="glass-strong mt-10 rounded-[1.75rem] px-6 py-8 md:px-10 md:py-10">
          <Suspense fallback={<p className="text-slate-400">Loading article...</p>}>
            <Markdown source={article.body} />
          </Suspense>
        </div>

        <nav aria-label="More articles" className="mt-10 grid gap-4 sm:grid-cols-2">
          {older ? (
            <Link to={`/articles/${older.slug}`} className="glass rounded-3xl p-6 transition-colors duration-300 hover:border-neon/50">
              <span className="text-sm text-slate-500">Previous</span>
              <span className="mt-1 block font-display text-lg text-white">{older.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {newer && (
            <Link to={`/articles/${newer.slug}`} className="glass rounded-3xl p-6 text-right transition-colors duration-300 hover:border-neon/50">
              <span className="text-sm text-slate-500">Next</span>
              <span className="mt-1 block font-display text-lg text-white">{newer.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </main>
  );
}
