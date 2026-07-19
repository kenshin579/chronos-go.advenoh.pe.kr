---
title: Getting started
slug: getting-started
---

chronos-go is a Redis-backed distributed task queue and scheduler for Go, with a
type-safe generic API: define a task type, register a `Handler[T]`, and enqueue it —
no `interface{}` payloads, no manual `json.Unmarshal`.

### Requirements

- Go 1.26+
- Redis 6.2+ (uses `XAUTOCLAIM`)

### Install

```bash
go get github.com/kenshin579/chronos-go
```

### Define a task and its handler

A task is just a struct with a stable `Kind()` (value receiver). Register a handler
for it on a `Mux`, then enqueue an instance of it through a `Client`.

```go
package main

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
	"github.com/kenshin579/chronos-go"
)

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

### Run it

`srv.Start(ctx, mux)` starts the server's fetch, heartbeat, forwarder, recoverer and
janitor loops in the background and returns immediately — it does not block. Keep the
process alive (as `select {}` does above) for as long as you want it consuming work,
and call `srv.Shutdown(context.Background())` to drain in-flight tasks and stop
cleanly.

You can tune what gets picked up and how, right at enqueue time:

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

A handler's return value decides what happens next:

- return `nil` → success (acked and removed — or kept for `WithRetention` for
  later inspection).
- return an `error` → retried with backoff until `MaxRetry` is exhausted, then
  dead-lettered.
- return `chronos.SkipRetry(err)` → dead-lettered immediately (permanent error).
- `panic` → recovered, treated as a retryable error.

Set an `OnDeadLetter` hook on `ServerConfig` to alert on / inspect exhausted tasks.

### Gotcha: handlers must be idempotent

chronos-go guarantees **at-least-once** delivery, not exactly-once. Crash recovery
(`XAUTOCLAIM`) and retries mean the same task can be redelivered and your handler
invoked again for it — after a crash mid-processing, after a redelivered message
races a slow ack, or after a retry that actually succeeded but whose ack was lost.
Write handlers so that running them twice on the same task is safe (e.g. upserts,
idempotency keys, checking for prior effect) rather than assuming single delivery.

### Next

Continue with [Tasks & handlers](/docs/#tasks-and-handlers) to go deeper on defining
task types, registering handlers, and handler outcomes.
