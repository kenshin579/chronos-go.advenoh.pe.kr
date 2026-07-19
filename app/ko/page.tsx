import type { Metadata } from 'next';
import { ko } from '@/lib/i18n/ko';
import { Landing } from '@/components/landing';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${siteConfig.name} — Go 분산 태스크 큐·스케줄러`,
  description: siteConfig.description,
  alternates: { canonical: '/ko/', languages: { en: '/', ko: '/ko/', 'x-default': '/' } },
};

export default function Page() {
  return <Landing t={ko} lang="ko" />;
}
