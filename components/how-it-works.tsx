import type { Dict } from '@/lib/i18n/types';
import { MermaidRunner } from './mermaid-runner';

const CHART = `flowchart LR
  E["Enqueue"] --> S[("Redis Stream")]
  T["Delayed · retry · scheduled"] --> Z[("ZSETs")]
  Z -- "forwarder promotes due" --> S
  S --> W["Workers"]
  W -. "recoverer reclaims" .-> S`;

export function HowItWorks({ t }: { t: Dict; lang: 'en' | 'ko' }) {
  const h = t.howItWorks;
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{h.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold">{h.title}</h2>
      <p className="mt-3 text-foreground/70">{h.lead}</p>
      <div className="mt-8 mermaid">{CHART}</div>
      <MermaidRunner />
    </section>
  );
}
