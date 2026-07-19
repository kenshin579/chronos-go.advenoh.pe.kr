---
title: 재시도와 안정성
slug: retries-and-reliability
group: Core
description: "백오프 재시도·dead-letter 훅·크래시 복구·heartbeat 갱신."
---

chronos-go는 **at-least-once**(최소 한 번 이상) 전달을 보장합니다 — 워커가
핸들러를 끝냈지만 ack하기 전에 죽거나, recoverer가 버려진 것처럼 보이는
태스크를 회수하면 태스크가 두 번 이상 실행될 수 있습니다. 그래서 핸들러는
반드시 멱등이어야 합니다. 세 가지 메커니즘이 함께 작동해 이 약속을
실용적으로 만듭니다 — 일반적인 핸들러 에러를 위한 백오프 기반 자동 재시도,
소진되었거나 영구적으로 실패한 태스크를 위한 데드레터 경로(훅 포함), 그리고
워커가 태스크 처리 도중 죽어도 태스크를 잃지 않도록 하는 크래시 복구입니다.

### 핸들러 결과

- `nil` 반환 → 성공 (ack되어 제거되거나, `WithRetention`이 설정되어 있으면
  보관됩니다 — [Enqueue 옵션](/ko/docs/enqueue-options/) 참고).
- `error` 반환 → `MaxRetry`가 소진될 때까지 백오프와 함께 재시도된 후
  데드레터로 이동합니다.
- `chronos.SkipRetry(err)` 반환 → 즉시 데드레터로 이동합니다.
- `panic` → 복구되어 재시도 가능한 에러로 취급됩니다.

### 레시피: 재시도 예산과 백오프

```go
chronos.Enqueue(ctx, client, EmailArgs{UserID: "u1", Body: "hi"},
	chronos.WithMaxRetry(5),
)
```

`WithMaxRetry`는 데드레터로 이동하기 전까지 태스크가 재시도되는 횟수의
상한을 정합니다 (기본값 `DefaultMaxRetry`, 음수는 `0`으로 고정되어 재시도가
없습니다). 시도 사이의 기본 백오프(`DefaultRetryDelay`)는 지수적으로
증가하는 상한 — `5s * 2^retried`, 최대 15분 — 에 full jitter를 적용합니다.
실제 지연 시간은 `0`과 그 상한 사이에서 균등 무작위로 선택되며, 이는
재시도가 한꺼번에 몰리는 thundering herd를 막고 흩어지게 합니다. 이를
커스터마이즈하려면 `ServerConfig`에 `RetryDelayFunc`를 설정하세요.

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	RetryDelayFunc: func(retried int, err error) time.Duration {
		return time.Duration(retried+1) * 10 * time.Second
	},
})
```

### 레시피: 데드레터된 태스크 알림

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	OnDeadLetter: func(ctx context.Context, info *chronos.TaskInfo, err error) {
		log.Printf("dead-lettered: queue=%s kind=%s err=%v", info.Queue, info.Kind, err)
	},
})
```

`OnDeadLetter`는 태스크가 재시도를 모두 소진했거나 `SkipRetry` 에러를
반환했을 때 호출됩니다 — 그 결과 아카이브되든 `WithDeadLetterDiscard`로
폐기되든([Enqueue 옵션](/ko/docs/enqueue-options/) 참고) 상관없이 호출됩니다.
크래시를 거치며 재시도 예산이 소진된 태스크를 *recoverer*가 데드레터로
이동시킬 때도 호출되므로, 이 훅 하나로 두 경로를 모두 커버합니다.

### 레시피: 영구 실패 처리 — 남은 재시도 건너뛰기

```go
func (h *EmailHandler) Handle(ctx context.Context, task *chronos.Task[EmailArgs]) error {
	if !isValidEmail(task.Args.To) {
		return chronos.SkipRetry(fmt.Errorf("invalid address: %s", task.Args.To))
	}
	return sendEmail(ctx, task.Args)
}
```

재시도로도 고칠 수 없는 에러 — 잘못된 입력, 영구적으로 거부된 수신자 등 —
에는 `SkipRetry`를 사용하세요. 그러면 재시도 예산을 먼저 소진하는 대신 곧장
데드레터로 이동합니다.

### 크래시 복구, heartbeat, janitor

핸들러에 별도 코드 없이도 "at-least-once, 자가 복구" 약속을 지켜주는 세 가지
백그라운드 메커니즘이 있습니다.

- **크래시 복구** — recoverer가 주기적으로 `RecoverMinIdle`보다 오래 유휴
  상태인 스트림 엔트리(태스크를 가져간 워커가 응답을 멈춘 경우)를
  `XAUTOCLAIM`하고, 태스크 해시에 이미 기록된 시도 횟수를 바탕으로 다시
  큐에 넣거나 데드레터로 이동시킵니다.
- **Heartbeat** — 태스크가 실제로 처리되는 동안 서버는 `HeartbeatInterval`마다
  PEL의 idle 시간(`XCLAIM ... JUSTID`)과 `WithUnique` 락의 TTL을 갱신합니다.
  이 덕분에 실제로 오래 걸리는 태스크가 recoverer에 의해 회수되는 일이
  없고, 처리 도중에 고유성 락이 만료되는 일도 없습니다.
- **Janitor** — `JanitorInterval`마다 실행되어, 데드레터(아카이브)된
  태스크와 보관 중인 완료 태스크(`WithRetention`)가 만료되거나 큐의
  `MaxArchived` / `MaxCompleted` 상한을 넘으면 제거해 Redis 메모리 사용량을
  제한합니다.

```go
srv := chronos.NewServer(rdb, chronos.ServerConfig{
	RecoverMinIdle:    30 * time.Second, // default
	HeartbeatInterval: 10 * time.Second, // default: RecoverMinIdle/3
})
```

`HeartbeatInterval`은 반드시 `RecoverMinIdle`보다 짧아야 하며, 그래야
실제로 처리 중인 태스크가 자신을 처리하는 워커 밑에서 회수되는 일이
없습니다.

### 주의: 멱등성이 필요하고, panic도 재시도 대상입니다

At-least-once 전달이라는 것은 같은 태스크에 대해 핸들러가 두 번 실행될 수
있다는 뜻입니다 — 핸들러가 `nil`을 반환한 직후, ack이 이루어지기 전에
크래시가 나는 것이 바로 recoverer가 메워야 하는 틈입니다. 반복 실행되어도
안전하도록 핸들러를 설계하세요 (insert 대신 upsert, 고유 키로 보호되는
check-then-act 등). 별개로, 핸들러 안에서 발생한 `panic`은 서버가 복구해
반환된 `error`와 동일하게 취급합니다 — 서버 전체를 죽이는 대신 재시도 한
번을 소모하므로, panic을 일으키는 핸들러도 실제로 재시도를 멈추게 하려면
`WithMaxRetry`나 `SkipRetry`가 필요합니다.

전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.
