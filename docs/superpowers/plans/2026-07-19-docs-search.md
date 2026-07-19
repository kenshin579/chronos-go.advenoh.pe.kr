# 문서 검색 (Pagefind) — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** 정적 export 사이트에 Pagefind 기반 문서 전문 검색을 추가한다 — 빌드타임 색인, nav 검색 버튼 + ⌘K 모달, en/ko 언어 분리, 백엔드 없음.

**Architecture:** `next build → postbuild-lang → pagefind --site out`로 `out/`을 색인. 문서 article에 `data-pagefind-body` 표시로 문서만 색인. 런타임은 클라이언트 `Search` 컴포넌트가 `/pagefind/pagefind-ui.js`를 지연 로드해 모달에 마운트.

**Tech Stack:** Next 16 static export, `pagefind`(devDep, CLI+런타임), React 19.

**스펙:** `docs/superpowers/specs/2026-07-19-docs-search-design.md`
**경로:** 리포 루트 `/Users/user/src/workspace_chronos_go/chronos-go.advenoh.pe.kr/`.

---

## Phase 1 — 색인 파이프라인

### Task 1: Pagefind 설치 + 빌드 스크립트 배선 + 색인 대상 표시
**Files:** `package.json`, `app/docs/[slug]/page.tsx`, `app/ko/docs/[slug]/page.tsx`

- [ ] **Step 1:** `npm install -D pagefind` (CLI + 런타임 번들 제공).
- [ ] **Step 2:** `package.json`의 `build`를 `next build && node scripts/postbuild-lang.mjs && pagefind --site out`로 변경(색인이 **마지막**, lang 세팅 후).
- [ ] **Step 3:** 두 article 페이지의 `<article className="mi-prose">`에 `data-pagefind-body`를 추가. 또한 `<h1>{doc.title}</h1>` 뒤(또는 article에) 언어 필터를 위해 `data-pagefind-meta="title"`은 h1이 자동 처리하므로 생략 가능. article만 표시하면 인덱스는 문서 본문으로 한정됨.
- [ ] **Step 4: 검증** — `npm run build` 성공, `out/pagefind/pagefind.js`·`out/pagefind/pagefind-ui.js`·`out/pagefind/pagefind-entry.json` 생성. `ls out/pagefind/`로 확인. 색인 로그에 en/ko 페이지 수가 잡히는지 확인(Pagefind가 `<html lang>`로 언어 분리).
- [ ] **Step 5: 색인 내용 확인** — 색인이 문서 용어를 포함하는지 간접 확인: `grep -rl "leader" out/pagefind/ | head -1` 또는 Pagefind 로그의 "indexed N pages / M words". nav/사이드바 텍스트가 과다 색인되지 않았는지(문서 body만) 확인.
- [ ] **Step 6:** `.gitignore`에 이미 `out/`이 있으므로 색인 산출물은 커밋 안 됨(정상). Commit: `git add package.json package-lock.json app/docs app/ko/docs && git commit -m "feat: index docs with Pagefind at build time"`.

## Phase 2 — 검색 UI

### Task 2: i18n 문자열
**Files:** `lib/i18n/en.ts`, `lib/i18n/ko.ts`
- [ ] **Step 1:** `en.ts`의 `en` 객체에 `search: { label: 'Search', placeholder: 'Search the docs…', empty: 'No results', shortcut: '⌘K' }` 추가. `Dict` 타입에 자동 반영.
- [ ] **Step 2:** `ko.ts`에 `search: { label: '검색', placeholder: '문서 검색…', empty: '결과 없음', shortcut: '⌘K' }` 추가.
- [ ] **Step 3:** `npx tsc --noEmit`로 en/ko 타입 일치 확인. Commit: `git commit -m "feat: add search i18n strings"`.

