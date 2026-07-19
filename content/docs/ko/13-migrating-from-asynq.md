---
title: asynq에서 마이그레이션
slug: migrating-from-asynq
---

[asynq](https://github.com/hibiken/asynq)는 유지보수 모드에 들어가 있고,
그곳에서 벗어나려는 많은 팀이 chronos-go로 향하는 이유는 API의 모양이
익숙하기 때문입니다 — enqueue하는 client, 태스크 타입으로 라우팅하는 mux,
핸들러를 실행하는 server. 다른 점은 옮기면서 얻는 것들입니다 — `[]byte`
대신 타입 안전한 payload, 손수 챙기지 않아도 모든 인스턴스에서 안전하게
실행할 수 있는 스케줄러, 그리고 TTL 하나만 믿는 대신 오래 걸리는 작업
동안에도 살아남는 고유 락입니다.

### API 대응표

| asynq | chronos-go |
|---|---|
| `asynq.Task` — `[]byte` payload, 손수 디코드 | `Task[T]` — 제네릭, `t.Args`가 이미 디코드되어 도착 |
| `asynq.ServeMux` + `asynq.HandlerFunc` | `chronos.Mux` (`chronos.NewMux()`) + `chronos.AddHandler[T]` |
| `asynq.Client.Enqueue` | `chronos.Enqueue[T](ctx, client, args, opts...)` |
| 앱이 직접 `asynq.Scheduler`가 하나만 실행되도록 보장해야 함 | `chronos.Scheduler` — 내장 리더 선출, 모든 인스턴스에서 안전 |
| 고유 락: TTL만 있어 처리 도중 만료될 수 있음 | 고유 락: 태스크가 처리되는 동안 heartbeat가 계속 갱신 |

### 레시피: 이전(asynq)과 이후(chronos-go)

양쪽 모두 같은 태스크 — 이메일 전송 — 입니다. 먼저 asynq입니다.

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

그리고 chronos-go입니다.

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

무엇이 사라졌는지 주목하세요. `HandleFunc` 등록과 계속 맞춰줘야 하는
`TypeEmailSend` 문자열 상수가 없고(타입에 붙은 `Kind()`가 유일한 진실의
원천입니다), 서로 맞춰줘야 하는 `json.Marshal`/`json.Unmarshal` 쌍도 없고,
`[]byte`도 보이지 않습니다. 핸들러 안의 `t.Args`는 이미 `EmailArgs`
자체입니다.

### 스케줄러: 인스턴스 하나 vs. 모든 인스턴스

asynq에서 주기 작업을 돌리려면 어딘가에서 `asynq.Scheduler`를 실행하면서
서비스 인스턴스 중 정확히 하나만 그것을 실행하도록 직접 보장해야 합니다 —
두 개가 동시에 실행되면 중복 enqueue가 발생하므로, 팀들은 결국 리더 파드를
지정하거나 스케줄러를 별도 배포로 손수 분리해서 운영하게 됩니다.
`chronos.Scheduler`(`chronos.RegisterInterval` / `chronos.RegisterCron`,
[스케줄링](/ko/docs/#scheduling) 참고)에서는 모든 인스턴스에 같은 일정을
등록해 두면 그중 하나만 실제로 실행됩니다 — asynq가 여러분에게 맡겼던
조정을 내장 리더 선출과 결정적인 중복 제거 키가 대신 처리합니다(그 메커니즘은
[동작 원리](/ko/docs/#how-it-works) 참고).

### 주의: payload 직렬화와 락 갱신 방식이 다릅니다

습관적으로 `json.Marshal`/`json.Unmarshal`을 다시 손대지 마세요 —
chronos-go의 제네릭 `Task[T]`가 enqueue 시점의 인코딩과 핸들러 실행 전
디코딩을 이미 처리하므로 `t.Args`는 이미 타입이 있는 값입니다. 그 위에
수동 (역)직렬화를 얹으면 중복일 뿐 아니라, 제네릭 경로가 하는 일과
어긋나면 미묘한 버그의 원인이 됩니다.

또 다른 차이는 고유 락입니다. asynq의 락은 TTL만 있습니다 — 작업이 실제로
걸리는 시간보다 짧은 TTL을 고르면, 태스크가 아직 처리 중인데도 락이
만료되어 중복이 슬쩍 들어올 수 있습니다. chronos-go의 `WithUnique` 락
([Enqueue 옵션](/ko/docs/#enqueue-options) 참고)도 처음에는 TTL일 뿐이지만,
워커가 태스크를 집어 든 다음부터는 서버의 heartbeat가 처리가 끝날 때까지
계속 갱신합니다 — heartbeat 메커니즘은
[재시도와 안정성](/ko/docs/#retries-and-reliability)을 참고하세요. TTL은
실행 시간이 아니라 대기 시간을 기준으로 잡으세요.

### 이제부터는

이 가이드가 다루는 전체 표면은 여기까지입니다. 전체 과정을 다시 보려면
[시작하기](/ko/docs/#getting-started)로 돌아가거나, GitHub의 소스와
이슈 트래커로 가 보세요:
[github.com/kenshin579/chronos-go](https://github.com/kenshin579/chronos-go).
