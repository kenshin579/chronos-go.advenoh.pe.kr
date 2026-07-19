export type FeatureIcon =
  | 'type-safe' | 'scheduler' | 'reliable' | 'workflow' | 'cluster' | 'observe';

type FeatureItem = { icon: FeatureIcon; title: string; desc: string; slug: string };
type CompRow = { label: string; asynq: string; chronos: string };

const featureItems: FeatureItem[] = [
  { icon: 'type-safe', title: 'Type-safe generic API', desc: 'Define a task type, register a Handler[T] — no interface{} payloads, no manual unmarshal.', slug: 'tasks-and-handlers' },
  { icon: 'scheduler', title: 'Distributed scheduler', desc: 'Interval & cron jobs. A Redis leader election ensures only one instance enqueues each trigger.', slug: 'scheduling' },
  { icon: 'reliable', title: 'Reliable by default', desc: 'Exponential backoff + jitter, crash recovery via XAUTOCLAIM, dead-letter with a hook.', slug: 'retries-and-reliability' },
  { icon: 'workflow', title: 'Chains & Groups', desc: 'Sequential chains and parallel groups, with results relayed between steps.', slug: 'chains' },
  { icon: 'cluster', title: 'Redis Cluster-safe', desc: 'Hash-tagged keys keep each queue on one slot, so multi-key Lua stays atomic.', slug: 'redis-cluster' },
  { icon: 'observe', title: 'Observability', desc: 'Metrics, an Inspector API, and a chronos CLI for queues and tasks.', slug: 'observability' },
];

const comparison: CompRow[] = [
  { label: 'Distributed scheduler (run-once)', asynq: '✗', chronos: '✓' },
  { label: 'Generic type-safe tasks', asynq: '✗', chronos: '✓' },
  { label: 'Bounded stream / dead-letter growth', asynq: '—', chronos: '✓' },
  { label: 'Unique lock renewed during long processing', asynq: '✗', chronos: '✓' },
  { label: 'Actively maintained', asynq: 'maintenance', chronos: '✓' },
];

export const en = {
  nav: { features: 'Features', docs: 'Docs', github: 'GitHub', pkg: 'pkg.go.dev' },
  hero: {
    badge: 'Open source · Go 1.26+ · Redis 6.2+',
    title1: 'Run every scheduled job',
    title2: 'exactly once, across all your instances',
    lead: 'chronos-go is a Redis-backed distributed task queue and scheduler for Go — type-safe tasks, a scheduler that elects a single leader, crash recovery, and Chains & Groups.',
    getStarted: 'Get started',
    github: 'Star on GitHub',
  },
  features: {
    eyebrow: 'Features',
    title: 'Everything you need for background jobs in Go',
    lead: 'A modern alternative to asynq — type-safe, distributed, and reliable.',
    more: 'Learn more',
    items: featureItems,
  },
  comparison: {
    eyebrow: 'Why chronos-go',
    title: 'chronos-go vs asynq',
    lead: 'asynq is in maintenance mode. chronos-go keeps the simple model and fixes the gaps.',
    headAsynq: 'asynq',
    headChronos: 'chronos-go',
    rows: comparison,
  },
  howItWorks: {
    eyebrow: 'How it works',
    title: 'Streams for now, ZSETs for later',
    lead: 'Immediate work rides a Redis Stream; delayed, retry and archived tasks live in sorted sets. A forwarder promotes due entries; a recoverer reclaims tasks from crashed workers.',
  },
  cta: {
    title: 'Ready to try chronos-go?',
    lead: 'Read the docs and add reliable background jobs to your Go service.',
    docs: 'Read the docs',
    github: 'GitHub',
    pkg: 'pkg.go.dev',
  },
  docs: { title: 'Documentation', toc: 'On this page' },
  footer: { tagline: 'Redis-backed task queue & scheduler for Go.', builtBy: 'Built by' },
  search: {
    label: 'Search',
    placeholder: 'Search the docs…',
    empty: 'No results',
    unavailable: 'Search is available after build.',
    shortcut: '⌘K',
  },
};

export type Dict = typeof en;
