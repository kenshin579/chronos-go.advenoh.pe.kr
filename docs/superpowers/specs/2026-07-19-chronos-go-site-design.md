# chronos-go 홍보/문서 사이트 — 설계 스펙

- **날짜:** 2026-07-19
- **대상 저장소:** `chronos-go.advenoh.pe.kr`
- **도메인:** https://chronos-go.advenoh.pe.kr
- **원본 패턴:** `../mqtt-insight.advenoh.pe.kr/` (같은 구조의 랜딩+문서 사이트)
- **홍보 대상 라이브러리:** `../chronos-go/` (Redis 기반 분산 태스크 큐·스케줄러, Go)

## 1. 목적

chronos-go 라이브러리의 **홍보 랜딩 페이지**와 **기능 사용 설명서(매뉴얼)**를 담는 정적 사이트를 만든다.

- 랜딩: "왜 chronos-go인가"를 30초 안에 전달한다. chronos-go는 UI가 없는 라이브러리이므로 스크린샷 대신 **차별점 다이어그램 · 기능 카드 · 비교표**로 채운다. 코드 스니펫은 랜딩에 넣지 않는다.
- 문서: chronos-go의 각 기능을 "어떻게 쓰는가" 중심의 **레시피형 How-to**로 설명한다. 코드 예제는 문서에 둔다.

## 2. 기술 스택 / 아키텍처

`mqtt-insight.advenoh.pe.kr`의 구조를 그대로 재사용한다.

- **Next.js static export** — `next.config.js`에 `output: 'export'`, `trailingSlash: true`. 빌드 산출물은 `out/`.
- **Tailwind CSS** + **next-themes**(라이트/다크 토글).
- **Markdown 파이프라인** — `content/docs/{en,ko}/NN-*.md`를 `gray-matter`(frontmatter) + `unified`/`remark-parse`/`remark-gfm`/`remark-rehype`/`rehype-stringify`로 HTML 렌더. 이 파이프라인 유틸(`lib/docs.ts` 등)은 **vitest로 테스트**한다.
- **배포:** Netlify(`netlify.toml`) — mqtt-insight과 동일한 방식.
- **스크립트:** `npm run dev` / `build` / `check`(tsc --noEmit) / `test`(vitest).

### 라우트 (이중언어 en/ko)

- `/` — 영어 랜딩 (기본)
- `/ko` — 한국어 랜딩
- `/docs` — 영어 문서
- `/ko/docs` — 한국어 문서

`app/` 구조는 mqtt-insight을 그대로 따른다: `app/page.tsx`, `app/docs/page.tsx`, `app/ko/page.tsx`, `app/ko/docs/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/sitemap.ts`, `app/robots.ts`.

## 3. 랜딩 페이지 구성 (코드 스니펫 없음)

위→아래 스크롤 순서:

1. **HERO — 차별점 우선.** 헤드라인: *"Run every scheduled job exactly once — across all your instances."* 서브헤드: Redis 기반 분산 태스크 큐 & 스케줄러 for Go(type-safe). 오른쪽/하단에 **분산 스케줄러 다이어그램**(여러 인스턴스 → 리더 1개 → Redis leader lock). CTA 버튼: `Get started`(→ /docs), `GitHub`(스타 유도).
2. **기능 하이라이트 — 6카드 그리드:** Type-safe API · Distributed scheduler · Reliable(retry/recover) · Chains & Groups · Redis Cluster-safe · Observability.
3. **왜 chronos-go? — vs asynq 비교표.** 항목: Distributed scheduler(run-once) / Generic type-safe tasks / Bounded stream·DLQ growth / Actively maintained. (출처: chronos-go README "vs. asynq" 표를 확장.)
4. **How it works — 개념 아키텍처 다이어그램 1장:** Streams(즉시) + ZSET(지연/재시도) + forwarder + recoverer.
5. **CTA:** Docs / GitHub / pkg.go.dev 링크.

랜딩의 헤드라인·문구·비교표 데이터의 **출처는 chronos-go의 `README.md`**다.

## 4. 문서(매뉴얼) 구성

### 스타일 — 레시피형 How-to

각 문서는 다음 형태를 따른다:

1. **개념 한 단락** — 왜 필요한가 / 언제 쓰나(그리고 언제 안 쓰나).
2. **코드 레시피** — 복사해서 바로 쓸 수 있는 예제.
3. **Gotcha** — 주의점(예: at-least-once 멱등성, 체인 실패 동작 등).
4. **다음 문서 링크.**

