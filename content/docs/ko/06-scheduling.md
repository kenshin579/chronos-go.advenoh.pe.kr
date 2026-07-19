---
title: 스케줄링
slug: scheduling
group: Core
description: "리더 선출로 여러 인스턴스에서 interval·cron 작업을 정확히 한 번 실행하기."
---

`Scheduler`는 일정이 도래할 때마다 태스크를 enqueue해서 반복 작업을
실행합니다 — 고정된 간격(interval)으로든, cron 표현식으로든. 평범한
`time.Ticker`나 cron 라이브러리와 다른 핵심 차별점은, **서비스의 모든
인스턴스가 스케줄러를 실행해도** 각 트리거가 클러스터 전체에서 정확히 한
번만 enqueue된다는 것입니다. 이것이 가능한 이유는 항상 하나의 인스턴스만
Redis 기반 리더 락을 쥐고 있고, 각 트리거가 결정적인 중복 제거 키로
enqueue되어 리더 교체가 일어나도 작업이 두 번 실행되지 않기 때문입니다.

### 레시피: 인터벌 작업

```go
sched := chronos.NewScheduler(rdb, chronos.SchedulerConfig{})

// every 30s (interval must be >= 1s)
chronos.RegisterInterval(sched, 30*time.Second, HealthCheckArgs{})

sched.Start(ctx)          // safe on every instance
defer sched.Shutdown(ctx)
```

`RegisterInterval`은 일반적인 옵션(`WithQueue`, `WithMaxRetry` 등)을
그대로 받습니다. interval은 최소 1초 이상이어야 합니다 — 서브초 단위
일정은 리더 페일오버를 견딜 수 없는데, 페일오버 자체가 `LeaderTTL` 정도의
시간이 걸리기 때문입니다.

### 레시피: cron 작업

```go
// standard 5-field cron
chronos.RegisterCron(sched, "0 0 * * *", DailyReportArgs{})
```

`RegisterCron`은 표준 5필드 cron 표현식과 `RegisterInterval`과 동일한
옵션들을 받습니다. 두 함수 모두 `Start`를 호출하기 전에 등록해야 합니다.

### 리더 선출은 어떻게 동작하나

한 번에 오직 하나의 스케줄러 인스턴스만 실제로 enqueue합니다 — 선출된
**리더**입니다. 내부적으로 이는 Redis `SET NX PX` 락입니다: 락이 비어
있으면 획득하고, 이미 자신이 쥐고 있으면 갱신(`PEXPIRE`)하며, TTL은
`SchedulerConfig.LeaderTTL`(기본 5초)입니다. 모든 인스턴스는 또한
pub/sub 채널을 구독합니다 — 리더가 종료될 때 `ResignLeadership`을
호출하면 락을 삭제함과 동시에 사임 알림을 발행해서, 팔로워가 TTL이 다
지나기를 기다리지 않고 즉시 재선출할 수 있게 합니다. 리더가 사임 없이
죽으면(크래시, 네트워크 파티션) 락은 그냥 만료되고 다른 인스턴스가
`LeaderTTL` 이내에 이를 넘겨받습니다.

어느 경우든 각 트리거는 핸드오프 구간보다 오래 살아남는 결정적인 중복
제거 키(`<schedule>:<trigger-unix>`)로 enqueue됩니다. 그래서 split-brain
순간 — 이전 리더는 여전히 자신이 리더라고 믿고, 새 리더는 방금 넘겨받은
상황 — 에도 두 쪽 다 같은 트리거에 대해 같은 중복 제거 키를 만들어내고,
두 번째 enqueue는 아무 일도 하지 않습니다. 스케줄러를 몇 개의 인스턴스가
실행하든 작업은 클러스터 전체에서 정확히 한 번만 실행됩니다.

등록된 일정은 레지스트리에도 게시되므로, Inspector·CLI·웹 콘솔에서 아직
한 번도 실행되지 않은 일정까지도 — 마지막 실행 시각과 생존 여부와 함께 —
조회할 수 있습니다.

### 리더가 죽으면 어떻게 되나

페일오버는 자동이라 별도로 조율할 게 없습니다:

- **정상 종료**(롤링 배포, 스케일다운): 리더가 `ResignLeadership`을 호출해
  락을 해제하고 사임을 게시하므로, standby가 **즉시** 선출됩니다 — 공백 없음.
- **크래시·노드 손실**(OOM, `SIGKILL`, 네트워크 분리): 리더가 갱신을 멈추면
  락이 만료되고, standby가 **`LeaderTTL` 이내**에 이어받습니다(기본 5s; 리더는
  `LeaderTTL/2`마다 갱신).

핸드오프 동안 트리거가 누락되거나 중복되지 않습니다. 스케줄러는 각 일정의
**`lastFired`**(마지막 실행 시각)를 Redis에 영속화하므로, 새 리더가 공백
구간에 도래한 트리거를 따라잡아 실행합니다 — 그리고 결정적 중복 제거 키
(`<schedule>:<trigger-unix>`)가 *같은* 트리거의 재실행을 무효화합니다.

죽은 pod가 (스케줄러가 아니라 워커로서) 태스크를 **실행 중**이었다면, 그건
별개의 보장입니다: recoverer가 `XAUTOCLAIM`으로 처리 중이던 태스크를 회수해
다른 워커가 재실행합니다 — [재시도와 안정성](/ko/docs/retries-and-reliability/) 참고.

**`LeaderTTL` 튜닝:** TTL이 짧을수록 페일오버가 빠르지만 갱신이 잦아집니다.
너무 짧으면 갱신이 잠깐 지연될 때 성급하게 넘어갈 위험이 있습니다. 기본 5s가
대부분의 배포에 적당합니다.

### 주의: 스케줄러는 enqueue만 합니다

`Scheduler.Start`는 도래한 태스크를 큐에 올릴 뿐, 실행하지는 않습니다.
스케줄러가 enqueue한 것을 실제로 처리하려면 어딘가에 — 흔히 같은 프로세스
안에 — `Mux`에 워커가 등록된 `Server`가 함께 실행되고 있어야 합니다. 둘
다 실행하세요.

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

스케줄러만 실행 중이라면 트리거는 대기 중인 태스크로 계속 쌓이기만 하고
아무도 처리하지 않습니다.

전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.
