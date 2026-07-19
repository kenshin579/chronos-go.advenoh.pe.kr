import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';
import { listSlugs } from '@/lib/docs';

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
  const articleEntries: MetadataRoute.Sitemap = listSlugs('en').flatMap((slug) => {
    const articleAlternates = {
      languages: {
        en: `${siteConfig.url}/docs/${slug}/`,
        ko: `${siteConfig.url}/ko/docs/${slug}/`,
      },
    };
    return [
      {
        url: `${siteConfig.url}/docs/${slug}/`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: articleAlternates,
      },
      {
        url: `${siteConfig.url}/ko/docs/${slug}/`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: articleAlternates,
      },
    ];
  });
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
    ...articleEntries,
  ];
}
