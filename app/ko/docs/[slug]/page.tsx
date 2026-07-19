import type { Metadata } from 'next';
import { loadDoc, getDocsNav, listSlugs } from '@/lib/docs';
import { ko } from '@/lib/i18n/ko';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsShell, PrevNext } from '@/components/docs/docs-layout';

export function generateStaticParams() {
  return listSlugs('ko').map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await loadDoc('ko', slug);
  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: `/ko/docs/${slug}/`,
      languages: { en: `/docs/${slug}/`, ko: `/ko/docs/${slug}/`, 'x-default': `/docs/${slug}/` },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await loadDoc('ko', slug);
  const nav = getDocsNav('ko');
  return (
    <>
      <Nav t={ko} lang="ko" />
      <DocsShell nav={nav} lang="ko" currentSlug={slug} tocLabel={ko.docs.toc}>
        <article className="mi-prose" data-pagefind-body>
          <h1>{doc.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: doc.html }} />
        </article>
        <PrevNext prev={doc.prev} next={doc.next} lang="ko" />
      </DocsShell>
      <Footer t={ko} />
    </>
  );
}
