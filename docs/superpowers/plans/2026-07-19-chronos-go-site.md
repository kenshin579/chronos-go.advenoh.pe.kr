# chronos-go 사이트 — 구현 계획 (Plan A: 골격 + 랜딩 + 문서 렌더링)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** chronos-go 홍보/문서 정적 사이트의 동작하는 이중언어(en/ko) 골격을 만든다 — 랜딩(코드 없음, 다이어그램·비교표 중심)과 문서 렌더링 파이프라인, 그리고 실제 시드 문서 1개(`01-getting-started`)까지 빌드·배포 가능한 상태로.

**Architecture:** `../mqtt-insight.advenoh.pe.kr/`(동일 스택의 완성된 사이트)를 원본 패턴으로 삼아 적응한다. Markdown 파이프라인(`lib/docs.ts`)과 공용 셸(nav/footer/theme/i18n)은 거의 그대로 재사용하고, 랜딩 섹션 컴포넌트(hero+scheduler 다이어그램, features, vs-asynq 비교표, how-it-works, CTA)는 chronos-go에 맞게 새로 구성한다.

**Tech Stack:** Next.js 15 static export(`output: 'export'`, `trailingSlash: true`) · React 19 · TypeScript · Tailwind CSS · next-themes · unified/remark/rehype + gray-matter · vitest · Netlify.

**참고 원본 경로:** 이 계획에서 "reference"는 항상 `/Users/user/src/workspace_chronos_go/mqtt-insight.advenoh.pe.kr/`를 가리킨다. 대상 저장소는 `/Users/user/src/workspace_chronos_go/chronos-go.advenoh.pe.kr/`(이하 리포 루트, 모든 상대경로의 기준).

**스펙:** `docs/superpowers/specs/2026-07-19-chronos-go-site-design.md`

**범위 밖(후속 Plan B):** `02`~`13` 문서 본문 저술(en/ko). 이 계획은 파이프라인이 임의 개수의 md를 렌더함을 `01` 문서 하나로 검증하는 데까지만 다룬다. 단, `lib/docs.ts`의 개수 검증 테스트는 최종 13개를 전제로 작성하되 `.skip`으로 두어 Plan B에서 활성화한다(아래 Task 2 참조).

---

## File Structure

**설정/스캐폴드 (reference에서 적응):**
- `package.json` — 의존성·스크립트. 이름만 교체.
- `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `netlify.toml`, `next-env.d.ts` — 거의 동일.
- `app/globals.css` — Tailwind 지시자 + 테마 CSS 변수. 동일.

**라이브러리 (핵심 로직):**
- `lib/docs.ts` — md 로더·en/ko 파리티 검증. reference 재사용 + 개수만 조정.
- `lib/docs.test.ts` — 파이프라인 vitest. chronos용으로 수정.
- `lib/site-config.ts` — 사이트 메타데이터. chronos-go 값으로 교체.
- `lib/i18n/en.ts`, `lib/i18n/ko.ts`, `lib/i18n/types.ts` — UI·랜딩 문구 사전(타입 안전). chronos용으로 전면 교체.

**앱 라우트 (4개):**
- `app/layout.tsx`, `app/ko/layout.tsx` — 루트/ko 레이아웃. 적응.
- `app/page.tsx`, `app/ko/page.tsx` — en/ko 랜딩.
- `app/docs/page.tsx`, `app/ko/docs/page.tsx` — en/ko 문서.
- `app/sitemap.ts`, `app/robots.ts` — 적응.

**컴포넌트:**
- 재사용(라벨만 i18n): `components/nav.tsx`, `footer.tsx`, `theme-toggle.tsx`, `lang-toggle.tsx`, `auto-lang-redirect.tsx`, `set-html-lang.tsx`, `docs/docs-layout.tsx`, `landing.tsx`(섹션 조립 순서 변경).
- 신규(chronos 전용):
  - `components/hero.tsx` — 헤드라인 + CTA + 우측 다이어그램 슬롯. (reference hero 적응)
  - `components/scheduler-diagram.tsx` — 인스턴스 N개 → 리더 1개 → Redis leader lock SVG. (reference `app-mock.tsx` 대체)
  - `components/features.tsx` — 6개 기능 카드. (reference 구조 재사용)
  - `components/comparison.tsx` — vs asynq 표. (reference `install.tsx` 자리)
  - `components/how-it-works.tsx` — Streams+ZSET 개념 다이어그램. (reference `faq.tsx` 자리)
  - `components/final-cta.tsx` — Docs/GitHub/pkg.go.dev CTA. (reference 적응)

**콘텐츠:**
- `content/docs/en/01-getting-started.md`, `content/docs/ko/01-getting-started.md` — 시드 문서(실제 저술).

---

## Phase 0 — 스캐폴드

### Task 0: 프로젝트 설정 파일 복사·적응

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `netlify.toml`, `next-env.d.ts`, `app/globals.css`

- [ ] **Step 1: 설정 파일 복사**

Run (리포 루트에서):
```bash
REF=../mqtt-insight.advenoh.pe.kr
cp $REF/next.config.js $REF/tsconfig.json $REF/tailwind.config.ts \
   $REF/postcss.config.js $REF/vitest.config.ts $REF/netlify.toml \
   $REF/next-env.d.ts ./
