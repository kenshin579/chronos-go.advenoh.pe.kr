---
title: Queues & priority
slug: queues-and-priority
---

A server can consume from several queues at once, and not every queue deserves
equal attention. `ServerConfig.Queues` maps queue name to a weight: while every
queue has work, a queue with weight 6 is dequeued about 6x as often as one with
weight 1 — smooth weighted round-robin, so lower-weight queues never starve.
When the queue picked for a round happens to be empty, that round falls
through to the highest-weight queue that does have work, so an idle
high-priority queue never blocks lower ones. For cases where lower-priority
work must never run ahead of higher-priority work, `StrictPriority` switches
to strict draining instead. Either way, a queue can be paused independently of
the server's process lifetime.

### Recipe: weighted queues

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	Queues: map[string]int{
		"critical": 6,
		"default":  3,
		"low":      1,
	},
})
```

At least one queue is required — there's no implicit default, and `Start`
returns an error if `Queues` is empty. Weights `<= 0` are treated as `1`.

### Recipe: strict priority

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	Queues: map[string]int{
		"critical": 6,
		"default":  3,
		"low":      1,
	},
	StrictPriority: true,
})
```

With `StrictPriority: true`, higher-weight queues are always drained first — a
lower-weight queue runs only while every higher-weight queue is empty. Ties
are broken by queue name for determinism.

### Recipe: pause and resume a queue

```go
insp := chronos.NewInspector(rdb)
if err := insp.PauseQueue(ctx, "low"); err != nil {
	// handle error
}
// ... later
if err := insp.ResumeQueue(ctx, "low"); err != nil {
	// handle error
}
```

The same operation is available from the `chronos` CLI:

```bash
chronos queue pause low     # stop consuming (~1s to take effect)
chronos queue resume low    # resume consuming
```

or from the web console's ⏸ toggle. Pausing stops servers from *consuming*
that queue within about one second — enqueueing, forwarding and recovery all
keep running, so work simply accumulates as pending until you resume.
In-flight tasks that were already picked up finish normally.

### Gotcha: unknown queue names stay paused

`PauseQueue` accepts any queue name, including one that doesn't match a queue
any server is actually configured with. It lingers in the paused set until you
call `ResumeQueue` on the same name — there's no validation against
`ServerConfig.Queues`, so a typo silently does nothing (and doesn't error)
rather than failing loudly.

Full signatures are on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).

### Next

Continue with [Retries & reliability](/docs/#retries-and-reliability) to see
how failed tasks are retried, dead-lettered, and recovered after a crash.
