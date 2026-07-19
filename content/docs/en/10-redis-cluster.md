---
title: Redis Cluster
slug: redis-cluster
---

chronos-go works on Redis Cluster **out of the box**: every key belonging to
a queue is wrapped in a `{queue}` hash tag, so all of a queue's keys land on
one slot — the multi-key Lua scripts that drive enqueue, retry and
completion stay atomic — while different queues spread across the cluster
for horizontal scale.

### Recipe: connecting a server to a cluster

Swap `redis.NewClient` for `redis.NewClusterClient`; `NewServer` takes the
same `redis.UniversalClient` interface either way, so nothing else changes:

```go
rdb := redis.NewClusterClient(&redis.ClusterOptions{
	Addrs: []string{"node1:6379", "node2:6379", "node3:6379"},
})
srv := chronos.NewServer(rdb, chronos.ServerConfig{ /* ... */ })
```

### Recipe: the CLI against a cluster

The `chronos` CLI connects the same way, via `--cluster` and a comma-separated
list of seed nodes (one is enough — the client discovers the rest):

```bash
chronos --cluster --redis node1:6379,node2:6379 queue ls
```

### Gotcha: DB, global keys, and Sentinel

- Redis Cluster has only logical database 0 — `--db` is a standalone-only
  flag, and the CLI rejects `--cluster` combined with `--db`.
- The global keys (`chronos:queues`, the scheduler leader lock) are accessed
  with single-key commands or single-key Lua scripts only, so they are
  cluster-safe without needing a hash tag of their own.
- Sentinel: injecting a `redis.NewFailoverClient` works too — it satisfies
  the same `redis.UniversalClient` interface — but Sentinel is not part of
  chronos-go's tested matrix yet.

### Verifying against a real cluster

The library repo ships a disposable 6-node cluster and a script-complete
integration suite (every Lua script and command pattern runs on cluster at
least once). From the **library repo** (not this docs site):

```bash
cd deploy/redis-cluster && docker compose up -d && cd ../..
make test-cluster
```

Full signatures are on
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go).

### Next

Continue with [Performance & benchmarks](/docs/#performance) to see how
chronos-go's throughput scales with concurrency.
