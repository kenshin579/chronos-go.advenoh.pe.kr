# chronos-go 사이트 — 구현 계획 (Plan B: 문서 02–13 저술)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** chronos-go 문서 사이트의 나머지 12개 문서(`02`–`13`)를 en/ko 양쪽으로 저술해, 랜딩 기능 카드·문서 간 링크가 모두 실제 대상 섹션을 갖도록 완성한다.

**Architecture:** Plan A가 만든 파이프라인(`content/docs/{en,ko}/NN-slug.md` → remark/rehype 렌더, en/ko 파리티·slug 검증)에 콘텐츠만 추가한다. 각 문서는 **레시피형**(개념 한 단락 → 코드 레시피 → gotcha → Next 링크)이며, 모든 Go 코드는 `../chronos-go/`의 실제 소스(README·`example_test.go`·`examples/`)에서 옮긴다 — 지어내지 않는다.

**Tech Stack:** 기존 Plan A 사이트(Next.js static export). 새 런타임 의존성 없음.

**참고 경로:** `LIB` = `/Users/user/src/workspace_chronos_go/chronos-go/`(라이브러리, 코드 출처). 대상 저장소는 `/Users/user/src/workspace_chronos_go/chronos-go.advenoh.pe.kr/`(리포 루트).

**스펙:** `docs/superpowers/specs/2026-07-19-chronos-go-site-design.md`
**선행 계획:** `docs/superpowers/plans/2026-07-19-chronos-go-site.md` (Plan A, 완료·머지됨)

---

## 공통 규칙 (모든 문서 태스크에 적용)

1. **파일 2개**: `content/docs/en/NN-slug.md`, `content/docs/ko/NN-slug.md`. 파일명·`slug`는 en/ko 동일(파이프라인 파리티 요구). `title`만 언어별.
2. **frontmatter**: `title`, `slug` 필수. `slug`는 `[a-z0-9-]+`.
3. **레시피 구조**: (1) 개념 한 단락 — 무엇/왜/언제 → (2) 하나 이상의 코드 레시피 → (3) **Gotcha**(주의점) → (4) **Next** 링크.
4. **코드 출처**: 아래 각 태스크의 "Source"에 적힌 `LIB`의 README 라인/`example_test.go` 함수/`examples/` 파일에서 실제 코드를 옮긴다. 존재하지 않는 API를 만들지 않는다. 상세 시그니처는 godoc(`https://pkg.go.dev/github.com/kenshin579/chronos-go`)으로 링크.
5. **코드 블록은 en/ko 동일**(코드는 번역하지 않음). 산문만 번역.
6. **Next 링크 형식**: 문서는 단일 페이지 + `#slug` 앵커로 렌더된다. en은 `/docs/#<다음-slug>`, ko는 `/ko/docs/#<다음-slug>`. (하드 라우트 `/docs/<slug>` 금지 — 404.)
7. **금지 마커**: 완료 후 `grep -rn "SOURCE:\|TODO\|FIXME\|TBD" content/docs/` → 아무것도 안 나와야 한다.
8. **각 문서 = 1 커밋**: `git add content/docs/en/NN-*.md content/docs/ko/NN-*.md && git commit -m "docs: add <slug> guide (en/ko)"`.
9. 저술 후 매 커밋 전 `npm test`가 여전히 통과해야 한다(파리티·loadDocs). `file -I` 로 두 파일이 `charset=utf-8`인지 확인.

## slug 고정표 (랜딩 기능 카드/시드 문서가 참조하므로 변경 금지)

