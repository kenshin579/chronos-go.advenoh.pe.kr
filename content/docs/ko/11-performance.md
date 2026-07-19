---
title: 성능과 벤치마크
slug: performance
---

chronos-go는 chronos-go와 [asynq](https://github.com/hibiken/asynq)에
동일한 워크로드를 나란히 돌려보는 벤치마크 스위트를 함께 제공합니다. 시나리오는
네 가지입니다: 순수 **enqueue**(클라이언트 측만), worker 동시성
`C ∈ {1, 4, 16, 64}`에서의 **end-to-end**(생산 + 소비), 순차적으로 이어지는
**chain**, 그리고 팬아웃/팬인 **group**입니다. 전체 방법론, 표, 주의사항은
라이브러리의
[`docs/BENCHMARKS.md`](https://github.com/kenshin579/chronos-go/blob/main/docs/BENCHMARKS.md)에
있습니다.

### 방법론 요약

두 라이브러리 모두 **기본 설정**으로 실행하며, 공유하는 노브만 동일하게
맞춥니다 — concurrency, payload(100바이트 JSON), 태스크 개수(20,000개),
프로듀서 개수(4개) — 같은 머신, 같은 로컬 Redis에서 번갈아 실행합니다.
모든 수치는 **3회 실행 중 처리량 중앙값**입니다(실행 사이마다 Redis를
플러시합니다). 프로듀서는 서버가 소비하는 동안 최대한 빠르게 enqueue합니다
— *포화(saturation)* 벤치마크이므로 처리량이 의미 있는 핵심 지표이며,
포화 상태에서의 지연 퍼센타일은 백로그 대기 시간을 포함하고, 소비가
생산을 따라잡는 경우(고동시성)에만 실제 태스크당 지연 시간에 근접합니다.

측정 환경(2026-07-12): Apple M4 Pro(12코어), Redis 8.0.3, Go 1.26.4,
해당 커밋의 chronos-go, asynq v0.26.0.

### 핵심 수치

`docs/BENCHMARKS.md`에서 그대로 인용합니다.

**Enqueue 처리량** (순수 클라이언트 측, 프로듀서 4개, 서버 없음):

| library | tasks/s |
|---|---|
| chronos-go | 25,872 |
| asynq | 27,133 |

**End-to-end 처리량** (태스크 2만 개, 프로듀서 4개, worker 동시성 `C`):

| C | chronos-go | asynq | ratio |
|---|---|---|---|
| 1 | 2,605 | 3,939 | 0.66x |
| 4 | 5,370 | 5,321 | 1.01x |
| 16 | **15,257** | 6,096 | **2.50x** |
| 64 | **19,859** | 4,908 | **4.05x** |

chronos-go는 동시성에 따라 확장됩니다(배치된 `XREADGROUP COUNT=k`와
파이프라인된 body 로드가 유휴 worker들 사이에서 Redis 왕복을 상각합니다).
asynq는 C=16 부근에서 정점을 찍고 이후 하락합니다. C=64에서는 chronos-go의
consumer가 프로듀서를 따라잡아 백로그 없이 **p50 ≈ 1ms**를 기록합니다.
동시성이 낮을수록 퍼센타일은 백로그가 지배합니다.

| C | chronos p50 / p95 | asynq p50 / p95 |
|---|---|---|
| 1 | 3,910ms / 6,552ms | 2,874ms / 4,146ms |
| 4 | 1,675ms / 2,737ms | 2,191ms / 2,877ms |
| 16 | 268ms / 354ms | 1,286ms / 2,128ms |
| 64 | **1ms / 1ms** | 2,481ms / 3,234ms |

**출처의 솔직한 코멘트**: C=1에서는 asynq가 약 1.5배 빠릅니다 — 배치
크기가 1이면 chronos-go는 여전히 태스크당 3번의 왕복(읽기, body 로드,
active 표시)을 지불하는 반면 asynq는 스크립트 하나로 처리합니다. 저동시성
단일 worker 배포는 chronos-go가 잘 맞는 지점이 아닙니다 — C≥4가 그
지점입니다.

**워크플로우** (asynq에는 대응 기능 없음), C=16, 총 태스크 2만 개:

| scenario | tasks/s | notes |
|---|---|---|
| chain (2,000 × 10 links) | 13,489 | whole-chain p50 1.1s under saturation (all 2,000 chains progress in waves) |
| group (2,000 × 10 members) | 6,664 | callback fires **p50 3ms** after the last member |

최신 수치와 전체 글 — 이전 실행에서 벤치마크 스위트가 무엇을 찾아내고
고쳤는지 포함 — 은 GitHub의
[`docs/BENCHMARKS.md`](https://github.com/kenshin579/chronos-go/blob/main/docs/BENCHMARKS.md)를
참고하세요. 여기 실린 결과는 한 시점의 스냅샷이며 두 라이브러리가
발전함에 따라 달라질 수 있습니다.

### 레시피: 수치 재현하기

`make bench`(라이브러리 저장소에서 실행)는 enqueue, 각 동시성에서의
end-to-end, 그리고 chain과 group까지 전체 매트릭스를 **로컬** Redis를
상대로 실행합니다.

```bash
make bench
```

실행 사이마다 **로컬 Redis DB 15를 플러시**하므로, 지워도 괜찮은 Redis를
가리키도록 하고 실제 데이터가 있는 데이터베이스에는 실행하지 마세요.

### 주의: 절대적인 보장이 아니라 상대 비교입니다

이 수치들은 로컬(비-Docker) Redis를 쓰는 한 대의 머신에서, 라이브러리
오버헤드만 격리하는 no-op 핸들러로 측정한 것입니다 — 실제로 일을 하는
핸들러라면 큐보다 훨씬 먼저 이 비용들을 압도할 것입니다. 이 수치는
**동일한 조건에서 asynq와 비교한 상대적인 값**으로 받아들이고, 여러분의
배포 환경에 대한 처리량 보장으로 여기지 마세요. 이 수치로 용량을
산정하기 전에 여러분의 하드웨어와 Redis 토폴로지에서 직접 `make bench`를
다시 실행해 보세요.

### 다음

이 수치들 뒤에 있는 내부 동작을 다루는
[동작 원리](/ko/docs/#how-it-works) 문서로 이어서 보세요.
