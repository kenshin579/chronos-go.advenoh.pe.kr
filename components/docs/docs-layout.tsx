import Link from 'next/link';
import type { DocNavGroup, DocMeta } from '@/lib/docs';

export function DocsShell({
  nav,
  lang,
  currentSlug,
  tocLabel,
  children,
}: {
  nav: DocNavGroup[];
  lang: 'en' | 'ko';
  currentSlug?: string;
  tocLabel: string;
  children: React.ReactNode;
}) {
  const base = lang === 'ko' ? '/ko/docs/' : '/docs/';
  const sidebar = (
    <nav aria-label="Docs navigation" className="mi-docs-nav">
      {nav.map((g) => (
        <div key={g.group} className="mi-docs-nav-group">
          <div className="mi-docs-toc-title">{g.group}</div>
          <ul>
            {g.items.map((it) => (
              <li key={it.slug}>
                <Link
                  href={`${base}${it.slug}/`}
                  aria-current={it.slug === currentSlug ? 'page' : undefined}
                  className={it.slug === currentSlug ? 'is-active' : undefined}
                >
                  {it.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="mi-container mi-docs">
      <aside className="mi-docs-toc">{sidebar}</aside>
      <main className="mi-docs-body">
        <details className="mi-docs-toc-mobile">
          <summary>{tocLabel}</summary>
          {sidebar}
        </details>
        {children}
      </main>
    </div>
  );
}

export function PrevNext({
  prev,
  next,
  lang,
}: {
  prev: DocMeta | null;
  next: DocMeta | null;
  lang: 'en' | 'ko';
}) {
  const base = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <nav className="mi-docs-prevnext" aria-label="Pagination">
      {prev ? (
        <Link className="mi-docs-prev" href={`${base}${prev.slug}/`}>
          <span className="mi-docs-prevnext-dir">←</span> {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="mi-docs-next" href={`${base}${next.slug}/`}>
          {next.title} <span className="mi-docs-prevnext-dir">→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
