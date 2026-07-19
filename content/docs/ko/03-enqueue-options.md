---
title: Enqueue 옵션
slug: enqueue-options
---

`Enqueue`는 태스크가 파이프라인에 들어간 뒤 어떻게 스케줄링되고 처리되는지를
제어하는 가변 인자 `Option` 목록을 받습니다 — 언제 처리 가능해지는지, 어느 큐로
가는지, 몇 번 재시도되는지, 중복을 거부할지, 완료된 태스크를 얼마나 보관할지
등입니다. 각 옵션은 공유된 `enqueueOptions`를 변경하는 작은 `optionFunc`이므로,
하나의 `Enqueue` 호출에서 자유롭게 조합할 수 있습니다.

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

### 지연 실행: `WithProcessIn`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithProcessIn(30*time.Minute),
)
```

`d`가 지난 뒤에야 태스크가 처음으로 처리 가능한 상태가 됩니다. `d`가 0 이하이면
즉시 큐에 들어갑니다. (절대 시각이 필요하다면 `WithProcessAt(t time.Time)`도
있습니다.)

### 큐 라우팅: `WithQueue`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithQueue("critical"),
)
```

기본 큐 대신 지정한 이름의 큐로 태스크를 보냅니다. 서버는 `ServerConfig.Queues`에
나열된 큐에서만 태스크를 가져옵니다.

### 재시도 예산: `WithMaxRetry`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithMaxRetry(5),
)
```

데드레터로 이동하기 전까지의 재시도 횟수 상한을 설정합니다. 기본값은
`DefaultMaxRetry`이며, 음수를 지정하면 `0`(재시도 없음)으로 고정됩니다.

### 고유성: `WithUnique`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithUnique(10*time.Minute),
)
```

`(kind + payload)` 기준으로 태스크를 중복 제거합니다 — 동일한 태스크가 파이프라인
어딘가(대기, 재시도, 예약)에 있는 동안 다시 큐에 넣으면 `ErrDuplicateTask`가
반환됩니다. `ttl`은 주로 워커가 아직 갱신하지 않는 대기 시간 동안의 락을
제한하므로, 예상되는 총 대기 시간보다 넉넉하게 설정하세요. 지연 태스크의 경우 락
TTL이 지연 시간을 포함하도록 자동으로 연장됩니다.

### 소진 시 폐기: `WithDeadLetterDiscard`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithDeadLetterDiscard(),
)
```

재시도가 소진되었을 때 아카이브 ZSET에 저장하는 대신 태스크를 폐기합니다.
`ServerConfig`의 `OnDeadLetter` 훅은 어느 쪽이든 그대로 호출됩니다.

### 보관 기간: `WithRetention`

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithRetention(24*time.Hour),
)
```

성공한 태스크를 janitor가 제거하기 전까지 조사할 수 있도록 "completed" 집합에
`d` 동안 보관합니다. 이 옵션이 없으면 성공한 태스크는 즉시 삭제됩니다. 1초 미만의
값은 1초로 올림 처리됩니다. 처리량이 높은 큐에서 보관 기간을 길게 잡으면 Redis
메모리 사용량이 늘어나므로, `ServerConfig`의 큐별 `MaxCompleted` 상한이 최악의
경우를 제한합니다.

### 주의: 모든 옵션이 모든 곳에서 동작하지는 않습니다

`WithUnique`와 `WithTaskID`는 태스크가 [체인](/ko/docs/#chains)의 한 단계로
enqueue될 때는 거부됩니다 — 이유는 해당 문서를 참고하세요. 그리고 `WithUnique`
락은 단순히 발사 후 잊는 TTL이 아닙니다 — 워커가 태스크를 집어 든 순간부터 처리가
끝날 때까지 서버의 heartbeat가 락을 계속 갱신하며, 이 부분은
[재시도와 신뢰성](/ko/docs/#retries-and-reliability)에서 다룹니다. 전체 옵션과
기본값은 [pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.

### 다음

여러 큐와 워커 동시성이 어떻게 상호작용하는지 살펴보는
[큐와 우선순위](/ko/docs/#queues-and-priority) 문서로 이어서 보세요.
