---
title: 시작하기
slug: getting-started
---

chronos-go는 Redis 기반의 분산 태스크 큐이자 스케줄러로, Go를 위한 타입 안전한
제네릭 API를 제공합니다. 태스크 타입을 정의하고 `Handler[T]`를 등록해 큐에 넣기만
하면 됩니다 — `interface{}` 페이로드도, 수동 `json.Unmarshal`도 필요 없습니다.

### 요구 사항

- Go 1.26 이상
- Redis 6.2 이상 (`XAUTOCLAIM`을 사용)

### 설치

```bash
go get github.com/kenshin579/chronos-go
```

### 태스크와 핸들러 정의하기

태스크는 안정적인 `Kind()` (값 리시버)를 가진 평범한 구조체입니다. `Mux`에 이 타입을
위한 핸들러를 등록한 다음, `Client`를 통해 해당 타입의 값을 큐에 넣습니다.

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

### 실행하기

`srv.Start(ctx, mux)`는 서버의 fetch, heartbeat, forwarder, recoverer, janitor
루프를 백그라운드에서 시작하고 즉시 반환합니다 — 블로킹되지 않습니다. 워커가 작업을
계속 소비하길 원하는 동안에는 (위 예제의 `select {}`처럼) 프로세스를 살려두고,
정리하며 종료하려면 `srv.Shutdown(context.Background())`을 호출해 진행 중인
태스크가 모두 끝나도록 하세요.

큐에 넣는 시점에 어떻게 처리될지 세밀하게 조정할 수 있습니다.

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

핸들러의 반환값에 따라 다음 동작이 결정됩니다.

- `nil` 반환 → 성공 (ack 후 제거되거나, `WithRetention`을 사용하면 나중에 조회할
  수 있도록 보관됨).
- `error` 반환 → `MaxRetry`가 소진될 때까지 백오프와 함께 재시도한 뒤 데드레터로
  이동.
- `chronos.SkipRetry(err)` 반환 → 즉시 데드레터로 이동 (영구적인 오류).
- `panic` → 복구되어 재시도 가능한 오류로 처리됨.

소진된 태스크에 대해 알림을 받거나 조사하려면 `ServerConfig`에 `OnDeadLetter` 훅을
설정하세요.

### 주의: 핸들러는 반드시 멱등이어야 합니다

chronos-go는 **최소 한 번(at-least-once)** 전달을 보장하며, 정확히 한 번을
보장하지 않습니다. 크래시 복구(`XAUTOCLAIM`)와 재시도로 인해 같은 태스크가 다시
전달되어 핸들러가 또 호출될 수 있습니다 — 처리 도중 크래시가 발생했거나, 재전달된
메시지가 느린 ack와 경합하거나, 실제로는 성공했지만 ack가 유실된 재시도의
경우입니다. 핸들러는 같은 태스크를 두 번 실행해도 안전하도록 작성하세요 (예:
upsert, 멱등성 키 사용, 이전 실행 효과 확인 등) — 단일 전달을 전제하지 마세요.

### 다음

태스크 타입 정의, 핸들러 등록, 핸들러 결과 처리를 더 깊이 다루는
[태스크와 핸들러](/ko/docs/#tasks-and-handlers) 문서로 이어서 보세요.