mkdir -p app && cp $REF/app/globals.css ./app/globals.css
cp $REF/package.json ./package.json
```

- [ ] **Step 2: `package.json`의 이름·설명·리포지토리 필드를 chronos용으로 수정**

`package.json`에서 `"name"`을 `"chronos-go-site"`로 바꾼다(있다면 `description`/`homepage`도 chronos-go로). `dependencies`/`devDependencies`/`scripts`는 그대로 둔다(동일 스택).

- [ ] **Step 3: `netlify.toml` 확인**

`netlify.toml`이 `command = "npm run build"`, `publish = "out"`인지 확인한다. 다르면 그렇게 맞춘다.

- [ ] **Step 4: 의존성 설치 후 빌드 도구 동작 확인**

Run: `npm install`
Expected: 에러 없이 완료, `node_modules/` 생성.

- [ ] **Step 5: Commit**

```bash
echo "node_modules/" >> .gitignore
echo "out/" >> .gitignore
echo ".next/" >> .gitignore
git add -A && git commit -m "chore: scaffold Next.js static-export project from reference config"
```

---

## Phase 1 — Markdown 파이프라인 (TDD)

### Task 1: `lib/docs.ts` 로더 재사용

**Files:**
- Create: `lib/docs.ts`

- [ ] **Step 1: reference의 `lib/docs.ts`를 복사**

Run: `mkdir -p lib && cp ../mqtt-insight.advenoh.pe.kr/lib/docs.ts ./lib/docs.ts`

이 파일은 그대로 재사용한다. 핵심 export: `listDocFiles(lang)`, `assertLangParity()`, `loadDocs(lang)` — frontmatter(`title`, `slug`) 파싱, en/ko 파일 세트 불일치 시 빌드 실패, slug 형식 검증(`[a-z0-9-]+`), md→html 렌더(remark-gfm 포함). chronos에 특화된 로직이 없으므로 수정하지 않는다.

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: `lib/docs.ts` 관련 에러 없음(다른 미작성 파일 에러는 이 단계에서 무시).

- [ ] **Step 3: Commit**

```bash
git add lib/docs.ts && git commit -m "feat: add markdown docs loader (reused from reference)"
```

### Task 2: `lib/docs.test.ts` — chronos용 파이프라인 테스트

**Files:**
- Create: `lib/docs.test.ts`
- Test: `lib/docs.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/docs.test.ts`에 다음을 작성한다. 개수 13 검증은 Plan B에서 켜도록 `.skip`으로 둔다.

```typescript
import { describe, it, expect } from 'vitest';
import { listDocFiles, assertLangParity, loadDocs } from './docs';

describe('assertLangParity', () => {
  it('passes when en and ko file sets match', () => {
    expect(() => assertLangParity()).not.toThrow();
  });
});

describe('listDocFiles', () => {
  it('returns md files sorted, identical set across langs', () => {
    const en = listDocFiles('en');
    const ko = listDocFiles('ko');
    expect(en.length).toBeGreaterThan(0);
    expect(en).toEqual([...en].sort());
    expect(ko).toEqual(en);
    expect(en[0]).toBe('01-getting-started.md');
  });

  // Plan B에서 13개 문서 완성 후 .skip 제거.
  it.skip('has all 13 docs', () => {
    expect(listDocFiles('en')).toHaveLength(13);
  });
});

