import Link from 'next/link';
import type { Dict } from '@/lib/i18n/types';
import { siteConfig } from '@/lib/site-config';
import { SchedulerDiagram } from './scheduler-diagram';

export function Hero({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  const docsHref = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 grid gap-10 md:grid-cols-2 items-center">
      <div>
        <span className="inline-block text-xs font-medium rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-foreground/60">
          {t.hero.badge}
        </span>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
          {t.hero.title1}{' '}
          <span className="text-emerald-600 dark:text-emerald-400">{t.hero.title2}</span>
        </h1>
        <p className="mt-4 text-lg text-foreground/70">{t.hero.lead}</p>
        <div className="mt-6 flex gap-3">
          <Link href={docsHref} className="rounded-md bg-foreground text-background px-5 py-2.5 font-medium">
            {t.hero.getStarted}
          </Link>
          <a href={siteConfig.github} className="rounded-md border border-black/15 dark:border-white/20 px-5 py-2.5 font-medium">
            {t.hero.github}
          </a>
        </div>
      </div>
      <SchedulerDiagram />
    </section>
  );
}
