---
title: 체인
slug: chains
group: Workflows
description: "태스크를 순차 실행하고 단계 간 결과를 다음으로 전달하기."
---

`Chain`은 태스크 시퀀스를 엄격하게 하나씩 순서대로 실행합니다 — 각 링크는
이전 링크가 성공해야만 enqueue됩니다. 폴링이나 수동으로 다음 태스크를
enqueue할 필요가 없습니다. 체인 자체가 남은 링크들을 계속 이어서 넘기기
때문에, 중간에 실패하면 앞으로 건너뛰는 대신 그 지점에서 시퀀스가 멈춥니다.

### 레시피: 체인 만들고 enqueue하기

```go
info, err := chronos.NewChain().
	Then(EncodeArgs{VideoID: "v1"}).
	Then(ThumbnailArgs{VideoID: "v1"}, chronos.WithQueue("low")).
	Then(NotifyArgs{UserID: "u1"}, chronos.WithRetention(time.Hour)).
	Enqueue(ctx, client)
```

`Then`은 링크를 하나 추가하며, 일반적인 태스크 옵션들 — `WithQueue`,
`WithMaxRetry`, `WithRetention`, `WithProcessIn`(이 옵션은 enqueue 시각이
아니라 *이전 링크가 완료된 시점*을 기준으로 지연을 적용합니다) — 을
받습니다. `Enqueue`는 첫 번째 링크만 처리 가능한 상태로 만들며, `info`는
그 첫 링크의 `TaskInfo`입니다. 이후 각 링크는 이전 링크가 성공적으로
끝나야만 실행 대상이 됩니다.

### 레시피: 링크 사이에 결과 전달하기

`AddHandler` 대신 `AddHandlerR`로 등록된 핸들러는 에러와 함께 타입이 있는
결과값을 반환하며, 이 결과는 체인의 *다음* 링크에서 `PrevResult[R]`을
통해 사용할 수 있습니다.

```go
chronos.AddHandlerR(mux, func(ctx context.Context, task *chronos.Task[EncodeArgs]) (EncodeResult, error) {
	// ... encode ...
	return EncodeResult{Path: "out.mp4"}, nil
})

chronos.AddHandlerR(mux, func(ctx context.Context, task *chronos.Task[ThumbnailArgs]) (EncodeResult, error) {
	prev, err := chronos.PrevResult[EncodeResult](task)
	if err != nil {
		return EncodeResult{}, err
	}
	// prev.Path is the previous link's output
	return generateThumbnail(prev)
})
```

이는 병렬 스테이지에서도 동일하게 쓰이는 결과 전달 메커니즘입니다 —
여러 멤버의 결과를 `GroupResults`로 모으는 `ThenGroup` 스테이지에 대한
전체 설명은 [그룹](/ko/docs/groups/) 문서를 참고하세요.

### 주의: 실패하면 체인이 멈춥니다

링크가 재시도를 모두 소진하고 데드레터로 이동하면, 그 뒤를 잇는 링크들은
실행되지 않습니다 — 데드레터된 링크의 메시지에 매달린 채로 대기합니다.
해당 태스크의 Inspector `ChainPending` 필드를 보면 뒤에 몇 개의 링크가
대기 중인지 알 수 있습니다. 재개하려면: 핸들러가 실패한 원인을 고친
다음, 데드레터된 링크를 다시 실행하세요(`chronos task run <queue>
<id>`, 또는 이에 상응하는 Inspector 호출) — 각 링크가 자신의 남은 꼬리를
전부 들고 있으므로, 그 링크 하나만 재실행해도 체인 전체가 그 지점부터
이어집니다.

그 밖에 알아둘 제약들:

- `WithTaskID`와 `WithUnique`는 체인 링크에서는 거부됩니다 — 체인이 내부적으로
  태스크 ID를 직접 관리하며, 체인 안에서는 unique 중복 제거가 지원되지
  않습니다.
- chronos-go 어디서나 그렇듯 핸들러는 멱등이어야 합니다 — 재전달된 링크는
  핸들러를 두 번 이상 실행할 수 있고, 이전 링크가 자신의 다음 링크가 이미
  끝난(그리고 보관되지 않은) 뒤에 재전달되면 다음 링크가 다시 만들어질 수
  있습니다. 링크별 `WithRetention`은 그 유지 기간 동안 이 틈을 막아줍니다.
- 각 링크의 메시지는 자신의 남은 꼬리 전체를 담고 있으므로, 체인이 아주
  길어지면 링크마다 메시지 크기가 커집니다. 체인은 적당히 짧게 유지하세요.

전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.
