import Link from 'next/link';
import type { Dict } from '@/lib/i18n/types';
import { siteConfig } from '@/lib/site-config';

export function FinalCta({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  const docsHref = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold">{t.cta.title}</h2>
      <p className="mt-3 text-foreground/70">{t.cta.lead}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href={docsHref} className="rounded-md bg-foreground text-background px-5 py-2.5 font-medium">{t.cta.docs}</Link>
        <a href={siteConfig.github} className="rounded-md border border-black/15 dark:border-white/20 px-5 py-2.5 font-medium">{t.cta.github}</a>
        <a href={siteConfig.pkgGoDev} className="rounded-md border border-black/15 dark:border-white/20 px-5 py-2.5 font-medium">{t.cta.pkg}</a>
      </div>
    </section>
  );
}
