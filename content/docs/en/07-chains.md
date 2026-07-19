---
title: Chains
slug: chains
---

A `Chain` runs a sequence of tasks strictly one after another — each link is
enqueued only once the previous one succeeds. There's no polling or manual
follow-up enqueue: the chain itself carries its remaining links forward, so
a failure partway through simply stops the sequence rather than skipping
ahead.

### Recipe: build and enqueue a chain

```go
info, err := chronos.NewChain().
	Then(EncodeArgs{VideoID: "v1"}).
	Then(ThumbnailArgs{VideoID: "v1"}, chronos.WithQueue("low")).
	Then(NotifyArgs{UserID: "u1"}, chronos.WithRetention(time.Hour)).
	Enqueue(ctx, client)
```

`Then` appends a link and accepts the usual per-task options — `WithQueue`,
`WithMaxRetry`, `WithRetention`, `WithProcessIn` (which delays a link
relative to its *predecessor's completion*, not its enqueue time). `Enqueue`
makes only the first link available for processing; `info` is that first
link's `TaskInfo`. Each later link becomes eligible only as its predecessor
finishes successfully.

### Recipe: relaying a result between links

A handler registered with `AddHandlerR` (instead of `AddHandler`) returns a
typed result alongside its error, and that result becomes available to the
*next* link in the chain via `PrevResult[R]`:

```go
chronos.AddHandlerR(mux, func(ctx context.Context, task *chronos.Task[EncodeArgs]) (EncodeResult, error) {
	// ... encode ...
	return EncodeResult{Path: "out.mp4"}, nil
})

chronos.AddHandlerR(mux, func(ctx context.Context, task *chronos.Task[ThumbnailArgs]) (EncodeResult, error) {
	prev, err := chronos.PrevResult[EncodeResult](task)
	if err != nil {
		return EncodeResult{}, err
	}
	// prev.Path is the previous link's output
	return generateThumbnail(prev)
})
```

This is the same result-relay mechanism used for parallel stages — see
[Groups](/docs/#groups) for how a `ThenGroup` stage fans results in from
multiple members via `GroupResults`.

### Gotcha: failure stops the chain

When a link exhausts its retries and is dead-lettered, its successors don't
run — they wait, still attached to the dead-lettered link's message. The
Inspector's `ChainPending` field on that task shows how many links are still
queued behind it. To resume: fix whatever made the handler fail, then re-run
the dead-lettered link (`chronos task run <queue> <id>`, or the equivalent
Inspector call) — because each link carries its remaining tail, resuming
that one link continues the whole chain from there.

A few other constraints to keep in mind:

- `WithTaskID` and `WithUnique` are rejected on chain links — the chain owns
  task IDs internally, and unique-dedup isn't supported inside a chain.
- Handlers must stay idempotent, as everywhere in chronos-go: a redelivered
  link can run its handler more than once, and if a predecessor is
  redelivered after its successor already finished (and wasn't retained),
  the successor can be recreated. Per-link `WithRetention` closes that
  window for its duration.
- Each link's message carries its entire remaining tail, so a very long
  chain grows message size with every link. Keep chains reasonably short.

Full signatures are on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).

### Next

Continue with [Groups](/docs/#groups) to run tasks in parallel and fan their
results into a single callback.
