# 문서 검색 (Pagefind) — 설계 스펙

- **날짜:** 2026-07-19
- **저장소:** `chronos-go.advenoh.pe.kr` (Next.js static export)
- **선행:** 문서 개별 페이지화(PR #5)·Shiki 하이라이팅(PR #6)까지 머지됨. `<html lang>`은 en=`/docs/**`, ko=`/ko/docs/**`로 정확히 세팅됨(postbuild-lang).

## 목적

정적 export 사이트(백엔드 없음)에 **문서 전문 검색**을 추가한다. 외부 서비스(Algolia 등)나 서버 없이, 빌드타임에 생성한 색인을 브라우저에서 검색한다.

## 결정 (확정)

- **엔진:** [Pagefind](https://pagefind.app) — 빌드된 `out/` HTML을 스캔해 정적 색인 생성. 런타임 매우 작고 오프라인 동작, 외부 서비스·API 키 불필요.
- **범위:** **문서만.** 문서 article 본문에 `data-pagefind-body`를 표시해 Pagefind가 그 영역만 색인한다(nav·사이드바·랜딩 제외 → 노이즈 없음).
- **다국어:** Pagefind가 페이지의 `<html lang>`을 읽어 언어별 색인을 분리한다. en 페이지에서 검색하면 en 결과, ko 페이지에서 검색하면 ko 결과. (우리가 고쳐둔 html lang이 여기서 활용됨.)
- **UX:** 전역 nav에 검색 버튼 + **⌘K / Ctrl+K 단축키** → 모달. Esc 닫기, 방향키·Enter로 결과 이동. (참고 사이트 frank.blog의 Search ⌘K와 동일 패턴.)
- **UI:** Pagefind 기본 UI(`@pagefind/default-ui`)를 사이트 인디고 톤으로 CSS 변수 테마 적용. (완전 커스텀 대신 기본 UI로 빠르게, 룩은 변수로 맞춤.)

## 아키텍처

### 색인 (빌드타임)
- `build` 스크립트에 Pagefind 색인 단계를 **마지막**에 추가:
  `next build && node scripts/postbuild-lang.mjs && pagefind --site out`
  (postbuild-lang이 ko의 `<html lang="ko">`를 먼저 세팅한 뒤 Pagefind가 색인해야 언어 분리가 정확하다.)
- Pagefind는 `out/pagefind/`에 색인 + 런타임 JS(`pagefind.js`, `pagefind-ui.js`, css)를 생성한다. 이 디렉터리는 정적 파일로 배포된다.
- `pagefind` npm 패키지를 **devDependency**로 추가(재현 가능한 빌드; `npx` 대신 고정 버전).

### 색인 대상 표시
- `app/docs/[slug]/page.tsx`·`app/ko/docs/[slug]/page.tsx`의 article 컨테이너에 `data-pagefind-body` 추가 → 개별 문서 본문만 색인.
- 문서 제목(`<h1>`)은 Pagefind가 자동으로 결과 제목으로 사용. 필요 시 `data-pagefind-meta="title"`로 명시.
- 개요 인덱스(`/docs/`)는 색인에서 제외(개별 문서로 충분).

### 검색 UI (런타임)
- `components/search.tsx`(client component): 검색 버튼(nav용) + 모달.
  - 모달 오픈 시 `/pagefind/pagefind-ui.js`를 **지연 로드**(script 태그 주입) 후 `new PagefindUI({ element, showSubResults: true, ... })`로 마운트. 파일은 빌드 산출물에만 존재하므로 `next dev`에선 없을 수 있음 → 없으면 "빌드 후 사용 가능" 안내로 graceful degrade.
  - 단축키: `⌘K`/`Ctrl+K` 전역 리스너로 오픈, `Esc` 닫기.
  - 접근성: 모달에 `role="dialog"`, `aria-modal`, 포커스 트랩, 오픈 시 입력에 포커스.
- `components/nav.tsx`의 `mi-nav-actions`에 검색 버튼 배치(github/lang/theme 옆).
- i18n: `t.search`(예: `placeholder`, `label`) 추가(en/ko).
- Pagefind UI 테마: `styles/site.css`에 `--pagefind-ui-primary` 등 변수를 인디고(#6366f1)·사이트 배경에 맞춤.

## 테스트 / 성공 기준

- `npm run build` 성공 후 `out/pagefind/pagefind.js`·`out/pagefind/pagefind-ui.js`·색인 파일 생성.
- 색인에 문서 콘텐츠 포함(예: "leader election"·"dead-letter" 같은 문서 용어가 색인 결과에 잡힘). en/ko 언어 분리 확인.
- nav에 검색 버튼 노출, ⌘K로 모달 오픈, 결과 클릭 시 해당 `/docs/<slug>/`(또는 `/ko/docs/<slug>/`)로 이동.
- `npx tsc --noEmit`·`npm test` 통과. 회귀(emerald/mqtt) 없음.
- 접근성: 모달 키보드 조작(⌘K/Esc/방향키), 포커스 관리 동작.

## 범위 밖

- 랜딩/마케팅 페이지 검색(문서만).
- 검색 분석·인기 검색어.
- 커스텀 랭킹/시노님(Pagefind 기본값 사용).
- `next dev`에서의 완전한 검색 동작(색인은 빌드 산출물 기반 → dev는 안내로 degrade).
