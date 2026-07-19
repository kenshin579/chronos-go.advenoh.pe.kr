# 문서 개편 · 하이라이팅 · 아이콘 마무리 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** 문서를 article별 개별 페이지(`/docs/<slug>/`)로 분리하고 그룹 사이드바·자동 prev/next·개요 인덱스를 추가하며, 코드 신택스 하이라이팅과 apple-touch-icon/매니페스트를 넣고 미사용 아이콘을 정리한다.

**Architecture:** `lib/docs.ts`를 (단일 페이지용 `loadDocs`) → (nav 모델 + 단일 article 로더 + prev/next)로 확장하고, `rehype-highlight`를 파이프라인에 추가. Next.js 동적 라우트 `app/(ko/)docs/[slug]/`로 정적 생성. `mi-` 프리픽스는 유지.

**Tech Stack:** Next 16 static export, unified 11(+`rehype-highlight`, `highlight.js`), React 19, Tailwind.

**스펙:** `docs/superpowers/specs/2026-07-19-docs-pages-highlight-design.md`

**경로:** 리포 루트 `/Users/user/src/workspace_chronos_go/chronos-go.advenoh.pe.kr/`.

---

## 그룹·slug 고정표

| group | slugs (순서) |
|---|---|
| Getting started | getting-started |
| Core | tasks-and-handlers · enqueue-options · queues-and-priority · retries-and-reliability · scheduling |
| Workflows | chains · groups |
| Operating | observability · redis-cluster · performance |
| Reference | how-it-works · migrating-from-asynq |

`GROUP_ORDER = ['Getting started','Core','Workflows','Operating','Reference']`. 선형 순서(prev/next) = 파일명 `NN-` 순서(그룹 순서와 일치).

## Phase 1 — 콘텐츠 frontmatter (group + description, 수동 Next 제거)

각 문서 md(en/ko 26파일)에 `group`·`description`을 추가하고 본문 끝의 수동 "Next"(`## Next`/`## 다음` + `/docs/#...` 링크)를 제거. doc 13의 "Where to go from here / 이제부터는" 닫음 링크는 유지.
- `group`은 고정표대로. `description`은 개념 한 줄(en 영어/ko 한국어), meta·인덱스에 쓰이므로 간결하게.
- 검증: `grep -L "^group:" content/docs/en/*.md` 없음; 수동 Next 잔존 없음(`grep -rn "docs/#" content/docs/` → 0, doc 13 닫음 링크는 `/docs/#getting-started`가 아니라 `/docs/getting-started/` 형태로 갱신).
- 커밋: `docs: add group/description frontmatter, drop manual next links`.

## Phase 2 — `lib/docs.ts` 모델 확장 + 하이라이팅 (TDD)

- `rehype-highlight`·`highlight.js` 설치.
- `lib/docs.ts`: `DocMeta{slug,title,group,description,order}`, `getDocsNav(lang)`, `loadDoc(lang,slug)`(html + prev/next), `listSlugs(lang)`. frontmatter에서 `group`(허용집합 검증)·`description` 필수. 파이프라인에 `rehype-highlight` 추가.
- `lib/docs-nav.ts`: `GROUP_ORDER` + 그룹핑 헬퍼.
- `lib/docs.test.ts` 갱신: 13개·slug 집합·파리티 유지 + group 허용값·description 존재·nav 5그룹 순서·prev/next 완결.
- 커밋: `feat: docs nav model + per-article loader + syntax highlighting`.

## Phase 3 — 라우트·레이아웃·링크·sitemap

- `components/docs/docs-layout.tsx` → 그룹 사이드바 셸로 리팩터(현재 slug 하이라이트), 인덱스/article 공용. article 하단 prev/next.
- `app/docs/[slug]/page.tsx`·`app/ko/docs/[slug]/page.tsx`: `generateStaticParams`=`listSlugs`, `generateMetadata`(title/description/canonical `/docs/<slug>/`/hreflang), 단일 article + 사이드바 + prev/next.
- `app/docs/page.tsx`·`app/ko/docs/page.tsx`: 그룹별 개요 인덱스.
- `components/features.tsx`: `${base}#${f.slug}` → `${base}${f.slug}/`.
- `app/sitemap.ts`: 인덱스 + 26 article URL.
- 코드블록 다크 테마 CSS(`.hljs`) 추가(사이트 톤).
- 커밋: `feat: per-article docs routes, grouped sidebar, overview index`.

## Phase 4 — 아이콘 마무리 + 정리

- 정사각 풀블리드 소스 SVG(라운드/투명 없음, indigo→purple + 흰 스톱워치) → `apple-touch-icon.png`(180), `icon-192.png`, `icon-512.png`(rsvg-convert). `public/site.webmanifest`. `app/layout.tsx` 메타(`icons.apple`, `manifest`).
- `lib/icons.tsx` 미사용 아이콘 제거(실제 사용: 로고·github·sun·moon 확인 후 나머지 제거), `IconName` 정리.
- 커밋: `feat: apple-touch-icon + web manifest; prune unused icons`.

## Phase 5 — 검증 + 최종 리뷰

- `npm run build`(26 article + 2 인덱스 생성) · `npx tsc --noEmit` · `npm test`(0 skip) 통과.
- 랜딩 카드 6개 → `/docs/<slug>/` 200(각 `out/docs/<slug>/index.html` 존재).
- 코드블록 `.hljs` 토큰 스팬 생성 확인.
- `apple-touch-icon.png` 180×180 · `site.webmanifest` 존재·레이아웃 참조.
- mqtt/emerald/rose 잔재 0(회귀 방지 grep).
- 최종 코드 리뷰(정확성·링크 무결성·접근성).

## Self-Review

- 스펙 5개 항목 모두 Phase로 커버. URL/그룹/prev/next/하이라이터/아이콘 결정 반영.
- 링크 정합성: features 카드·sitemap·prev/next·hreflang이 새 `/docs/<slug>/` 체계와 일치. Task/Phase 3에 집약.
- 위험: 라우트 구조 변경으로 기존 `/docs/#slug` 딥링크가 깨질 수 있음 → 콘텐츠·카드 링크를 모두 새 형식으로 갱신(Phase 1·3). 외부 딥링크는 통제 밖(허용).
