export const siteConfig = {
  name: 'chronos-go',
  description:
    'Redis-backed distributed task queue and scheduler for Go, with a type-safe generic API.',
  url: 'https://chronos-go.advenoh.pe.kr',
  github: 'https://github.com/kenshin579/chronos-go',
  pkgGoDev: 'https://pkg.go.dev/github.com/kenshin579/chronos-go',
  issues: 'https://github.com/kenshin579/chronos-go/issues',
  license: 'https://github.com/kenshin579/chronos-go/blob/main/LICENSE',
  gaId: process.env.NEXT_PUBLIC_GA_ID || '',
  ogImage: '/og.png',
} as const;