describe('loadDocs', () => {
  it('parses frontmatter and renders markdown to html', async () => {
    const sections = await loadDocs('en');
    const gettingStarted = sections.find((s) => s.slug === 'getting-started');
    expect(gettingStarted).toBeDefined();
    expect(gettingStarted!.title).toBeTruthy();
    expect(gettingStarted!.html).toContain('<');
  });

  it('every section has non-empty slug, title and html', async () => {
    for (const lang of ['en', 'ko'] as const) {
      const sections = await loadDocs(lang);
      for (const s of sections) {
        expect(s.slug).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.html.length).toBeGreaterThan(20);
      }
    }
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL — `content/docs/en` 디렉터리가 없어 `listDocFiles`가 던지거나 빈 배열. (콘텐츠는 Task 3에서 생성.)

- [ ] **Step 3: Commit (실패 테스트)**

```bash
git add lib/docs.test.ts && git commit -m "test: add docs pipeline tests (seed doc + lang parity)"
```

### Task 3: 시드 문서 `01-getting-started` 작성 (en/ko)

**Files:**
- Create: `content/docs/en/01-getting-started.md`
- Create: `content/docs/ko/01-getting-started.md`

- [ ] **Step 1: chronos-go의 실제 Quick start 소스 확인**

Run: `sed -n '58,138p' ../chronos-go/README.md`
Expected: "Quick start" 섹션(설치, `Task[T]` 정의, 핸들러 등록, `Enqueue`, `NewServer`)과 Enqueue options / Handler outcomes. **문서의 코드는 여기서 가져온다(새로 지어내지 않는다).**

- [ ] **Step 2: 영어 시드 문서 작성**

`content/docs/en/01-getting-started.md`를 레시피형으로 작성한다. frontmatter는 `title`, `slug` 필수(파이프라인 검증). 구조: 개념 한 단락 → 설치 → 첫 태스크(정의/핸들러/enqueue/server) 코드 → gotcha(at-least-once 멱등성) → 다음 문서 링크.

```markdown
---
title: Getting started
slug: getting-started
---

chronos-go is a Redis-backed distributed task queue and scheduler for Go. This
guide runs your first task end-to-end: define a typed task, register a handler,
enqueue it, and start a server to process it.

## Install

​```bash
go get github.com/kenshin579/chronos-go
​```

Requires Go 1.26+ and Redis 6.2+.

## Define a task and its handler

<!-- SOURCE: ../chronos-go/README.md "Quick start" — replace this block with the
     verified snippet from that section (task type, chronos.NewTask / Task[T],
     mux.AddHandler[T], client.Enqueue, chronos.NewServer). Keep it compilable. -->

## Run it

<!-- SOURCE: same section — the NewServer + Run snippet. -->

## Gotcha: handlers must be idempotent

chronos-go is at-least-once — a task can run more than once (e.g. a worker
crashes after finishing but before acking). Make handler side effects safe to
repeat.

## Next

- [Tasks & handlers](#) — the type-safe API in depth.
```

> **저술 지침:** 위 `<!-- SOURCE ... -->` 주석은 `../chronos-go/README.md`의 "Quick start" 코드로 교체한다. `lib/docs.ts`가 html 주석을 그대로 통과시키므로, **교체 후 남은 `SOURCE` 주석이 없어야 한다**(Task 3 Step 4에서 확인).

- [ ] **Step 3: 한국어 시드 문서 작성**

`content/docs/ko/01-getting-started.md`를 같은 구조·같은 `slug`(`getting-started`)로 한국어 번역해 작성한다. `title`은 `시작하기`. 코드 블록은 동일(코드는 번역하지 않음).

- [ ] **Step 4: SOURCE 주석 잔존 여부 확인**

Run: `grep -rn "SOURCE:" content/docs/ && echo "FOUND (fix)" || echo "clean"`
Expected: `clean` (실제 코드로 모두 교체됨).

- [ ] **Step 5: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: PASS — 파리티/loadDocs/slug 테스트 통과, `has all 13 docs`는 skip 표시.

- [ ] **Step 6: Commit**

```bash
git add content/ && git commit -m "docs: add getting-started seed doc (en/ko)"
```

---

## Phase 2 — 공용 셸 (레이아웃·테마·i18n 타입)

### Task 4: `lib/site-config.ts` — chronos 메타데이터

**Files:**
- Create: `lib/site-config.ts`

- [ ] **Step 1: 작성**

```typescript
export const siteConfig = {
  name: 'chronos-go',
  description:
    'Redis-backed distributed task queue and scheduler for Go, with a type-safe generic API.',
  url: 'https://chronos-go.advenoh.pe.kr',
  github: 'https://github.com/kenshin579/chronos-go',
  pkgGoDev: 'https://pkg.go.dev/github.com/kenshin579/chronos-go',
  issues: 'https://github.com/kenshin579/chronos-go/issues',
  license: 'https://github.com/kenshin579/chronos-go/blob/main/LICENSE',
  gaId: process.env.NEXT_PUBLIC_GA_ID || '',
  ogImage: '/og.png',
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/site-config.ts && git commit -m "feat: add chronos-go site config"
```

### Task 5: i18n 사전 타입·컨텐츠 (en/ko)

**Files:**
- Create: `lib/i18n/en.ts`, `lib/i18n/ko.ts`, `lib/i18n/types.ts`

- [ ] **Step 1: `lib/i18n/en.ts` 작성 — 랜딩·nav·docs 문구 + 타입 원천**

reference `lib/i18n/en.ts`를 열어 구조(named const `en`, 타입 `Dict = typeof en`)를 참고하되, chronos용으로 아래 shape로 작성한다. `features.items`는 6개, `comparison`은 vs asynq 행들.

```typescript
export type FeatureIcon =
  | 'type-safe' | 'scheduler' | 'reliable' | 'workflow' | 'cluster' | 'observe';

type FeatureItem = { icon: FeatureIcon; title: string; desc: string; slug: string };
type CompRow = { label: string; asynq: string; chronos: string };

const featureItems: FeatureItem[] = [
  { icon: 'type-safe', title: 'Type-safe generic API', desc: 'Define a task type, register a Handler[T] — no interface{} payloads, no manual unmarshal.', slug: 'tasks-and-handlers' },
  { icon: 'scheduler', title: 'Distributed scheduler', desc: 'Interval & cron jobs. A Redis leader election ensures only one instance enqueues each trigger.', slug: 'scheduling' },
  { icon: 'reliable', title: 'Reliable by default', desc: 'Exponential backoff + jitter, crash recovery via XAUTOCLAIM, dead-letter with a hook.', slug: 'retries-and-reliability' },
  { icon: 'workflow', title: 'Chains & Groups', desc: 'Sequential chains and parallel groups, with results relayed between steps.', slug: 'chains' },
  { icon: 'cluster', title: 'Redis Cluster-safe', desc: 'Hash-tagged keys keep each queue on one slot, so multi-key Lua stays atomic.', slug: 'redis-cluster' },
  { icon: 'observe', title: 'Observability', desc: 'Metrics, an Inspector API, and a chronos CLI for queues and tasks.', slug: 'observability' },
];

const comparison: CompRow[] = [
  { label: 'Distributed scheduler (run-once)', asynq: '✗', chronos: '✓' },
  { label: 'Generic type-safe tasks', asynq: '✗', chronos: '✓' },
  { label: 'Bounded stream / dead-letter growth', asynq: '—', chronos: '✓' },
  { label: 'Unique lock renewed during long processing', asynq: '✗', chronos: '✓' },
  { label: 'Actively maintained', asynq: 'maintenance', chronos: '✓' },
];

export const en = {
  nav: { features: 'Features', docs: 'Docs', github: 'GitHub', pkg: 'pkg.go.dev' },
  hero: {
    badge: 'Open source · Go 1.26+ · Redis 6.2+',
    title1: 'Run every scheduled job',
    title2: 'exactly once, across all your instances',
    lead: 'chronos-go is a Redis-backed distributed task queue and scheduler for Go — type-safe tasks, a scheduler that elects a single leader, crash recovery, and Chains & Groups.',
    getStarted: 'Get started',
    github: 'Star on GitHub',
  },
  features: {
    eyebrow: 'Features',
    title: 'Everything you need for background jobs in Go',
    lead: 'A modern alternative to asynq — type-safe, distributed, and reliable.',
    more: 'Learn more',
    items: featureItems,
  },
  comparison: {
    eyebrow: 'Why chronos-go',
    title: 'chronos-go vs asynq',
    lead: 'asynq is in maintenance mode. chronos-go keeps the simple model and fixes the gaps.',
    headAsynq: 'asynq',
    headChronos: 'chronos-go',
    rows: comparison,
  },
  howItWorks: {
    eyebrow: 'How it works',
    title: 'Streams for now, ZSETs for later',
    lead: 'Immediate work rides a Redis Stream; delayed, retry and archived tasks live in sorted sets. A forwarder promotes due entries; a recoverer reclaims tasks from crashed workers.',
  },
  cta: {
    title: 'Ready to try chronos-go?',
    lead: 'Read the docs and add reliable background jobs to your Go service.',
    docs: 'Read the docs',
    github: 'GitHub',
    pkg: 'pkg.go.dev',
  },
  docs: { title: 'Documentation', toc: 'On this page' },
  footer: { tagline: 'Redis-backed task queue & scheduler for Go.', builtBy: 'Built by' },
} as const;

export type Dict = typeof en;
```

- [ ] **Step 2: `lib/i18n/types.ts` 작성**

```typescript
export type { Dict } from './en';
```

- [ ] **Step 3: `lib/i18n/ko.ts` 작성 — `Dict` 타입에 맞춘 한국어 번역**

```typescript
import type { Dict } from './en';

export const ko: Dict = {
  nav: { features: '기능', docs: '문서', github: 'GitHub', pkg: 'pkg.go.dev' },
  hero: {
    badge: '오픈소스 · Go 1.26+ · Redis 6.2+',
    title1: '예약 작업을',
    title2: '모든 인스턴스에서 정확히 한 번만',
    lead: 'chronos-go는 Go를 위한 Redis 기반 분산 태스크 큐·스케줄러입니다 — 타입 안전 태스크, 리더를 선출하는 스케줄러, 크래시 복구, 그리고 Chains & Groups.',
    getStarted: '시작하기',
    github: 'GitHub에서 스타',
  },
  features: {
    eyebrow: '기능',
    title: 'Go 백그라운드 작업에 필요한 모든 것',
    lead: 'asynq의 현대적 대안 — 타입 안전하고, 분산되며, 안정적입니다.',
    more: '자세히',
    items: [
      { icon: 'type-safe', title: '타입 안전 제네릭 API', desc: '태스크 타입을 정의하고 Handler[T]를 등록하세요. interface{} payload도, 수동 unmarshal도 없습니다.', slug: 'tasks-and-handlers' },
      { icon: 'scheduler', title: '분산 스케줄러', desc: 'interval·cron 작업. Redis 리더 선출로 각 트리거를 오직 한 인스턴스만 enqueue합니다.', slug: 'scheduling' },
      { icon: 'reliable', title: '기본으로 안정적', desc: '지수 백오프+지터, XAUTOCLAIM 크래시 복구, 훅이 달린 dead-letter.', slug: 'retries-and-reliability' },
      { icon: 'workflow', title: 'Chains & Groups', desc: '순차 체인과 병렬 그룹, 단계 간 결과 전달까지.', slug: 'chains' },
      { icon: 'cluster', title: 'Redis Cluster 안전', desc: '해시태그 키로 큐를 한 슬롯에 모아 멀티키 Lua가 원자적으로 유지됩니다.', slug: 'redis-cluster' },
      { icon: 'observe', title: '관측성', desc: '메트릭, Inspector API, 그리고 큐·태스크용 chronos CLI.', slug: 'observability' },
    ],
  },
  comparison: {
    eyebrow: '왜 chronos-go인가',
    title: 'chronos-go vs asynq',
    lead: 'asynq은 유지보수 모드입니다. chronos-go는 단순한 모델은 지키고 빈틈을 메웁니다.',
    headAsynq: 'asynq',
    headChronos: 'chronos-go',
    rows: [
      { label: '분산 스케줄러 (run-once)', asynq: '✗', chronos: '✓' },
      { label: '제네릭 타입 안전 태스크', asynq: '✗', chronos: '✓' },
      { label: 'Stream·dead-letter 증가 제한', asynq: '—', chronos: '✓' },
      { label: '장시간 처리 중 unique 락 갱신', asynq: '✗', chronos: '✓' },
      { label: '활발한 유지보수', asynq: 'maintenance', chronos: '✓' },
    ],
  },
  howItWorks: {
    eyebrow: '동작 원리',
    title: '즉시 작업은 Streams, 시간 작업은 ZSET',
    lead: '즉시 작업은 Redis Stream을 타고, 지연·재시도·보관 태스크는 sorted set에 있습니다. forwarder가 도래한 항목을 승격하고, recoverer가 죽은 워커의 태스크를 회수합니다.',
  },
  cta: {
    title: 'chronos-go를 써볼 준비가 되셨나요?',
    lead: '문서를 읽고 Go 서비스에 안정적인 백그라운드 작업을 추가하세요.',
    docs: '문서 읽기',
    github: 'GitHub',
    pkg: 'pkg.go.dev',
  },
  docs: { title: '문서', toc: '이 페이지 목차' },
  footer: { tagline: 'Go를 위한 Redis 기반 태스크 큐·스케줄러.', builtBy: 'Built by' },
};
```

- [ ] **Step 4: 타입 정합성 확인**

Run: `npx tsc --noEmit`
Expected: `lib/i18n/*` 관련 에러 없음(ko가 Dict 형태와 정확히 일치). 컴포넌트 미작성으로 인한 다른 에러는 무시.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n && git commit -m "feat: add bilingual i18n dictionary (landing + docs strings)"
```

### Task 6: 공용 셸 컴포넌트 재사용 (nav/footer/theme/lang/redirect)

**Files:**
- Create: `components/nav.tsx`, `components/footer.tsx`, `components/theme-toggle.tsx`, `components/lang-toggle.tsx`, `components/auto-lang-redirect.tsx`, `components/set-html-lang.tsx`

- [ ] **Step 1: reference 컴포넌트 복사**

Run:
```bash
mkdir -p components
for f in nav footer theme-toggle lang-toggle auto-lang-redirect set-html-lang; do
  cp ../mqtt-insight.advenoh.pe.kr/components/$f.tsx components/$f.tsx
done
```

- [ ] **Step 2: `nav.tsx`·`footer.tsx`를 chronos i18n·링크에 맞게 수정**

`nav.tsx`에서 `t.nav`의 키가 Task 5 사전(`features`, `docs`, `github`, `pkg`)과 일치하도록 링크 항목을 조정한다. mqtt에만 있던 `install`/`faq` 링크는 제거하고, `GitHub`→`siteConfig.github`, `pkg.go.dev`→`siteConfig.pkgGoDev` 링크를 추가한다. `footer.tsx`도 `t.footer` 키(`tagline`, `builtBy`)와 `siteConfig`(github/pkgGoDev/license) 링크에 맞춘다. mqtt 전용 문구(다운로드 등) 제거.

- [ ] **Step 3: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: nav/footer/theme/lang/redirect 관련 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add components/ && git commit -m "feat: add shared shell components (nav, footer, theme/lang toggle)"
```

### Task 7: 루트/ko 레이아웃 + globals

**Files:**
- Create: `app/layout.tsx`, `app/ko/layout.tsx`
- Modify: `app/globals.css` (필요 시 색 토큰만)

- [ ] **Step 1: reference 레이아웃 복사·적응**

Run: `cp ../mqtt-insight.advenoh.pe.kr/app/layout.tsx app/layout.tsx && mkdir -p app/ko && cp ../mqtt-insight.advenoh.pe.kr/app/ko/layout.tsx app/ko/layout.tsx`

- [ ] **Step 2: 메타데이터를 `siteConfig`로 교체**

`app/layout.tsx`의 `metadata`(title/description/openGraph/metadataBase)가 `siteConfig`(name/description/url)에서 오도록 수정한다. 폰트·`ThemeProvider`·`<html>` 골격은 그대로 둔다. `app/ko/layout.tsx`도 동일하게 `lang="ko"` 유지.

- [ ] **Step 3: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: layout 관련 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/ko/layout.tsx app/globals.css && git commit -m "feat: add root and ko layouts with chronos metadata"
```

---

## Phase 3 — 문서 렌더링

### Task 8: `DocsLayout` + 4개 라우트 중 문서 2개

**Files:**
- Create: `components/docs/docs-layout.tsx`
- Create: `app/docs/page.tsx`, `app/ko/docs/page.tsx`

- [ ] **Step 1: reference DocsLayout 복사**

Run: `mkdir -p components/docs && cp ../mqtt-insight.advenoh.pe.kr/components/docs/docs-layout.tsx components/docs/docs-layout.tsx`

이 컴포넌트는 `sections: DocSection[]`, `title`, `tocTitle` props로 사이드바 TOC + 본문(`dangerouslySetInnerHTML`)을 렌더한다. chronos 특화 로직 없음 — `Nav`/`Footer` import 경로만 확인.

- [ ] **Step 2: `app/docs/page.tsx` 작성 (en)**

```tsx
import type { Metadata } from 'next';
import { loadDocs } from '@/lib/docs';
import { en } from '@/lib/i18n/en';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsLayout } from '@/components/docs/docs-layout';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Docs',
  description: `How to use ${siteConfig.name}.`,
  alternates: {
    canonical: '/docs/',
    languages: { en: '/docs/', ko: '/ko/docs/', 'x-default': '/docs/' },
  },
};

export default async function Page() {
  const sections = await loadDocs('en');
  return (
    <>
      <Nav t={en} lang="en" />
      <DocsLayout sections={sections} title={en.docs.title} tocTitle={en.docs.toc} />
      <Footer t={en} lang="en" />
    </>
  );
}
```

- [ ] **Step 3: `app/ko/docs/page.tsx` 작성 (ko)**

Step 2와 동일하되 `import { ko } ...`, `loadDocs('ko')`, `lang="ko"`, `canonical: '/ko/docs/'`로 바꾼다. (전체 코드를 그대로 반복하고 en→ko만 교체.)

```tsx
import type { Metadata } from 'next';
import { loadDocs } from '@/lib/docs';
import { ko } from '@/lib/i18n/ko';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { DocsLayout } from '@/components/docs/docs-layout';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '문서',
  description: `${siteConfig.name} 사용법.`,
  alternates: {
    canonical: '/ko/docs/',
    languages: { en: '/docs/', ko: '/ko/docs/', 'x-default': '/docs/' },
  },
};

