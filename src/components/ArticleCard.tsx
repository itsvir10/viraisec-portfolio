import { useNavigate } from 'react-router-dom';
import { Chip, TiltCard } from './ui';
import { fieldLabel, formatDate, type Article } from '../lib/articles';

export function FieldMark({ field }: { field: Article['field'] }) {
  const ai = field === 'ai';
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs ${ai ? 'border-ultra/60 bg-ultra/15 text-[#c4b0ff]' : 'border-neon/30 bg-neon/10 text-neon'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ai ? 'bg-[#a98bff]' : 'bg-neon'}`} />
      {fieldLabel(field)}
    </span>
  );
}

/** Article card. `large` is the wide film-strip version. */
export default function ArticleCard({ article, large = false, onFocus }: { article: Article; large?: boolean; onFocus?: () => void }) {
  const navigate = useNavigate();
  return (
    <div onFocus={onFocus} className="h-full">
      <TiltCard
        cursor="read"
        label={`Read article: ${article.title}`}
        onClick={() => navigate(`/articles/${article.slug}`)}
        max={large ? 4 : 7}
        className="h-full rounded-[1.75rem]"
      >
        <div className="flex h-full flex-col">
          <div className={`flex min-h-[17rem] flex-1 flex-col ${large ? 'p-7 md:p-9' : 'p-7'}`}>
            <div className="flex items-center justify-between gap-3">
              <FieldMark field={article.field} />
              <span className="text-sm text-slate-500">
                {formatDate(article.date)}, {article.minutes} min read
              </span>
            </div>
            <h3 className={`mt-8 font-display font-medium tracking-tight text-white ${large ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>{article.title}</h3>
            <p className={`mt-3 text-slate-300 ${large ? 'max-w-xl text-base' : 'text-[15px] leading-relaxed'}`}>{article.summary}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              {article.tags.slice(0, 4).map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}
