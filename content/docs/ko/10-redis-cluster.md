---
title: Redis Cluster
slug: redis-cluster
group: Operating
description: "해시태그로 슬롯 안전한 키를 쓰는 Redis Cluster에서 chronos-go 실행하기."
---

chronos-go는 **별도 설정 없이** Redis Cluster에서 동작합니다: 큐에 속한
모든 키는 `{queue}` 해시 태그로 감싸져 있어서, 한 큐의 모든 키가 하나의
슬롯에 놓입니다 — enqueue, retry, completion을 구동하는 멀티키 Lua
스크립트가 원자성을 유지합니다 — 반면 서로 다른 큐는 클러스터 전체에
분산되어 수평 확장을 얻습니다.

### 레시피: 서버를 클러스터에 연결하기

`redis.NewClient` 대신 `redis.NewClusterClient`를 쓰면 됩니다. `NewServer`는
어느 쪽이든 동일한 `redis.UniversalClient` 인터페이스를 받으므로 그 외에는
아무것도 바뀌지 않습니다.

```go
rdb := redis.NewClusterClient(&redis.ClusterOptions{
	Addrs: []string{"node1:6379", "node2:6379", "node3:6379"},
})
srv := chronos.NewServer(rdb, chronos.ServerConfig{ /* ... */ })
```

### 레시피: 클러스터를 상대로 CLI 사용하기

`chronos` CLI도 동일한 방식으로 연결합니다. `--cluster`와 쉼표로 구분한
시드 노드 목록을 넘기면 됩니다(하나만 있어도 충분합니다 — 클라이언트가
나머지를 알아서 찾습니다).

```bash
chronos --cluster --redis node1:6379,node2:6379 queue ls
```

### 주의: DB, 전역 키, 그리고 Sentinel

- Redis Cluster는 논리 데이터베이스 0만 가지고 있습니다 — `--db`는
  standalone 전용 플래그이며, CLI는 `--cluster`와 `--db`를 함께 쓰면
  거부합니다.
- 전역 키(`chronos:queues`, 스케줄러 리더 락)는 싱글키 커맨드 또는
  싱글키 Lua 스크립트로만 접근하므로, 별도의 해시 태그 없이도
  클러스터에서 안전합니다.
- Sentinel: `redis.NewFailoverClient`를 주입하는 것도 가능합니다 — 동일한
  `redis.UniversalClient` 인터페이스를 만족합니다 — 다만 Sentinel은 아직
  chronos-go의 테스트 매트릭스에 포함되어 있지 않습니다.

### 실제 클러스터로 검증하기

라이브러리 저장소는 즉석에서 띄울 수 있는 6노드 클러스터와, 스크립트
전체를 커버하는 통합 테스트 스위트(모든 Lua 스크립트와 커맨드 패턴이
클러스터에서 최소 한 번씩 실행됨)를 함께 제공합니다. 이 문서 사이트가
아니라 **라이브러리 저장소**에서 실행합니다.

```bash
cd deploy/redis-cluster && docker compose up -d && cd ../..
make test-cluster
```

전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.
