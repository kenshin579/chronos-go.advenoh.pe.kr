import type { Metadata } from 'next';
import { loadDoc, getDocsNav, listSlugs } from '@/lib/docs';
import { en } from '@/lib/i18n/en';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsShell, PrevNext } from '@/components/docs/docs-layout';

export function generateStaticParams() {
  return listSlugs('en').map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await loadDoc('en', slug);
  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: `/docs/${slug}/`,
      languages: { en: `/docs/${slug}/`, ko: `/ko/docs/${slug}/`, 'x-default': `/docs/${slug}/` },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await loadDoc('en', slug);
  const nav = getDocsNav('en');
  return (
    <>
      <Nav t={en} lang="en" />
      <DocsShell nav={nav} lang="en" currentSlug={slug} tocLabel={en.docs.toc}>
        <article className="mi-prose" data-pagefind-body>
          <h1>{doc.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: doc.html }} />
        </article>
        <PrevNext prev={doc.prev} next={doc.next} lang="en" />
      </DocsShell>
      <Footer t={en} />
    </>
  );
}
