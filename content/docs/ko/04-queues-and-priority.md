---
title: 큐와 우선순위
slug: queues-and-priority
---

서버 하나가 동시에 여러 큐를 소비할 수 있으며, 모든 큐가 똑같은 대우를 받아야
하는 것은 아닙니다. `ServerConfig.Queues`는 큐 이름을 가중치에 매핑합니다 —
모든 큐에 작업이 있는 동안, 가중치 6인 큐는 가중치 1인 큐보다 약 6배 더 자주
소비됩니다. smooth weighted round-robin 방식이라 가중치가 낮은 큐도 굶주리지
않습니다. 이번 라운드에 선택된 큐가 마침 비어 있으면, 그 라운드는 작업이 있는
가장 높은 가중치의 큐로 넘어가므로 유휴 상태인 고우선순위 큐가 낮은 큐를
막는 일도 없습니다. 낮은 우선순위 작업이 절대 높은 우선순위 작업보다 먼저
실행되면 안 되는 경우에는 `StrictPriority`로 완전히 순서대로 소비하도록 바꿀
수 있습니다. 어느 쪽이든, 큐는 서버 프로세스의 생명주기와 별개로 일시정지할
수 있습니다.

### 레시피: 가중치 큐

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	Queues: map[string]int{
		"critical": 6,
		"default":  3,
		"low":      1,
	},
})
```

큐는 최소 하나 이상 필요합니다 — 암묵적인 기본 큐는 없으며, `Queues`가
비어 있으면 `Start`가 에러를 반환합니다. `<= 0`인 가중치는 `1`로 취급됩니다.

### 레시피: 엄격한 우선순위

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	Queues: map[string]int{
		"critical": 6,
		"default":  3,
		"low":      1,
	},
	StrictPriority: true,
})
```

`StrictPriority: true`이면 가중치가 높은 큐가 항상 먼저 소비됩니다 — 가중치가
낮은 큐는 더 높은 가중치의 큐가 모두 비어 있을 때만 실행됩니다. 동률은 큐
이름으로 결정론적으로 정리됩니다.

### 레시피: 큐 일시정지와 재개

```go
insp := chronos.NewInspector(rdb)
if err := insp.PauseQueue(ctx, "low"); err != nil {
	// handle error
}
// ... later
if err := insp.ResumeQueue(ctx, "low"); err != nil {
	// handle error
}
```

같은 동작을 `chronos` CLI에서도 사용할 수 있습니다.

```bash
chronos queue pause low     # stop consuming (~1s to take effect)
chronos queue resume low    # resume consuming
```

또는 웹 콘솔의 ⏸ 토글로도 가능합니다. 일시정지는 약 1초 안에 서버가 해당
큐를 *소비*하는 것만 멈춥니다 — enqueue, forwarding, recovery는 모두 계속
동작하므로, 재개할 때까지 작업은 pending 상태로 그저 쌓입니다. 이미 집어
들어 처리 중이던 태스크는 정상적으로 끝까지 처리됩니다.

### 주의: 알 수 없는 큐 이름도 계속 일시정지 상태로 남습니다

`PauseQueue`는 실제로 어떤 서버에도 설정되어 있지 않은 큐 이름을 포함해
어떤 이름이든 받아들입니다. 같은 이름으로 `ResumeQueue`를 호출하기 전까지
paused 집합에 그대로 남아 있습니다 — `ServerConfig.Queues`에 대한 검증이
없으므로, 오타는 크게 실패하는 대신 조용히 아무 효과도 내지 않습니다.

전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.

### 다음

실패한 태스크가 어떻게 재시도되고, 데드레터로 이동하고, 크래시 이후 복구되는지
살펴보는 [재시도와 안정성](/ko/docs/#retries-and-reliability) 문서로
이어서 보세요.