### Task 3: `Search` 클라이언트 컴포넌트 (버튼 + ⌘K 모달)
**Files:** `components/search.tsx`
- [ ] **Step 1:** `'use client'` 컴포넌트 작성. props: `{ t: Dict }`.
  - 상태 `open`. 버튼(`mi-icon-btn` 스타일) 클릭 또는 `⌘K`/`Ctrl+K`로 `open=true`.
  - 전역 `keydown` 리스너(`useEffect`): `(e.metaKey||e.ctrlKey) && e.key==='k'` → preventDefault + open; `Esc` → close.
  - 모달 오픈 시: `/pagefind/pagefind-ui.js`가 아직 로드 안 됐으면 `<script>` 주입으로 지연 로드 → 로드 완료 후 `new window.PagefindUI({ element: '#pagefind-search', showSubResults: true, showImages: false, resetStyles: false })`로 마운트(중복 마운트 방지 플래그). 스크립트 로드 실패(예: `next dev`, 파일 없음) 시 "빌드 후 사용 가능"(`t.search.empty` 또는 별도 문구) 표시로 graceful degrade.
  - 접근성: 오버레이 + `role="dialog"` `aria-modal="true"` `aria-label={t.search.label}`, 오픈 시 검색 입력에 포커스, Esc/오버레이 클릭으로 닫기, 포커스 트랩(간단히: 모달 밖 탭 방지 또는 최소한 오픈 시 포커스 이동).
  - `window.PagefindUI` 타입은 `declare global`로 `interface Window { PagefindUI?: new (opts: Record<string, unknown>) => unknown }` 선언.
- [ ] **Step 2:** `npx tsc --noEmit` 통과. Commit: `git commit -m "feat: add Search component (button + Cmd-K modal, lazy Pagefind UI)"`.

### Task 4: nav 통합 + Pagefind UI 테마
**Files:** `components/nav.tsx`, `styles/site.css`
- [ ] **Step 1:** `nav.tsx`의 `mi-nav-actions` 안(github 버튼 앞)에서 `<Search t={t} />` 렌더. import 추가. (nav는 서버 컴포넌트지만 자식으로 client 컴포넌트 렌더는 정상.)
- [ ] **Step 2:** `styles/site.css`에 모달/오버레이 스타일 + Pagefind UI CSS 변수 테마 추가:
  - 오버레이(반투명 배경, 중앙 상단 모달 카드, 사이트 다크/라이트 대응), 검색 버튼(라이트/다크).
  - Pagefind UI 변수: `.pagefind-ui { --pagefind-ui-primary:#6366f1; --pagefind-ui-text:...; --pagefind-ui-background:...; --pagefind-ui-border:...; --pagefind-ui-tag:...; }` 라이트/다크(`[data-theme='dark']`) 모두.
- [ ] **Step 3: 검증** — `npm run build` 성공, 빌드 후 로컬 미리보기(`npx serve out`)에서: nav에 검색 버튼 노출, ⌘K로 모달 오픈, 문서 용어(예: "scheduling", "dead-letter") 검색 시 결과 노출, 결과 클릭 시 `/docs/<slug>/`(또는 ko) 이동, en/ko 페이지에서 각 언어 결과. `npx tsc --noEmit`·`npm test` 통과.
- [ ] **Step 4:** Commit: `git commit -m "feat: wire search into nav; theme Pagefind UI to indigo"`.

## Phase 3 — 검증 + 리뷰

- [ ] `npm run build`(색인 생성) · `npx tsc --noEmit` · `npm test`(0 skip) 통과.
- [ ] `out/pagefind/` 존재, 문서 색인됨, en/ko 분리.
- [ ] 회귀 없음: `grep -rIl "emerald\|mqtt\|insight" out/` 없음(단 pagefind 번들은 서드파티라 제외 판단).
- [ ] a11y: ⌘K/Esc/포커스 동작. 검색 버튼에 `aria-label`.
- [ ] 최종 코드 리뷰(모달 a11y·지연 로드 견고성·테마 대비·SSR/hydration 안전성).

## Self-Review

- 스펙 항목(엔진/범위/다국어/UX/UI/빌드) 모두 Task로 커버. `data-pagefind-body`로 문서 한정, 빌드 스크립트에 색인 마지막 배치(lang 후), ⌘K 모달 + 지연 로드 graceful degrade, 인디고 테마.
- 위험: `pagefind-ui.js`는 빌드 산출물에만 존재 → dev/미빌드 시 부재. Task 3에서 graceful degrade로 처리(명시). 타입: `window.PagefindUI`는 `declare global`로 선언.
- 정합성: 결과 링크는 Pagefind가 색인한 페이지 URL(`/docs/<slug>/`)을 그대로 사용 → 기존 라우팅과 일치.
