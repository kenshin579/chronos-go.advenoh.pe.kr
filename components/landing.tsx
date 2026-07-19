import type { Dict } from '@/lib/i18n/types';
import { Nav } from './nav';
import { Hero } from './hero';
import { Features } from './features';
import { Comparison } from './comparison';
import { HowItWorks } from './how-it-works';
import { FinalCta } from './final-cta';
import { Footer } from './footer';

export function Landing({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  return (
    <>
      <Nav t={t} lang={lang} />
      <Hero t={t} lang={lang} />
      <Features t={t} lang={lang} />
      <Comparison t={t} lang={lang} />
      <HowItWorks t={t} lang={lang} />
      <FinalCta t={t} lang={lang} />
      <Footer t={t} />
    </>
  );
}
