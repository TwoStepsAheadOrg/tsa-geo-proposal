# plurank.com 랜딩 다국어(KO/EN/JA) 설계

작성일: 2026-07-31

## 배경

`plurank.com`의 한국어 랜딩(`/`)은 2026-07-23 새 SPA 디자인으로 교체됐지만, `/en`·`/ja`는 여전히
옛 다크 디자인 정적 페이지(162KB·167KB)를 서빙한다. `middleware.js`가 비한국 접속자를
`/` → `/en`으로 307 리다이렉트하므로, **해외 방문자는 전원 옛 디자인으로 떨어진다.**

또한 `/consulting`은 SPA 내부 라우트만 존재하고 정적 파일이 없어 직접 접속·새로고침 시 404다.

## 현재 상태 조사 결과

### 리포 구성

| 리포 | 역할 |
|---|---|
| `TwoStepsAheadOrg/plurank_landing` | SPA 소스 (React 19 + Vite 6). `src/Experience.jsx`(697줄) + `src/experience.css`(4,386줄) |
| `TwoStepsAheadOrg/tsa-geo-proposal` | 배포 리포 (Vercel). 빌드 산출물 + 프리렌더 HTML 커밋 → push 시 자동배포 |

### ⚠️ 소스와 배포본의 분기 (이번 작업의 핵심 제약)

배포된 번들 `assets/index-FlrKoINb.js`는 **`plurank_landing`에 커밋된 적 없는 로컬 작업본에서
빌드**됐다. 전 커밋·전 브랜치를 검색해도 아래 항목은 소스에 존재한 적이 없다.

| 항목 | 배포본 | 소스 HEAD |
|---|---|---|
| FAQ 섹션(6문항) + FAQPage JSON-LD | 있음 | **없음** |
| nav `블로그`·`#faq` 링크, `상담하기` CTA(`xp-nav__cta`) | 있음 | 없음 |
| footer `/blog`·`/#faq` 링크 | 있음 | 없음 |
| `xp-faq` CSS | 있음(`index-Tg6z-14Q.css`) | 없음(`experience.css`) |
| hero `xp-service-link` (커밋 `0fd0de8`·`8e05103`) | 없음 | 있음 |
| 영문 카피 `COPY.en` | 있음 | 있음 |

따라서 **소스를 그대로 빌드하면 라이브가 기능 후퇴**한다(FAQ·블로그 진입점·상담 CTA 소실).

### 그 밖의 확인 사항

- `COPY`에 `ko`/`en`은 완비, **`ja`는 없음**. `LanguageMenu`도 ko/en만 제공.
- `Experience()`의 `language`가 `useState("ko")`로 하드코딩 — URL과 무관.
- `document.title`이 언어와 무관하게 한국어로 고정.
- 배포 리포 `tests/homepage.test.mjs`의 **6개 테스트가 이미 실패** 중(옛 랜딩 기준 assertion).
- 배포된 `index.html`에 프리렌더 스냅샷 잔여물(`url=http%3A%2F%2Flocalhost%3A4188` 이 박힌
  doubleclick 스크립트 태그)이 포함돼 있음.
- 배포 리포에 `assets/plurank-page-transition.js`(emilie)가 "Plurank 서비스 바로가기" 버튼을
  DOM 오버레이로 생성 — 소스의 `xp-service-link`와 기능 중복.

## 결정 사항

대표 승인 완료:

1. **EN + JA 둘 다** 새 디자인으로 대응한다. JA 카피는 신규 번역하되 배포 전 검수를 받는다.
2. **`/consulting` 404도 같이 고친다** (언어별 3개 포함).
3. **한국어 페이지도 새 번들로 교체**한다. 단 교체 전 현행 KO와 신규 KO를 스크린샷으로 비교해
   차이가 없음을 확인한 뒤에만 배포한다.
4. **서비스 바로가기 버튼은 소스 JSX(`xp-service-link`)로 통일**한다. 오버레이 스크립트의 버튼
   생성 로직은 제거한다(emilie 담당 코드이므로 변경 사실을 공유한다).

## 라우팅 설계

Vercel `cleanUrls: true` 기준. 언어는 경로 프리픽스로 표현하고, 각 조합을 프리렌더된 정적
HTML로 서빙한다(SEO·직접 접속·새로고침 모두 정상 동작).