| NN | slug | title(en) | title(ko) | Next → slug |
|----|------|-----------|-----------|-------------|
| 02 | `tasks-and-handlers` | Tasks & handlers | 태스크와 핸들러 | `enqueue-options` |
| 03 | `enqueue-options` | Enqueue options | Enqueue 옵션 | `queues-and-priority` |
| 04 | `queues-and-priority` | Queues & priority | 큐와 우선순위 | `retries-and-reliability` |
| 05 | `retries-and-reliability` | Retries & reliability | 재시도와 안정성 | `scheduling` |
| 06 | `scheduling` | Scheduling | 스케줄링 | `chains` |
| 07 | `chains` | Chains | 체인 | `groups` |
| 08 | `groups` | Groups | 그룹 | `observability` |
| 09 | `observability` | Observability | 관측성 | `redis-cluster` |
| 10 | `redis-cluster` | Redis Cluster | Redis Cluster | `performance` |
| 11 | `performance` | Performance & benchmarks | 성능과 벤치마크 | `how-it-works` |
| 12 | `how-it-works` | How it works & delivery | 동작 원리와 전달 의미론 | `migrating-from-asynq` |
| 13 | `migrating-from-asynq` | Migrating from asynq | asynq에서 마이그레이션 | (없음 — 마지막 문서, Next 생략) |

> 시드 문서 `01-getting-started`의 Next는 이미 `#tasks-and-handlers`를 가리킨다(Plan A). 02가 그 대상이 된다.

---

## Task 02: Tasks & handlers  (slug `tasks-and-handlers`)

**Files:** `content/docs/{en,ko}/02-tasks-and-handlers.md`
**Source (LIB):** `README.md` 58–137 (Quick start, Enqueue options 개요, Handler outcomes), `example_test.go` `Example()`(21) 및 `ExampleAddHandlerR()`(56). 필요 시 `handler.go`로 `Mux`/`AddHandler`/`AddHandlerR` 시그니처 확인.

- [ ] **Step 1: 소스 읽기** — Run: `sed -n '58,137p' $LIB/README.md` 및 `sed -n '21,77p' $LIB/example_test.go` ($LIB=`/Users/user/src/workspace_chronos_go/chronos-go`).
- [ ] **Step 2: en 저술** — frontmatter `title: Tasks & handlers` / `slug: tasks-and-handlers`. 다룰 내용:
  - 개념: 타입 안전 태스크 모델 — `Task[T]`(payload가 타입), `Mux` 라우팅.
  - 레시피 A: 태스크 타입 정의 + `mux.AddHandler[T](...)` 등록(실제 코드).
  - 레시피 B: 결과를 반환하는 핸들러 — `AddHandlerR`로 등록해 다음 단계(체인/그룹)로 결과 전달(`ExampleAddHandlerR` 코드). 여기서는 "결과를 반환할 수 있다"까지만; 체인/그룹 상세는 07/08로 링크.
  - Handler outcomes: `nil`→성공, `error`→백오프 재시도 후 dead-letter, `chronos.SkipRetry(err)`→즉시 dead-letter, `panic`→재시도 가능한 오류로 복구.
  - Gotcha: at-least-once → 핸들러 멱등성.
  - Next: `/docs/#enqueue-options`.
- [ ] **Step 3: ko 저술** — 같은 구조/slug, `title: 태스크와 핸들러`, Next `/ko/docs/#enqueue-options`, 코드 동일.
- [ ] **Step 4:** `grep` 마커 없음 확인 → `npm test` 통과 → `file -I` utf-8 확인.
- [ ] **Step 5: Commit** — `git commit -m "docs: add tasks-and-handlers guide (en/ko)"`.

## Task 03: Enqueue options  (slug `enqueue-options`)

**Files:** `content/docs/{en,ko}/03-enqueue-options.md`
**Source (LIB):** `README.md` 114–137 (Enqueue options, Handler outcomes). 옵션 함수는 `chronos.go`에서 확인: `WithQueue`, `WithMaxRetry`, `WithProcessIn`(지연), `WithUnique`, `WithDeadLetterDiscard`, `WithRetention`. deadline 관련 옵션이 있으면 포함, 없으면 언급하지 않음(실제 존재하는 것만).

