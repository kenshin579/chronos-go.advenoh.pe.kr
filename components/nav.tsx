import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { LangToggle } from './lang-toggle';
import { Icon } from '@/lib/icons';
import { siteConfig } from '@/lib/site-config';
import type { Dict } from '@/lib/i18n/types';
import { Search } from './search';

export function Nav({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  const home = lang === 'ko' ? '/ko/' : '/';
  const docs = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <header className="mi-nav">
      <div className="mi-container mi-nav-inner">
        <Link href={home} className="mi-logo">
          <Icon name="logo" size={20} />
          chronos-go
        </Link>
        <nav className="mi-nav-links">
          <a href={`${home}#features`}>{t.nav.features}</a>
          <Link href={docs}>{t.nav.docs}</Link>
          <a href={siteConfig.github} target="_blank" rel="noreferrer">
            {t.nav.github}
          </a>
          <a href={siteConfig.pkgGoDev} target="_blank" rel="noreferrer">
            {t.nav.pkg}
          </a>
        </nav>
        <div className="mi-nav-actions">
          <Search t={t} />
          <a
            className="mi-icon-btn"
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Icon name="github" size={16} />
          </a>
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
