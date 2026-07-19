import { describe, it, expect } from 'vitest';
import { listDocFiles, assertLangParity, loadDocs } from './docs';

describe('assertLangParity', () => {
  it('passes when en and ko file sets match', () => {
    expect(() => assertLangParity()).not.toThrow();
  });
});

describe('listDocFiles', () => {
  it('returns md files sorted, identical set across langs', () => {
    const en = listDocFiles('en');
    const ko = listDocFiles('ko');
    expect(en.length).toBeGreaterThan(0);
    expect(en).toEqual([...en].sort());
    expect(ko).toEqual(en);
    expect(en[0]).toBe('01-getting-started.md');
  });

  // Plan B enables this once all 13 docs exist.
  it.skip('has all 13 docs', () => {
    expect(listDocFiles('en')).toHaveLength(13);
  });
});

describe('loadDocs', () => {
  it('parses frontmatter and renders markdown to html', async () => {
    const sections = await loadDocs('en');
    const gettingStarted = sections.find((s) => s.slug === 'getting-started');
    expect(gettingStarted).toBeDefined();
    expect(gettingStarted!.title).toBeTruthy();
    expect(gettingStarted!.html).toContain('<');
  });

  it('every section has non-empty slug, title and html', async () => {
    for (const lang of ['en', 'ko'] as const) {
      const sections = await loadDocs(lang);
      for (const s of sections) {
        expect(s.slug).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.html.length).toBeGreaterThan(20);
      }
    }
  });
});
