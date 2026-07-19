import type { Metadata } from 'next';
import { loadDocs } from '@/lib/docs';
import { ko } from '@/lib/i18n/ko';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsLayout } from '@/components/docs/docs-layout';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '문서',
  description: `${siteConfig.name} 사용법.`,
  alternates: {
    canonical: '/ko/docs/',
    languages: { en: '/docs/', ko: '/ko/docs/', 'x-default': '/docs/' },
  },
};

export default async function Page() {
  const sections = await loadDocs('ko');
  return (
    <>
      <Nav t={ko} lang="ko" />
      <DocsLayout sections={sections} title={ko.docs.title} tocTitle={ko.docs.toc} />
      <Footer t={ko} />
    </>
  );
}
