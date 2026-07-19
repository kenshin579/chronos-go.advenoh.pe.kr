import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const landingAlternates = {
    languages: {
      en: `${siteConfig.url}/`,
      ko: `${siteConfig.url}/ko/`,
    },
  };
  const docsAlternates = {
    languages: {
      en: `${siteConfig.url}/docs/`,
      ko: `${siteConfig.url}/ko/docs/`,
    },
  };
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1.0,
      alternates: landingAlternates,
    },
    {
      url: `${siteConfig.url}/ko/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: landingAlternates,
    },
    {
      url: `${siteConfig.url}/docs/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: docsAlternates,
    },
    {
      url: `${siteConfig.url}/ko/docs/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: docsAlternates,
    },
  ];
}
