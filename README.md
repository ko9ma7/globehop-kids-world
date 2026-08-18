# GlobeHop 🌍✈️

아이들이 나라·도시·명소를 검색하고, 출발지에서 목적지까지의 거리·시차·예상 이동시간을 보며 세계를 공부하는 GitHub Pages용 정적 웹서비스입니다.

이 프로젝트는 **평면 세계지도 + 지구본 느낌 애니메이션**, **비행기 경로**, **편도/왕복**, **육상 이동 거리**, **국가 기본 통계**, **아이용 학습 카드**, **다국어 UI**, **출발지 설정**, **이미지 갤러리**, **PWA**, **GitHub Actions 배포**를 하나의 완성 프로젝트로 제공합니다.

## 핵심 기능

- 국가·도시·명소 검색
- 232개 국가 기본 검색 데이터
- 대표 도시/명소 오프라인 검색 데이터
- Open-Meteo Geocoding 기반 온라인 지명 검색 보조
- 2D 세계지도 / 지구본 느낌 전환
- 비행기 이동 애니메이션
- 편도 / 왕복 애니메이션
- 직선거리 계산
- 가능한 경우 OSRM 실제 도로망 기반 육상 거리·시간 조회
- 도로 라우팅 실패 시 지역/국경 기반 안전한 추정값 fallback
- 예상 비행시간
- 현지시간 / 시차
- 나라별 수도·인구·면적·GDP·GNI·통화·언어·지역·국가번호
- World Bank API 기반 최신 통계 보강
- 나라별 음식·특산물·동물·식물·랜드마크·인사말·기후·추천 시기·여행 팁·재미있는 사실
- 국기 및 국가별 이미지 갤러리
- 즐겨찾기 / 최근 탐험 LocalStorage 저장
- Light / Dark / System 테마
- PWA manifest / service worker
- SEO / Open Graph / Twitter Card
- 커스텀 404
- GitHub Actions 자동 Pages 배포

## 지원 언어

UI는 다음 언어를 지원합니다.

- 한국어
- English
- 日本語
- 中文
- हिन्दी
- Deutsch
- Français
- Español
- Português
- العربية
- Bahasa Indonesia

국가명은 브라우저의 `Intl.DisplayNames`를 이용해 가능한 범위에서 자동 현지화합니다. 국가별 학습 콘텐츠는 현재 영어/한국어 중심이며 JSON 파일에 언어 블록을 추가하는 방식으로 확장할 수 있습니다.

## 기본 출발지

다음 대표 도시를 기본 출발지로 제공합니다.

- 서울
- 뉴델리
- 베를린
- 파리
- 도쿄
- 베이징
- 자카르타
- 방콕
- 뉴욕
- 상파울루
- 카이로
- 두바이

브라우저 Geolocation 권한을 허용하면 **내 위치**를 출발지로 사용할 수 있습니다.

> 내 위치를 선택하면 도로 거리 계산을 위해 좌표가 공개 위치/라우팅 API로 전송될 수 있습니다. GlobeHop 자체 서버는 없으며 프로젝트 자체가 위치 좌표를 서버에 저장하지 않습니다.

## 이동 경로 정책

배·기차·비행기가 같은 선을 따라 움직이는 문제를 피하기 위해 **지도에서 움직이는 교통수단은 비행기 하나만 사용**합니다.

대신 아래 정보를 구분해서 제공합니다.

- 직선거리: Haversine 계산
- 비행시간: 거리 기반 교육용 예상값
- 육상거리/시간: OSRM 경로가 반환되면 실제 도로망 기반 결과 사용
- OSRM이 실패하거나 현실적인 육상 연결이 어려우면 추정값 또는 `계산 어려움` 표시

비행기 곡선은 실제 항공편의 운항 경로가 아니라 아이들이 위치 관계를 이해하기 위한 교육용 시각화입니다.

## 프로젝트 구조

