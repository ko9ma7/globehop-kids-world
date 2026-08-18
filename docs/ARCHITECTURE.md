# GlobeHop Architecture

## 목표

GitHub Pages만으로 실행되는 아이용 세계 탐험 웹서비스입니다. 상세 내비게이션 지도보다 위치 관계와 기초 지식 학습에 집중합니다.

## 초기 로드

1. 세계 국가 검색 index
2. 대표 도시/명소 index
3. 출발지 preset
4. 단순 세계지도 geometry
5. 첫 목적지 국가 정보
6. 해당 국가 knowledge pack

전체 국가의 학습 데이터를 한 번에 받지 않고 선택한 국가의 JSON만 lazy-load 합니다.

## 검색

- 1차: 로컬 국가/대표 장소
- 2차: Open-Meteo Geocoding 온라인 보조
- 외부 API 실패 시 로컬 검색 유지

## 통계

국가 상세값은 내장 snapshot을 먼저 렌더링합니다.

그 뒤 World Bank API가 응답하면 인구/GDP/GNI만 최신값으로 교체합니다.

## 여행

- 지도 애니메이션: 비행기만 사용
- 편도/왕복
- 2D 지도 / 지구본 느낌
- 직선거리
- 비행시간 예상
- 육상거리/시간
- 시차/현지시간

## 저장

LocalStorage:

- 언어
- 테마
- 지도 보기 방식
- 편도/왕복
- 출발지 preset
- 최근 탐험
- 즐겨찾기

## 정적 호스팅

모든 내부 asset 경로는 상대경로를 사용합니다. 따라서 아래 환경을 모두 지원합니다.

```text
http://localhost:5173/
https://USERNAME.github.io/REPOSITORY/
https://USERNAME.github.io/
custom domain
```
