import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { about, certs, profile, skillsCore, skillsFoundations } from '../data/content';
import { articles, fieldLabel, formatDate, getArticle, toTerminalLines } from '../lib/articles';

type Line = { kind: 'in' | 'out' | 'ok' | 'err'; body: ReactNode };

const BASE = ['help', 'whoami', 'about', 'skills', 'articles', 'read', 'certs', 'contact', 'socials', 'clear', 'matrix', 'sudo hire-me', 'play breach', 'gui', 'terminal'];
const COMPLETIONS = [...BASE.filter((c) => c !== 'read'), ...articles.map((a) => `read ${a.slug}`)];

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-neon underline decoration-neon/40 underline-offset-4 hover:decoration-neon">
    {label}
  </a>
);
const out = (body: ReactNode): Line => ({ kind: 'out', body });
const fieldColor = (f: string) => (f === 'ai' ? 'text-[#a98bff]' : 'text-neon');

function run(cmd: string): Line[] {
  if (cmd.startsWith('read')) {
    const slug = cmd.slice(4).trim();
    const article = slug ? getArticle(slug) : undefined;
    if (!article) {
      return [
        { kind: 'err', body: slug ? `no article called "${slug}".` : 'usage: read <slug>' },
        out(`Available: ${articles.map((a) => a.slug).join(', ')}`),
      ];
    }
    return [
      out(<span className="text-lg text-white">{article.title}</span>),
      out(
        <span className="text-slate-500">
          {fieldLabel(article.field)} / {formatDate(article.date)} / {article.minutes} min read
        </span>,
      ),
      ...(article.repo ? [out(<>code: {ext(article.repo, article.repo.replace('https://', ''))}</>)] : []),
      out(' '),
      ...toTerminalLines(article).map((l) =>
        out(
          l.kind === 'h' ? (
            <span className={`${fieldColor(article.field)} font-semibold`}>## {l.text}</span>
          ) : l.kind === 'code' ? (
            <span className="whitespace-pre text-slate-400">{`    ${l.text}`}</span>
          ) : (
            l.text || ' '
          ),
        ),
      ),
    ];
  }

  switch (cmd) {
    case 'help':
      return [
        out('Available commands:'),
        out(
          <span className="grid grid-cols-[8.5rem_1fr] gap-x-2">
            <span className="text-neon">whoami</span><span>who is this guy</span>
            <span className="text-neon">about</span><span>the short story</span>
            <span className="text-neon">skills</span><span>security, AI and the foundations</span>
            <span className="text-neon">articles</span><span>list what I have written</span>
            <span className="text-neon">read &lt;slug&gt;</span><span>read an article right here</span>
            <span className="text-neon">certs</span><span>certifications</span>
            <span className="text-neon">contact</span><span>how to reach me</span>
            <span className="text-neon">socials</span><span>LinkedIn and GitHub</span>
            <span className="text-neon">play breach</span><span>a 30-second game: contain the breach</span>
            <span className="text-neon">gui</span><span>switch to the graphical site</span>
            <span className="text-neon">terminal</span><span>switch to the full-screen terminal</span>
            <span className="text-neon">matrix</span><span>you know what this does</span>
            <span className="text-neon">clear</span><span>wipe the screen</span>
          </span>,
        ),
        out('Tab autocompletes, including article names. Up and down arrows walk your history.'),
      ];
    case 'whoami':
      return [out(`${profile.name} (${profile.short})`), out(profile.sub), out(profile.location)];
    case 'about':
      return about.paragraphs.map((p) =>
        out(
          <>
            <span className={fieldColor(p.field)}>{p.field === 'ai' ? 'ai' : 'security'}</span>: {p.text}
          </>,
        ),
      );
    case 'skills':
      return [
        ...skillsCore.map((g) =>
          out(
            <>
              <span className={fieldColor(g.field)}>{g.title.toLowerCase()}</span>: {g.items.join(', ')}
            </>,
          ),
        ),
        ...skillsFoundations.map((g) =>
          out(
            <>
              <span className="text-slate-500">{g.title.toLowerCase()}</span>: {g.items.join(', ')}
            </>,
          ),
        ),
      ];
    case 'articles':
      return [
        ...articles.map((a) =>
          out(
            <>
              <span className={fieldColor(a.field)}>{a.slug}</span>
              <span className="text-slate-500"> / </span>
              <span className="text-white">{a.title}</span>
              <span className="text-slate-500"> ({fieldLabel(a.field)}, {formatDate(a.date)})</span>
            </>,
          ),
        ),
        out(articles.length ? 'Type "read <slug>" to open one. Tab completes the name.' : 'Nothing published yet.'),
      ];
    case 'certs':
      return certs.flatMap((c) => [
        out(
          <>
            <span className="text-white">{c.title}</span>
            <span className="text-slate-500"> ({c.issuer}, {c.detail})</span>
          </>,
        ),
        out(<span className="text-slate-400">{`  ${c.about}`}</span>),
        ...c.outcomes.map((o) => out(<span className="text-slate-400">{`  - ${o}`}</span>)),
      ]);
    case 'contact':
      return [out(<>email: {ext(`mailto:${profile.email}`, profile.email)}</>), out('Fastest way to get a reply.')];
    case 'socials':
      return [out(<>linkedin: {ext(profile.linkedin, profile.linkedinLabel)}</>), out(<>github: {ext(profile.github, profile.githubLabel)}</>)];
    case 'sudo hire-me':
      return [
        out('[sudo] password for recruiter: ********'),
        { kind: 'ok', body: 'Access granted. Excellent decision.' },
        out(<>Next step: {ext(`mailto:${profile.email}`, profile.email)}</>),
      ];
    case 'sudo':
      return [{ kind: 'err', body: 'sudo: nice try. The only sudo command here is "sudo hire-me".' }];
    case 'ls':
      return [out('about.txt  skills/  articles/  certs/  contact.txt')];
    default:
      return [{ kind: 'err', body: `command not found: ${cmd}. Type "help" to see what works.` }];
  }
}

