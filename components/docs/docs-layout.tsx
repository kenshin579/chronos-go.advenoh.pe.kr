import type { DocSection } from '@/lib/docs';

export function DocsLayout({
  sections,
  title,
  tocTitle,
}: {
  sections: DocSection[];
  title: string;
  tocTitle: string;
}) {
  const toc = (
    <ul>
      {sections.map((s) => (
        <li key={s.slug}>
          <a href={`#${s.slug}`}>{s.title}</a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mi-container mi-docs">
      <aside className="mi-docs-toc">
        <div className="mi-docs-toc-title">{tocTitle}</div>
        <nav aria-label="Table of contents">{toc}</nav>
      </aside>
      <main className="mi-docs-body">
        <h1>{title}</h1>
        <details className="mi-docs-toc-mobile">
          <summary>{tocTitle}</summary>
          <nav aria-label="Table of contents">{toc}</nav>
        </details>
        {sections.map((s) => (
          <section key={s.slug} id={s.slug} className="mi-doc-section">
            <h2>{s.title}</h2>
            <div className="mi-prose" dangerouslySetInnerHTML={{ __html: s.html }} />
          </section>
        ))}
      </main>
    </div>
  );
}