- [ ] **Step 1:** `sed -n '114,137p' $LIB/README.md`; `grep -nE "^func With" $LIB/chronos.go` 로 실제 옵션 목록 확인.
- [ ] **Step 2: en 저술** — `title: Enqueue options` / `slug: enqueue-options`.
  - 개념: `Enqueue` 호출 시 옵션으로 실행 시점·큐·재시도·중복·보존을 제어.
  - 레시피: 각 옵션을 짧은 코드 조각으로 — 지연 실행(`WithProcessIn`), 큐 지정(`WithQueue`), 재시도 예산(`WithMaxRetry`), 중복 방지(`WithUnique`), 소진 시 폐기(`WithDeadLetterDiscard`), 완료 보존(`WithRetention`). 실제 존재하는 옵션만.
  - Gotcha: `WithUnique`/`WithTaskID`는 체인 내부에서 거부됨(07 참조); unique 락 만료는 heartbeat가 갱신(05 참조).
  - Next: `/docs/#queues-and-priority`.
- [ ] **Step 3: ko 저술** — `title: Enqueue 옵션`, Next `/ko/docs/#queues-and-priority`.
- [ ] **Step 4–5:** 마커/테스트/utf-8 확인 → `git commit -m "docs: add enqueue-options guide (en/ko)"`.

## Task 04: Queues & priority  (slug `queues-and-priority`)

**Files:** `content/docs/{en,ko}/04-queues-and-priority.md`
**Source (LIB):** `README.md` 138–167 (Queue priority, Pausing a queue).

- [ ] **Step 1:** `sed -n '138,167p' $LIB/README.md`.
- [ ] **Step 2: en 저술** — `title: Queues & priority` / `slug: queues-and-priority`.
  - 개념: 여러 큐에 가중치를 주고, 서버가 부드러운 가중 라운드로빈으로 소비. 엄격 우선순위 옵션.
  - 레시피 A: `ServerConfig`에 큐별 가중치 설정.
  - 레시피 B: `StrictPriority`로 높은 가중치 큐를 항상 먼저.
  - 레시피 C: 큐 일시정지/재개(`Pause`/`Resume` — Inspector 또는 CLI). 정지 중에도 forwarding/recovery는 계속되고 소비만 멈춰 작업이 쌓임.
  - Gotcha: 알 수 없는 큐 이름도 pause 가능(재개 전까지 정지 유지).
  - Next: `/docs/#retries-and-reliability`.
- [ ] **Step 3: ko 저술** — `title: 큐와 우선순위`, Next `/ko/docs/#retries-and-reliability`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add queues-and-priority guide (en/ko)"`.

## Task 05: Retries & reliability  (slug `retries-and-reliability`)

**Files:** `content/docs/{en,ko}/05-retries-and-reliability.md`
**Source (LIB):** `README.md` 27–42 (Highlights의 Reliable/Heartbeat/Self-cleaning), 127–137 (Handler outcomes), `retry.go`(백오프), `server.go`(`OnDeadLetter`, recover, heartbeat, janitor). 참고: `reliability_integration_test.go`.

- [ ] **Step 1:** `sed -n '127,137p' $LIB/README.md`; `grep -niE "OnDeadLetter|Heartbeat|janitor|MaxRetry|backoff" $LIB/README.md $LIB/server.go | head -30`.
- [ ] **Step 2: en 저술** — `title: Retries & reliability` / `slug: retries-and-reliability`.
  - 개념: at-least-once + 자동 재시도 + 크래시 복구가 어떻게 맞물리는지.
  - 레시피 A: 재시도 예산·백오프 — `WithMaxRetry`, 지수 백오프+지터(동작 설명, 조정 가능한 부분만 코드로).
  - 레시피 B: dead-letter 훅 — `ServerConfig{ OnDeadLetter: ... }`로 소진된 태스크 알림/검사.
  - 레시피 C: 즉시 실패 — `chronos.SkipRetry(err)`.
  - 설명(코드 최소): 크래시 복구(`XAUTOCLAIM`로 유휴 태스크 회수), heartbeat(장시간 태스크의 lease·unique 락 갱신), janitor(dead-letter/보존 완료 태스크 정리).
  - Gotcha: 멱등성 필수; `panic`은 재시도성 오류로 처리됨.
  - Next: `/docs/#scheduling`.
- [ ] **Step 3: ko 저술** — `title: 재시도와 안정성`, Next `/ko/docs/#scheduling`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add retries-and-reliability guide (en/ko)"`.

## Task 06: Scheduling  (slug `scheduling`)

