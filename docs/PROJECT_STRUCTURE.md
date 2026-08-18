# Project Structure

GlobeHop은 데이터 양이 커져도 한 파일이 비대해지지 않도록 기능과 데이터를 분리합니다.

## 1. UI layer

```text
src/app.js
src/styles.css
```

`app.js`는 화면 조립과 이벤트 연결만 담당합니다. 국가 데이터 자체를 하드코딩하지 않습니다.

## 2. Service layer

```text
src/modules/
├─ config.js
├─ dataService.js
├─ geo.js
├─ globe.js
├─ i18n.js
└─ storage.js
```

- `config.js`: API endpoint / 지원 locale / 앱 설정
- `dataService.js`: JSON/API 접근
- `geo.js`: 거리/시간/육상 fallback 계산
- `globe.js`: 지도와 여행 애니메이션
- `i18n.js`: UI 번역
- `storage.js`: LocalStorage

## 3. Data layer

```text
src/data/
├─ countries/
├─ knowledge/
├─ origins/
├─ places/
└─ world-geometries.json
```

### countries
세계 국가 검색과 상세 기초 데이터.

### knowledge
아이용 학습 콘텐츠. 국가마다 JSON 1개.

### origins
출발 도시 목록. UI와 분리되어 있어 도시 추가가 쉽습니다.

### places
대표 도시/명소의 오프라인 검색용 데이터.

### world-geometries
단순화된 세계지도 국가 도형.

## 4. Static public assets

```text
public/
├─ icons/
├─ 404.html
├─ favicon.svg
├─ manifest.webmanifest
├─ og-image.png
├─ repo-social-preview.png
├─ robots.txt
├─ sitemap.xml
└─ sw.js
```

GitHub Pages에 그대로 복사되는 파일입니다.

## 5. Build / Deployment

```text
scripts/build.mjs
scripts/dev-server.mjs
.github/workflows/deploy.yml
```

서버 백엔드 없이 GitHub Pages에서 작동하도록 설계되어 있습니다.
