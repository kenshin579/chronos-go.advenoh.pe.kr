import Link from 'next/link';
import type { Dict } from '@/lib/i18n/types';

export function Features({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  const base = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{t.features.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold">{t.features.title}</h2>
      <p className="mt-2 text-foreground/70">{t.features.lead}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map((f) => (
          <Link key={f.slug} href={`${base}#${f.slug}`} className="rounded-xl border border-black/10 dark:border-white/10 p-5 hover:border-indigo-500/50 transition">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-foreground/70">{f.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
