import type { Metadata } from 'next';
import { ko } from '@/lib/i18n/ko';
import { siteConfig } from '@/lib/site-config';
import { SetHtmlLang } from '@/components/set-html-lang';

const titleKo = `${siteConfig.name} — Go를 위한 분산 태스크 큐·스케줄러`;

export const metadata: Metadata = {
  title: { default: titleKo, template: `%s | ${siteConfig.name}` },
  description: ko.hero.lead,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: `${siteConfig.url}/ko/`,
    siteName: siteConfig.name,
    title: titleKo,
    description: ko.hero.lead,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: titleKo,
    description: ko.hero.lead,
    images: [siteConfig.ogImage],
  },
  alternates: {
    canonical: '/ko/',
    languages: {
      en: '/',
      ko: '/ko/',
      'x-default': '/',
    },
  },
};

export default function KoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetHtmlLang lang="ko" />
      {children}
    </>
  );
}