export default async function Page() {
  const sections = await loadDocs('ko');
  return (
    <>
      <Nav t={ko} lang="ko" />
      <DocsLayout sections={sections} title={ko.docs.title} tocTitle={ko.docs.toc} />
      <Footer t={ko} lang="ko" />
    </>
  );
}
```

- [ ] **Step 4: 빌드로 문서 렌더 확인**

Run: `npm run build`
Expected: 성공. `out/docs/index.html`, `out/ko/docs/index.html` 생성. (랜딩 페이지는 Task 9~에서 생성되므로, 아직 `app/page.tsx`가 없다면 이 단계는 문서 라우트만 확인. 루트 페이지가 없어 빌드가 실패하면 Step 5의 임시 스텁을 먼저 넣는다.)

- [ ] **Step 5: (필요 시) 루트 랜딩 임시 스텁**

`app/page.tsx`가 없어 빌드가 실패하면, 다음 최소 스텁을 넣어 빌드를 통과시키고 Task 9에서 대체한다:

```tsx
export default function Page() { return <main>chronos-go</main>; }
```

`app/ko/page.tsx`도 동일 스텁.

- [ ] **Step 6: 문서 렌더 육안 확인**

Run: `grep -o "getting-started" out/docs/index.html | head -1`
Expected: `getting-started` (시드 문서가 렌더됨).

- [ ] **Step 7: Commit**

```bash
git add components/docs app/docs app/ko/docs app/page.tsx app/ko/page.tsx && git commit -m "feat: render bilingual docs pages from markdown"
```

---

## Phase 4 — 랜딩 페이지 (코드 없음)

### Task 9: `scheduler-diagram.tsx` — 히어로 다이어그램

**Files:**
- Create: `components/scheduler-diagram.tsx`

- [ ] **Step 1: 작성 — 인스턴스 N개 → 리더 1개 → Redis**

순수 프레젠테이션 컴포넌트. SVG 또는 Tailwind 박스로 "app 1/2★/3 → Redis leader lock" 개념도를 그린다. 외부 이미지 없이 self-contained.

```tsx
export function SchedulerDiagram() {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex flex-col gap-2">
          {['app 1', 'app 2 ★', 'app 3'].map((n) => (
            <div
              key={n}
              className={
                'rounded-md px-3 py-2 text-center border ' +
                (n.includes('★')
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-black/15 dark:border-white/15 text-foreground/70')
              }
            >
              {n}
            </div>
          ))}
        </div>
        <div className="text-foreground/40 text-2xl">&rarr;</div>
        <div className="rounded-lg bg-rose-500 text-white px-4 py-6 text-center font-medium">
          Redis
          <br />
          leader lock
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-foreground/50">
        ★ = elected leader — only one instance enqueues each trigger
      </p>
    </div>
  );
}
```

> 참고: `text-foreground`/`bg-background` 토큰이 reference `globals.css`/`tailwind.config.ts`에 정의돼 있다. 없으면 `text-neutral-500` 등 표준 색으로 대체.

- [ ] **Step 2: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add components/scheduler-diagram.tsx && git commit -m "feat: add scheduler diagram for hero"
```

