---
title: 태스크와 핸들러
slug: tasks-and-handlers
---

chronos-go에서 태스크는 `Kind() string` (값 리시버)을 구현한 평범한 구조체일
뿐입니다 — 이것이 `TaskArgs` 계약의 전부입니다. `Mux`에 해당 타입을 위한 타입
안전한 핸들러를 등록하면, 큐는 들어오는 메시지를 그 `Kind`와 일치하는 핸들러로
라우팅합니다. 핸들러가 태스크 타입에 대해 제네릭이기 때문에 `t.Args`는 이미
디코딩된 상태로 전달됩니다 — `interface{}`도, 수동 `json.Unmarshal`도, 타입
단언도 필요 없습니다.

### 레시피 A: 태스크 타입 정의와 핸들러 등록

```go
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

`AddHandler`는 `T`의 제로 값에서 `Kind()`를 읽어 등록 키로 사용하므로, `Kind()`는
값 리시버여야 합니다. 같은 `Kind`에 대해 두 번째 핸들러를 등록하면 패닉이
발생합니다 — 하나의 `Mux`에서 각 태스크 타입은 정확히 하나의 핸들러만 가집니다.

### 레시피 B: 결과를 반환하는 핸들러

핸들러가 이후 단계에서 필요한 결과를 만들어낼 때는 `AddHandler` 대신
`AddHandlerR`을 사용하세요 — 예를 들어 리사이즈 핸들러가 결과 파일 크기를 알려주는
경우입니다. 결과는 JSON으로 인코딩되어 `PrevResult` / `GroupResults`를 통해 다음
단계에서 사용할 수 있으며, 이것이 [체인](/ko/docs/#chains)과
[그룹](/ko/docs/#groups)이 단계 사이에 데이터를 전달하는 방식입니다.

```go
type ResizeArgs struct {
	Path string `json:"path"`
}

func (ResizeArgs) Kind() string { return "img:resize" }

type ResizeResult struct {
	Bytes int `json:"bytes"`
}

// ExampleAddHandlerR shows a handler that returns a result, which the next
// workflow step reads with PrevResult / GroupResults.
func ExampleAddHandlerR() {
	mux := chronos.NewMux()
	chronos.AddHandlerR(mux, func(ctx context.Context, t *chronos.Task[ResizeArgs]) (ResizeResult, error) {
		return ResizeResult{Bytes: 1024}, nil
	})
	_ = mux
}
```

### 핸들러 결과 처리

핸들러의 반환값(또는 패닉)에 따라 태스크의 다음 동작이 결정됩니다.

- `nil` 반환 → 성공 (ack 후 제거되거나, `WithRetention`을 사용하면 나중에 조회할
  수 있도록 보관됨).
- `error` 반환 → `MaxRetry`가 소진될 때까지 백오프와 함께 재시도한 뒤 데드레터로
  이동.
- `chronos.SkipRetry(err)` 반환 → 즉시 데드레터로 이동 (영구적인 오류이며, 재시도
  예산을 아예 건너뜀).
- `panic` → 서버가 복구하여 재시도 가능한 오류로 처리함.

소진된 태스크에 대해 알림을 받거나 조사하려면 `ServerConfig`에 `OnDeadLetter` 훅을
설정하세요.

### 주의: 핸들러는 반드시 멱등이어야 합니다

chronos-go는 **최소 한 번(at-least-once)** 전달을 보장하며, 정확히 한 번을
보장하지 않습니다. 크래시 복구와 재시도로 인해 같은 태스크가 다시 전달되어
핸들러가 또 호출될 수 있습니다 — 처리 도중 크래시가 발생했거나, 재전달된 메시지가
느린 ack와 경합하거나, 실제로는 성공했지만 ack가 유실된 재시도의 경우입니다.
핸들러는 같은 태스크를 두 번 실행해도 안전하도록 작성하세요 (예: upsert, 멱등성
키 사용, 이전 실행 효과 확인 등) — 단일 전달을 전제하지 마세요. `Mux`, `Task[T]`,
`TaskArgs`의 전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에서 확인할 수
있습니다.

### 다음

큐에 넣는 시점에 타이밍, 큐 라우팅, 재시도, 고유성, 보관 기간을 제어하는
[Enqueue 옵션](/ko/docs/#enqueue-options) 문서로 이어서 보세요.
