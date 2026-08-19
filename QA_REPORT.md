# GlobeHop V8 QA Report

Date: 2026-08-19

## V8 target

V7의 2D/3D 지도 동작을 유지하면서 세계 도시 탐험 데이터와 도시별 상세 정보를 대폭 확장했습니다.

## Automated checks

### Build
- `npm run build`: PASS

### JavaScript syntax
- `src/*.js`: PASS
- `src/modules/*.js`: PASS
- `public/sw.js`: PASS
- `scripts/*.mjs`: PASS

### Globe geometry verifier
- `npm run verify:globe`: PASS
- sphere winding: PASS
- route focus midpoint: PASS
- camera-facing route coordinates: PASS

### Legacy V7/V8 map verifier
- `npm run verify:v7`: PASS
- 3D texture persistent country-name text 제거: PASS
- responsive screen-space labels: PASS
- 3D programmatic zoom API: PASS
- 2D wheel/pinch/drag: PASS
- 2D pointer-anchored zoom: PASS
- drag accidental-click suppression: PASS
- UI +/- zoom controls: PASS
- build badge `V8.5`: PASS
- Service Worker cache `globehop-v8-5-korea-tourism-20260819`: PASS

## Data validation

- country index: 232
- city index: 33,801
- city index covered country codes: 229
- city JSON parse: PASS
- bundled city index size: about 2.9 MB

Sample indexed city counts:

- South Korea: 147
- Japan: 1,300
- United States: 3,407
- France: 692
- Germany: 1,139
- United Kingdom: 865
- Italy: 660
- Spain: 735
- Thailand: 328
- Vietnam: 312

## V8 source-level feature checks

### Country → cities
- `getCountryCitySuggestions()` reads local city index
- population data is used as a primary sorting signal
- country screen displays up to 30 city choices by default
- selecting a city reuses the normal destination flow

### City location/details
- local GeoNames-derived city coordinates/timezone/population metadata
- Open-Meteo geocoding fallback/enrichment
- Wikipedia city page search and intro/image
- MediaWiki coordinate geosearch for nearby knowledge places
- Wikidata entity claims for structured city facts
- partial-source failure fallback

### Weather
- current temperature
- apparent temperature
- humidity
- precipitation/weather code
- wind speed/gust/direction
- cloud cover
- surface pressure
- visibility
- daily high/low
- precipitation probability
- sunrise/sunset

### Air quality
- U.S. AQI
- European AQI
- PM2.5
- PM10
- ozone
- nitrogen dioxide
- sulphur dioxide
- carbon monoxide
- dust
- UV index

### Derived city facts
- population density when population + area are both available
- distance to national capital
- local city time
- hemisphere

## Browser-render limitation

이 실행 컨테이너의 headless Chromium은 D-Bus/네트워크 환경 문제로 페이지 스크린샷 테스트가 제한 시간 내 완료되지 않았습니다. 또한 컨테이너의 일반 네트워크 DNS가 차단되어 런타임 외부 API 실호출을 직접 검증하지 못했습니다.

대신 Open-Meteo, MediaWiki, Wikidata의 공식 API 문서에 맞춰 요청 형식을 구성했고, 빌드·구문·데이터·기존 2D/3D 검증 스크립트를 모두 통과했습니다. 실제 GitHub Pages 배포 후에는 브라우저 DevTools의 Network 탭에서 외부 API 응답을 한 번 확인하는 것을 권장합니다.

## Deployment identity

- package version: `8.0.0`
- app badge: `V8.5`
- Service Worker cache: `globehop-v8-5-korea-tourism-20260819`

## V8.5 추가 검증 — 2026-08-19

- 첫 진입 기본 대상국가 `KR`: PASS
- 마지막 선택 `localStorage(globehop:lastDestination)` 저장/복원 코드: PASS
- 선택 이동 `history.pushState` + `popstate` 복원: PASS
- 도시 상세 `이전 위치` / `상위 국가` 탐색 UI: PASS
- 선택 국가 전체 도시 지도 공급 구조: PASS
- 2D 확대 최소 폭 34 (기존 120보다 심화 확대): PASS
- 2D viewport/zoom 기반 도시 밀도 필터: PASS
- 3D zoom 기반 도시/랜드마크 밀도 증가: PASS
- 2D/3D marker zoom scale 변화: PASS
- 대한민국 도시 인덱스: 147개
- 대한민국 한국어 도시 alias: 71개
- 대한민국 관광도시 profile: 26개
- 대한민국 관광 포인트: 81개
- 도시 사진 horizontal slider: PASS (Wikipedia/Wikimedia 이미지가 있을 때)
- `npm run build`: PASS
- `npm run verify:globe`: PASS
- `npm run verify:v7`: PASS
- 전체 `src/**/*.js` `node --check`: PASS
