import type { Metadata } from 'next';
import Link from 'next/link';
import { getDocsNav } from '@/lib/docs';
import { ko } from '@/lib/i18n/ko';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsShell } from '@/components/docs/docs-layout';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '문서',
  description: `${siteConfig.name} 사용법.`,
  alternates: {
    canonical: '/ko/docs/',
    languages: { en: '/docs/', ko: '/ko/docs/', 'x-default': '/docs/' },
  },
};

export default function Page() {
  const nav = getDocsNav('ko');
  return (
    <>
      <Nav t={ko} lang="ko" />
      <DocsShell nav={nav} lang="ko" tocLabel={ko.docs.toc}>
        <div className="mi-prose mi-docs-index">
          <h1>{ko.docs.title}</h1>
          {nav.map((g) => (
            <section key={g.group}>
              <h2>{g.group}</h2>
              <ul>
                {g.items.map((it) => (
                  <li key={it.slug}>
                    <Link href={`/ko/docs/${it.slug}/`}>{it.title}</Link> — {it.description}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DocsShell>
      <Footer t={ko} />
    </>
  );
}