**Files:** `content/docs/{en,ko}/06-scheduling.md`
**Source (LIB):** `README.md` 285–309 (Scheduling), `example_test.go` `ExampleNewScheduler()`(90), `examples/jobscheduler/jobscheduler.go`.

- [ ] **Step 1:** `sed -n '285,309p' $LIB/README.md`; `sed -n '90,99p' $LIB/example_test.go`; `cat $LIB/examples/jobscheduler/jobscheduler.go`.
- [ ] **Step 2: en 저술** — `title: Scheduling` / `slug: scheduling`.
  - 개념: interval·cron 반복 작업. **핵심 차별점** — Redis 리더 선출로 인스턴스가 여러 개여도 각 트리거를 정확히 한 번만 enqueue(deterministic dedup key).
  - 레시피 A: `NewScheduler` + interval 등록(`ExampleNewScheduler` 코드).
  - 레시피 B: cron 표현식 등록.
  - 설명: 리더 선출(`SET NX PX` + pub/sub 사임), split-brain 핸드오프에도 이중 enqueue 없음.
  - Gotcha: 스케줄러는 enqueue만 담당 — 실제 실행은 서버(워커)가; 스케줄러와 서버를 함께 띄워야 함.
  - Next: `/docs/#chains`.
- [ ] **Step 3: ko 저술** — `title: 스케줄링`, Next `/ko/docs/#chains`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add scheduling guide (en/ko)"`.

## Task 07: Chains  (slug `chains`)

**Files:** `content/docs/{en,ko}/07-chains.md`
**Source (LIB):** `README.md` 168–195 (Chains), `example_test.go` `ExampleNewChain()`(66).

- [ ] **Step 1:** `sed -n '168,195p' $LIB/README.md`; `sed -n '66,77p' $LIB/example_test.go`.
- [ ] **Step 2: en 저술** — `title: Chains` / `slug: chains`.
  - 개념: 태스크를 순차 실행 — 이전 링크 성공 시에만 다음 enqueue.
  - 레시피 A: `NewChain().Then(...).Then(..., WithQueue("low")).Enqueue(...)`(실제 코드).
  - 레시피 B: 링크 간 결과 전달 — `AddHandlerR`로 등록한 핸들러의 결과를 다음 링크에서 `PrevResult[R]`로 수신(개념 + 08로 상세 링크).
  - Gotcha: 실패 시 체인 중단 → dead-letter의 링크를 고쳐 `chronos task run`으로 재개; `WithUnique`/`WithTaskID`는 링크에서 거부; 매우 긴 체인은 메시지 크기 증가로 지양.
  - Next: `/docs/#groups`.
- [ ] **Step 3: ko 저술** — `title: 체인`, Next `/ko/docs/#groups`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add chains guide (en/ko)"`.

## Task 08: Groups  (slug `groups`)

**Files:** `content/docs/{en,ko}/08-groups.md`
**Source (LIB):** `README.md` 196–284 (Groups, Passing results between steps, Parallel stages, Chains as group members), `example_test.go` `ExampleNewGroup()`(78).

- [ ] **Step 1:** `sed -n '196,284p' $LIB/README.md`; `sed -n '78,89p' $LIB/example_test.go`.
- [ ] **Step 2: en 저술** — `title: Groups` / `slug: groups`.
  - 개념: 병렬 fan-out → 모든 멤버 완료 시 `OnComplete` fan-in.
  - 레시피 A: `NewGroup(...).OnComplete(...)`(실제 코드).
  - 레시피 B: 결과 집계 — `GroupResults`로 멤버 결과 수집.
  - 레시피 C: 병렬 스테이지 — 체인 안에서 `ThenGroup`으로 fan-out 후 다시 순차.
  - 레시피 D: 그룹 멤버로서의 체인 — `AddChain`.
  - Gotcha: **중첩은 정확히 한 단계**(그룹 멤버가 체인, 체인이 그룹 포함 — 그 이상 불가); 멤버 실패 시 그룹 park.
  - Next: `/docs/#observability`.
- [ ] **Step 3: ko 저술** — `title: 그룹`, Next `/ko/docs/#observability`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add groups guide (en/ko)"`.