| URL | 파일 | 언어 | 페이지 |
|---|---|---|---|
| `/` | `index.html` | ko | main |
| `/ko` | `ko.html` | ko | main (기존 유지, `index.html`과 동일) |
| `/en` | `en/index.html` | en | main |
| `/ja` | `ja/index.html` | ja | main |
| `/consulting` | `consulting.html` | ko | consulting |
| `/en/consulting` | `en/consulting.html` | en | consulting |
| `/ja/consulting` | `ja/consulting.html` | ja | consulting |

기존 `en.html`·`ja.html`은 삭제한다. 삭제 전 `en_legacy.html`·`ja_legacy.html`과 내용이
동일한지 확인하고, 다르면 현재 내용을 `*_legacy.html`로 먼저 백업한다.

`en.html`과 `en/` 디렉터리를 공존시키면 `cleanUrls` 해석이 모호해지므로 디렉터리 형태로 통일한다.

## 구현 설계

### 1. 소스 정본화 — 역이식 (`plurank_landing`)

배포본에만 있는 요소를 소스로 복원한다. 복원 대상은 배포된 `index.html`(프리렌더 마크업)과
`index-Tg6z-14Q.css`에서 추출한다.

- `Experience.jsx`
  - `COPY.ko.faq` / `COPY.en.faq` 추가: 섹션 제목·부제 + 6개 문항(질문·답변).
  - `<section id="faq" className="xp-section xp-faq xp-reveal">` — `<details class="xp-faq-item">`
    6개, 첫 항목만 `open`. `MainPage`에서 features 뒤·final-cta 앞에 배치.
  - `TopNav`: main 페이지 링크에 `#faq`, `/blog` 추가 + `xp-nav__cta` 상담 버튼(클릭 시
    `onOpenContact`). consulting 페이지 nav는 현행 유지.
  - `Footer`: 정책 링크 앞에 `/blog`·`/#faq` 링크 추가.
- `experience.css`: 배포 CSS에서 `xp-faq*`·`xp-nav__cta*` 규칙 블록을 이식.

역이식 검증: 소스 빌드 결과의 `#root` 마크업이 현행 배포 `index.html`의 `#root` 마크업과
구조적으로 일치해야 한다(4단계 비교 게이트에서 확인).

### 2. i18n 라우팅 (`plurank_landing`)

```js
const LANGS = ["ko", "en", "ja"];

function langFromLocation() {
  const seg = window.location.pathname.split("/")[1];
  return seg === "en" || seg === "ja" ? seg : "ko";
}

function pageFromLocation() {
  const rest = window.location.pathname.replace(/^\/(en|ja)(?=\/|$)/, "");
  return rest.startsWith("/consulting") ? "consulting" : "plurank";
}

function pathFor(lang, page) {
  const prefix = lang === "ko" ? "" : `/${lang}`;
  return page === "consulting" ? `${prefix}/consulting` : (prefix || "/");
}
```

- `Experience()`: `useState(langFromLocation)`. `navigate()`는 `pathFor(language, target)`을 쓴다.
- **언어 전환은 full navigation**(`window.location.href = pathFor(next, page)`). 언어별로 프리렌더
  문서가 따로 존재하므로 pushState로 URL만 바꾸면 문서와 URL이 어긋난다.
- `LanguageMenu`에 `日本語` 추가.
- `document.title` / `<html lang>`을 언어·페이지별로 설정(런타임). 프리렌더 head는 4단계에서 별도 주입.
- `ProductSwitch`/`TopNav`/기타의 `language === "ko" ? A : B` 2분기 표현을 3분기로 확장한다.
  대상: `ProductSwitch`(서비스 바로가기 문구, aria-label, 제품 스위치 라벨), `TopNav`(nav aria-label),
  `LanguageMenu`(aria-label), `Footer`(법인 정보 전체), `HeroLaptopPreview`·`GlobalMarketVisual`·
  `ModelIntelligence`·`DashboardMotion`·`CompetitorChannelVisual`의 라벨.

### 3. JA 카피 (`plurank_landing`)

`COPY.ja`를 한국어 원문 기준으로 신규 작성한다. `COPY.ko`와 동일한 키 구조를 유지하고,
`<br />` 줄바꿈은 일본어 어절에 맞게 재배치한다. 회사 정보(법인명·주소·대표자)는 일본어 표기로
작성하되 사업자등록번호·이메일·전화번호는 원문 유지.

번역 초안은 배포 전 대표 검수를 받는다.

### 4. 프리렌더 파이프라인 (`plurank_landing/scripts/prerender.mjs`, 신규)

기존 스냅샷 방식(수동, head 오염)을 대체한다.

