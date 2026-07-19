import type { Dict } from '@/lib/i18n/types';

export function Comparison({ t }: { t: Dict; lang: 'en' | 'ko' }) {
  const c = t.comparison;
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{c.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold">{c.title}</h2>
      <p className="mt-2 text-foreground/70">{c.lead}</p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/15 dark:border-white/15">
              <th className="text-left py-3"></th>
              <th className="py-3 text-foreground/50 font-medium">{c.headAsynq}</th>
              <th className="py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{c.headChronos}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r) => (
              <tr key={r.label} className="border-b border-black/5 dark:border-white/5">
                <td className="py-3">{r.label}</td>
                <td className="py-3 text-center text-foreground/50">{r.asynq}</td>
                <td className="py-3 text-center text-emerald-600 dark:text-emerald-400">{r.chronos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
