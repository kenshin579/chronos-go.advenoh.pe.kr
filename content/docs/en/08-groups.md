---
title: Groups
slug: groups
group: Workflows
description: "Fan out tasks in parallel and fan in with an on-complete callback."
---

A `Group` fans members out in parallel and runs a callback once **all of
them succeed** — the fan-in counterpart to a [Chain](/docs/chains/)'s
strictly sequential links.

### Recipe: fan out and fan in

```go
info, err := chronos.NewGroup().
	Add(ResizeArgs{Path: "a.png"}).
	Add(ResizeArgs{Path: "b.png"}, chronos.WithQueue("low")).
	OnComplete(ResizeArgs{Path: "manifest"}, chronos.WithRetention(time.Hour)).
	Enqueue(ctx, client)
```

`Add` appends a member with its own per-task options; members run on any
queue concurrently. `OnComplete` sets the callback, enqueued exactly once
while its record exists — idempotent tracking means an at-least-once
redelivery can't double-fire it. `Enqueue` validates every member up front
and creates the group's pending-member record before enqueueing any of
them, so a partial failure midway can never fire the callback early.

### Recipe: aggregating member results

A member handler registered with `AddHandlerR` returns a typed result, and
the callback reads every member's result, in `Add` order, via
`chronos.GroupResults[R](task)`:

```go
chronos.AddHandlerR(mux, func(ctx context.Context, task *chronos.Task[ResizeArgs]) (ResizeResult, error) {
	// ... resize ...
	return ResizeResult{Path: "out.png"}, nil
})

chronos.AddHandler(mux, func(ctx context.Context, task *chronos.Task[ManifestArgs]) error {
	results, err := chronos.GroupResults[ResizeResult](task)
	if err != nil {
		return err
	}
	// results[i] is the i-th Add()'d member's result
	return writeManifest(results)
})
```

`GroupResults` assumes a homogeneous group (every member returned the same
`R`); a member without a result fails with `ErrNoResult`. For heterogeneous
or partial results, read `task.RawGroupResults()` instead.

### Recipe: a parallel stage inside a chain

`ThenGroup` puts a group in the middle (or at the end) of a chain:

```go
chronos.NewChain().
	Then(Validate{}).
	ThenGroup(chronos.NewGroup().
		Add(Encode{Res: "720p"}).
		Add(Encode{Res: "4k"}).
		OnComplete(BuildManifest{})). // fan-in: receives GroupResults
	Then(Deploy{}).                    // receives the callback's result
	Enqueue(ctx, client)
```

Every member receives the previous stage's result via `PrevResult`, the
callback fans the member results in, and its own result flows to the next
stage. A group cannot be the chain's first stage — start with `Then`, or
use `NewGroup` directly.

### Recipe: a chain as a group member

`AddChain` makes a member run a whole chain instead of a single task: its
links run in sequence, and the chain's final link reports the member's
completion to the group (its last result becomes that member's
`GroupResults` entry). This expresses fan-out-of-pipelines — e.g. migrate N
tenants, each a dump→transform→load chain, in parallel, then a verify
callback:

```go
g := chronos.NewGroup()
for _, t := range tenants {
	g.AddChain(chronos.NewChain().Then(Dump{t}).Then(Transform{t}).Then(Load{t}))
}
g.OnComplete(Verify{}).Enqueue(ctx, client)
```

### Gotcha: nesting is exactly one level, and a failed member parks the group

A member chain may not contain a `ThenGroup` stage, and a group used as a
`ThenGroup` stage may not have chain members — nesting stops at one level in
either direction.

A failed member parks the group: when it exhausts its retries, it dead-letters
like any other task, and the group simply waits — the Inspector's
`GroupPending` field on that task shows how many members are still
outstanding. Re-run the dead-lettered member (`chronos task run <queue>
<id>`); once it succeeds, the callback fires if it was the last one. Group
state lives for 7 days and every member completion renews it, so only a
truly abandoned group (a member deleted, or dead-lettered and never re-run)
expires — the callback then never fires.

Full signatures are on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).
