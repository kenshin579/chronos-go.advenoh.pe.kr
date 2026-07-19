---
title: Scheduling
slug: scheduling
group: Core
description: "Run interval and cron jobs once across many instances via leader election."
---

A `Scheduler` fires recurring jobs — on a fixed interval or a cron
expression — by enqueueing a task each time the schedule is due. The key
differentiator from a plain `time.Ticker` or cron library: **every instance
of your service can run the scheduler**, and each trigger is still enqueued
exactly once cluster-wide. That's possible because one instance holds a
Redis-backed leader lock at any moment, and each trigger is enqueued under a
deterministic dedup key, so a leader handover can't double-fire a job.

### Recipe: interval jobs

```go
sched := chronos.NewScheduler(rdb, chronos.SchedulerConfig{})

// every 30s (interval must be >= 1s)
chronos.RegisterInterval(sched, 30*time.Second, HealthCheckArgs{})

sched.Start(ctx)          // safe on every instance
defer sched.Shutdown(ctx)
```

`RegisterInterval` accepts the usual per-schedule options (`WithQueue`,
`WithMaxRetry`, ...). The interval must be at least 1 second — a sub-second
schedule can't survive a leader failover, since failover itself takes on the
order of `LeaderTTL`.

### Recipe: cron jobs

```go
// standard 5-field cron
chronos.RegisterCron(sched, "0 0 * * *", DailyReportArgs{})
```

`RegisterCron` takes a standard 5-field cron expression and the same options
as `RegisterInterval`. Both must be registered before `Start` is called.

### How the leader election works

Only one scheduler instance actually enqueues at a time — the elected
**leader**. Internally this is a Redis `SET NX PX` lock: an instance acquires
it if it's vacant, or renews it (`PEXPIRE`) if it already holds it, with a
TTL of `SchedulerConfig.LeaderTTL` (default 5s). Every instance also
subscribes to a pub/sub channel; a leader that shuts down calls
`ResignLeadership`, which deletes the lock *and* publishes a resignation
notice so a follower can re-elect immediately instead of waiting out the
full TTL. If the leader dies without resigning (crash, network partition),
the lock simply expires and another instance picks it up within `LeaderTTL`.

Either way, each trigger is enqueued under a deterministic dedup key
(`<schedule>:<trigger-unix>`) that outlives the handover window. So even in
a split-brain moment — old leader still believes it's leader, new leader has
just taken over — both would produce the same dedup key for the same
trigger, and the second enqueue is a no-op. A job fires once, cluster-wide,
no matter how many instances are running the scheduler.

Registered schedules are also published to a registry, so the Inspector, CLI
and web console can list them — with last-fired time and liveness — even
before they first fire.

### When the leader dies

Failover is automatic — you don't coordinate anything:

- **Graceful shutdown** (rolling deploy, scale-down): the leader calls
  `ResignLeadership`, which releases the lock *and* publishes a resignation, so
  a standby is elected **immediately** — no gap.
- **Crash or node loss** (OOM, `SIGKILL`, network partition): the leader stops
  renewing, its lock expires, and a standby takes over **within `LeaderTTL`**
  (default 5s; the leader renews at `LeaderTTL/2`).

No trigger is missed or duplicated across the hand-off. The scheduler persists
each schedule's **`lastFired`** time in Redis, so the new leader fires any
trigger that came due during the gap — while the deterministic dedup key
(`<schedule>:<trigger-unix>`) makes a re-fire of the *same* trigger a no-op.

If the pod that went down was **running** a task (as a worker, not the
scheduler), that's a separate guarantee: the recoverer reclaims the in-flight
task with `XAUTOCLAIM` and another worker re-runs it — see
[Retries & reliability](/docs/retries-and-reliability/).

**Tuning `LeaderTTL`:** a shorter TTL fails over faster but renews more often;
too short risks a premature hand-off if one renewal is briefly delayed. The 5s
default suits most deployments.

### Gotcha: the scheduler only enqueues

`Scheduler.Start` puts due tasks onto a queue; it does not execute them. You
still need a `Server` (with workers registered on a `Mux`) running somewhere
— often the same process — to actually process what the scheduler
enqueues. Run both:

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{})
mux := chronos.NewMux()
chronos.AddHandler(mux, func(ctx context.Context, t *chronos.Task[HealthCheckArgs]) error {
	return runHealthCheck(ctx)
})

sched := chronos.NewScheduler(rdb, chronos.SchedulerConfig{})
chronos.RegisterInterval(sched, 30*time.Second, HealthCheckArgs{})

srv.Start(ctx, mux)
sched.Start(ctx)
```

If only the scheduler runs, triggers pile up as pending tasks and nothing
ever handles them.

Full signatures are on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).