/** Short Matrix-style rain drawn over the terminal body. */
function MatrixRain({ onEnd }: { onEnd: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth);
    const h = (canvas.height = canvas.offsetHeight);
    const size = 14;
    const drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -30);
    const glyphs = 'アカサタナハマヤラワ0123456789ABCDEF<>/{}';
    ctx.font = `${size}px monospace`;
    const timer = window.setInterval(() => {
      ctx.fillStyle = 'rgba(5,6,10,0.16)';
      ctx.fillRect(0, 0, w, h);
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.94 ? '#ffffff' : i % 2 === 0 ? '#7C3AED' : '#00E5FF';
        ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * size, y * size);
        drops[i] = y * size > h && Math.random() > 0.95 ? 0 : y + 1;
      });
    }, 45);
    const end = window.setTimeout(onEnd, 4200);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(end);
    };
  }, [onEnd]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

const WELCOME: Line[] = [
  out('vir.sys 1.0 ready.'),
  out('Type "help" and press Enter. Try "articles", or "sudo hire-me" if you are feeling decisive.'),
];

/**
 * The interactive terminal. Used twice: as a window inside the graphical
 * site (variant "section") and as the whole screen in terminal mode ("full").
 */
export default function TerminalShell({
  variant,
  onGui,
  onFull,
  onPlay,
  headerExtra,
  autoFocus = false,
  className = '',
}: {
  variant: 'section' | 'full';
  onGui?: () => void;
  onFull?: () => void;
  onPlay?: () => void;
  headerExtra?: ReactNode;
  autoFocus?: boolean;
  className?: string;
}) {
  const [lines, setLines] = useState<Line[]>(WELCOME);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [matrix, setMatrix] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [lines]);
  useEffect(() => {
    if (autoFocus) input.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const endMatrix = useCallback(() => {
    setMatrix(false);
    setLines((l) => [...l, { kind: 'ok', body: 'Wake up, recruiter. The portfolio has you.' }]);
  }, []);

  const submit = (raw: string) => {
    const typed = raw.trim();
    const cmd = typed.toLowerCase().replace(/\s+/g, ' ');
    if (!cmd) return;
    setHistory((h) => [...h, typed]);
    setCursor(-1);
    setValue('');
    if (cmd === 'clear') return setLines([]);
    const echo: Line = { kind: 'in', body: typed };
    const print = (...more: Line[]) => setLines((l) => [...l, echo, ...more]);

    if (cmd === 'matrix') {
      print();
      return setMatrix(true);
    }
    if (cmd === 'play' || cmd === 'play breach' || cmd === 'breach') {
      print({ kind: 'ok', body: 'Launching: contain the breach...' });
      return void window.setTimeout(() => onPlay?.(), 250);
    }
    if (cmd === 'gui' || cmd === 'graphical' || cmd === 'exit') {
      if (variant === 'full' && onGui) {
        print({ kind: 'ok', body: 'Loading the graphical site...' });
        return void window.setTimeout(onGui, 350);
      }
      return print(out('You are already in the graphical site. Type "terminal" for the full-screen version.'));
    }
    if (cmd === 'terminal') {
      if (variant === 'section' && onFull) {
        print({ kind: 'ok', body: 'Switching to terminal mode...' });
        return void window.setTimeout(onFull, 350);
      }
      return print(out('You are already in terminal mode. Type "gui" for the graphical site.'));
    }
    print(...run(cmd));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit(value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cursor < 0) return;
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(-1);
        setValue('');
      } else {
        setCursor(next);
        setValue(history[next]);
      }
    } else if (e.key === 'Tab') {
      const partial = value.trimStart().toLowerCase();
      if (!partial) return; // let Tab move focus when the line is empty
      e.preventDefault();
      const matches = COMPLETIONS.filter((c) => c.startsWith(partial));
      if (matches.length === 1) setValue(matches[0]);
      else if (matches.length > 1) {
        // complete as far as all matches agree, and show the options
        let prefix = matches[0];
        for (const m of matches) while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
        if (prefix.length > partial.length) setValue(prefix);
        setLines((l) => [...l, out(matches.join('   '))]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const quick = ['help', 'articles', 'play breach', 'sudo hire-me'];

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div
        className={`glass-strong flex min-h-0 flex-1 flex-col overflow-hidden transition-colors duration-500 focus-within:border-neon/40 ${
          variant === 'full' ? 'rounded-2xl md:rounded-3xl' : 'rounded-3xl'
        }`}
        onClick={() => input.current?.focus({ preventScroll: true })}
      >
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-slate-500">visitor@vir.sys: ~</span>
          <span className="ml-auto">{headerExtra}</span>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={body}
            data-lenis-prevent
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
            className={`overflow-y-auto px-5 py-4 font-mono text-[13px] leading-6 text-slate-300 md:text-sm md:leading-7 ${
              variant === 'full' ? 'absolute inset-0' : 'h-[22rem]'
            }`}
          >
            {lines.map((l, i) => (
              <div key={i} className={l.kind === 'err' ? 'text-rose-300' : l.kind === 'ok' ? 'text-emerald-300' : l.kind === 'in' ? 'text-white' : ''}>
                {l.kind === 'in' && <span className="mr-2 text-neon">❯</span>}
                {l.body}
              </div>
            ))}

            <label className="flex items-center">
              <span className="mr-2 text-neon" aria-hidden="true">❯</span>
              <span className="sr-only">Terminal command</span>
              <input
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={matrix}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                placeholder="type a command"
                className="w-full bg-transparent text-white caret-neon outline-none placeholder:text-slate-600 term-input"
              />
            </label>
          </div>
          {matrix && <MatrixRain onEnd={endMatrix} />}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quick.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => submit(c)}
            className="rounded-full border border-white/10 px-3.5 py-1.5 font-mono text-xs text-slate-400 transition-colors duration-300 hover:border-neon/50 hover:text-white"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