### Task 10: `hero.tsx`, `features.tsx`, `comparison.tsx`, `how-it-works.tsx`, `final-cta.tsx`

**Files:**
- Create: `components/hero.tsx`, `components/features.tsx`, `components/comparison.tsx`, `components/how-it-works.tsx`, `components/final-cta.tsx`

각 컴포넌트는 `{ t: Dict; lang: 'en' | 'ko' }` props를 받는다(reference 규약과 동일).

- [ ] **Step 1: `hero.tsx` 작성**

```tsx
import Link from 'next/link';
import type { Dict } from '@/lib/i18n/types';
import { siteConfig } from '@/lib/site-config';
import { SchedulerDiagram } from './scheduler-diagram';

export function Hero({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  const docsHref = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 grid gap-10 md:grid-cols-2 items-center">
      <div>
        <span className="inline-block text-xs font-medium rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-foreground/60">
          {t.hero.badge}
        </span>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
          {t.hero.title1}{' '}
          <span className="text-emerald-600 dark:text-emerald-400">{t.hero.title2}</span>
        </h1>
        <p className="mt-4 text-lg text-foreground/70">{t.hero.lead}</p>
        <div className="mt-6 flex gap-3">
          <Link href={docsHref} className="rounded-md bg-foreground text-background px-5 py-2.5 font-medium">
            {t.hero.getStarted}
          </Link>
          <a href={siteConfig.github} className="rounded-md border border-black/15 dark:border-white/20 px-5 py-2.5 font-medium">
            {t.hero.github}
          </a>
        </div>
      </div>
      <SchedulerDiagram />
    </section>
  );
}
```

