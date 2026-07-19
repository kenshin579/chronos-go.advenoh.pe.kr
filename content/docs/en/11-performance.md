---
title: Performance & benchmarks
slug: performance
---

chronos-go ships a benchmark suite that runs the same workload against
chronos-go and [asynq](https://github.com/hibiken/asynq) side by side, on
four scenarios: plain **enqueue** (client-side only), **end-to-end**
(produce + consume) at worker concurrency `C ∈ {1, 4, 16, 64}`, a **chain**
of sequential links, and a **group** fan-out/fan-in. Full methodology,
tables and caveats live in the library's
[`docs/BENCHMARKS.md`](https://github.com/kenshin579/chronos-go/blob/main/docs/BENCHMARKS.md).

### Methodology, in brief

Both libraries run their **default configs**; only the shared knobs are set
identically — concurrency, payload (100-byte JSON), task count (20,000),
producers (4) — on the same machine, same local Redis, runs interleaved.
Every number is the **median-throughput run of 3** (Redis is flushed between
runs). Producers enqueue as fast as they can while the server consumes — a
*saturation* benchmark, so throughput is the meaningful headline number;
latency percentiles under saturation include backlog wait, and approach true
per-task latency only once consumption keeps up with production (high
concurrency).

Measured 2026-07-12 on: Apple M4 Pro (12 cores), Redis 8.0.3, Go 1.26.4,
chronos-go @ that commit, asynq v0.26.0.

### The headline numbers

Quoted from `docs/BENCHMARKS.md`:

**Enqueue throughput** (pure client-side, 4 producers, no server):

| library | tasks/s |
|---|---|
| chronos-go | 25,872 |
| asynq | 27,133 |

**End-to-end throughput** (20k tasks, 4 producers, worker concurrency `C`):

| C | chronos-go | asynq | ratio |
|---|---|---|---|
| 1 | 2,605 | 3,939 | 0.66x |
| 4 | 5,370 | 5,321 | 1.01x |
| 16 | **15,257** | 6,096 | **2.50x** |
| 64 | **19,859** | 4,908 | **4.05x** |

chronos-go scales with concurrency (batched `XREADGROUP COUNT=k` plus
pipelined body loads amortize Redis round trips across free workers); asynq
peaks around C=16 and declines. At C=64, chronos-go's consumers keep up with
the producers, so tasks see **p50 ≈ 1ms** with no backlog; at lower
concurrency the percentiles are backlog-dominated:

| C | chronos p50 / p95 | asynq p50 / p95 |
|---|---|---|
| 1 | 3,910ms / 6,552ms | 2,874ms / 4,146ms |
| 4 | 1,675ms / 2,737ms | 2,191ms / 2,877ms |
| 16 | 268ms / 354ms | 1,286ms / 2,128ms |
| 64 | **1ms / 1ms** | 2,481ms / 3,234ms |

**Honest note from the source**: at C=1 asynq is ~1.5x faster — with a batch
of one, chronos-go still pays 3 round trips per task (read, load body, mark
active) where asynq uses a single script. Low-concurrency single-worker
deployments are not chronos-go's sweet spot; C≥4 is.

**Workflows** (no asynq equivalent), C=16, 20k tasks total:

| scenario | tasks/s | notes |
|---|---|---|
| chain (2,000 × 10 links) | 13,489 | whole-chain p50 1.1s under saturation (all 2,000 chains progress in waves) |
| group (2,000 × 10 members) | 6,664 | callback fires **p50 3ms** after the last member |

For the newest numbers and the full write-up — including what the benchmark
suite found and fixed in earlier runs — see
[`docs/BENCHMARKS.md`](https://github.com/kenshin579/chronos-go/blob/main/docs/BENCHMARKS.md)
on GitHub; results here are a snapshot and can drift as both libraries
evolve.

### Recipe: reproducing the numbers

`make bench` (from the library repo) runs the full matrix — enqueue, then
end-to-end at each concurrency, then chain and group — against a **local**
Redis:

```bash
make bench
```

It flushes **local Redis DB 15** between runs, so point it at a Redis you
don't mind clearing, and don't run it against a database holding real data.

### Gotcha: relative comparisons, not absolute guarantees

These numbers come from one machine with local (non-Docker) Redis and
no-op handlers that isolate library overhead — real handlers doing real
work will dominate these costs long before the queue does. Treat the
figures as **relative comparisons against asynq under identical
conditions**, not as a throughput guarantee for your deployment; re-run
`make bench` on your own hardware and Redis topology before sizing anything
on these numbers.

### Next

Continue with [How it works](/docs/#how-it-works) for the internals behind
these numbers.
