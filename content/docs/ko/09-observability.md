---
title: 관측성
slug: observability
group: Operating
description: "메트릭·Inspector API·chronos CLI로 큐와 태스크를 관찰하기."
---

chronos-go는 헤드리스 라이브러리이기 때문에, 지금 무슨 일이 일어나고
있는지 *들여다볼* 수 있는 수단을 함께 제공합니다: 카운터를 위한 `Metrics`
훅, 큐와 태스크를 위한 `Inspector` API, 그리고 그 위에 만들어진 `chronos`
CLI입니다.

### 레시피: 메트릭

`Metrics`는 서버가 태스크를 처리할 때마다 한 번씩 호출하는 단일 메서드
인터페이스입니다. 제로값/nil `Metrics`는 관측 자체를 비활성화합니다.

```go
type Metrics interface {
	ObserveTask(queue, kind string, outcome TaskOutcome, dur time.Duration)
}
```

`TaskOutcome`은 `OutcomeSuccess`, `OutcomeRetry`, `OutcomeDeadLetter` 중
하나입니다. 코어는 의존성 없는 상태를 유지하며 — 실제로 쓸 수 있는
Prometheus 구현체(그리고 Grafana 대시보드)는 별도 모듈인
[`contrib/prometheus`](https://github.com/kenshin579/chronos-go/tree/main/contrib/prometheus)에
있습니다.

```bash
cd contrib/prometheus/deploy && docker compose up --build
# Grafana: http://localhost:3000  (dashboard "chronos-go")
```

### 레시피: Inspector API

`NewInspector`는 Redis 클라이언트를 감싸서 동일한 데이터를 프로그래밍 방식으로
제공합니다 — CLI(그리고 향후 어떤 UI든)가 만들어지는 토대입니다.

```go
rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:6379"})
insp := chronos.NewInspector(rdb)
queues, _ := insp.Queues(context.Background())
for _, q := range queues {
	fmt.Printf("%s: pending=%d paused=%v\n", q.Queue, q.Pending, q.Paused)
}
```

`Queues`는 큐마다 상태별 카운트(`Pending`, `Active`, `Scheduled`, `Retry`,
`Archived`, `Completed`)와 `Paused` 플래그를 담은 `*QueueInfo`를
반환합니다. `ListTasks(ctx, qname, state, limit)`은 `"scheduled"`,
`"retry"`, `"archived"`, `"completed"` 중 하나의 상태에서 최대 `limit`개의
태스크를 나열하며, 재시도 횟수, 마지막 에러, (체인/그룹의 경우)
`ChainPending`/`GroupPending`을 담은 `*TaskInfo` 항목들을 반환합니다.
`GetTask(ctx, qname, taskID)`는 태스크 하나의 전체 상세 정보를 가져옵니다.
`PauseQueue`/`ResumeQueue`/`PausedQueues`는 소비를 관리합니다.

### 레시피: `chronos` CLI

CLI는 터미널을 위해 Inspector를 감싸는 도구입니다.

```
chronos [--redis addr] [--db n] queue ls                       # standalone (default)
chronos --cluster --redis n1:7000,n2:7001 queue ls             # Redis Cluster
chronos [flags] queue pause  <queue>                            # stop consumption (~1s); unknown names are accepted and stay paused until resume
chronos [flags] queue resume <queue>
chronos [flags] task ls   <queue> <scheduled|retry|archived|completed>
chronos [flags] task run  <queue> <task-id>
chronos [flags] task rm   <queue> <task-id>
```

`--standalone`(기본값)은 단일 Redis에 연결하고, `--cluster`는 `--redis`로
쉼표로 구분된 시드 노드들을 받으며 — Redis Cluster는 데이터베이스 0만
가지므로 — `--db`를 거부합니다. 보관된 성공 기록을 살펴보려면 `task ls
default completed`를 사용하고, `task run <queue> <id>`는 데드레터된
태스크(체인 링크나 그룹 멤버도 포함)를 다시 실행합니다.

### 주의: 일시정지는 소비만 멈춥니다

`queue pause`는 약 1초 안에 서버가 해당 큐를 *소비*하는 것만 멈춥니다 —
enqueue, forward, 복구는 모두 계속 동작하므로, 처리되지 않은 작업이
pending 상태로 쌓입니다. 큐 사이의 우선순위 가중치에도 영향을 주지
않습니다. 큐 가중치와 소비가 어떻게 상호작용하는지는
[큐와 우선순위](/ko/docs/queues-and-priority/) 문서를 참고하세요.

전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.
