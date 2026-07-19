---
title: Observability
slug: observability
group: Operating
description: "Inspect queues and tasks with metrics, the Inspector API and the chronos CLI."
---

chronos-go is a headless library, so it ships ways to *see* what it is
doing: a `Metrics` hook for counters, an `Inspector` API for queues and
tasks, and a `chronos` CLI built on top of the Inspector.

### Recipe: metrics

`Metrics` is a single-method interface the server calls once per processed
task; the zero/nil `Metrics` disables observation entirely:

```go
type Metrics interface {
	ObserveTask(queue, kind string, outcome TaskOutcome, dur time.Duration)
}
```

`TaskOutcome` is one of `OutcomeSuccess`, `OutcomeRetry`, or
`OutcomeDeadLetter`. The core stays dependency-free — a ready Prometheus
implementation (plus a Grafana dashboard) lives in the separate
[`contrib/prometheus`](https://github.com/kenshin579/chronos-go/tree/main/contrib/prometheus)
module:

```bash
cd contrib/prometheus/deploy && docker compose up --build
# Grafana: http://localhost:3000  (dashboard "chronos-go")
```

### Recipe: the Inspector API

`NewInspector` wraps a Redis client and gives you the same data
programmatically — the foundation the CLI (and any future UI) is built on:

```go
rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:6379"})
insp := chronos.NewInspector(rdb)
queues, _ := insp.Queues(context.Background())
for _, q := range queues {
	fmt.Printf("%s: pending=%d paused=%v\n", q.Queue, q.Pending, q.Paused)
}
```

`Queues` returns a `*QueueInfo` per queue with per-state counts (`Pending`,
`Active`, `Scheduled`, `Retry`, `Archived`, `Completed`) and its `Paused`
flag. `ListTasks(ctx, qname, state, limit)` lists up to `limit` tasks in one
of `"scheduled"`, `"retry"`, `"archived"`, `"completed"`, returning
`*TaskInfo` entries with retry counts, the last error, and (for chains/groups)
`ChainPending`/`GroupPending`. `GetTask(ctx, qname, taskID)` fetches one
task's full detail. `PauseQueue`/`ResumeQueue`/`PausedQueues` administer
consumption.

### Recipe: the `chronos` CLI

The CLI wraps the Inspector for the terminal:

```
chronos [--redis addr] [--db n] queue ls                       # standalone (default)
chronos --cluster --redis n1:7000,n2:7001 queue ls             # Redis Cluster
chronos [flags] queue pause  <queue>                            # stop consumption (~1s); unknown names are accepted and stay paused until resume
chronos [flags] queue resume <queue>
chronos [flags] task ls   <queue> <scheduled|retry|archived|completed>
chronos [flags] task run  <queue> <task-id>
chronos [flags] task rm   <queue> <task-id>
```

`--standalone` (the default) talks to a single Redis; `--cluster` takes
comma-separated seed nodes via `--redis` and — since Redis Cluster has only
database 0 — rejects `--db`. `task ls default completed` is how you inspect
retained successes, and `task run <queue> <id>` re-runs a dead-lettered
task (a chain link or group member included).

### Gotcha: pausing only stops consumption

`queue pause` stops servers from *consuming* the queue within about a
second — enqueueing, forwarding and recovery all keep running, so work
piles up as pending rather than draining. It doesn't affect priority
weighting between queues either; see
[Queues and priority](/docs/queues-and-priority/) for how queue weights and
consumption interact.

Full signatures are on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).