- [ ] **Step 2: `features.tsx` 작성 (6카드 그리드)**

```tsx
import Link from 'next/link';
import type { Dict } from '@/lib/i18n/types';

export function Features({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  const base = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t.features.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold">{t.features.title}</h2>
      <p className="mt-2 text-foreground/70">{t.features.lead}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map((f) => (
          <Link key={f.slug} href={`${base}#${f.slug}`} className="rounded-xl border border-black/10 dark:border-white/10 p-5 hover:border-emerald-500/50 transition">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-foreground/70">{f.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `comparison.tsx` 작성 (vs asynq 표)**

```tsx
import type { Dict } from '@/lib/i18n/types';

export function Comparison({ t }: { t: Dict; lang: 'en' | 'ko' }) {
  const c = t.comparison;
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{c.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold">{c.title}</h2>
      <p className="mt-2 text-foreground/70">{c.lead}</p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/15 dark:border-white/15">
              <th className="text-left py-3"></th>
              <th className="py-3 text-foreground/50 font-medium">{c.headAsynq}</th>
              <th className="py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{c.headChronos}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r) => (
              <tr key={r.label} className="border-b border-black/5 dark:border-white/5">
                <td className="py-3">{r.label}</td>
                <td className="py-3 text-center text-foreground/50">{r.asynq}</td>
                <td className="py-3 text-center text-emerald-600 dark:text-emerald-400">{r.chronos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `how-it-works.tsx` 작성**

```tsx
import type { Dict } from '@/lib/i18n/types';

