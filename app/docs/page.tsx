import type { Metadata } from 'next';
import Link from 'next/link';
import { getDocsNav } from '@/lib/docs';
import { en } from '@/lib/i18n/en';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsShell } from '@/components/docs/docs-layout';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Docs',
  description: `How to use ${siteConfig.name}.`,
  alternates: {
    canonical: '/docs/',
    languages: { en: '/docs/', ko: '/ko/docs/', 'x-default': '/docs/' },
  },
};

export default function Page() {
  const nav = getDocsNav('en');
  return (
    <>
      <Nav t={en} lang="en" />
      <DocsShell nav={nav} lang="en" tocLabel={en.docs.toc}>
        <div className="mi-prose mi-docs-index">
          <h1>{en.docs.title}</h1>
          {nav.map((g) => (
            <section key={g.group}>
              <h2>{g.group}</h2>
              <ul>
                {g.items.map((it) => (
                  <li key={it.slug}>
                    <Link href={`/docs/${it.slug}/`}>{it.title}</Link> — {it.description}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DocsShell>
      <Footer t={en} />
    </>
  );
}
