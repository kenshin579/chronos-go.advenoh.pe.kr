---
title: Migrating from asynq
slug: migrating-from-asynq
group: Reference
description: "Map asynq concepts to chronos-go and port your handlers and scheduler."
---

[asynq](https://github.com/hibiken/asynq) is in maintenance mode, and a lot of
teams moving off it land on chronos-go because the shape of the API is
familiar: a client that enqueues, a mux that routes by task type, a server
that runs handlers. The differences are what you gain by moving — a
type-safe payload instead of `[]byte`, a scheduler that's safe to run on
every instance instead of one you have to babysit, and a unique lock that
survives long-running work instead of just a TTL.

### API mapping

| asynq | chronos-go |
|---|---|
| `asynq.Task` — `[]byte` payload, decoded by hand | `Task[T]` — generic, `t.Args` arrives already decoded |
| `asynq.ServeMux` + `asynq.HandlerFunc` | `chronos.Mux` (`chronos.NewMux()`) + `chronos.AddHandler[T]` |
| `asynq.Client.Enqueue` | `chronos.Enqueue[T](ctx, client, args, opts...)` |
| App must ensure only one `asynq.Scheduler` runs | `chronos.Scheduler` — built-in leader election, safe on every instance |
| Unique lock: TTL only, can expire mid-processing | Unique lock: heartbeat-renewed for as long as the task is being worked |

### Recipe: before (asynq) and after (chronos-go)

Same task — send an email — on both sides. asynq first:

```go
package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/hibiken/asynq"
)

type EmailPayload struct {
	UserID string `json:"user_id"`
	Body   string `json:"body"`
}

const TypeEmailSend = "email:send"

func NewEmailSendTask(payload EmailPayload) (*asynq.Task, error) {
	b, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeEmailSend, b), nil
}

func handleEmailSendTask(ctx context.Context, t *asynq.Task) error {
	var p EmailPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}
	log.Printf("sending to %s: %s", p.UserID, p.Body)
	return nil
}

func main() {
	redisOpt := asynq.RedisClientOpt{Addr: "127.0.0.1:6379"}

	// --- worker side ---
	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeEmailSend, handleEmailSendTask)

	srv := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: 10,
		Queues:      map[string]int{"default": 1},
	})
	go func() {
		if err := srv.Run(mux); err != nil {
			log.Fatal(err)
		}
	}()
	defer srv.Shutdown()

	// --- producer side ---
	client := asynq.NewClient(redisOpt)
	defer client.Close()

	task, err := NewEmailSendTask(EmailPayload{UserID: "u1", Body: "hi"})
	if err != nil {
		log.Fatal(err)
	}
	if _, err := client.Enqueue(task); err != nil {
		log.Fatal(err)
	}

	select {}
}
```

And chronos-go:

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

Notice what disappears: no `TypeEmailSend` string constant to keep in sync
with a `HandleFunc` registration (`Kind()` on the type is the single source
of truth), no `json.Marshal`/`json.Unmarshal` pair to keep in sync with each
other, no `[]byte` in sight. `t.Args` in the handler is already an
`EmailArgs`.

### Scheduler: one instance vs. every instance

With asynq, a periodic job means running an `asynq.Scheduler` somewhere and
making sure exactly one instance of your service runs it — two copies means
duplicate enqueues, so teams end up designating a leader pod, or running
schedulers as a separate deployment, by hand. With `chronos.Scheduler`
(`chronos.RegisterInterval` / `chronos.RegisterCron`, see
[Scheduling](/docs/scheduling/)), you register the same schedule on every
instance and only one of them actually fires at a time — the built-in leader
election and deterministic dedup key handle the coordination that asynq
leaves to you (see [How it works](/docs/how-it-works/) for the mechanism).

### Gotcha: payload serialization and lock renewal work differently

Don't reach for `json.Marshal`/`json.Unmarshal` out of habit — chronos-go's
generic `Task[T]` handles encoding on enqueue and decoding before your
handler runs, so `t.Args` is already the typed value; adding manual
(de)serialization on top is redundant and, if it disagrees with what the
generic path does, a source of subtle bugs.

The other difference is the unique lock. asynq's lock is TTL-only: pick a TTL
too short for how long the job actually takes, and the lock can expire while
the task is still processing, letting a duplicate slip in. chronos-go's
`WithUnique` lock (see [Enqueue options](/docs/enqueue-options/)) is
initially just a TTL too, but once a worker picks the task up, the server's
heartbeat renews it for as long as processing takes — see
[Retries & reliability](/docs/retries-and-reliability/) for the heartbeat
mechanism. Size the TTL for the wait, not the run.

### Where to go from here

That's the whole surface this guide covers. Go back to
[Getting started](/docs/getting-started/) for the full walkthrough, or head
to the source and issue tracker on GitHub:
[github.com/kenshin579/chronos-go](https://github.com/kenshin579/chronos-go).