```text
kids-world-explorer/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ DATA_GUIDE.md
│  ├─ PROJECT_STRUCTURE.md
│  └─ ROUTING_AND_PRIVACY.md
├─ public/
│  ├─ icons/
│  │  ├─ apple-touch-icon.png
│  │  ├─ favicon-16.png
│  │  ├─ favicon-32.png
│  │  ├─ icon-192.png
│  │  ├─ icon-512.png
│  │  └─ icon-512-maskable.png
│  ├─ .nojekyll
│  ├─ 404.html
│  ├─ favicon.svg
│  ├─ manifest.webmanifest
│  ├─ og-image.png
│  ├─ repo-social-preview.png
│  ├─ robots.txt
│  ├─ sitemap.xml
│  └─ sw.js
├─ scripts/
│  ├─ build.mjs
│  └─ dev-server.mjs
├─ src/
│  ├─ data/
│  │  ├─ countries/
│  │  │  ├─ index.json
│  │  │  └─ regions/
│  │  ├─ knowledge/
│  │  │  ├─ index.json
│  │  │  ├─ kr.json
│  │  │  ├─ jp.json
│  │  │  ├─ in.json
│  │  │  └─ ...
│  │  ├─ origins/
│  │  │  └─ index.json
│  │  ├─ places/
│  │  │  └─ index.json
│  │  └─ world-geometries.json
│  ├─ modules/
│  │  ├─ config.js
│  │  ├─ dataService.js
│  │  ├─ geo.js
│  │  ├─ globe.js
│  │  ├─ i18n.js
│  │  └─ storage.js
│  ├─ app.js
│  └─ styles.css
├─ index.html
├─ LICENSE
├─ NOTICE.md
├─ package.json
├─ package-lock.json
└─ README.md
```

## 역할별 파일

### `src/data/countries/`
국가 기본 데이터입니다. 전 세계 검색용 index와 대륙별 상세 파일로 나눴습니다.

### `src/data/origins/`
출발지 프리셋 데이터입니다. 출발 도시를 추가하려면 UI 코드를 고치지 않고 이 JSON을 확장하면 됩니다.

### `src/data/places/`
오프라인에서도 검색할 대표 도시·랜드마크입니다.

### `src/data/knowledge/`
나라별 아이용 학습 콘텐츠입니다. **한 나라 = 한 JSON** 방식이므로 데이터가 많아져도 분리 관리할 수 있습니다.

### `src/modules/dataService.js`
정적 JSON, Open-Meteo, World Bank, OSRM 요청을 담당합니다.

### `src/modules/geo.js`
거리, 시차, 예상 비행시간, 육상 이동 fallback 계산을 담당합니다.

### `src/modules/globe.js`
평면 지도/지구본 효과와 비행기 경로 애니메이션을 담당합니다.

### `src/modules/i18n.js`
다국어 UI 사전입니다.

## 실행 방법

Node.js 20 이상 권장입니다.

```bash
npm install
npm run dev
```

브라우저에서:

```text
http://localhost:5173/
```

## 빌드

```bash
npm run build
```

배포 파일은 `dist/`에 생성됩니다.

GitHub Pages 실제 URL을 canonical/OG/sitemap에 넣어 빌드하려면:

```bash
SITE_URL="https://USERNAME.github.io/REPOSITORY/" npm run build
```

## GitHub Pages 배포

1. GitHub에 새 Repository를 만듭니다.
2. 이 프로젝트 전체를 업로드합니다.
3. 기본 브랜치를 `main`으로 사용합니다.
4. GitHub Repository에서 **Settings → Pages**를 엽니다.
5. Build and deployment Source를 **GitHub Actions**로 설정합니다.
6. `main`에 push하면 `.github/workflows/deploy.yml`이 자동 실행됩니다.

배포 흐름:

```text
git push
→ npm ci
→ npm run build
→ dist 생성
→ GitHub Pages artifact 업로드
→ deploy-pages
```

## 데이터 확장

자세한 방법은 다음 문서를 참고하세요.

- `docs/DATA_GUIDE.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/ROUTING_AND_PRIVACY.md`

## 주요 외부 서비스

- Open-Meteo Geocoding: 도시/지명 검색 보조
- World Bank Indicators API: 인구/GDP/GNI 최신값 보강
- OSRM: 가능한 경우 자동차 도로 경로 거리/시간 조회

외부 API가 실패해도 국가 기본 검색과 내장 학습 데이터는 계속 동작합니다.

## 이미지

- 국기는 FlagCDN 이미지를 우선 사용하고 로드 실패 시 UI fallback을 표시합니다.
- 일부 국가 지식팩은 Wikimedia Commons 기반 대표 이미지 URL을 포함합니다.
- 대규모 운영에서는 `public/content/<country-code>/`에 직접 관리하는 최적화 이미지를 두는 방식을 권장합니다.

## License

코드: MIT License

정적 데이터 및 외부 이미지/API는 각 원출처의 라이선스/이용조건을 별도로 확인해야 합니다. `NOTICE.md`를 함께 확인하세요.
