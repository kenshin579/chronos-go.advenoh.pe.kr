---
title: Enqueue options
slug: enqueue-options
---

`Enqueue` takes a variadic list of `Option`s that control how a task is scheduled and
handled once it's in the pipeline: when it becomes available, which queue it lands in,
how many times it's retried, whether a duplicate is rejected, and how long a completed
task is kept around. Each option is a small `optionFunc` that mutates the shared
`enqueueOptions`, so they compose freely on a single `Enqueue` call.

```go
chronos.Enqueue(ctx, client, EmailArgs{...},
	chronos.WithQueue("critical"),          // route to a queue
	chronos.WithMaxRetry(5),                 // retry budget (default 25)
	chronos.WithProcessIn(30*time.Minute),   // run later (delayed)
	chronos.WithUnique(10*time.Minute),      // dedup identical (kind+payload) tasks
	chronos.WithDeadLetterDiscard(),         // drop instead of archive on exhaustion
	chronos.WithRetention(24*time.Hour),     // keep the completed task for inspection
)
```

### Delayed execution: `WithProcessIn`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithProcessIn(30*time.Minute),
)
```

The task first becomes available for processing after `d` elapses; a non-positive `d`
enqueues it immediately. (There's also `WithProcessAt(t time.Time)` for an absolute
time, if you need it.)

### Queue routing: `WithQueue`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithQueue("critical"),
)
```

Routes the task to the named queue instead of the default one. The server only picks
up tasks from queues listed in its `ServerConfig.Queues`.

### Retry budget: `WithMaxRetry`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithMaxRetry(5),
)
```

Caps the number of retries before the task is dead-lettered; defaults to
`DefaultMaxRetry`. A negative value is clamped to `0` (no retries).

### Uniqueness: `WithUnique`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithUnique(10*time.Minute),
)
```

Deduplicates tasks by `(kind + payload)`: while a matching task is anywhere in the
pipeline (pending, retrying, scheduled), enqueueing another returns `ErrDuplicateTask`.
`ttl` mainly bounds the lock for time spent waiting with no worker renewing it — set it
comfortably above the expected total waiting time; for a delayed task the lock TTL is
automatically extended to cover the delay.

### Discard on exhaustion: `WithDeadLetterDiscard`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithDeadLetterDiscard(),
)
```

Discards the task on retry exhaustion instead of storing it in the archived ZSET. The
`OnDeadLetter` hook on `ServerConfig` still fires either way.

### Retention: `WithRetention`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithRetention(24*time.Hour),
)
```

Keeps a succeeded task in the "completed" set for `d` so it can be inspected before the
janitor removes it; without this option a successful task is deleted immediately.
Durations under one second round up to one second. On high-throughput queues, a long
retention grows Redis memory — the per-queue `MaxCompleted` cap on `ServerConfig`
bounds the worst case.

### Gotcha: not every option works everywhere

`WithUnique` and `WithTaskID` are rejected when a task is enqueued as a step inside a
[chain](/docs/#chains) — see that doc for why. And a `WithUnique` lock isn't just a
fire-and-forget TTL: once a worker picks the task up, the server's heartbeat renews the
lock for as long as processing takes, a detail covered in
[Retries & reliability](/docs/#retries-and-reliability). Full option and default
values are documented on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).

### Next

Continue with [Queues & priority](/docs/#queues-and-priority) to see how multiple
queues and worker concurrency interact.