상세 시그니처·전체 옵션은 문서에 나열하지 않고 **godoc/pkg.go.dev로 링크**한다(중복 방지).

### 코드 예제의 출처(source of truth)

문서의 모든 코드 예제는 chronos-go의 **실제 동작 코드**(`../chronos-go/examples/`, `../chronos-go/example_test.go`, README의 검증된 스니펫)에서 가져온다. 라이브러리 API가 바뀌면 예제가 어긋나지 않도록, 새로 지어내지 말고 실제 코드를 옮긴다.

### 목차 — 13개 문서 / 5묶음

각 문서는 `content/docs/en/NN-*.md`와 `content/docs/ko/NN-*.md` 두 파일로 작성.

**Getting started**
- `01-getting-started` — 설치, 첫 태스크 실행(enqueue → handler 등록 → server 기동).

**Core**
- `02-tasks-and-handlers` — `Task[T]` 정의, `Mux`, `AddHandler`/`AddHandlerR`, 핸들러 결과(성공/재시도/skip).
- `03-enqueue-options` — 지연 실행, deadline, 큐 지정, 재시도 횟수, unique(중복 방지), 보존(retention).
- `04-queues-and-priority` — 가중 라운드로빈, `StrictPriority`, 큐 pause/resume.
- `05-retries-and-reliability` — 지수 백오프+지터, dead-letter(`OnDeadLetter`), 크래시 복구(`XAUTOCLAIM`), heartbeat.
- `06-scheduling` — interval & cron, 분산 리더 선출(인스턴스 여러 개, 각 트리거는 정확히 한 번 enqueue).

**Workflows**
- `07-chains` — 순차 실행, 링크별 옵션, 실패 시 체인 중단/재개, 단계 간 결과 전달(`PrevResult`), `ThenGroup`.
- `08-groups` — 병렬 fan-out/in, `OnComplete`, `GroupResults`, 그룹 멤버로서의 체인(`AddChain`). (Chains/Groups는 분량이 충분해 두 문서로 분리.)

**Operating**
- `09-observability` — 메트릭, `Inspector` API, `chronos` CLI(`queue ls/pause/resume`, `task ls`).
- `10-redis-cluster` — 왜 그냥 되는가(`{queue}` 해시태그 → 큐당 1슬롯, 멀티키 Lua 원자성), `redis.NewClusterClient` 설정, CLI `--cluster`, 주의점(DB 0만, 글로벌 키 단일키 안전, Sentinel 미검증), 실제 클러스터 검증(`deploy/redis-cluster` docker compose + `make test-cluster`).
- `11-performance` — 벤치마크 방법론 요약 + 결과. 출처는 chronos-go `docs/BENCHMARKS.md`, 상세는 GitHub 링크.

**Reference**
- `12-how-it-works` — Streams+ZSET 구조, forwarder/recoverer, at-least-once 전달 의미론, 멱등성 설계 원칙.
- `13-migrating-from-asynq` — 개념 매핑표(`asynq.Task`→`Task[T]`, `ServeMux`→`Mux`), 스케줄러 차이(앱이 직접 단일화 → 내장 리더 선출), 재작성 전/후 코드 비교.

## 5. 언어 규칙

- 사이트 콘텐츠는 **이중언어 en/ko** — 모든 문서와 랜딩 문구를 두 언어로 제공.
- 이 저장소는 공개 OSS 톤이므로 **Git 산출물(커밋 메시지, PR 제목/본문)은 영어**로 작성한다. 대화형 응답은 한국어.

## 6. 범위 밖 (Non-goals / 이번 스펙에서 제외)

- 실시간 데이터/서버 백엔드 — 순수 정적 사이트.
- 검색 기능(Algolia 등) — 초기 범위 밖.
- 코드 예제의 자동 컴파일 검증(CI에서 chronos-go 예제와 diff) — 유용하지만 별도 후속 작업.
- 한국어 외 추가 언어.

## 7. 성공 기준

- `npm run build`가 `out/`에 정적 파일 생성(4개 라우트: `/`, `/ko`, `/docs`, `/ko/docs` 및 문서 렌더).
- `npm run check`(tsc) 및 `npm test`(md 파이프라인 vitest) 통과.
- 랜딩이 코드 스니펫 없이 차별점 다이어그램·기능 카드·비교표로 구성됨.
- 13개 문서가 en/ko 양쪽에 존재하고 레시피형 형태를 따름.
- 라이트/다크 테마 전환 동작.
