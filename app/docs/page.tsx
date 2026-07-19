import type { Metadata } from 'next';
import { loadDocs } from '@/lib/docs';
import { en } from '@/lib/i18n/en';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsLayout } from '@/components/docs/docs-layout';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Docs',
  description: `How to use ${siteConfig.name}.`,
  alternates: {
    canonical: '/docs/',
    languages: { en: '/docs/', ko: '/ko/docs/', 'x-default': '/docs/' },
  },
};

export default async function Page() {
  const sections = await loadDocs('en');
  return (
    <>
      <Nav t={en} lang="en" />
      <DocsLayout sections={sections} title={en.docs.title} tocTitle={en.docs.toc} />
      <Footer t={en} />
    </>
  );
}
