# 문서 개편 · 코드 하이라이팅 · 아이콘 마무리 — 설계 스펙

- **날짜:** 2026-07-19
- **저장소:** `chronos-go.advenoh.pe.kr` (Next.js static export)
- **선행:** Plan A(사이트 골격)·Plan B(문서 02–13)·SEO·리브랜딩(indigo/purple) 모두 머지됨.

## 목적

1. **문서를 article별 개별 페이지로 분리** — 현재 언어별 단일 페이지(`/docs/`, `/ko/docs/`)에 13개 주제를 `#slug` 앵커로 모아 렌더. 이를 주제당 개별 URL(`/docs/<slug>/`)로 분리해 검색 유입·탐색·공유를 개선.
2. **주제 그룹핑** — 사이드바를 5개 묶음으로.
3. **코드 신택스 하이라이팅** — 빌드타임, 클라이언트 JS 없음.
4. **아이콘 마무리(B-1)** — apple-touch-icon + 웹 매니페스트.
5. **정리(B-2)** — 미사용 아이콘 제거.

## 결정 사항 (확정)

- **URL:** 평평한 `/docs/<slug>/`, `/ko/docs/<slug>/`. 그룹은 URL이 아니라 **사이드바에만** 반영(그룹 변경에도 URL 안정). `/docs/`·`/ko/docs/`는 **그룹별 개요 인덱스**.
- **prev/next:** 문서 순서(파일명 `NN-`)에서 **자동 생성**. md의 수동 "Next" 링크는 제거.
- **하이라이터:** `rehype-highlight`(highlight.js, 빌드타임). 다크 코드블록 테마(인디고 톤).
- **`mi-` CSS 프리픽스:** 이번엔 유지(순수 코스메틱, 240곳). dead 아이콘만 제거.

## ① 문서 개별 페이지 + 그룹핑

**데이터 모델 (`lib/docs.ts`):**
- frontmatter에 `group` 필수 추가(허용값: `Getting started` · `Core` · `Workflows` · `Operating` · `Reference`), `description` 필수 추가(인덱스·meta용 한 줄).
- `order`는 파일명 `NN-` 접두에서 파생.
- 함수: `getDocsNav(lang)` → 그룹 순서대로 묶인 `{ group, items: {slug,title,order} }[]`; `loadDoc(lang, slug)` → 단일 article(html 포함) + `prev`/`next`(전체 선형 순서 기준); `listSlugs(lang)` → generateStaticParams용.
- en/ko 파일 세트 파리티·slug 유일성·slug 형식 검증은 유지. `group` 값이 허용 집합 밖이면 빌드 실패.

**그룹 배치:**
- Getting started: `getting-started`
- Core: `tasks-and-handlers` · `enqueue-options` · `queues-and-priority` · `retries-and-reliability` · `scheduling`
- Workflows: `chains` · `groups`
- Operating: `observability` · `redis-cluster` · `performance`
- Reference: `how-it-works` · `migrating-from-asynq`

**라우트:**
- `app/docs/[slug]/page.tsx`(en), `app/ko/docs/[slug]/page.tsx`(ko) — `generateStaticParams`로 13개씩 정적 생성. 사이드바(그룹 nav) + article 본문 + prev/next. 페이지별 메타: `title`(article 제목), `description`, canonical `/docs/<slug>/`, hreflang(en/ko/x-default).
- `app/docs/page.tsx`·`app/ko/docs/page.tsx` — 개요 인덱스로 변경(그룹별 문서 목록 + description).
- `components/docs/docs-layout.tsx` — 그룹 사이드바 + 본문 셸로 리팩터(인덱스·article 공용). article 하단 prev/next.
- `app/sitemap.ts` — 인덱스 + 26개 article URL 추가.

**기존 링크 갱신:**
- `components/features.tsx`: 카드 링크 `${base}#${slug}` → `${base}${slug}/`.
- md 본문의 수동 "Next" 섹션 제거(자동 prev/next로 대체). doc 13의 "Where to go from here"(getting-started·GitHub 링크)는 유지 가능.

## ② 코드 하이라이팅

- `lib/docs.ts` 파이프라인에 `rehype-highlight` 추가(remarkRehype 이후, rehypeStringify 이전). 언어: go·bash·ts/tsx.
- 다크 코드블록 테마 CSS(`.hljs` 토큰 색)를 사이트 톤(다크 배경 + 인디고/보라 계열 강조)으로 추가. 코드블록은 라이트/다크 모두에서 다크 배경 유지(가독성).

## ③ 아이콘 마무리 (B-1)

- 스톱워치 마크 기반 **정사각 풀블리드**(iOS 마스킹 대비 라운드/투명 없이) 소스 SVG → `apple-touch-icon.png`(180×180), `icon-192.png`, `icon-512.png` 생성(rsvg-convert). favicon PNG 폴백(32/16) 선택.
- `public/site.webmanifest`: `name`/`short_name`=chronos-go, `theme_color`=`#6366f1`, `background_color`=`#0e1524`, icons(192/512), `display`=standalone.
- `app/layout.tsx` 메타: `icons: { icon, apple }`, `manifest: '/site.webmanifest'`.

## ④ 정리 (B-2)

- `lib/icons.tsx`에서 실제 사용되는 아이콘만 남기고(로고·github·sun·moon 등 확인 후) 미사용(tree/chart/diff/send/record/shield 등) 제거. `IconName` 타입·`FeatureIcon` 등 연쇄 정리.

## 테스트 / 성공 기준

- `lib/docs.test.ts` 갱신: 13개 유지·slug 집합·en/ko 파리티에 더해 (a) 모든 문서에 허용된 `group`·`description` 존재, (b) `getDocsNav`가 5그룹을 순서대로 반환, (c) `loadDoc`의 prev/next 체인이 처음~끝 완결.
- `npm run build` 성공: `/docs/`·`/ko/docs/` 인덱스 + `/docs/<slug>/`·`/ko/docs/<slug>/` 26개 생성.
- `npm test`·`npx tsc --noEmit` 통과.
- 코드블록에 `.hljs` 클래스/토큰 스팬 생성(하이라이팅 동작).
- 랜딩 6개 기능 카드가 `/docs/<slug>/`로 연결(404 없음).
- `apple-touch-icon.png`(180×180)·`site.webmanifest` 존재하고 레이아웃에서 참조.

## 범위 밖

- `mi-` 프리픽스 리네이밍(코스메틱, 별도 후속).
- 문서 검색·추가 언어·코드 예제 CI 컴파일 검증(기존 스펙 §6 후속).