## Task 09: Observability  (slug `observability`)

**Files:** `content/docs/{en,ko}/09-observability.md`
**Source (LIB):** `README.md` 310–343 (Observability), `example_test.go` `ExampleNewInspector()`(100), `cmd/chronos/main.go`(CLI 사용법 주석), `metrics.go`, `docs/OBSERVING.md`.

- [ ] **Step 1:** `sed -n '310,343p' $LIB/README.md`; `sed -n '100,110p' $LIB/example_test.go`; `sed -n '1,20p' $LIB/cmd/chronos/main.go`.
- [ ] **Step 2: en 저술** — `title: Observability` / `slug: observability`.
  - 개념: 큐/태스크 상태를 메트릭·Inspector·CLI로 관찰.
  - 레시피 A: 메트릭 — `metrics.go`가 노출하는 카운터/게이지(실제 존재하는 것). Prometheus는 `contrib/prometheus`로 링크.
  - 레시피 B: Inspector API — `NewInspector`로 큐 목록/상태 태스크 조회(`ExampleNewInspector` 코드).
  - 레시피 C: `chronos` CLI — `queue ls/pause/resume`, `task ls <queue> <scheduled|retry|archived|completed>`(main.go 주석 기반), standalone/`--cluster` 모드.
  - Gotcha: CLI의 pause는 소비만 멈춤(04 참조).
  - Next: `/docs/#redis-cluster`.
- [ ] **Step 3: ko 저술** — `title: 관측성`, Next `/ko/docs/#redis-cluster`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add observability guide (en/ko)"`.

## Task 10: Redis Cluster  (slug `redis-cluster`)

**Files:** `content/docs/{en,ko}/10-redis-cluster.md`
**Source (LIB):** `README.md` 373–410 (Redis Cluster, Verifying against a real cluster).

- [ ] **Step 1:** `sed -n '373,410p' $LIB/README.md`.
- [ ] **Step 2: en 저술** — `title: Redis Cluster` / `slug: redis-cluster`.
  - 개념: 큐의 모든 키를 `{queue}` 해시태그로 감싸 한 슬롯에 모음 → 멀티키 Lua 원자성 유지, 큐별로 슬롯 분산 → 그냥 동작.
  - 레시피 A: `redis.NewClusterClient(...)` → `NewServer` 주입(실제 코드).
  - 레시피 B: CLI `chronos --cluster --redis n1,n2 queue ls`.
  - Gotcha: 클러스터는 논리 DB 0만(`--db`는 standalone 전용); 글로벌 키는 단일키 접근이라 해시태그 없이도 안전; Sentinel은 `NewFailoverClient`로 주입 가능하나 테스트 매트릭스 밖.
  - 검증: `deploy/redis-cluster` 6노드 docker compose + `make test-cluster`(라이브러리 저장소 기준).
  - Next: `/docs/#performance`.
- [ ] **Step 3: ko 저술** — `title: Redis Cluster`, Next `/ko/docs/#performance`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add redis-cluster guide (en/ko)"`.

## Task 11: Performance & benchmarks  (slug `performance`)

**Files:** `content/docs/{en,ko}/11-performance.md`
**Source (LIB):** `README.md` 362–372 (Performance), `docs/BENCHMARKS.md`(방법론·결과).

- [ ] **Step 1:** `sed -n '362,372p' $LIB/README.md`; `sed -n '1,80p' $LIB/docs/BENCHMARKS.md`.
- [ ] **Step 2: en 저술** — `title: Performance & benchmarks` / `slug: performance`.
  - 개념: 무엇을 어떻게 측정하는가(enqueue/e2e/chain/group 시나리오, C∈{1,4,16,64} 스케일).
  - 요약: BENCHMARKS.md의 방법론 요약 + 핵심 수치(있는 그대로 인용, 과장 금지). 상세·최신 수치는 라이브러리 저장소 `docs/BENCHMARKS.md`와 GitHub로 링크.
  - 재현: `make bench`(로컬 Redis DB 15 flush) 개요.
  - Gotcha: 벤치는 환경 의존 — 절대 수치보다 상대 비교로 해석.
  - Next: `/docs/#how-it-works`.
