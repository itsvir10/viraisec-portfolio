import { useRef, useState, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { icons } from './ui';

/** Code block with a copy button. */
function Pre({ children, ...rest }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText ?? '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };
  return (
    <div className="group relative">
      <pre ref={ref} data-lenis-prevent {...rest}>
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-ink/80 px-3 py-1.5 text-xs text-slate-300 opacity-0 transition-opacity duration-200 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
      >
        {icons.copy}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Anchor({ href = '', children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  const external = /^https?:/.test(href);
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
      {children}
    </a>
  );
}

export default function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-vir">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{ pre: Pre, a: Anchor, img: (props) => <img loading="lazy" {...props} /> }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
