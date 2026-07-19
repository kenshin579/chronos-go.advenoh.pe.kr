---
title: 그룹
slug: groups
---

`Group`은 멤버들을 병렬로 fan-out하고, **멤버 전부가 성공했을 때** 콜백을
실행합니다 — [체인](/ko/docs/#chains)의 엄격한 순차 링크와 짝을 이루는
fan-in 개념입니다.

### 레시피: fan-out과 fan-in

```go
info, err := chronos.NewGroup().
	Add(ResizeArgs{Path: "a.png"}).
	Add(ResizeArgs{Path: "b.png"}, chronos.WithQueue("low")).
	OnComplete(ResizeArgs{Path: "manifest"}, chronos.WithRetention(time.Hour)).
	Enqueue(ctx, client)
```

`Add`는 각자의 태스크 옵션을 가진 멤버를 하나 추가합니다. 멤버들은 어떤
큐에서든 동시에 실행됩니다. `OnComplete`은 콜백을 설정하며, 이 콜백은
자신의 레코드가 존재하는 동안 정확히 한 번만 enqueue됩니다 — 멱등적으로
추적되므로 at-least-once 재전달이 콜백을 두 번 실행시킬 수 없습니다.
`Enqueue`는 모든 멤버를 미리 검증하고, 어떤 멤버든 enqueue하기 전에 그룹의
pending-member 레코드를 먼저 만들기 때문에, 중간에 일부만 실패해도 콜백이
너무 일찍 실행되는 일은 없습니다.

### 레시피: 멤버 결과 모으기

`AddHandlerR`로 등록된 멤버 핸들러는 타입이 있는 결과값을 반환하고,
콜백은 `chronos.GroupResults[R](task)`을 통해 모든 멤버의 결과를 `Add`한
순서대로 읽을 수 있습니다.

```go
chronos.AddHandlerR(mux, func(ctx context.Context, task *chronos.Task[ResizeArgs]) (ResizeResult, error) {
	// ... resize ...
	return ResizeResult{Path: "out.png"}, nil
})

chronos.AddHandler(mux, func(ctx context.Context, task *chronos.Task[ManifestArgs]) error {
	results, err := chronos.GroupResults[ResizeResult](task)
	if err != nil {
		return err
	}
	// results[i] is the i-th Add()'d member's result
	return writeManifest(results)
})
```

`GroupResults`는 그룹이 동질적이라고 가정합니다(모든 멤버가 같은 `R`을
반환). 결과가 없는 멤버가 있으면 `ErrNoResult`로 실패합니다. 이종 결과나
일부만 있는 결과를 다뤄야 한다면 `task.RawGroupResults()`를 대신
사용하세요.

### 레시피: 체인 안의 병렬 스테이지

`ThenGroup`은 체인 중간(또는 끝)에 그룹을 하나 끼워 넣습니다.

```go
chronos.NewChain().
	Then(Validate{}).
	ThenGroup(chronos.NewGroup().
		Add(Encode{Res: "720p"}).
		Add(Encode{Res: "4k"}).
		OnComplete(BuildManifest{})). // fan-in: receives GroupResults
	Then(Deploy{}).                    // receives the callback's result
	Enqueue(ctx, client)
```

각 멤버는 `PrevResult`를 통해 이전 스테이지의 결과를 받고, 콜백은 멤버
결과들을 모아 fan-in하며, 그 콜백의 결과가 다음 스테이지로 흘러갑니다.
그룹은 체인의 첫 번째 스테이지가 될 수 없습니다 — `Then`으로 시작하거나,
선행 단계가 없다면 `NewGroup`을 직접 사용하세요.

### 레시피: 그룹 멤버로 쓰이는 체인

`AddChain`은 멤버가 단일 태스크 대신 체인 전체를 실행하게 합니다: 그
링크들이 순서대로 실행되고, 체인의 마지막 링크가 그 멤버의 완료를
그룹에 보고합니다(마지막 결과가 그 멤버의 `GroupResults` 항목이
됩니다). 이는 파이프라인의 fan-out을 표현합니다 — 예를 들어 N개의
테넌트를 각각 dump→transform→load 체인으로 병렬 마이그레이션한 뒤 검증
콜백을 실행하는 경우입니다.

```go
g := chronos.NewGroup()
for _, t := range tenants {
	g.AddChain(chronos.NewChain().Then(Dump{t}).Then(Transform{t}).Then(Load{t}))
}
g.OnComplete(Verify{}).Enqueue(ctx, client)
```

### 주의: 중첩은 정확히 한 단계까지, 실패한 멤버는 그룹을 멈춰 세웁니다

멤버 체인은 `ThenGroup` 스테이지를 포함할 수 없고, `ThenGroup` 스테이지로
쓰이는 그룹은 체인 멤버를 가질 수 없습니다 — 어느 방향이든 중첩은 한
단계에서 멈춥니다.

실패한 멤버는 그룹을 멈춰 세웁니다: 재시도를 모두 소진하면 다른 태스크와
마찬가지로 데드레터되고, 그룹은 그냥 대기합니다 — 해당 태스크의 Inspector
`GroupPending` 필드를 보면 아직 남아있는 멤버 수를 알 수 있습니다.
데드레터된 멤버를 재실행하세요(`chronos task run <queue> <id>`). 그 멤버가
성공하면, 그것이 마지막 멤버였을 경우 콜백이 실행됩니다. 그룹 상태는 7일간
유지되며 멤버가 완료될 때마다 갱신되므로, 정말로 방치된 그룹만(멤버가
삭제되었거나 데드레터된 채 재실행되지 않은 경우) 만료되며 — 그 경우
콜백은 영영 실행되지 않습니다.

전체 시그니처는
[pkg.go.dev](https://pkg.go.dev/github.com/kenshin579/chronos-go)에
문서화되어 있습니다.

### 다음

메트릭, Inspector API, CLI로 큐와 태스크를 들여다보는
[관측성](/ko/docs/#observability) 문서로 이어서 보세요.
