# GlobeHop QA Report

검수일: 2026-08-18

## Build

- `npm run build`: PASS
- 출력 폴더: `dist/`
- `__SITE_URL__` 미치환 placeholder: 없음

## Syntax

- `src/app.js`: PASS
- `src/modules/*.js`: PASS
- `scripts/*.mjs`: PASS

## Data

- 국가 검색 index: 232개
- 대표 도시/명소: 52개
- 출발지 preset: 12개
- 확장 knowledge pack: 23개
- JSON / manifest parse: PASS
- knowledge index → 실제 파일 연결: PASS

## GitHub Pages

- 상대경로 asset 구조: 적용
- `.nojekyll`: 적용
- custom 404: 적용
- GitHub Actions workflow: 포함
- favicon / PWA icons / manifest: 포함
- Open Graph / Twitter Card: 포함
- robots / sitemap: 포함

## 기능 검토

- 국가/지명 검색
- Open-Meteo 온라인 검색 fallback
- 출발지 preset
- 브라우저 내 위치
- 2D 지도 / 지구본 느낌 전환
- 비행기 편도/왕복 애니메이션
- 직선거리
- 예상 비행시간
- OSRM 육상 도로거리 시도 + fallback
- 시차 / 현지시간
- World Bank 통계 보강
- 나라별 학습 카드
- 이미지 gallery fallback
- LocalStorage 즐겨찾기/최근탐험/설정
- 반응형 CSS

## Browser automation note

이 작업 컨테이너의 Chromium headless 프로세스가 DBus/환경 제약으로 종료되지 않아 자동 스크린샷 검수는 완료하지 못했습니다. HTTP 서버는 정상 200 응답을 확인했고, 대신 build/syntax/data/asset 정적 검증을 수행했습니다.
