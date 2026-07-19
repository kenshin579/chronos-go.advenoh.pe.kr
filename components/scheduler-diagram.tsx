export function SchedulerDiagram() {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex flex-col gap-2">
          {['app 1', 'app 2 ★', 'app 3'].map((n) => (
            <div
              key={n}
              className={
                'rounded-md px-3 py-2 text-center border ' +
                (n.includes('★')
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-black/15 dark:border-white/15 text-foreground/70')
              }
            >
              {n}
            </div>
          ))}
        </div>
        <div className="text-foreground/40 text-2xl">&rarr;</div>
        <div className="rounded-lg bg-purple-500 text-white px-4 py-6 text-center font-medium">
          Redis
          <br />
          leader lock
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-foreground/50">
        ★ = elected leader — only one instance enqueues each trigger
      </p>
    </div>
  );
}
