import type { Dict } from '@/lib/i18n/types';

export function HowItWorks({ t }: { t: Dict; lang: 'en' | 'ko' }) {
  const h = t.howItWorks;
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{h.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold">{h.title}</h2>
      <p className="mt-3 text-foreground/70">{h.lead}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3 text-center text-sm">
        {['Streams — immediate', 'ZSETs — delayed / retry', 'Forwarder + Recoverer'].map((b) => (
          <div key={b} className="rounded-lg border border-black/10 dark:border-white/10 py-6 px-3">{b}</div>
        ))}
      </div>
    </section>
  );
}
