import { profile } from '../data/content';
import { Magnetic, RevealText, icons } from '../components/ui';
import { toast } from '../lib/toast';

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(profile.email);
    toast('Email copied');
  } catch {
    toast(`Copy blocked here. It is ${profile.email}`);
  }
}

export default function Contact() {
  return (
    <section id="contact" className="relative flex min-h-screen flex-col px-6 pt-28 md:px-12 lg:px-20">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center text-center">
        <RevealText
          text="Got a system to protect or an agent to build?"
          className="mx-auto max-w-5xl font-display text-[clamp(2.4rem,6.4vw,6rem)] font-medium leading-[0.95] tracking-[-0.04em] text-white [text-shadow:0_2px_40px_rgba(5,6,10,0.7)]"
        />
        <p className="mt-7 max-w-md text-lg text-slate-300">Internships, projects, or a good argument about threat models and agent design. My inbox is open.</p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Magnetic>
            <button
              type="button"
              onClick={copyEmail}
              data-cursor="copy"
              className="glass flex items-center gap-3 rounded-full py-3.5 pl-6 pr-5 font-mono text-sm text-white transition-colors duration-500 hover:border-neon/50 md:text-base"
              aria-label={`Copy email address ${profile.email}`}
            >
              {profile.email}
              <span className="text-neon">{icons.copy}</span>
            </button>
          </Magnetic>
          <Magnetic>
            <a
              href={`mailto:${profile.email}`}
              className="bg-gradient-accent flex items-center gap-2.5 rounded-full px-7 py-3.5 font-display text-base font-medium text-ink transition-shadow duration-500 hover:shadow-[0_0_40px_-4px_rgba(0,229,255,0.7)]"
            >
              {icons.mail}
              Send an email
            </a>
          </Magnetic>
        </div>

        <ul className="mt-10 flex items-center gap-3">
          {[
            { href: profile.linkedin, label: profile.linkedinLabel, icon: icons.linkedin, name: 'LinkedIn' },
            { href: profile.github, label: profile.githubLabel, icon: icons.github, name: 'GitHub' },
          ].map((s) => (
            <li key={s.name}>
              <Magnetic strength={0.25}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${s.name}: ${s.label}`}
                  className="glass flex items-center gap-3 rounded-full px-5 py-3 text-sm text-slate-200 transition-all duration-500 hover:border-neon/50 hover:text-white hover:shadow-[0_0_30px_-6px_rgba(0,229,255,0.6)]"
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.name}</span>
                </a>
              </Magnetic>
            </li>
          ))}
        </ul>
      </div>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 border-t border-white/[0.07] py-7 text-sm text-slate-500 sm:flex-row">
        <span>
          {profile.name}, {profile.location}
        </span>
        <span>Built with React and Three.js</span>
      </footer>
    </section>
  );
}
