import { siteConfig } from '@/lib/site-config';
import type { Dict } from '@/lib/i18n/types';

export function Footer({ t }: { t: Dict }) {
  return (
    <footer className="mi-footer">
      <div className="mi-container mi-footer-inner">
        <span>
          © {new Date().getFullYear()} {siteConfig.name} — {t.footer.tagline}
        </span>
        <nav className="mi-footer-links">
          <a href={siteConfig.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={siteConfig.pkgGoDev} target="_blank" rel="noreferrer">
            pkg.go.dev
          </a>
          <a href={siteConfig.license} target="_blank" rel="noreferrer">
            License
          </a>
        </nav>
        <span className="mi-footer-built">{t.footer.builtBy} advenoh</span>
      </div>
    </footer>
  );
}
