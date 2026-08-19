# GlobeHop Architecture

## 목표

GitHub Pages만으로 실행되면서 아이가 **검색하거나 지도를 직접 눌러** 세계를 탐험할 수 있는 교육용 웹서비스입니다.

## 렌더링 계층

### 2D Map — `src/modules/globe.js`

- SVG 기반 세계지도
- GeoJSON 국가 path
- 도시·명소 point layer
- 국가/포인트 hover 및 click
- 출발–목적지 quadratic flight path
- 여행 시작 시 route bounding box 자동 zoom

### 3D Globe — `src/modules/globe3d.js`

외부 3D 라이브러리 없이 WebGL로 구성됩니다.

1. 위·경도 기반 sphere mesh 생성
2. `world-geometries.json`을 Canvas equirectangular texture로 렌더링
3. texture를 WebGL sphere에 mapping
4. yaw/pitch로 구 회전
5. perspective projection으로 확대/축소
6. 도시·명소를 3D 좌표로 변환하여 overlay에 projection
7. 마우스 좌표에서 view-ray와 sphere intersection 계산
8. 구 표면 좌표를 lat/lon으로 역산
9. point-in-polygon으로 hover한 국가 판별
10. 국가/장소 click 이벤트를 앱으로 전달

## 3D 여행 카메라

목적지를 선택하면:

1. 출발지와 목적지를 unit sphere vector로 변환
2. 두 vector의 spherical midpoint 계산
3. midpoint가 화면 정면에 오도록 yaw/pitch 결정
4. 두 지점의 angular distance를 기준으로 camera distance 산정
5. 카메라를 easing으로 자동 회전/확대
6. great-circle 기반 arc를 구 바깥으로 들어 올려 표시
7. 비행기 icon을 arc를 따라 이동

## Hover / Click

### 도시·명소

`places/index.json` 좌표를 2D/3D 모두 point로 표시합니다.

### 국가

- 2D: SVG 국가 path 자체가 hit target
- 3D: pointer → ray → sphere intersection → lat/lon → country polygon hit-test

따라서 3D에서도 국가 전체 표면이 인터랙티브합니다.

## 초기 로드

1. 국가 검색 index
2. 대표 도시/명소
3. 출발지 preset
4. 세계 GeoJSON geometry
5. 2D/3D renderer 준비
6. 첫 목적지 국가
7. 선택 국가 knowledge pack lazy-load

## 검색

- 1차: 로컬 국가/대표 장소
- 2차: Open-Meteo Geocoding 온라인 보조
- 외부 API 실패 시 로컬 검색 유지

## 통계

- 내장 snapshot 즉시 표시
- World Bank API 응답 시 인구/GDP/GNI 최신값으로 교체

## 거리

- 직선거리: Haversine
- 비행시간: 교육용 추정
- 육상거리: OSRM 성공 시 live driving route
- 실패 시 지역/국경 기반 fallback

## 저장

LocalStorage:

- 언어
- 테마
- 2D/3D 보기
- 편도/왕복
- 출발지
- 최근 탐험
- 즐겨찾기

## 정적 배포

내부 asset은 상대경로를 사용합니다.

```text
http://localhost:5173/
https://USERNAME.github.io/REPOSITORY/
custom domain
```

WebGL이 없거나 초기화에 실패하면 앱 전체가 멈추지 않고 2D 지도로 자동 fallback합니다.