- [ ] **Step 3: ko 저술** — `title: 성능과 벤치마크`, Next `/ko/docs/#how-it-works`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add performance guide (en/ko)"`.

## Task 12: How it works & delivery  (slug `how-it-works`)

**Files:** `content/docs/{en,ko}/12-how-it-works.md`
**Source (LIB):** `README.md` 344–361 (How it works), 411–415 (Delivery semantics). 보강: 워크스페이스 `chronos-go/CLAUDE.md`의 Architecture(있으면 개념 참고, 코드는 아님).

- [ ] **Step 1:** `sed -n '344,361p' $LIB/README.md`; `sed -n '411,415p' $LIB/README.md`.
- [ ] **Step 2: en 저술** — `title: How it works & delivery` / `slug: how-it-works`.
  - 개념: 즉시 작업은 Redis Stream(consumer group), 시간 기반(지연/재시도/보관/완료)은 ZSET. forwarder가 도래 항목을 Stream으로 승격, recoverer가 죽은 워커 항목 회수.
  - 다이어그램/설명(코드 최소): Stream + ZSET + forwarder + recoverer 흐름.
  - Delivery: at-least-once의 의미와 재실행이 발생하는 시나리오(ack 직전 크래시, recoverer 회수) → 멱등성 재강조.
  - Gotcha: 이 문서는 개념 이해용 — API가 아님.
  - Next: `/docs/#migrating-from-asynq`.
- [ ] **Step 3: ko 저술** — `title: 동작 원리와 전달 의미론`, Next `/ko/docs/#migrating-from-asynq`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add how-it-works guide (en/ko)"`.

## Task 13: Migrating from asynq  (slug `migrating-from-asynq`)

**Files:** `content/docs/{en,ko}/13-migrating-from-asynq.md`
**Source (LIB):** `README.md` 416–425 (vs. asynq 표), 그리고 앞선 문서들에서 확립한 chronos API. asynq 개념은 일반적으로 알려진 것 사용(`asynq.NewTask`, `asynq.HandlerFunc`, `ServeMux`, `Client.Enqueue`, `Scheduler`).

- [ ] **Step 1:** `sed -n '416,425p' $LIB/README.md`.
- [ ] **Step 2: en 저술** — `title: Migrating from asynq` / `slug: migrating-from-asynq`.
  - 개념: asynq 사용자가 chronos-go로 옮기는 법. asynq이 유지보수 모드인 점.
  - 매핑표: `asynq.Task`([]byte payload) → `Task[T]`(타입 안전); `ServeMux`+`HandlerFunc` → `Mux`+`AddHandler[T]`; `Client.Enqueue` → `Enqueue[T]`; asynq 스케줄러(앱이 단일화 책임) → chronos 내장 리더 선출.
  - 레시피: asynq 핸들러/enqueue 전 → chronos 후 코드 나란히(chronos 쪽은 실제 API).
  - Gotcha: payload 직렬화 차이(수동 marshal 불필요); unique 락은 heartbeat로 갱신됨.
  - Next: 없음(마지막). 대신 "처음으로 → Getting started" 또는 GitHub 링크.
- [ ] **Step 3: ko 저술** — `title: asynq에서 마이그레이션`.
- [ ] **Step 4–5:** 확인 → `git commit -m "docs: add migrating-from-asynq guide (en/ko)"`.

---

## Task 14: 13개 문서 완성 검증 + 테스트 활성화

**Files:** `lib/docs.test.ts`

