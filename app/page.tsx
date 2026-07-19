import type { Metadata } from 'next';
import { en } from '@/lib/i18n/en';
import { Landing } from '@/components/landing';
import { AutoLangRedirect } from '@/components/auto-lang-redirect';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${siteConfig.name} — distributed task queue & scheduler for Go`,
  description: siteConfig.description,
  alternates: { canonical: '/', languages: { en: '/', ko: '/ko/', 'x-default': '/' } },
};

export default function Page() {
  return (
    <>
      <AutoLangRedirect />
      <Landing t={en} lang="en" />
    </>
  );
}