1. `vite build` → `dist/client`
2. `vite preview`로 로컬 서빙
3. 헤드리스 Chrome(Playwright, devDependency 추가)으로 6개 URL 방문
   (`/`, `/consulting`, `/en`, `/en/consulting`, `/ja`, `/ja/consulting`)
4. React 마운트 완료 대기 후 **`#root`의 innerHTML만** 추출
5. 최종 HTML = 언어별 `<head>` 템플릿 + `<body><div id="root">{추출본}</div>` + 스크립트 태그

`#root`만 추출하므로 gtag·doubleclick 등 런타임 주입 태그가 섞이지 않는다(현행 `localhost:4188`
잔여물 문제 해소).

`/ko`는 `/`의 중복 사본이므로 프리렌더 대상이 아니다. 배포 시 `index.html`을 `ko.html`로 복사한다.

head 템플릿이 언어별로 생성하는 것:

- `<html lang>`, `<title>`, `description`, `keywords`
- `canonical` + `hreflang` 4종(ko/en/ja/x-default) — 페이지(main·consulting)별로 대응 URL 지정
- OG/Twitter 메타(`og:locale`은 `ko_KR`/`en_US`/`ja_JP`)
- FAQPage JSON-LD (main 페이지 한정, 언어별 문항)
- 공통 head 파트: 파비콘·manifest·애널리틱스 로더·gtag·`plurank-page-transition.css`
  → `scripts/head-partials/` 로 분리해 7개 문서가 공유

출력물은 `dist/prerendered/{index,consulting}.html`, `dist/prerendered/{en,ja}/{index,consulting}.html`.

### 5. 배포 리포 반영 (`tsa-geo-proposal`)

- `assets/` — 새 번들(JS·CSS) 교체. 옛 해시 파일 제거.
- `index.html`·`ko.html`·`consulting.html`·`en/index.html`·`en/consulting.html`·
  `ja/index.html`·`ja/consulting.html` 배치. `en.html`·`ja.html` 삭제.
- `assets/plurank-page-transition.js` — 버튼 생성 로직 제거(소스 JSX로 이관). 스크롤 보정 등
  나머지 동작은 유지.
- `sitemap.xml` — 정규 6개 URL 반영(`/ko`는 `/`의 중복이므로 제외), `lastmod` 갱신.
- `lang-preference.js` — `languageByPath`에 `/consulting`·`/en/consulting`·`/ja/consulting` 추가.
- `middleware.js` — 변경 없음(matcher가 `/`·`/index.html`뿐이므로 신규 경로에 영향 없음).

### 6. 테스트

`tests/homepage.test.mjs`를 다시 쓴다. 옛 랜딩 기준으로 이미 실패 중인 6개 assertion
(`AI Discovery AdTech`, `discovery-canvas`, `Live Signal Graph`, 실행 루프 라벨 등)을 제거하고
아래를 검증한다.

- 7개 파일이 모두 존재한다.
- 각 파일의 `<html lang>`이 경로와 일치한다.
- 각 파일의 `canonical`이 자기 URL이고 `hreflang` 4종이 모두 있다.
- 언어별 대표 문구가 존재한다(KO `AI 답변 노출을 위한`, EN `Multi-channel publishing`, JA 대응 문구).
- KO main에 FAQ 6문항과 FAQPage JSON-LD가 있다.
- 어떤 파일에도 `localhost:4188` 잔여물이 없다.
- emilie의 페이지 전환 assertion 중 유효한 것(스크롤 보정·CSS)은 유지한다.

## 검증 게이트

배포 전 순서대로 통과해야 한다.

1. `npx vite build` 성공.
2. 프리렌더 7개 파일 생성 + 테스트 전량 통과.
3. **KO 회귀 비교** — 현행 라이브 `/`와 신규 KO 프리렌더를 동일 뷰포트에서 헤드리스 캡처해
   나란히 비교하고, 대표에게 제시해 승인받는다. 차이가 있으면 배포하지 않는다.
4. 배포 후 7개 URL이 200이고 `<html lang>`·언어 문구가 기대와 일치하는지 실측.

## 범위 밖 (별도 처리)

- 블로그 SSR(`api/_lib/blog-shared.js`)의 en/ja nav가 KO 홈을 가리키는 문제.
- `middleware.js`가 `/consulting`을 언어별로 분기하지 않는 점.
- `SLACK_WEBHOOK_URL`이 광고 리포트 채널로 향해 있는 문제.
- 통신판매업신고번호 푸터 표기.

> ⚠️ **폐기(2026-08-13)**: 위 계획과 동일한 사유로 폐기. 다국어 필요 시 새 구조 기준으로 다시 설계해야 합니다.