- [ ] **Step 1: 개수 확인** — Run: `ls content/docs/en/*.md | wc -l` 및 `ls content/docs/ko/*.md | wc -l` → 둘 다 `13`.
- [ ] **Step 2: `has all 13 docs` 테스트 활성화** — `lib/docs.test.ts`에서 `it.skip('has all 13 docs', ...)`의 `.skip`을 제거하고, ko도 13개인지 추가 단언:
```typescript
  it('has all 13 docs', () => {
    expect(listDocFiles('en')).toHaveLength(13);
    expect(listDocFiles('ko')).toHaveLength(13);
  });
```
- [ ] **Step 3: slug 집합 단언 추가** — 같은 `describe('listDocFiles')` 블록에 다음 테스트를 추가해 12개 신규 slug + getting-started가 모두 렌더되는지 확인(오타/링크 깨짐 방지):
```typescript
  it('renders every expected slug', async () => {
    const slugs = (await loadDocs('en')).map((s) => s.slug).sort();
    expect(slugs).toEqual(
      [
        'chains', 'enqueue-options', 'getting-started', 'groups',
        'how-it-works', 'migrating-from-asynq', 'observability',
        'performance', 'queues-and-priority', 'redis-cluster',
        'retries-and-reliability', 'scheduling', 'tasks-and-handlers',
      ].sort(),
    );
  });
```
- [ ] **Step 4: 링크 무결성 확인** — 모든 문서의 Next 앵커가 실제 존재하는 slug를 가리키는지:
  Run: `grep -rhoE "/(ko/)?docs/#[a-z0-9-]+" content/docs/ | sed -E 's#.*#\0#' | grep -oE "#[a-z0-9-]+" | sort -u` → 출력된 앵커가 모두 위 slug 목록에 포함되는지 육안 확인(404 앵커 0).
- [ ] **Step 5: 전체 검증** — Run: `npm run build && npx tsc --noEmit && npm test`.
  Expected: build 성공; test는 이제 **skip 없이 전부 pass**(13-docs 테스트 활성화됨). `grep -rn "SOURCE:\|TODO\|FIXME\|TBD" content/docs/` → 없음.
- [ ] **Step 6: 랜딩 기능 카드 링크 실사** — `npm run build` 후 랜딩의 6개 카드 slug(`tasks-and-handlers`, `scheduling`, `retries-and-reliability`, `chains`, `redis-cluster`, `observability`)가 이제 렌더된 `/docs` 페이지에 앵커로 존재하는지: `for s in tasks-and-handlers scheduling retries-and-reliability chains redis-cluster observability; do grep -q "id=\"$s\"" out/docs/index.html && echo "$s OK" || echo "$s MISSING"; done` → 전부 OK. (DocsLayout이 slug를 섹션 `id`로 렌더한다는 전제. 만약 `id`가 다른 규칙이면 실제 렌더 마크업에 맞춰 확인.)
- [ ] **Step 7: Commit** — `git commit -m "test: enable 13-docs assertions and verify doc slug/link integrity"`.

---

## Self-Review (작성자 확인)

- **스펙 커버리지:** 스펙 §4의 13개 문서 중 `01`은 Plan A에서 완료, `02`–`13`은 Task 02–13이 각각 담당. 레시피형 구조·실제 코드 출처·en/ko 파리티·godoc 위임 모두 공통 규칙에 명시.
- **플레이스홀더:** 각 문서의 산문은 실행 시 `LIB` 소스를 읽어 저술(내용의 출처·섹션·다룰 API·Gotcha·Next를 태스크별로 구체 지정) → 저술 지침이지 placeholder 아님. Step 4의 마커 grep + Task 14 Step 5의 전역 grep가 게이트.
- **정합성:** slug 고정표가 랜딩 기능 카드 i18n(`tasks-and-handlers` 등)·시드 문서 Next(`#tasks-and-handlers`)와 일치. Next 링크 형식(en `/docs/#`, ko `/ko/docs/#`)이 Plan A에서 고친 규칙과 동일. Task 14가 slug 집합·링크·카드 앵커를 기계적으로 검증.
- **범위:** 콘텐츠만 추가 — 런타임/구조 변경 없음. 각 문서 1커밋으로 리뷰 단위 유지.

## 완료 후

Plan A+B로 스펙 §7 성공 기준(13개 문서 en/ko, build/check/test 통과, 카드·문서 링크 유효)이 모두 충족된다. 남는 선택 후속: 코드 예제 자동 컴파일 검증(CI에서 chronos-go 예제와 diff) — 스펙 §6에서 이미 범위 밖으로 표시됨.
