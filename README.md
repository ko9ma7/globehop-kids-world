# GlobeHop V8

> 최신 버전: V8.5 — 33,801개 도시 검색 인덱스, 국가별 주요 도시 디렉터리, 도시별 구조화 정보·날씨·대기질·Wikipedia 주변 지식 탐험을 추가했습니다.

# GlobeHop 🌍✈️

GlobeHop은 아이들이 나라·도시·명소를 직접 눌러 탐험하고, 출발지에서 목적지까지의 거리·시차·예상 이동시간을 보며 세계를 공부하는 **GitHub Pages용 정적 웹서비스**입니다.

이번 버전은 단순한 “지구본처럼 보이는 2D 화면”이 아니라 **WebGL로 직접 렌더링하는 실제 3D 구체**를 포함합니다.

## Preview / 핵심 경험

1. 출발지를 고릅니다.
2. 나라·도시·명소를 검색하거나 지도 위에서 직접 고릅니다.
3. 여행을 시작하면 해당 구간이 잘 보이도록 화면이 자동 확대·회전합니다.
4. 2D 지도와 WebGL 3D 지구본을 전환해서 볼 수 있습니다.
5. 지도 위 국가·도시·명소에 마우스를 올리면 미니 정보가 표시됩니다.
6. 국가나 포인트를 클릭하면 검색창을 다시 쓰지 않아도 바로 그곳으로 목적지가 바뀝니다.
7. 거리·비행시간·육상거리·시차·현지시간과 국가 학습 카드를 함께 확인합니다.

## 3D Globe

`src/modules/globe3d.js`는 별도 외부 3D 라이브러리 없이 WebGL로 동작합니다.

- 실제 구(Sphere) 메시 렌더링
- 국가 GeoJSON을 지구 텍스처로 변환
- 마우스/터치 드래그 회전
- 휠 확대/축소
- 모바일 두 손가락 핀치 확대/축소
- 출발지→목적지 자동 카메라 회전
- 이동 구간 자동 줌
- 구 표면 위로 솟아오르는 비행 arc
- arc를 따라 움직이는 비행기
- 편도 / 왕복 애니메이션
- 도시·명소 포인트 표시
- 포인트 hover/tap 정보
- 지구 표면의 국가 자체를 마우스로 판별해 hover/click
- 선택 국가 하이라이트
- WebGL을 쓸 수 없는 브라우저에서는 2D 지도로 자동 fallback

## 2D Map

`src/modules/globe.js`는 교육용 평면 세계지도입니다.

- 국가 영역 hover / keyboard focus
- 국가 클릭 → 해당 국가 수도로 즉시 이동
- 도시·명소 포인트 hover/click
- 출발지→목적지 비행 경로 애니메이션
- 편도 / 왕복
- 이동 시작 시 구간 자동 확대
- 선택 국가 하이라이트

## 거리와 이동 정보

지도 위에서 움직이는 교통수단은 **비행기만** 사용합니다. 배·기차가 같은 선을 따라가는 잘못된 표현은 제거했습니다.

대신 아래 값을 별도로 제공합니다.

- 직선거리: Haversine 계산
- 예상 비행시간: 교육용 거리 기반 추정
- 육상거리 / 육상시간: 가능한 경우 OSRM 도로 라우팅 결과
- 도로 라우팅 실패 시: 국가·국경·대륙 관계 기반 fallback
- 현실적인 육상 연결이 어려우면 `계산 어려움`
- 목적지 현지시간
- 출발지와 목적지 시차

> 비행 arc는 실제 항공사의 운항 항로가 아니라 위치 관계를 이해하기 위한 교육용 시각화입니다.

## 지도에서 바로 탐험

### 2D

- 국가 영역에 포인터를 올리면 국가명·수도·지역·거리 표시
- 도시/랜드마크 점에 올리면 장소명·국가·거리 표시
- 클릭하면 즉시 목적지 변경

### 3D

- 구 표면에 포인터를 올리면 위도/경도를 역산해 해당 국가 판별
- 주요 도시·명소 포인트를 별도로 표시
- 클릭하면 해당 국가/도시/명소로 이동
- 목적지가 바뀌면 3D 카메라가 이동 구간의 중간 지점을 향해 회전하고 줌

모바일에서는 hover 대신 터치/탭 흐름으로 사용할 수 있습니다.

## 검색 및 데이터

- 232개 국가 기본 검색 데이터
- **33,801개 도시 검색 인덱스** (`src/data/cities/index.json`)
- 국가 선택 시 인구 데이터를 우선한 주요 도시 디렉터리
- 도시 선택 시 인구·행정구역·면적·고도·설립연도·시간대·언어·우편번호·자매도시 등 상세 정보
- Open-Meteo 기반 현재 날씨·오늘 최고/최저·강수확률·일출/일몰
- Open-Meteo/CAMS 기반 AQI·PM2.5·PM10·UV
- Wikipedia/MediaWiki 기반 도시 소개·대표 이미지·주변 지식 장소
- Wikidata 기반 구조화 도시 속성 보강
- 52개 대표 도시·명소 오프라인 탐험 포인트 및 국가 수도 동적 포인트
- World Bank API 기반 국가 인구/GDP/GNI 보강
- 외부 API가 실패해도 로컬 도시/국가 데이터로 기본 탐험 유지

## 국가 학습 카드

국가별 `src/data/knowledge/<code>.json`에 다음 정보를 분리합니다.

- 나라 한눈에 보기
- 현지 인사말
- 기후
- 여행하기 좋은 시기
- 여행 팁
- 대표 음식·특산물
- 동물
- 식물
- 랜드마크
- 재미있는 사실
- 이미지 갤러리

## 지원 언어

