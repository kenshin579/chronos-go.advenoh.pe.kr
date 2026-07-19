---
title: Tasks & handlers
slug: tasks-and-handlers
---

A task in chronos-go is just a struct implementing `Kind() string` (value receiver) —
that's the whole `TaskArgs` contract. You register a typed handler for it on a `Mux`,
and the queue routes each incoming message to the handler matching its `Kind`. Because
handlers are generic over the task type, `t.Args` arrives already decoded — no
`interface{}`, no manual `json.Unmarshal`, no type assertions.

### Recipe A: define a task type and register its handler

```go
// A task type: any struct with a stable Kind() (value receiver).
type EmailArgs struct {
	UserID string `json:"user_id"`
	Body   string `json:"body"`
}

func (EmailArgs) Kind() string { return "email:send" }

func main() {
	rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:6379"})
	ctx := context.Background()

	// --- worker side ---
	mux := chronos.NewMux()
	chronos.AddHandler(mux, func(ctx context.Context, t *chronos.Task[EmailArgs]) error {
		// t.Args is strongly typed — no casting, no json.Unmarshal.
		log.Printf("sending to %s: %s", t.Args.UserID, t.Args.Body)
		return nil
	})

	srv := chronos.NewServer(rdb, chronos.ServerConfig{
		Queues:      map[string]int{"default": 1},
		Concurrency: 10,
	})
	if err := srv.Start(ctx, mux); err != nil {
		log.Fatal(err)
	}
	defer srv.Shutdown(context.Background())

	// --- producer side ---
	client := chronos.NewClient(rdb)
	defer client.Close()

	if _, err := chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"}); err != nil {
		log.Fatal(err)
	}

	select {} // keep the worker running
}
```

`AddHandler` reads `Kind()` off the zero value of `T` to key the registration, so
`Kind()` must have a value receiver. Registering a second handler for the same `Kind`
panics — each task type gets exactly one handler on a `Mux`.

### Recipe B: a result-returning handler

Use `AddHandlerR` instead of `AddHandler` when the handler produces a result that a
later step needs — a resize handler reporting the output size, say. The result is
JSON-encoded and made available to the next stage via `PrevResult` / `GroupResults`,
which is how [chains](/docs/#chains) and [groups](/docs/#groups) pass data between
steps.

```go
type ResizeArgs struct {
	Path string `json:"path"`
}

func (ResizeArgs) Kind() string { return "img:resize" }

type ResizeResult struct {
	Bytes int `json:"bytes"`
}

// ExampleAddHandlerR shows a handler that returns a result, which the next
// workflow step reads with PrevResult / GroupResults.
func ExampleAddHandlerR() {
	mux := chronos.NewMux()
	chronos.AddHandlerR(mux, func(ctx context.Context, t *chronos.Task[ResizeArgs]) (ResizeResult, error) {
		return ResizeResult{Bytes: 1024}, nil
	})
	_ = mux
}
```

### Handler outcomes

A handler's return value (or panic) decides what happens to the task next:

- return `nil` → success (acked and removed — or kept for `WithRetention` for
  later inspection).
- return an `error` → retried with backoff until `MaxRetry` is exhausted, then
  dead-lettered.
- return `chronos.SkipRetry(err)` → dead-lettered immediately (permanent error,
  skips the retry budget entirely).
- `panic` → recovered by the server, treated as a retryable error.

Set an `OnDeadLetter` hook on `ServerConfig` to alert on / inspect exhausted tasks.

### Gotcha: handlers must be idempotent

chronos-go guarantees **at-least-once** delivery, not exactly-once. Crash recovery and
retries mean the same task can be redelivered and your handler invoked again for it —
after a crash mid-processing, after a redelivered message races a slow ack, or after a
retry that actually succeeded but whose ack was lost. Write handlers so that running
them twice on the same task is safe (e.g. upserts, idempotency keys, checking for prior
effect) rather than assuming single delivery. Full signatures for `Mux`, `Task[T]`, and
`TaskArgs` are on [pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).

### Next

Continue with [Enqueue options](/docs/#enqueue-options) to control timing, queue
routing, retries, uniqueness, and retention at enqueue time.