export function HowItWorks({ t }: { t: Dict; lang: 'en' | 'ko' }) {
  const h = t.howItWorks;
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{h.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold">{h.title}</h2>
      <p className="mt-3 text-foreground/70">{h.lead}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3 text-center text-sm">
        {['Streams — immediate', 'ZSETs — delayed / retry', 'Forwarder + Recoverer'].map((b) => (
          <div key={b} className="rounded-lg border border-black/10 dark:border-white/10 py-6 px-3">{b}</div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: `final-cta.tsx` 작성**

```tsx
import Link from 'next/link';
import type { Dict } from '@/lib/i18n/types';
import { siteConfig } from '@/lib/site-config';

export function FinalCta({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  const docsHref = lang === 'ko' ? '/ko/docs/' : '/docs/';
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold">{t.cta.title}</h2>
      <p className="mt-3 text-foreground/70">{t.cta.lead}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href={docsHref} className="rounded-md bg-foreground text-background px-5 py-2.5 font-medium">{t.cta.docs}</Link>
        <a href={siteConfig.github} className="rounded-md border border-black/15 dark:border-white/20 px-5 py-2.5 font-medium">{t.cta.github}</a>
        <a href={siteConfig.pkgGoDev} className="rounded-md border border-black/15 dark:border-white/20 px-5 py-2.5 font-medium">{t.cta.pkg}</a>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 7: Commit**

```bash
git add components/hero.tsx components/features.tsx components/comparison.tsx components/how-it-works.tsx components/final-cta.tsx && git commit -m "feat: add landing section components"
```

### Task 11: `landing.tsx` 조립 + 랜딩 라우트 교체

**Files:**
- Create: `components/landing.tsx`
- Modify: `app/page.tsx`, `app/ko/page.tsx` (Task 8의 스텁 대체)

- [ ] **Step 1: `landing.tsx` 작성 (섹션 순서)**

```tsx
import type { Dict } from '@/lib/i18n/types';
import { Nav } from './nav';
import { Hero } from './hero';
import { Features } from './features';
import { Comparison } from './comparison';
import { HowItWorks } from './how-it-works';
import { FinalCta } from './final-cta';
import { Footer } from './footer';

export function Landing({ t, lang }: { t: Dict; lang: 'en' | 'ko' }) {
  return (
    <>
      <Nav t={t} lang={lang} />
      <Hero t={t} lang={lang} />
      <Features t={t} lang={lang} />
      <Comparison t={t} lang={lang} />
      <HowItWorks t={t} lang={lang} />
      <FinalCta t={t} lang={lang} />
      <Footer t={t} lang={lang} />
    </>
  );
}
```

- [ ] **Step 2: `app/page.tsx` 교체 (en 랜딩)**

```tsx
import type { Metadata } from 'next';
import { en } from '@/lib/i18n/en';
import { Landing } from '@/components/landing';
import { AutoLangRedirect } from '@/components/auto-lang-redirect';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${siteConfig.name} — distributed task queue & scheduler for Go`,
  description: siteConfig.description,
  alternates: { canonical: '/', languages: { en: '/', ko: '/ko/', 'x-default': '/' } },
};

export default function Page() {
  return (
    <>
      <AutoLangRedirect />
      <Landing t={en} lang="en" />
    </>
  );
}
```

- [ ] **Step 3: `app/ko/page.tsx` 교체 (ko 랜딩)**

```tsx
import type { Metadata } from 'next';
import { ko } from '@/lib/i18n/ko';
import { Landing } from '@/components/landing';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${siteConfig.name} — Go 분산 태스크 큐·스케줄러`,
  description: siteConfig.description,
  alternates: { canonical: '/ko/', languages: { en: '/', ko: '/ko/', 'x-default': '/' } },
};

export default function Page() {
  return <Landing t={ko} lang="ko" />;
}
```

> `auto-lang-redirect.tsx`가 reference에서 브라우저 언어에 따라 `/` ↔ `/ko/`로 보내는 클라이언트 컴포넌트다. 없으면 이 import를 제거하고 진행한다.

- [ ] **Step 4: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add components/landing.tsx app/page.tsx app/ko/page.tsx && git commit -m "feat: assemble bilingual landing page"
```

### Task 12: sitemap/robots + 전체 빌드 검증

**Files:**
- Create: `app/sitemap.ts`, `app/robots.ts`

- [ ] **Step 1: reference 복사·적응**

Run: `cp ../mqtt-insight.advenoh.pe.kr/app/sitemap.ts app/sitemap.ts && cp ../mqtt-insight.advenoh.pe.kr/app/robots.ts app/robots.ts`

`sitemap.ts`의 URL 목록을 chronos 라우트(`/`, `/ko/`, `/docs/`, `/ko/docs/`)로, base를 `siteConfig.url`로 맞춘다. `robots.ts`의 host도 `siteConfig.url`.

- [ ] **Step 2: 전체 검증 — 빌드 + 타입 + 테스트**

Run: `npm run build && npx tsc --noEmit && npm test`
Expected: 셋 다 성공. `out/`에 `index.html`, `ko/index.html`, `docs/index.html`, `ko/docs/index.html` 생성.

- [ ] **Step 3: 랜딩에 코드 스니펫이 없는지(설계 준수) 확인**

Run: `grep -c "client.Enqueue\|func main\|package main" out/index.html || true`
Expected: `0` — 랜딩에는 코드 스니펫이 없어야 한다(다이어그램·비교표만). 0이 아니면 어느 섹션에 코드가 새어 들어갔는지 찾아 제거.

- [ ] **Step 4: 로컬 미리보기(선택) — 육안 확인**

Run: `npx serve out -l 3000` 후 브라우저에서 `http://localhost:3000`(en), `/ko/`, `/docs/`, `/ko/docs/` 확인. 히어로 다이어그램·6카드·비교표·CTA·다크모드 토글·언어 토글 동작 확인.

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts app/robots.ts && git commit -m "feat: add sitemap and robots; site builds end-to-end"
```

---

## Self-Review 결과 (작성자 확인)

- **스펙 커버리지:** 스택(Task 0/1) · 이중언어 라우트(Task 8/11) · 랜딩 5섹션 코드 없음(Task 9~12, Step 3에서 코드 부재 검증) · md 파이프라인+파리티(Task 1/2) · 레시피형 문서 & 실제 코드 출처(Task 3) · 다크모드(Task 6/7) · 성공 기준의 build/check/test(Task 12) 모두 태스크로 커버. **문서 13개 전량 저술은 의도적으로 범위 밖(Plan B)** — 이 계획은 "임의 개수 md 렌더"를 `01` 하나로 검증.
- **플레이스홀더:** 콘텐츠 md의 `<!-- SOURCE ... -->`는 Task 3에서 실제 chronos-go 코드로 교체하고 grep으로 잔존 검증(placeholder 아님 — 저술 지침 + 검증 게이트).
- **타입 정합성:** `Dict = typeof en`을 ko가 준수(Task 5), 컴포넌트 props `{ t: Dict; lang }` 규약 일관, i18n 키(`hero/features/comparison/howItWorks/cta/docs/footer/nav`)가 컴포넌트 사용처와 일치.

## 다음 (Plan B — 별도 작성 예정)

`02`~`13` 문서 본문(en/ko 24파일)을 `../chronos-go/`의 README·`examples/`·`example_test.go`에서 출처를 두고 레시피형으로 저술. 완료 시 `lib/docs.test.ts`의 `has all 13 docs` `.skip` 제거.