현재 UI 언어:

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
- বাংলা
- Русский
- Türkçe
- Tiếng Việt
- ไทย
- اردو
- Italiano
- فارسی
- Filipino
- Bahasa Indonesia

국가명은 `Intl.DisplayNames`를 이용해 가능한 범위에서 현지화합니다. 국가별 긴 학습 콘텐츠는 영어/한국어를 기본으로 하고 국가 JSON에 언어 블록을 추가하는 방식으로 확장할 수 있습니다.

## 기본 출발지

`src/data/origins/index.json`에서 관리합니다.

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
- 다카
- 카라치
- 모스크바
- 이스탄불
- 하노이
- 로마
- 테헤란
- 멕시코시티
- 라고스
- 런던
- 마드리드
- 마닐라

브라우저 위치 권한을 허용하면 **내 위치**도 출발지로 사용할 수 있습니다.

## Project Structure

```text
GlobeHop_3D_V5_COMPLETE_PROJECT/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ DATA_GUIDE.md
│  ├─ CITY_DATA_EXPANSION.md
│  ├─ PROJECT_STRUCTURE.md
│  ├─ ROUTING_AND_PRIVACY.md
│  └─ INTERACTION_AND_3D.md
├─ public/
│  ├─ icons/
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
│  │  ├─ cities/
│  │  ├─ knowledge/
│  │  ├─ origins/
│  │  ├─ places/
│  │  └─ world-geometries.json
│  ├─ modules/
│  │  ├─ config.js
│  │  ├─ dataService.js
│  │  ├─ cityInsights.js
│  │  ├─ geo.js
│  │  ├─ globe.js
│  │  ├─ globe3d.js
│  │  ├─ i18n.js
│  │  └─ storage.js
│  ├─ app.js
│  └─ styles.css
├─ START_HERE.md
├─ QA_REPORT.md
├─ index.html
├─ package.json
└─ README.md
```

## Local Development

Node.js 20 이상 권장:

```bash
npm install
npm run dev
```

브라우저:

```text
http://localhost:5173/
```

## Build

```bash
npm run build
```

`dist/` 폴더가 생성됩니다.

실제 GitHub Pages 주소를 메타데이터에 넣어서 빌드하려면:

```bash
SITE_URL="https://USERNAME.github.io/REPOSITORY/" npm run build
```

## GitHub Pages Deployment

1. GitHub Repository 생성
2. 이 프로젝트 전체 업로드
3. `Settings → Pages`
4. Source를 **GitHub Actions**로 설정
5. `main` 브랜치에 push

포함된 `.github/workflows/deploy.yml`이 다음 과정을 수행합니다.

```text
git push
→ npm ci
→ npm run build
→ dist artifact
→ GitHub Pages deploy
```

## PWA / SEO / Sharing

포함 파일:

- `manifest.webmanifest`
- service worker
- SVG/PNG favicon
- Apple Touch Icon
- 192/512 앱 아이콘
- Open Graph 이미지
- Repository Social Preview
- `robots.txt`
- `sitemap.xml`
- JSON-LD
- 커스텀 `404.html`
- `.nojekyll`

## Data Expansion

대용량 데이터가 한 파일에 몰리지 않도록 분리했습니다.

- 나라 기본값 → `countries/`
- 국가 학습팩 → `knowledge/`
- 출발지 → `origins/`
- 도시·명소 → `places/`
- 지도 형상 → `world-geometries.json`

자세한 방법:

- `docs/DATA_GUIDE.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/ROUTING_AND_PRIVACY.md`
- `docs/INTERACTION_AND_3D.md`
- `docs/FEATURE_CHECKLIST.md`

## Accessibility

- semantic HTML
- 키보드 검색 결과 탐색
- 2D 국가 keyboard focus / Enter 이동
- focus-visible
- 충분한 터치 영역
- `prefers-reduced-motion`
- 이미지 alt
- WebGL 미지원 시 2D fallback

## Privacy

GlobeHop 자체 서버는 없습니다. 브라우저 위치 기능을 사용할 때에는 거리 및 라우팅 계산을 위해 외부 공개 API로 좌표가 전달될 수 있으므로 `docs/ROUTING_AND_PRIVACY.md`를 확인하세요.

## License

코드: MIT License

외부 데이터·이미지·API는 각 원출처의 이용조건을 별도로 확인하세요. `NOTICE.md`도 함께 확인하세요.

## V5 시각화 안정화 핵심

- 2D 확대 시 비행기/핀/도시 점이 같이 커지던 문제를 수정했습니다. 마커는 화면에서 거의 일정한 크기로 유지됩니다.
- 서울→일본 같은 짧은 구간은 2D에서 약 190×95 world-unit 범위로 맞춰 한국과 일본 전체 윤곽이 함께 보이도록 합니다.
- 3D는 짧은 지역 여행에서 전체 국토 외곽을 억지로 모두 맞추지 않고, 출발·도착 지점을 중심으로 지역 확대 카메라를 사용합니다.
- 서울→도쿄 기준 925×420 화면에서 두 지점이 약 266px 떨어져 보이도록 카메라 거리를 조정했습니다.
- 3D 국가 라벨과 도시 라벨이 겹치지 않도록 목적지가 국가일 때 중복 도착 도시 라벨을 생략하고, 국가명은 지구 표면 텍스처에도 표시합니다.
- 선택 국가의 도시·명소 포인트는 우선순위와 개수 제한을 적용해 과밀 표시를 줄였습니다.
- `?view=map` / `?view=globe` URL 파라미터로 QA 시 특정 보기 모드를 강제할 수 있습니다.
- Service Worker 캐시는 V5 키로 갱신했습니다.

자세한 변경점은 `docs/V5_VISUAL_FIX.md`를 확인하세요.
