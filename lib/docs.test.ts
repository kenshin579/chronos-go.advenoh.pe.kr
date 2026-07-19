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

  it('has all 13 docs', () => {
    expect(listDocFiles('en')).toHaveLength(13);
    expect(listDocFiles('ko')).toHaveLength(13);
  });

  it('renders every expected slug', async () => {
    const slugs = (await loadDocs('en')).map((s) => s.slug).sort();
    expect(slugs).toEqual(
      [
        'chains', 'enqueue-options', 'getting-started', 'groups',
        'how-it-works', 'migrating-from-asynq', 'observability',
        'performance', 'queues-and-priority', 'redis-cluster',
        'retries-and-reliability', 'scheduling', 'tasks-and-handlers',
      ].sort(),
    );
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
