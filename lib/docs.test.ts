import { describe, it, expect } from 'vitest';
import {
  GROUPS,
  assertLangParity,
  listSlugs,
  readAllMeta,
  getDocsNav,
  loadDoc,
} from './docs';

const EXPECTED_SLUGS = [
  'getting-started', 'tasks-and-handlers', 'enqueue-options', 'queues-and-priority',
  'retries-and-reliability', 'scheduling', 'chains', 'groups', 'observability',
  'redis-cluster', 'performance', 'how-it-works', 'migrating-from-asynq',
];

describe('parity & slugs', () => {
  it('en and ko file sets match', () => {
    expect(() => assertLangParity()).not.toThrow();
  });
  it('has all 13 slugs in both languages', () => {
    expect([...listSlugs('en')].sort()).toEqual([...EXPECTED_SLUGS].sort());
    expect([...listSlugs('ko')].sort()).toEqual([...EXPECTED_SLUGS].sort());
  });
});

describe('metadata', () => {
  it('every doc has an allowed group and a non-empty description, both langs', () => {
    for (const lang of ['en', 'ko'] as const) {
      for (const m of readAllMeta(lang)) {
        expect(GROUPS).toContain(m.group);
        expect(m.description.length).toBeGreaterThan(0);
        expect(m.title.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getDocsNav', () => {
  it('returns the 5 groups in GROUPS order with all 13 docs', () => {
    const nav = getDocsNav('en');
    expect(nav.map((g) => g.group)).toEqual([...GROUPS]);
    expect(nav.reduce((n, g) => n + g.items.length, 0)).toBe(13);
    // items within a group are ordered by filename order
    for (const g of nav) {
      const orders = g.items.map((i) => i.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
  });
});

describe('loadDoc', () => {
  it('first doc has no prev, next = tasks-and-handlers', async () => {
    const d = await loadDoc('en', 'getting-started');
    expect(d.prev).toBeNull();
    expect(d.next?.slug).toBe('tasks-and-handlers');
    expect(d.html).toContain('<');
  });
  it('last doc has no next, prev = how-it-works', async () => {
    const d = await loadDoc('en', 'migrating-from-asynq');
    expect(d.next).toBeNull();
    expect(d.prev?.slug).toBe('how-it-works');
  });
  it('applies syntax highlighting (hljs classes) to code blocks', async () => {
    const d = await loadDoc('en', 'getting-started');
    expect(d.html).toContain('hljs');
  });
  it('renders ko as well', async () => {
    const d = await loadDoc('ko', 'scheduling');
    expect(d.title.length).toBeGreaterThan(0);
    expect(d.html.length).toBeGreaterThan(50);
  });
});
