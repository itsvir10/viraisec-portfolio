import { motion } from 'framer-motion';
import { skillsCore, skillsFoundations } from '../data/content';
import { RevealText } from '../components/ui';

const EXPO = [0.16, 1, 0.3, 1] as const;
const item = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  show: (i: number) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EXPO, delay: i * 0.05 } }),
};

export default function Skills() {
  return (
    <section id="skills" className="relative flex min-h-screen items-center px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto w-full max-w-7xl">
        <RevealText text="Two toolkits." className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.035em] text-white md:text-7xl" />

        {/* Security and AI: same size, side by side */}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {skillsCore.map((group) => {
            const security = group.field === 'security';
            return (
              <motion.div
                key={group.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                className={`glass rounded-[1.75rem] p-7 md:p-9 ${security ? '!border-neon/25' : '!border-ultra/40'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${security ? 'bg-neon shadow-[0_0_14px_2px_color-mix(in_srgb,var(--color-neon)_70%,transparent)]' : 'bg-ultra-soft shadow-[0_0_14px_2px_color-mix(in_srgb,var(--color-ultra)_90%,transparent)]'}`} />
                  <h3 className="font-display text-3xl font-medium tracking-tight text-white md:text-4xl">{group.title}</h3>
                </div>
                <p className="mt-2 text-slate-400">{group.note}</p>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {group.items.map((skill, i) => (
                    <motion.li
                      key={skill}
                      custom={i}
                      variants={item}
                      className={`rounded-full border bg-white/[0.04] px-3.5 py-1.5 text-sm text-slate-100 transition-colors duration-300 ${
                        security ? 'border-neon/20 hover:border-neon/70' : 'border-ultra/40 hover:border-ultra-soft'
                      }`}
                    >
                      {skill}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* shared foundations */}
        <div className="glass mt-5 grid divide-y divide-white/[0.07] rounded-[1.75rem] md:grid-cols-3 md:divide-x md:divide-y-0">
          {skillsFoundations.map((group) => (
            <motion.div key={group.title} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -8% 0px' }} className="p-6 md:p-7">
              <h3 className="font-display text-lg font-medium text-white">{group.title}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((skill, i) => (
                  <motion.li key={skill} custom={i} variants={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[13px] text-slate-300">
                    {skill}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
