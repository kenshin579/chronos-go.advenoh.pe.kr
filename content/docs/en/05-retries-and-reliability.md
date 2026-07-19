---
title: Retries & reliability
slug: retries-and-reliability
group: Core
description: "Backoff retries, dead-letter hooks, crash recovery and heartbeat renewal."
---

chronos-go is **at-least-once**: a task can run more than once (a worker
crashes after finishing but before acking, or a recoverer reclaims a task that
looked abandoned) — handlers must be idempotent. Three mechanisms work
together to make that promise practical: automatic retries with backoff for
ordinary handler errors, a dead-letter path (with a hook) for exhausted or
permanently-failed tasks, and crash recovery so a worker dying mid-task
doesn't lose the task.

### Handler outcomes

- return `nil` → success (acked and removed, or kept for `WithRetention` if
  set — see [Enqueue options](/docs/enqueue-options/)).
- return an `error` → retried with backoff until `MaxRetry` is exhausted, then
  dead-lettered.
- return `chronos.SkipRetry(err)` → dead-lettered immediately.
- `panic` → recovered, treated as a retryable error.

### Recipe: retry budget and backoff

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithMaxRetry(5),
)
```

`WithMaxRetry` caps how many times a task is retried before it's dead-lettered
(default `DefaultMaxRetry`; a negative value clamps to `0`, no retries). Between
attempts, the default backoff (`DefaultRetryDelay`) is an exponential cap —
`5s * 2^retried`, capped at 15 minutes — with full jitter: the actual delay is
picked uniformly at random between `0` and that cap, which spreads retries out
instead of letting them pile up in a thundering herd. To customize it, set
`RetryDelayFunc` on `ServerConfig`:

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	RetryDelayFunc: func(retried int, err error) time.Duration {
		return time.Duration(retried+1) * 10 * time.Second
	},
})
```

### Recipe: alerting on dead-lettered tasks

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	OnDeadLetter: func(ctx context.Context, info *chronos.TaskInfo, err error) {
		log.Printf("dead-lettered: queue=%s kind=%s err=%v", info.Queue, info.Kind, err)
	},
})
```

`OnDeadLetter` fires whenever a task exhausts its retries or returns a
`SkipRetry` error — whether it ends up archived or discarded via
`WithDeadLetterDiscard` (see [Enqueue options](/docs/enqueue-options/)). It's
also invoked when the *recoverer* dead-letters a task whose retry budget ran
out across a crash, so this one hook covers both paths.

### Recipe: fail permanently, skip the remaining retries

```go
func (h *EmailHandler) Handle(ctx context.Context, task *chronos.Task[EmailArgs]) error {
	if !isValidEmail(task.Args.To) {
		return chronos.SkipRetry(fmt.Errorf("invalid address: %s", task.Args.To))
	}
	return sendEmail(ctx, task.Args)
}
```

Use `SkipRetry` for errors that retrying can't fix — bad input, a permanently
rejected recipient — so the task goes straight to dead-letter instead of
burning through its retry budget first.

### Crash recovery, heartbeat, and the janitor

Three background mechanisms keep the "at-least-once, self-healing" promise
without any code in your handlers:

- **Crash recovery** — a recoverer periodically `XAUTOCLAIM`s stream entries
  that have been idle longer than `RecoverMinIdle` (a worker that claimed the
  task went silent) and either re-queues or dead-letters them, based on the
  attempt count already tracked in the task's hash.
- **Heartbeat** — while a task is actively being handled, the server refreshes
  its PEL idle time (`XCLAIM ... JUSTID`) and its `WithUnique` lock TTL every
  `HeartbeatInterval`. That's what keeps a genuinely long-running task from
  being reclaimed by the recoverer, and what keeps its uniqueness lock from
  expiring mid-processing.
- **Janitor** — runs on `JanitorInterval` and trims dead-lettered (archived)
  tasks and retained-completed tasks (`WithRetention`) once they age out or a
  queue's `MaxArchived` / `MaxCompleted` cap is exceeded, so Redis memory
  stays bounded.

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	RecoverMinIdle:    30 * time.Second, // default
	HeartbeatInterval: 10 * time.Second, // default: RecoverMinIdle/3
})
```

`HeartbeatInterval` must stay shorter than `RecoverMinIdle` so an
actively-processing task is never reclaimed out from under its own worker.

### Gotcha: idempotency, and panics are retryable

At-least-once delivery means a handler can run twice for the same task — a
crash right after the handler returns `nil` but before the ack is exactly the
kind of gap the recoverer exists to close. Design handlers so a repeat run is
safe (upsert instead of insert, check-then-act guarded by a unique key,
etc.). Separately, a `panic` inside a handler is recovered by the server and
treated the same as a returned `error` — it consumes a retry attempt rather
than crashing the whole server, so a panicking handler still needs
`WithMaxRetry` or `SkipRetry` to actually stop retrying.

Full signatures are on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).
