import { useEffect, useState } from 'react';
import { articles } from '../lib/articles';
import { store } from '../lib/store';
import ArticleCard from '../components/ArticleCard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'security', label: 'Security' },
  { id: 'ai', label: 'AI' },
] as const;

export default function ArticlesPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const shown = articles.filter((a) => filter === 'all' || a.field === filter);

  useEffect(() => {
    store.page = 'article';
    document.title = 'Articles | Virdhawal Jadhav';
    return () => {
      store.page = 'home';
      document.title = 'Virdhawal Jadhav | Cyber Security and AI';
    };
  }, []);

  return (
    <main className="relative z-10 min-h-screen px-6 pb-24 pt-36 md:px-12 lg:px-20">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.035em] text-white md:text-7xl">Articles</h1>
        <p className="mt-5 max-w-xl text-lg text-slate-400">Write-ups of things I have built, in security and in AI.</p>

        <div className="mt-9 flex gap-2" role="group" aria-label="Filter articles by field">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-5 py-2 text-sm transition-colors duration-300 ${
                filter === f.id ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="glass mt-10 rounded-3xl p-8 text-slate-300">Nothing in this field yet. Pick another filter.</p>
        ) : (
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {shown.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
